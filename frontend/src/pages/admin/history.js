import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import API from '../../utils/api';
import { getAuth } from '../../utils/auth';
import Navbar from '../../components/Navbar';

export default function History() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);

  useEffect(() => {
    const { user: authUser } = getAuth();
    if (!authUser || authUser.role !== 'admin') {
      router.push('/');
    } else {
      setUser(authUser);
      fetchOrders();
    }
    setLoading(false);
  }, [router]);

  const fetchOrders = async () => {
    try {
      const res = await API.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewUserProfile = async (userId) => {
    try {
      const res = await API.get(`/users/${userId}`);
      setSelectedUserProfile(res.data);
    } catch (err) {
      alert('Error fetching user profile');
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
        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-8">
          📋 Purchase History
        </h2>

        {orders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-16 text-center">
            <div className="text-8xl mb-6">📋</div>
            <p className="text-gray-600 text-xl font-medium">No orders found</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold">Order ID</th>
                    <th className="px-6 py-4 text-left font-bold">Customer</th>
                    <th className="px-6 py-4 text-left font-bold">Date</th>
                    <th className="px-6 py-4 text-left font-bold">Items</th>
                    <th className="px-6 py-4 text-left font-bold">Total Amount</th>
                    <th className="px-6 py-4 text-left font-bold">Status</th>
                    <th className="px-6 py-4 text-left font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map(order => (
                    <tr key={order._id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm font-semibold text-gray-700">
                        #{order._id.slice(-6)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewUserProfile(order.user._id)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {order.user?.username || 'N/A'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge bg-blue-100 text-blue-800">{order.items.length} items</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-xl text-green-600">
                        ${order.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-success">{order.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 font-medium shadow-md active:scale-95 transition-all"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-slideUp" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-5 rounded-t-2xl">
              <h2 className="text-2xl font-bold">📦 Order Details</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Order ID</p>
                  <p className="font-bold font-mono text-lg text-gray-800">{selectedOrder._id}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Customer</p>
                  <button
                    onClick={() => {
                      handleViewUserProfile(selectedOrder.user._id);
                      setSelectedOrder(null);
                    }}
                    className="font-bold text-lg text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {selectedOrder.user?.username}
                  </button>
                  <p className="text-sm text-gray-600">{selectedOrder.user?.email}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="font-bold text-lg text-gray-800">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span className="badge badge-success text-lg px-4 py-2">{selectedOrder.status}</span>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6 border-2 border-blue-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                    📍 Shipping Address
                  </h3>
                  <div className="text-gray-700 space-y-1">
                    {selectedOrder.shippingAddress.street && (
                      <p>{selectedOrder.shippingAddress.street}</p>
                    )}
                    <p>
                      {selectedOrder.shippingAddress.city}
                      {selectedOrder.shippingAddress.state && `, ${selectedOrder.shippingAddress.state}`}
                      {selectedOrder.shippingAddress.zipCode && ` ${selectedOrder.shippingAddress.zipCode}`}
                    </p>
                    {selectedOrder.shippingAddress.country && (
                      <p>{selectedOrder.shippingAddress.country}</p>
                    )}
                  </div>
                </div>
              )}

              <h3 className="text-2xl font-bold text-gray-800 mb-4">Order Items</h3>
              <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Product</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Quantity</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Price</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {item.product?.name || 'Deleted Product'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-gray-600">${item.price.toFixed(2)}</td>
                        <td className="px-4 py-3 font-bold text-green-600">
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-6 rounded-xl mb-6 border-2 border-blue-300">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-medium text-gray-700">Total Amount:</span>
                  <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    ${selectedOrder.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-xl hover:from-blue-600 hover:to-indigo-600 font-bold shadow-lg active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUserProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-slideUp" onClick={() => setSelectedUserProfile(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-5 rounded-t-2xl">
              <h2 className="text-2xl font-bold">👤 Customer Profile</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Username</p>
                  <p className="font-bold text-lg text-gray-800">{selectedUserProfile.username}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-bold text-lg text-gray-800">{selectedUserProfile.email}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Role</p>
                  <span className={`badge ${
                    selectedUserProfile.role === 'admin' ? 'badge-danger' : 'badge-success'
                  } text-lg px-4 py-2`}>
                    {selectedUserProfile.role.toUpperCase()}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                  <p className="font-bold text-lg text-gray-800">{selectedUserProfile.phoneNumber || 'Not provided'}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6 border-2 border-blue-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  📍 Address
                </h3>
                {selectedUserProfile.address && (selectedUserProfile.address.street || selectedUserProfile.address.city) ? (
                  <div className="space-y-2 text-gray-700">
                    {selectedUserProfile.address.street && (
                      <p><span className="font-semibold">Street:</span> {selectedUserProfile.address.street}</p>
                    )}
                    {selectedUserProfile.address.city && (
                      <p><span className="font-semibold">City:</span> {selectedUserProfile.address.city}</p>
                    )}
                    {selectedUserProfile.address.state && (
                      <p><span className="font-semibold">State:</span> {selectedUserProfile.address.state}</p>
                    )}
                    {selectedUserProfile.address.zipCode && (
                      <p><span className="font-semibold">Zip Code:</span> {selectedUserProfile.address.zipCode}</p>
                    )}
                    {selectedUserProfile.address.country && (
                      <p><span className="font-semibold">Country:</span> {selectedUserProfile.address.country}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No address information provided</p>
                )}
              </div>

              <button
                onClick={() => setSelectedUserProfile(null)}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-xl hover:from-blue-600 hover:to-indigo-600 font-bold shadow-lg active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}