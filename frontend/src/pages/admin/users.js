import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import API from '../../utils/api';
import { getAuth } from '../../utils/auth';
import Navbar from '../../components/Navbar';

export default function Users() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const { user: authUser } = getAuth();
    if (!authUser || authUser.role !== 'admin') {
      router.push('/');
    } else {
      setUser(authUser);
      fetchUsers();
    }
    setLoading(false);
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await API.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const res = await API.get(`/users/${userId}`);
      setSelectedUser(res.data);
      setShowModal(true);
    } catch (err) {
      alert(err.response?.data?.msg || 'Error fetching user details');
    }
  };

  const handleResetPassword = (userId) => {
    const user = users.find(u => u._id === userId);
    setSelectedUser(user);
    setShowPasswordModal(true);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setMessage({ type: '', text: '' });
  };

  const submitPasswordReset = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    try {
      await API.put(`/users/${selectedUser._id}/reset-password`, {
        newPassword: passwordData.newPassword
      });
      
      setMessage({ type: 'success', text: 'Password reset successfully!' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setSelectedUser(null);
      }, 2000);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.msg || 'Error resetting password' 
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await API.delete(`/users/${userId}`);
      fetchUsers();
      alert('User deleted successfully');
    } catch (err) {
      alert(err.response?.data?.msg || 'Error deleting user');
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
          👥 User Management
        </h2>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-bold">Username</th>
                  <th className="px-6 py-4 text-left font-bold">Email</th>
                  <th className="px-6 py-4 text-left font-bold">Role</th>
                  <th className="px-6 py-4 text-left font-bold">Phone</th>
                  <th className="px-6 py-4 text-left font-bold">Joined</th>
                  <th className="px-6 py-4 text-left font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(userItem => (
                  <tr key={userItem._id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-800">{userItem.username}</td>
                    <td className="px-6 py-4 text-gray-600">{userItem.email}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${
                        userItem.role === 'admin' ? 'badge-danger' : 'badge-success'
                      }`}>
                        {userItem.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{userItem.phoneNumber || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(userItem.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewUser(userItem._id)}
                          className="bg-gradient-to-r from-blue-400 to-blue-500 text-white text-sm px-4 py-2 rounded-lg hover:from-blue-500 hover:to-blue-600 font-medium shadow-md active:scale-95 transition-all"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleResetPassword(userItem._id)}
                          className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-sm px-4 py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-600 font-medium shadow-md active:scale-95 transition-all"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => handleDeleteUser(userItem._id)}
                          className="bg-gradient-to-r from-red-400 to-red-500 text-white text-sm px-4 py-2 rounded-lg hover:from-red-500 hover:to-red-600 font-medium shadow-md active:scale-95 transition-all"
                          disabled={userItem._id === user.id}
                        >
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

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-slideUp" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-5 rounded-t-2xl">
              <h2 className="text-2xl font-bold">👤 User Profile</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Username</p>
                  <p className="font-bold text-lg text-gray-800">{selectedUser.username}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-bold text-lg text-gray-800">{selectedUser.email}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Role</p>
                  <span className={`badge ${
                    selectedUser.role === 'admin' ? 'badge-danger' : 'badge-success'
                  } text-lg px-4 py-2`}>
                    {selectedUser.role.toUpperCase()}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                  <p className="font-bold text-lg text-gray-800">{selectedUser.phoneNumber || 'Not provided'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Member Since</p>
                  <p className="font-bold text-lg text-gray-800">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                  <p className="font-bold text-lg text-gray-800">
                    {new Date(selectedUser.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Address</h3>
                {selectedUser.address && (selectedUser.address.street || selectedUser.address.city) ? (
                  <div className="space-y-2">
                    {selectedUser.address.street && (
                      <p className="text-gray-700"><span className="font-semibold">Street:</span> {selectedUser.address.street}</p>
                    )}
                    {selectedUser.address.city && (
                      <p className="text-gray-700"><span className="font-semibold">City:</span> {selectedUser.address.city}</p>
                    )}
                    {selectedUser.address.state && (
                      <p className="text-gray-700"><span className="font-semibold">State:</span> {selectedUser.address.state}</p>
                    )}
                    {selectedUser.address.zipCode && (
                      <p className="text-gray-700"><span className="font-semibold">Zip Code:</span> {selectedUser.address.zipCode}</p>
                    )}
                    {selectedUser.address.country && (
                      <p className="text-gray-700"><span className="font-semibold">Country:</span> {selectedUser.address.country}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No address information provided</p>
                )}
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-xl hover:from-blue-600 hover:to-indigo-600 font-bold shadow-lg active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-slideUp" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-5 rounded-t-2xl">
              <h2 className="text-2xl font-bold">🔒 Reset Password</h2>
              <p className="text-sm mt-1">User: {selectedUser.username}</p>
            </div>
            
            <form onSubmit={submitPasswordReset} className="p-6">
              {message.text && (
                <div className={`mb-4 p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 border-l-4 border-green-500 text-green-700' 
                    : 'bg-red-50 border-l-4 border-red-500 text-red-700'
                }`}>
                  <p className="font-medium">{message.text}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="input"
                    required
                    placeholder="Enter new password"
                    minLength="6"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>

                <div>
                  <label className="label">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="input"
                    required
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-green-700 font-bold shadow-lg active:scale-95 transition-all"
                >
                  Reset Password
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-xl hover:from-gray-600 hover:to-gray-700 font-bold shadow-lg active:scale-95 transition-all"
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