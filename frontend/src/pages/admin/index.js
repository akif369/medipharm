import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import API from '../../utils/api';
import { getAuth } from '../../utils/auth';
import Navbar from '../../components/Navbar';

export default function Admin() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    manufacturer: '',
    rackNo: '',
    expiryDate: ''
  });

  useEffect(() => {
    const { user: authUser } = getAuth();
    if (!authUser || authUser.role !== 'admin') {
      router.push('/');
    } else {
      setUser(authUser);
      fetchProducts();
    }
    setLoading(false);
  }, [router]);

  const fetchProducts = async () => {
    try {
      const res = await API.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await API.put(`/products/${editingProduct._id}`, formData);
      } else {
        await API.post('/products', formData);
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        stock: '',
        manufacturer: '',
        rackNo: '',
        expiryDate: ''
      });
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.msg || 'Error saving product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stock: product.stock,
      manufacturer: product.manufacturer,
      rackNo: product.rackNo,
      expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await API.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) {
        alert(err.response?.data?.msg || 'Error deleting product');
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadResult(null);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await API.post('/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadResult(res.data);
      setUploadFile(null);
      fetchProducts();
      
      // Reset file input
      const fileInput = document.getElementById('bulk-upload-file');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setUploadResult({
        success: false,
        error: err.response?.data?.msg || 'Error uploading file'
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await API.get('/products/template', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products-template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error downloading template');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-500 mx-auto absolute top-0 left-1/2 -ml-10"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Manage Products
          </h2>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowBulkUpload(true)} 
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 font-bold shadow-lg active:scale-95 transition-all"
            >
              📤 Bulk Upload
            </button>
            <button 
              onClick={() => setShowModal(true)} 
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 font-bold shadow-lg active:scale-95 transition-all"
            >
              ➕ Add Product
            </button>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-bold">Name</th>
                  <th className="px-6 py-4 text-left font-bold">Category</th>
                  <th className="px-6 py-4 text-left font-bold">Rack No.</th>
                  <th className="px-6 py-4 text-left font-bold">Price</th>
                  <th className="px-6 py-4 text-left font-bold">Stock</th>
                  <th className="px-6 py-4 text-left font-bold">Manufacturer</th>
                  <th className="px-6 py-4 text-left font-bold">Expiry Date</th>
                  <th className="px-6 py-4 text-left font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map(product => (
                  <tr key={product._id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-800">{product.name}</td>
                    <td className="px-6 py-4 text-gray-600">{product.category}</td>
                    <td className="px-6 py-4">
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                        {product.rackNo}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-green-600">${product.price}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${
                        product.stock > 10 ? 'badge-success' : 
                        product.stock > 0 ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{product.manufacturer}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {product.expiryDate 
                        ? new Date(product.expiryDate).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(product)} className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-sm px-4 py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-600 font-medium shadow-md active:scale-95 transition-all">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(product._id)} className="bg-gradient-to-r from-red-400 to-red-500 text-white text-sm px-4 py-2 rounded-lg hover:from-red-500 hover:to-red-600 font-medium shadow-md active:scale-95 transition-all">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-slideUp" onClick={() => setShowBulkUpload(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-5 rounded-t-2xl">
              <h2 className="text-2xl font-bold">📤 Bulk Upload Products</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h3 className="font-bold text-blue-800 mb-2">Instructions:</h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Download the CSV template below</li>
                  <li>Fill in product details (name, description, category, price, stock, manufacturer, rackNo, expiryDate)</li>
                  <li>Save and upload the file</li>
                  <li>Required fields: name, description, category, price, manufacturer</li>
                </ul>
              </div>

              <button
                onClick={downloadTemplate}
                className="w-full mb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 font-bold shadow-lg active:scale-95 transition-all"
              >
                📥 Download CSV Template
              </button>

              <form onSubmit={handleBulkUpload} className="space-y-4">
                <div>
                  <label className="label">Select CSV/TXT File</label>
                  <input
                    id="bulk-upload-file"
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:border-purple-500 outline-none transition"
                  />
                  {uploadFile && (
                    <p className="text-sm text-green-600 mt-2">✓ Selected: {uploadFile.name}</p>
                  )}
                </div>

                {uploadResult && (
                  <div className={`p-4 rounded-lg ${
                    uploadResult.success 
                      ? 'bg-green-50 border-l-4 border-green-500' 
                      : 'bg-red-50 border-l-4 border-red-500'
                  }`}>
                    {uploadResult.success ? (
                      <>
                        <p className="text-green-800 font-bold">✓ Upload Successful!</p>
                        <p className="text-green-700 text-sm">Inserted: {uploadResult.inserted} products</p>
                        {uploadResult.errors > 0 && (
                          <p className="text-yellow-700 text-sm">Errors: {uploadResult.errors} rows skipped</p>
                        )}
                      </>
                    ) : (
                      <p className="text-red-800 font-bold">✗ {uploadResult.error}</p>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={uploading || !uploadFile}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-green-700 font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    {uploading ? '⏳ Uploading...' : '📤 Upload Products'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkUpload(false)}
                    className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-xl hover:from-gray-600 hover:to-gray-700 font-bold shadow-lg active:scale-95 transition-all"
                  >
                    Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal - Same as before */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-slideUp" onClick={() => {
          setShowModal(false);
          setEditingProduct(null);
        }}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-5 rounded-t-2xl">
              <h2 className="text-2xl font-bold">
                {editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="label">Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="input"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  rows="3"
                  className="input"
                  placeholder="Enter product description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                    className="input"
                    placeholder="e.g., Medicine"
                  />
                </div>

                <div>
                  <label className="label">Rack Number</label>
                  <input
                    type="text"
                    value={formData.rackNo}
                    onChange={(e) => setFormData({...formData, rackNo: e.target.value})}
                    required
                    className="input"
                    placeholder="e.g., A1, B5, C12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                    className="input"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="label">Stock (units)</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    required
                    className="input"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                    required
                    className="input"
                    placeholder="Enter manufacturer name"
                  />
                </div>

                <div>
                  <label className="label">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-green-700 font-bold shadow-lg active:scale-95 transition-all">
                  {editingProduct ? '✓ Update Product' : '➕ Add Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl hover:from-red-600 hover:to-red-700 font-bold shadow-lg active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}