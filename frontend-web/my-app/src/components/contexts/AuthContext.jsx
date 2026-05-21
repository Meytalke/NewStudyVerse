import { createContext, useState, useContext, useEffect, useCallback } from 'react'; // Import React hooks and createContext for context management
import { api, authService, userService } from '../services/api'; // Import API service instances

// Create the AuthContext with a null default value
const AuthContext = createContext(null);

// AuthProvider component which will wrap the parts of the app that need authentication context
// wrap= לעטוף
export const AuthProvider = ({ children }) => {
    // State for the authenticated user object. 'user' holds detailed user data.
    const [user, setUser] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); 
    // State to store the authentication token (JWT)
    const [token, setToken] = useState(null); 

    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
    const [forgotPasswordError, setForgotPasswordError] = useState(null);
    const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
    const [resetPasswordError, setResetPasswordError] = useState(null);

    const logout = useCallback(() => {
        console.log(`[AuthContext Logout] ${new Date().toISOString()} - User logging out.`);
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setToken(null); 
        setUser(null); 
        setError(null); 
        console.log('[AuthContext Logout] User logged out successfully.');
    }, []); // It doesn't rely on any external state

    // Attempts to fetch current user data using the stored token.
    const refreshUser = useCallback(async () => {
        setLoading(true);
        console.log(`[AuthContext Refresh User] ${new Date().toISOString()} - Attempting to refresh user data. Current token state: ${!!token}`);
        const currentToken = localStorage.getItem('token'); 

        if (!currentToken) {
            console.warn('[AuthContext Refresh User] No token found in localStorage for refresh. Logging out.');
            logout(); 
            setLoading(false);
            return;
        }

        // Set Authorization header for all subsequent API requests
        api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`; 
        setToken(currentToken); 

        try {
            // Fetch current user data
            const response = await authService.getCurrentUser(); 
            setUser(response.data); 
            setError(null); 
            console.log(`[AuthContext Refresh User] User data refreshed: ${response.data.username}, ID: ${response.data.user_id}`);
        } catch (err) {
            console.error("[AuthContext Refresh User] Failed to refresh user data:", err.response?.data?.message || err.message, err);
            setError(err.response?.data?.message || 'Failed to refresh user data. Your session might have expired.');
            logout(); // Logout if refresh fails (e.g., token expired/invalid)
        } finally {
            setLoading(false);
        }
    }, [logout, token]); 

    // useEffect hook for initial authentication check when the component mounts
    useEffect(() => {
        console.log(`[AuthContext Init Effect] ${new Date().toISOString()} - Running initial AuthContext setup.`);
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            console.log('[AuthContext Init Effect] Token found in localStorage. Setting token state and attempting refresh.');
            setToken(storedToken); 
            refreshUser(); // Attempt to refresh user data with the stored token
        } else {
            console.log('[AuthContext Init Effect] No token found in localStorage. Setting initial state to unauthenticated.');
            setUser(null);
            setToken(null);
            setLoading(false); 
        }
    }, []); 

    // useEffect hook to sync user and token states.
    useEffect(() => {
        console.log(`[AuthContext User/Token Sync Effect] ${new Date().toISOString()} - User state changed. User: ${!!user}, Token: ${!!token}, Loading: ${loading}`);
        // If user and token exist and not loading, check if user object is complete
        if (!!user && !!token && !loading) {
            if (!user.user_id || !user.username) { 
                console.log('[AuthContext User/Token Sync Effect] User object incomplete, refreshing data.');
                refreshUser();
            } else {
                console.log('[AuthContext User/Token Sync Effect] User and token are present and consistent.');
            }
        } else if (!user && !token && !loading) {
            console.log('[AuthContext User/Token Sync Effect] User and token are null/empty, confirming unauthenticated state.');
            setUser(null);
            setToken(null);
        }
    }, [user, token, loading, refreshUser]); 

    // useCallback for the login function
    const login = useCallback(async (credentials) => {
        setLoading(true);
        setError(null);
        console.log(`[AuthContext Login] ${new Date().toISOString()} - Attempting login for identifier: ${credentials.identifier}.`);
        try {
            // Call login API
            const response = await authService.login(credentials);
            console.log('[AuthContext Login] Login Response received:', response.data);

            const { token: receivedToken, user: userData } = response.data; 

            // Basic validation of the response data
            if (!receivedToken || !userData || !userData.user_id) { 
                const errorMessage = 'Login response missing token or user data.';
                console.error(`[AuthContext Login] Error: ${errorMessage}`, response.data);
                throw new Error(errorMessage); // Throw error if response is incomplete
            }
            
            localStorage.setItem('token', receivedToken); 
            setToken(receivedToken); 
            setUser(userData); 
            // Set Authorization header for Axios
            api.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`; 
            
            console.log(`[AuthContext Login] User logged in successfully: ${userData.username}, User_ID: ${userData.user_id}. Token and user states updated.`);
            return { success: true, user: userData, token: receivedToken };
        } catch (err) {
            console.error('[AuthContext Login] Login failed:', err.response?.data?.message || err.message, err);
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            throw err; 
        } finally {
            setLoading(false);
        }
    }, []); // It handles its own state and side effects

    // useCallback for the register function
    const register = useCallback(async (userData) => {
        setLoading(true);
        setError(null);
        console.log(`[AuthContext Register] ${new Date().toISOString()} - Attempting registration for username: ${userData.username}.`);
        try {
            // Call register API
            const response = await authService.register(userData);
            console.log('[AuthContext Register] Registration Response received:', response.data);

            const { token: receivedToken, user: registeredUser } = response.data; 

            // Basic validation of the response data
            if (!receivedToken || !registeredUser || !registeredUser.user_id) { 
                const errorMessage = 'Registration response missing token or user data.';
                console.error(`[AuthContext Register] Error: ${errorMessage}`, response.data); 
                throw new Error(errorMessage);
            }

            localStorage.setItem('token', receivedToken);
            setToken(receivedToken); 
            setUser(registeredUser); 
            // Set Authorization header
            api.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`; 
            console.log(`[AuthContext Register] User registered successfully: ${registeredUser.username}, User_ID: ${registeredUser.user_id}. Token and user states updated.`);
            return { success: true, user: registeredUser, token: receivedToken }; // Return success status and data
        } catch (err) {
            console.error('[AuthContext Register] Registration failed:', err.response?.data?.message || err.message, err);
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            throw err;
        } finally {
            setLoading(false);
        }
    }, []); 

    // useCallback for updating user password
    const updatePassword = useCallback(async (oldPassword, newPassword) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authService.changePassword({ oldPassword, newPassword });
            console.log('[AuthContext Update Password] Password updated successfully.');
            return response.data;
        } catch (err) {
            console.error('[AuthContext Update Password] Failed to update password:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to update password.');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // useCallback for sending a forgot password email
    const sendForgotPasswordEmail = useCallback(async (email) => {
        setForgotPasswordLoading(true);
        setForgotPasswordError(null);
        try {
            const response = await authService.forgotPassword(email);
            console.log('[AuthContext Forgot Password] Email sent:', response.data.message);
            return response.data;
        } catch (err) {
            console.error('Forgot password email error:', err.response?.data?.message || err.message);
            setForgotPasswordError(err.response?.data?.message || 'Failed to send reset email.');
            throw err;
        } finally {
            setForgotPasswordLoading(false);
        }
    }, []);

    // useCallback for resetting password with a token
    const resetPassword = useCallback(async (resetToken, newPassword, confirmNewPassword) => {
        setResetPasswordLoading(true);
        setResetPasswordError(null);
        try {
            const response = await authService.resetPasswordWithToken(resetToken, newPassword, confirmNewPassword);
            console.log('[AuthContext Reset Password] Password reset successful.');
            return response.data;
        } catch (err) {
            console.error('[AuthContext Reset Password] Reset password error:', err.response?.data?.message || err.message);
            setResetPasswordError(err.response?.data?.message || 'Failed to reset password.');
            throw err;
        } finally {
            setResetPasswordLoading(false);
        }
    }, []);

    // useCallback to clear the main error state
    const clearError = useCallback(() => { 
        setError(null);
    }, []);

    // The value object provided by the AuthContext
    const value = {
        currentUser: user, 
        isAuthenticated: !!user && !!token, 
        token, 
        user, 
        loading,
        error, 
        login,
        register,
        logout,
        updatePassword,
        sendForgotPasswordEmail,
        resetPassword,
        clearError,
        refreshUser,
        forgotPasswordLoading,
        forgotPasswordError,
        resetPasswordLoading,
        resetPasswordError,
    };

    // Render the AuthContext.Provider with the value and children
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Render the AuthContext.Provider with the value and children
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;