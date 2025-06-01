import React, { useState, useEffect, useContext, createContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const apiUrl = import.meta.env.VITE_Backend_URL;
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

    const login = async (token) => {
        localStorage.setItem('Hactify-Auth-token', token);
        await fetchUserRole();
    };

    const logout = () => {
        localStorage.removeItem('Hactify-Auth-token');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            error, 
            logout,
            login,
            fetchUserRole  
        }}>
            {children}
        </AuthContext.Provider>
    );
};



export default AuthContext;