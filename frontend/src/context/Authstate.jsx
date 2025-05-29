import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const apiUrl = import.meta.env.VITE_Backend_URL;
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Function to fetch user details based on token
    const fetchUserRole = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/auth/getuser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Auth-token': localStorage.getItem('Hactify-Auth-token')
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('Hactify-Auth-token');
                alert('Session Expired! Please login again');
                window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch user');
            }

            const userData = await response.json();
            setUser(userData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('Hactify-Auth-token');
        if (token) {
            fetchUserRole();
        } else {
            setLoading(false);
        }
    }, []);


    const logout = () => {
        localStorage.removeItem('Hactify-Auth-token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, logout, fetchUserRole  }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
