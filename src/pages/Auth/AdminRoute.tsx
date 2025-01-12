import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser) {
        const adminStatus = await isAdmin(currentUser.uid);
        setIsAdminUser(adminStatus);
      }
      setLoading(false);
    };

    checkAdminStatus();
  }, [currentUser, isAdmin]);

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (!currentUser || !isAdminUser) {
    return <Navigate to="/admin/login" />;
  }

  return <>{children}</>;
};

export default AdminRoute;
