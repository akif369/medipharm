import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import API from '../utils/api';
import { getAuth, setAuth } from '../utils/auth';
import Navbar from '../components/Navbar';

export default function Profile() {
   const router = useRouter();
  const { tab: queryTab, redirect } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const { user: authUser } = getAuth();
    if (!authUser) {
      router.push('/login');
    } else {
      setUser(authUser);
      fetchUserProfile();
      
      // Set active tab from query
      if (queryTab) {
        setActiveTab(queryTab);
      }
    }
    setLoading(false);
  }, [router]);

  const fetchUserProfile = async () => {
    try {
      const res = await API.get('/auth/user');
      setFormData({
        username: res.data.username,
        email: res.data.email,
        phoneNumber: res.data.phoneNumber || '',
        address: res.data.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setUpdating(true);

    try {
      const res = await API.put('/auth/profile', formData);
      
      // Update localStorage
      const { user: authUser } = getAuth();
      const updatedUser = {
        ...authUser,
        username: res.data.username,
        email: res.data.email
      };
      setAuth(getAuth().token, updatedUser);
      setUser(updatedUser);

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Redirect if specified
      if (redirect) {
        setTimeout(() => {
          router.push(`/${redirect}`);
        }, 1500);
      }
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.msg || 'Error updating profile' 
      });
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setUpdating(true);

    try {
      await API.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.msg || 'Error changing password' 
      });
    } finally {
      setUpdating(false);
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-8">
          👤 My Profile
        </h2>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-lg rounded-t-2xl shadow-lg">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📋 Profile Information
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'password'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🔒 Change Password
            </button>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-b-2xl shadow-lg p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border-l-4 border-green-500 text-green-700' 
                : 'bg-red-50 border-l-4 border-red-500 text-red-700'
            }`}>
              <p className="font-medium">{message.text}</p>
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    className="input bg-gray-100"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    className="input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="label">Role</label>
                  <input
                    type="text"
                    value={user.role.toUpperCase()}
                    className="input bg-gray-100"
                    disabled
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="label">Street Address</label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, street: e.target.value}
                      })}
                      className="input"
                      placeholder="123 Main St"
                    />
                  </div>

                  <div>
                    <label className="label">City</label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, city: e.target.value}
                      })}
                      className="input"
                      placeholder="New York"
                    />
                  </div>

                  <div>
                    <label className="label">State</label>
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, state: e.target.value}
                      })}
                      className="input"
                      placeholder="NY"
                    />
                  </div>

                  <div>
                    <label className="label">Zip Code</label>
                    <input
                      type="text"
                      value={formData.address.zipCode}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, zipCode: e.target.value}
                      })}
                      className="input"
                      placeholder="10001"
                    />
                  </div>

                  <div>
                    <label className="label">Country</label>
                    <input
                      type="text"
                      value={formData.address.country}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, country: e.target.value}
                      })}
                      className="input"
                      placeholder="USA"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={updating}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {updating ? 'Updating...' : '💾 Save Changes'}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <label className="label">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="input"
                  required
                  placeholder="Enter current password"
                />
              </div>

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
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="input"
                  required
                  placeholder="Confirm new password"
                />
              </div>

              <button 
                type="submit" 
                disabled={updating}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-green-700 font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {updating ? 'Changing Password...' : '🔒 Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}