import Link from 'next/link';
import { useRouter } from 'next/router';
import { removeAuth } from '../utils/auth';

export default function Navbar({ user, cartCount, onCartClick }) {
  const router = useRouter();

  const handleLogout = () => {
    removeAuth();
    router.push('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-2xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <span className="text-3xl">🏥</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Medical Inventory
            </h1>
          </Link>
          
          <div className="flex items-center gap-2">
            <Link href="/" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
              Home
            </Link>
            <Link href="/products" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
              Products
            </Link>
            
            {user?.role === 'admin' && (
              <>
                <Link href="/admin" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
                  Admin
                </Link>
                <Link href="/admin/users" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
                  Users
                </Link>
                <Link href="/admin/history" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
                  History
                </Link>
              </>
            )}
            
            {cartCount !== undefined && (
              <button
                onClick={onCartClick}
                className="relative bg-green-500 px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-all active:scale-95"
              >
                🛒 Cart
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
            
            {user && (
              <>
                <Link href="/profile" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
                  👤 Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-all active:scale-95"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}