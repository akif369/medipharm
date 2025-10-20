import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import API from '../utils/api';
import { getAuth } from '../utils/auth';
import Navbar from '../components/Navbar';

export default function Orders() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const { user: authUser } = getAuth();
    if (!authUser) {
      router.push('/login');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '⚙️';
      case 'shipped':
        return '🚚';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '📦';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-8">
          📦 My Orders
        </h2>

        {orders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-16 text-center">
            <div className="text-8xl mb-6">📦</div>
            <p className="text-gray-600 text-xl font-medium mb-4">No orders yet</p>
            <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
            <button
              onClick={() => router.push('/products')}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 font-bold shadow-lg active:scale-95 transition-all"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders.map(order => (
              <div
                key={order._id}
                className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg hover:shadow-2xl transition-all p-6"
              >
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-bold font-mono text-lg">#{order._id.slice(-8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Items</p>
                    <p className="font-semibold">{order.items.length} item(s)</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-bold text-2xl text-green-600">₹{order.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <span className={`badge ${getStatusColor(order.status)} text-base px-4 py-2`}>
                      {getStatusIcon(order.status)} {order.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 font-semibold mb-2">Order Items:</p>
                  <div className="space-y-2">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.product?.name || 'Product deleted'} x {item.quantity}
                        </span>
                        <span className="font-semibold text-gray-800">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-sm text-gray-500 italic">
                        +{order.items.length - 3} more item(s)
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrder(order)}
                  className="mt-4 w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-lg hover:from-blue-600 hover:to-indigo-600 font-semibold shadow-md active:scale-95 transition-all"
                >
                  View Full Details
                </button>
              </div>
            ))}
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
                  <p className="text-sm text-gray-500 mb-1">Order Date</p>
                  <p className="font-bold text-lg text-gray-800">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span className={`badge ${getStatusColor(selectedOrder.status)} text-lg px-4 py-2`}>
                    {getStatusIcon(selectedOrder.status)} {selectedOrder.status.toUpperCase()}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                  <p className="font-bold text-lg text-gray-800">
                    {new Date(selectedOrder.updatedAt || selectedOrder.createdAt).toLocaleString()}
                  </p>
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
                          {item.product?.name || 'Product deleted'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-gray-600">₹{item.price.toFixed(2)}</td>
                        <td className="px-4 py-3 font-bold text-green-600">
                          ₹{(item.price * item.quantity).toFixed(2)}
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
                    ₹{selectedOrder.totalAmount.toFixed(2)}
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
    </div>
  );
}