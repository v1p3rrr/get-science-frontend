import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken, getUserRoles } from '../services/auth';

interface ProtectedRouteProps {
    children: React.ReactElement;
    requiredRoles?: string[];
    onlyIfUnauthenticated?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles, onlyIfUnauthenticated }) => {
    const location = useLocation();
    const token = getToken();
    const roles = getUserRoles();

    if (onlyIfUnauthenticated && token) {
        return <Navigate to="/" replace />;
    }

    if (!onlyIfUnauthenticated && !token) {
        return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
    }

    if (!onlyIfUnauthenticated && requiredRoles && !requiredRoles.some(role => roles.includes(role))) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
