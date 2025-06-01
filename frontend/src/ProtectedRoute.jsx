import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useContext } from "react";
import { useAuth } from './context/AuthContext.jsx';
import { useNavigate } from "react-router-dom";
const WT= import.meta.env.VITE_WT;

const ProtectedRoute = () => {
    const navigate = useNavigate();
  const { user, loading, fetchUserRole } = useAuth();

 
    useEffect(() => {
        const getUserRole = async () => {
            try {
                await fetchUserRole();
            } catch (error) {
                console.error('Error fetching user role:', error);
                // Handle error, e.g., redirect to an error page
            }
        };

        getUserRole();
    }, []);

    useEffect(() => {
        // Redirect if user is not logged in or does not have required role
        if (!user || user.role !== WT ) {
            navigate("/login");
        }
    }, [user, navigate]);

  return  <Outlet />
};

export default ProtectedRoute;