import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from './context/Authstate';
const WT= import.meta.env.VITE_WT;

function ProtectedRoute({ Component }) {
    const navigate = useNavigate();
    const context = useContext(AuthContext);
    const { user, fetchUserRole } = context;

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

    // Render the component if user is authenticated and has required role
    return <Component />;
}

export default ProtectedRoute;
