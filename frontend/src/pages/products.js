import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import API from '../utils/api';
import { getAuth } from '../utils/auth';
import Navbar from '../components/Navbar';

export default function Products() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [racks, setRacks] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    minPrice: '',
    maxPrice: '',
    stockStatus: 'all',
    rackNo: 'all'
  });
  const [sortOptions, setSortOptions] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    const { user: authUser } = getAuth();
    if (!authUser) {
      router.push('/login');
    } else {
      setUser(authUser);
      fetchProducts();
      fetchCategories();
      fetchRacks();
    }
    setLoading(false);
  }, [router]);

  

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      
      if (search) params.append('search', search);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.stockStatus !== 'all') params.append('stockStatus', filters.stockStatus);
      if (filters.rackNo !== 'all') params.append('rackNo', filters.rackNo);
      params.append('sortBy', sortOptions.sortBy);
      params.append('sortOrder', sortOptions.sortOrder);

      const res = await API.get(`/products?${params.toString()}`);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get('/products/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRacks = async () => {
    try {
      const res = await API.get('/products/racks');
      setRacks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [filters, sortOptions]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const resetFilters = () => {
    setFilters({
      category: 'all',
      minPrice: '',
      maxPrice: '',
      stockStatus: 'all',
      rackNo: 'all'
    });
    setSearch('');
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.product === product._id);
    if (existing) {
      setCart(cart.map(item =>
        item.product === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product: product._id, quantity: 1, name: product.name, price: product.price }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.product === productId ? { ...item, quantity } : item
    ));
  };

const handleCheckout = async () => {
  try {
    const res = await API.post('/orders', { items: cart });
    alert('Order placed successfully!');
    setCart([]);
    setShowCart(false);
    fetchProducts();
  } catch (err) {
    if (err.response?.data?.requiresAddress) {
      // Redirect to profile if address is required
      if (confirm('Please complete your address before placing an order. Go to profile now?')) {
        router.push('/profile?tab=profile&redirect=products');
      }
    } else {
      alert(err.response?.data?.msg || 'Error placing order');
    }
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

  if (!user) return null;

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar user={user} cartCount={cart.length} onCartClick={() => setShowCart(true)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-6">
            Browse Products
          </h2>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-12"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                🔍
              </span>
            </div>
            <button type="submit" className="btn btn-primary px-8 shadow-lg">
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-warning px-8 shadow-lg"
            >
              {showFilters ? '✕ Hide Filters' : '🔧 Filters'}
            </button>
          </form>

          {/* Filters Section */}
          {showFilters && (
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg p-6 mb-4 animate-slideUp">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="label">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                    className="input"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Rack Number Filter */}
                <div>
                  <label className="label">Rack Number</label>
                  <select
                    value={filters.rackNo}
                    onChange={(e) => setFilters({...filters, rackNo: e.target.value})}
                    className="input"
                  >
                    <option value="all">All Racks</option>
                    {racks.map(rack => (
                      <option key={rack} value={rack}>{rack}</option>
                    ))}
                  </select>
                </div>

                {/* Stock Status Filter */}
                <div>
                  <label className="label">Stock Status</label>
                  <select
                    value={filters.stockStatus}
                    onChange={(e) => setFilters({...filters, stockStatus: e.target.value})}
                    className="input"
                  >
                    <option value="all">All Stock</option>
                    <option value="in-stock">In Stock (&gt; 10)</option>
                    <option value="low-stock">Low Stock (1-10)</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>

                {/* Min Price Filter */}
                <div>
                  <label className="label">Min Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                    className="input"
                    placeholder="0.00"
                  />
                </div>

                {/* Max Price Filter */}
                <div>
                  <label className="label">Max Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                    className="input"
                    placeholder="999.99"
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div>
                  <label className="label">Sort By</label>
                  <select
                    value={sortOptions.sortBy}
                    onChange={(e) => setSortOptions({...sortOptions, sortBy: e.target.value})}
                    className="input"
                  >
                    <option value="createdAt">Date Added</option>
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="stock">Stock</option>
                    <option value="category">Category</option>
                    <option value="rackNo">Rack Number</option>
                  </select>
                </div>

                <div>
                  <label className="label">Sort Order</label>
                  <select
                    value={sortOptions.sortOrder}
                    onChange={(e) => setSortOptions({...sortOptions, sortOrder: e.target.value})}
                    className="input"
                  >
                    <option value="asc">Ascending (A-Z, Low-High)</option>
                    <option value="desc">Descending (Z-A, High-Low)</option>
                  </select>
                </div>
              </div>

              {/* Reset Filters Button */}
              <button
                onClick={resetFilters}
                className="mt-4 w-full btn btn-danger"
              >
                🔄 Reset All Filters
              </button>
            </div>
          )}

          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.category !== 'all' && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Category: {filters.category}
              </span>
            )}
            {filters.rackNo !== 'all' && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                Rack: {filters.rackNo}
              </span>
            )}
            {filters.stockStatus !== 'all' && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {filters.stockStatus.replace('-', ' ')}
              </span>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                Price: ${filters.minPrice || '0'} - ${filters.maxPrice || '∞'}
              </span>
            )}
          </div>
        </div>

        {/* Products Count */}
        <div className="mb-4 text-gray-600">
          Found <span className="font-bold text-gray-800">{products.length}</span> products
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl">
            <div className="text-8xl mb-6">📦</div>
            <p className="text-gray-600 text-xl font-medium">No products found</p>
            <p className="text-gray-500 mt-2">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product._id} className="group bg-white/80 backdrop-blur-lg rounded-xl shadow-lg hover:shadow-2xl transition-all p-6 transform hover:-translate-y-1 animate-slideUp">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition flex-1">
                      {product.name}
                    </h3>
                    <span className="ml-2 bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded">
                      {product.rackNo}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium text-gray-800">{product.category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Manufacturer:</span>
                    <span className="font-medium text-gray-800">{product.manufacturer}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Rack Number:</span>
                    <span className="font-bold text-purple-600">{product.rackNo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Stock:</span>
                    <span className={`badge ${
                      product.stock > 10 ? 'badge-success' : 
                      product.stock > 0 ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {product.stock} units
                    </span>
                  </div>
                  {product.expiryDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Expiry:</span>
                      <span className="font-medium text-gray-800">
                        {new Date(product.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      ${product.price}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className="w-full btn btn-primary py-3 shadow-lg"
                  >
                    {product.stock === 0 ? '❌ Out of Stock' : '🛒 Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Modal (same as before) */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-slideUp" onClick={() => setShowCart(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-5 rounded-t-2xl">
              <h2 className="text-2xl font-bold">🛒 Shopping Cart</h2>
            </div>
            
            <div className="p-6">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-8xl mb-6">🛒</div>
                  <p className="text-gray-600 text-xl font-medium">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map(item => (
                      <div key={item.product} className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                          <p className="text-gray-600">${item.price} each</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.product, item.quantity - 1)}
                            className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-lg hover:from-yellow-500 hover:to-yellow-600 font-bold shadow-md active:scale-95 transition-all"
                          >
                            -
                          </button>
                          <span className="font-bold text-lg w-10 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product, item.quantity + 1)}
                            className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-lg hover:from-green-500 hover:to-green-600 font-bold shadow-md active:scale-95 transition-all"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product)}
                            className="ml-2 px-4 py-2 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-lg hover:from-red-500 hover:to-red-600 shadow-md active:scale-95 transition-all"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-6 rounded-xl mb-6 border-2 border-blue-300">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-medium text-gray-700">Total Amount:</span>
                      <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleCheckout} className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl hover:from-green-600 hover:to-green-700 font-bold shadow-lg active:scale-95 transition-all">
                      ✓ Checkout
                    </button>
                    <button onClick={() => setShowCart(false)} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-xl hover:from-blue-600 hover:to-indigo-600 font-bold shadow-lg active:scale-95 transition-all">
                      Continue Shopping
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}