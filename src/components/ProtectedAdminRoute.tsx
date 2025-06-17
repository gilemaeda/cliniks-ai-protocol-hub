
import { Navigate } from 'react-router-dom';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const checkAuth = () => {
    const adminAuth = localStorage.getItem('cliniks_admin_auth');
    const adminData = localStorage.getItem('cliniks_admin_data');
    return adminAuth === 'authenticated' && adminData;
  };

  if (!checkAuth()) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
