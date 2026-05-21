import { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { userService } from '../services/api';
import { useAuth } from './AuthContext';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const { currentUser, loading: authLoading, isAuthenticated} = useAuth();

    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [profileError, setProfileError] = useState(null);

    const [publicProfileLoading, setPublicProfileLoading] = useState(false);
    const [publicProfileError, setPublicProfileError] = useState(null);

    const [allUsers, setAllUsers] = useState([]);
    const [allUsersLoading, setAllUsersLoading] = useState(false);
    const [allUsersError, setAllUsersError] = useState(null);
    const [userActionLoading, setUserActionLoading] = useState(false);

    const getUserProfile = useCallback(async () => {
        if (!currentUser || !currentUser.user_id) {
            console.warn("UserContext: Cannot fetch current user profile, currentUser or _id is missing.");
            setProfileError("User not authenticated.");
            setLoadingProfile(false);
            return;
        }
        setLoadingProfile(true);
        setProfileError(null);
        try {
            const response = await userService.getUserById(currentUser._id);
            setProfile(response.data);
            console.log("UserContext: Current user profile fetched:", response.data);
        } catch (err) {
            console.error("UserContext: Failed to fetch current user profile:", err);
            setProfileError(err.response?.data?.message || 'Failed to load user profile.');
        } finally {
            setLoadingProfile(false);
        }
    }, [currentUser]);

    const getPublicUserProfile = useCallback(async (userId) => {
        setPublicProfileLoading(true);
        setPublicProfileError(null);
        try {
            const response = await userService.getPublicUserProfile(userId);
            console.log("UserContext: Public user profile fetched for", userId, ":", response.data);
            return response.data;
        } catch (err) {
            console.error("UserContext: Failed to fetch public user profile:", err);
            const errorMessage = err.response?.data?.message || "Failed to load public profile data.";
            setPublicProfileError(errorMessage);
            throw err;
        } finally {
            setPublicProfileLoading(false);
        }
    }, []);

    const updateProfile = useCallback(async (userData) => {
        setUserActionLoading(true);
        setProfileError(null);
        try {
            const response = await userService.updateProfile(userData);
            setProfile(response.data);
            console.log("UserContext: Profile updated successfully:", response.data);
            return response.data;
        } catch (err) {
            console.error("UserContext: Failed to update profile:", err);
            setProfileError(err.response?.data?.message || 'Failed to update profile.');
            throw err;
        } finally {
            setUserActionLoading(false);
        }
    }, []);


    // Function to get all users (Admin)
    const getAllUsers = useCallback(async () => {
        setAllUsersLoading(true);
        setAllUsersError(null);
        try {
            const response = await userService.getAllUsers();
            setAllUsers(response.data);
            console.log("UserContext (Admin): All users fetched:", response.data.length, "users.");
        } catch (err) {
            console.error("UserContext (Admin): Failed to fetch all users:", err);
            setAllUsersError(err.response?.data?.message || 'Failed to load all users.');
            setAllUsers([]);
        } finally {
            setAllUsersLoading(false);
        }
    }, []); // This function itself updates allUsers

    // Function to delete a user (Admin)
    const adminDeleteUser = useCallback(async (userId) => {
        setUserActionLoading(true);
        setAllUsersError(null);
        try {
            await userService.deleteUser(userId);
            console.log("UserContext (Admin): User deleted:", userId);
            await getAllUsers();
        } catch (err) {
            console.error("UserContext (Admin): Failed to delete user:", err);
            setAllUsersError(err.response?.data?.message || 'Failed to delete user.');
            throw err;
        } finally {
            setUserActionLoading(false);
        }
    }, [getAllUsers]); 

    // Function to update a user's details (Admin)
    const adminUpdateUser = useCallback(async (userId, userData) => {
        setUserActionLoading(true);
        setAllUsersError(null);
        try {
            const response = await userService.updateUserByAdmin(userId, userData);
            console.log("UserContext (Admin): User updated:", userId, response.data);
            // After successful update, RE-FETCH all users
            await getAllUsers(); 
            return response.data;
        } catch (err) {
            console.error("UserContext (Admin): Failed to update user:", err);
            setAllUsersError(err.response?.data?.message || 'Failed to update user.');
            throw err;
        } finally {
            setUserActionLoading(false);
        }
    }, [getAllUsers]);

    // Function to update a user's role (Admin)
    const adminUpdateUserRole = useCallback(async (userId, newRoleData) => {
        setUserActionLoading(true);
        setAllUsersError(null);
        try {
            const response = await userService.updateUserRole(userId, newRoleData);
            console.log("UserContext (Admin): User role updated:", userId, response.data.role);
            // After successful role update, RE-FETCH all users
            await getAllUsers(); 
            return response.data;
        } catch (err) {
            console.error("UserContext (Admin): Failed to update user role:", err);
            setAllUsersError(err.response?.data?.message || 'Failed to update user role.');
            throw err;
        } finally {
            setUserActionLoading(false);
        }
    }, [getAllUsers]); 

    useEffect(() => {
        if (!authLoading && isAuthenticated && currentUser && currentUser.user_id) {
            getUserProfile();
        } else if (!authLoading && !isAuthenticated) {
            setProfile(null);
            setLoadingProfile(false);
        }
    }, [authLoading, isAuthenticated, currentUser, getUserProfile]);

    const value = {
        profile,
        loadingProfile,
        profileError,
        getPublicUserProfile,
        updateProfile,

        allUsers,
        allUsersLoading,
        allUsersError,
        userActionLoading,
        
        getAllUsers,
        adminDeleteUser,
        adminUpdateUser,
        adminUpdateUserRole,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export default UserContext;