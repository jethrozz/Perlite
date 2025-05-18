import { useContext } from 'react';
import { AuthContext } from '@/contexts/auth-context';
import { useLocation } from 'wouter';

export function useAuth() {
  const auth = useContext(AuthContext);
  const [location, navigate] = useLocation();

  // Navigate to login if not authenticated
  const requireAuth = (callback?: () => void) => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      navigate('/auth/login');
    } else if (callback && auth.isAuthenticated) {
      callback();
    }
  };

  // Navigate to creator dashboard if not a creator
  const requireCreator = (callback?: () => void) => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      navigate('/auth/login');
    } else if (!auth.isLoading && auth.isAuthenticated && !auth.user?.isCreator) {
      navigate('/');
    } else if (callback && auth.isAuthenticated && auth.user?.isCreator) {
      callback();
    }
  };

  return {
    ...auth,
    requireAuth,
    requireCreator,
  };
}
