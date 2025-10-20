import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getAuth } from '../utils/auth';
import Navbar from '../components/Navbar';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { user: authUser } = getAuth();
    if (!authUser) {
      router.push('/login');
    } else {
      setUser(authUser);
    }
    setLoading(false);
  }, [router]);

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-10 text-center max-w-3xl mx-auto animate-slideUp">
          <div className="inline-block p-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-6">
            <span className="text-7xl">👋</span>
          </div>
          
          <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
            Welcome, {user.username}!
          </h2>
          
          <div className="inline-block bg-gradient-to-r from-blue-100 to-indigo-100 px-6 py-3 rounded-full mb-10">
            <p className="text-gray-700 font-medium">
              Role: <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {user.role.toUpperCase()}
              </span>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            <Link href="/products">
              <div className="group bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-xl hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🛒</div>
                <h3 className="text-2xl font-bold mb-2">Browse Products</h3>
                <p className="text-blue-100">View and order medical supplies</p>
              </div>
            </Link>

             {user.role === 'user' && (
              <Link href="/orders">
              <div className="group bg-gradient-to-br from-violet-500 to-violet-600 text-white p-8 rounded-xl hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🛩️</div>
                <h3 className="text-2xl font-bold mb-2">Order History</h3>
                <p className="text-blue-100">View all Order History and Details</p>
              </div>
            </Link>
            )}
            
            {user.role === 'admin' && (
              <Link href="/admin">
                <div className="group bg-gradient-to-br from-green-500 to-green-600 text-white p-8 rounded-xl hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">⚙️</div>
                  <h3 className="text-2xl font-bold mb-2">Admin Panel</h3>
                  <p className="text-green-100">Manage inventory and products</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}