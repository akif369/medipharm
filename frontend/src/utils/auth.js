import Cookies from 'js-cookie';

// Check if we're in the browser
const isBrowser = typeof window !== 'undefined';

export const setAuth = (token, user) => {
  Cookies.set('token', token, { expires: 1 });
  if (isBrowser) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const getAuth = () => {
  const token = Cookies.get('token');
  let user = null;
  
  if (isBrowser) {
    const userStr = localStorage.getItem('user');
    user = userStr ? JSON.parse(userStr) : null;
  }
  
  return {
    token,
    user
  };
};

export const removeAuth = () => {
  Cookies.remove('token');
  if (isBrowser) {
    localStorage.removeItem('user');
  }
};

export const isAdmin = () => {
  const { user } = getAuth();
  return user && user.role === 'admin';
};