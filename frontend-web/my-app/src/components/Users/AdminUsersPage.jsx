import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { studyFields, institutions, yearOptions } from '../utils/types';
import './AdminUsersPage.css'; 

const AdminUsersPage = () => {
    const { user: authUser, loading: authLoading } = useAuth();
    const {
        allUsers,
        allUsersLoading,
        allUsersError,
        getAllUsers,
        adminDeleteUser,
        adminUpdateUser,
        adminUpdateUserRole
    } = useUser();

    const navigate = useNavigate();

    const [loadingAction, setLoadingAction] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        role: '',
        institution: '',
        studyField: '',
        yearOfStudy: ''
    });

    const [searchParams, setSearchParams] = useState({
        username: '',
        email: '',
        role: '', 
        institution: '',
        studyField: '',
        yearOfStudy: '',
        isVerified: '', 
    });
    const [filteredUsers, setFilteredUsers] = useState([]);

    const fetchUsers = useCallback(async () => {
        try {
            await getAllUsers();
        } catch (err) {
            toast.error('Error loading users.');
        }
    }, [getAllUsers]);

    useEffect(() => {
        if (!authLoading) {
            if (!authUser || authUser.role !== 'admin') {
                toast.error("You do not have permission to view this page.");
                navigate('/dashboard');
                return;
            }
            fetchUsers();
        }
    }, [fetchUsers, authUser, authLoading, navigate]);

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prevParams => ({
            ...prevParams,
            [name]: value,
        }));
    };

    const handleClearSearch = () => {
        setSearchParams({
            username: '',
            email: '',
            role: '',
            institution: '',
            studyField: '',
            yearOfStudy: '',
            isVerified: '',
        });
    };

    useEffect(() => {
        if (!allUsers || allUsersLoading) {
            setFilteredUsers([]);
            return;
        }

        let currentFilteredUsers = allUsers;

        if (searchParams.username) {
            currentFilteredUsers = currentFilteredUsers.filter(user =>
                user.username.toLowerCase().includes(searchParams.username.toLowerCase())
            );
        }

        if (searchParams.email) {
            currentFilteredUsers = currentFilteredUsers.filter(user =>
                user.email.toLowerCase().includes(searchParams.email.toLowerCase())
            );
        }

        if (searchParams.role) {
            currentFilteredUsers = currentFilteredUsers.filter(user =>
                user.role === searchParams.role
            );
        }

        if (searchParams.institution) {
            currentFilteredUsers = currentFilteredUsers.filter(user =>
                user.institution && user.institution.toLowerCase().includes(searchParams.institution.toLowerCase())
            );
        }

        if (searchParams.studyField) {
            currentFilteredUsers = currentFilteredUsers.filter(user =>
                user.studyField === searchParams.studyField
            );
        }

        if (searchParams.yearOfStudy) {
            currentFilteredUsers = currentFilteredUsers.filter(user =>
                user.yearOfStudy === searchParams.yearOfStudy
            );
        }

        if (searchParams.isVerified !== '') {
            const isVerifiedBool = searchParams.isVerified === 'true';
            currentFilteredUsers = currentFilteredUsers.filter(user =>
                user.emailVerified === isVerifiedBool
            );
        }

        setFilteredUsers(currentFilteredUsers);
    }, [allUsers, searchParams, allUsersLoading]); 

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }
        setLoadingAction(true);
        try {
            await adminDeleteUser(userId);
            toast.success('User deleted successfully!');
        } catch (err) {
            console.error('Error deleting user:', err);
            toast.error(err.response?.data?.message || 'Failed to delete user.');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleEditClick = (userToEdit) => {
        setEditingUser(userToEdit.user_id); 
        setEditForm({
            role: userToEdit.role,
            institution: userToEdit.institution || '',
            studyField: userToEdit.studyField || '',
            yearOfStudy: userToEdit.yearOfStudy || ''
        });
    };

    const handleEditFormChange = (e) => {
        setEditForm({
            ...editForm,
            [e.target.name]: e.target.value
        });
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
        setEditForm({ role: '', institution: '', studyField: '', yearOfStudy: '' });
    };

    const handleSaveEdit = async (userId) => {
        setLoadingAction(true);
        try {
            const dataToUpdate = {
                role: editForm.role,
                institution: editForm.institution,
                studyField: editForm.studyField,
                yearOfStudy: editForm.yearOfStudy
            };
            await adminUpdateUser(userId, dataToUpdate); 
            toast.success('User updated successfully!');
            setEditingUser(null);
        } catch (err) {
            console.error('Error updating user:', err);
            toast.error(err.response?.data?.message || 'Failed to update user.');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleChangeRole = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'student' : 'admin'; 
        if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
            return;
        }
        setLoadingAction(true);
        try {
            await adminUpdateUserRole(userId, { role: newRole });
            toast.success(`User role changed to ${newRole}!`);
        } catch (err) {
            console.error('Error changing user role:', err);
            toast.error(err.response?.data?.message || 'Failed to change user role.');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    if (allUsersLoading) {
        return (
            <div className="admin-users-container">
                <p className="loading-indicator">
                    <span className="spinner">⚙️</span> Loading users...
                </p>
            </div>
        );
    }

    if (allUsersError || (!authLoading && (!authUser || authUser.role !== 'admin'))) {
        const displayError = allUsersError || 'You do not have permission to view this page.';
        return (
            <div className="admin-users-container">
                <p className="error-message">{displayError}</p>
                {displayError.includes("permission") && <p className="unauthorized-message">Please ensure you are logged in as an administrator.</p>}
                <button className="back-button" onClick={handleGoBack}>Go Back</button>
            </div>
        );
    }

    if (!authUser) {
        return (
            <div className="admin-users-container">
                <p className="unauthorized-message">Authentication not complete. Please refresh or log in again.</p>
                <button className="back-button" onClick={handleGoBack}>Go Back</button>
            </div>
        );
    }

    return (
        <div className="admin-users-container">
            <div className="admin-header">
                <button className="back-button" onClick={handleGoBack}>&larr; Go Back</button>
                <h1 className="page-title">Manage Users</h1>
            </div>

            <div className="search-container">
                <h2 className="search-title">Filter Users</h2>
                <form className="search-form">
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={searchParams.username}
                            onChange={handleSearchChange}
                            placeholder="Search by username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={searchParams.email}
                            onChange={handleSearchChange}
                            placeholder="Search by email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="role">Role</label>
                        <select
                            id="role"
                            name="role"
                            value={searchParams.role}
                            onChange={handleSearchChange}
                        >
                            <option value="">All</option>
                            <option value="student">Student</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="institution">Academic Institution</label>
                        <select
                            id="institution"
                            name="institution"
                            value={searchParams.institution}
                            onChange={handleSearchChange}
                        >
                            <option value="">All Institutions</option>
                            {institutions.map(inst => (
                                <option key={inst} value={inst}>{inst}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="studyField">Study Field</label>
                        <select
                            id="studyField"
                            name="studyField"
                            value={searchParams.studyField}
                            onChange={handleSearchChange}
                        >
                            <option value="">All Study Fields</option>
                            {studyFields.map(field => (
                                <option key={field} value={field}>{field}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="yearOfStudy">Year of Study</label>
                        <select
                            id="yearOfStudy"
                            name="yearOfStudy"
                            value={searchParams.yearOfStudy}
                            onChange={handleSearchChange}
                        >
                            <option value="">All Years</option>
                            {yearOptions.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="isVerified">Email Verified</label>
                        <select
                            id="isVerified"
                            name="isVerified"
                            value={searchParams.isVerified}
                            onChange={handleSearchChange}
                        >
                            <option value="">All</option>
                            <option value="true">Verified</option>
                            <option value="false">Not Verified</option>
                        </select>
                    </div>

                    <div className="search-buttons">
                        <button type="button" className="btn btn-secondary" onClick={handleClearSearch}>Clear Filters</button>
                    </div>
                </form>
            </div>

            {loadingAction && <p className="loading-indicator">Processing action...</p>}

            <div className="table-responsive">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Institution</th>
                            <th>Study Field</th>
                            <th>Year of Study</th>
                            <th>Verified</th> 
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center' }}>No users found matching your criteria.</td> 
                            </tr>
                        ) : (
                            filteredUsers.map(u => (
                                <tr key={u.user_id} className={u.role === 'admin' ? 'admin-row' : ''}>
                                    {editingUser === u.user_id ? (
                                        <>
                                            <td data-label="Username">
                                                <input
                                                    type="text"
                                                    value={u.username}
                                                    disabled
                                                    className="disabled-input"
                                                />
                                            </td>
                                            <td data-label="Email">
                                                <input
                                                    type="email"
                                                    value={u.email}
                                                    disabled
                                                    className="disabled-input"
                                                />
                                            </td>
                                            <td data-label="Role">
                                                <select
                                                    name="role"
                                                    value={editForm.role}
                                                    onChange={handleEditFormChange}
                                                    disabled={loadingAction || authUser.user_id === u.user_id}
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                {authUser.user_id === u.user_id && <span className="self-action-note">Cannot change your own role here</span>}
                                            </td>
                                            <td data-label="Institution">
                                                <select
                                                    name="institution"
                                                    value={editForm.institution}
                                                    onChange={handleEditFormChange}
                                                    disabled={loadingAction}
                                                >
                                                    <option value="">Select Institution</option>
                                                    {institutions.map(inst => (
                                                        <option key={inst} value={inst}>{inst}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td data-label="Study Field">
                                                <select
                                                    name="studyField"
                                                    value={editForm.studyField}
                                                    onChange={handleEditFormChange}
                                                    disabled={loadingAction}
                                                >
                                                    <option value="">Select Study Field</option>
                                                    {studyFields.map(field => (
                                                        <option key={field} value={field}>{field}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td data-label="Year of Study">
                                                <select
                                                    name="yearOfStudy"
                                                    value={editForm.yearOfStudy}
                                                    onChange={handleEditFormChange}
                                                    disabled={loadingAction}
                                                >
                                                    <option value="">Select Year</option>
                                                    {yearOptions.map(year => (
                                                        <option key={year} value={year}>{year}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td data-label="Verified">
                                                {u.emailVerified ? 'Yes' : 'No'}
                                            </td>
                                            <td data-label="Created At">
                                                {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td data-label="Actions">
                                                <button
                                                    className="action-button primary"
                                                    onClick={() => handleSaveEdit(u._id)}
                                                    disabled={loadingAction}
                                                    title="Save Changes"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    className="action-button secondary"
                                                    onClick={handleCancelEdit}
                                                    disabled={loadingAction}
                                                    title="Cancel Edit"
                                                >
                                                    Cancel
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td data-label="Username">
                                                {u.username} {authUser.user_id === u.user_id && <span className="current-user-tag">(You)</span>}
                                            </td>
                                            <td data-label="Email">{u.email}</td>
                                            <td data-label="Role" className={u.role === 'admin' ? 'role-admin' : 'role-user'}>
                                                {u.role}
                                            </td>
                                            <td data-label="Institution">{u.institution || 'N/A'}</td>
                                            <td data-label="Study Field">{u.studyField || 'N/A'}</td>
                                            <td data-label="Year of Study">{u.yearOfStudy || 'N/A'}</td>
                                            <td data-label="Verified">{u.emailVerified ? 'Yes' : 'No'}</td>
                                            <td data-label="Created At">
                                                {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td data-label="Actions">
                                                {authUser.user_id !== u.user_id ? (
                                                    <>
                                                        <button
                                                            className="action-button edit"
                                                            onClick={() => handleEditClick(u)}
                                                            disabled={loadingAction}
                                                            title="Edit User"
                                                        >
                                                            ⚙️ Edit
                                                        </button>
                                                        <button
                                                            className="action-button delete"
                                                            onClick={() => handleDeleteUser(u._id)}
                                                            disabled={loadingAction}
                                                            title="Delete User"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                        <button
                                                            className={`action-button ${u.role === 'admin' ? 'demote-button' : 'promote-button'}`}
                                                            onClick={() => handleChangeRole(u._id, u.role)}
                                                            disabled={loadingAction}
                                                            title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                                                        >
                                                            {u.role === 'admin' ? '⬇️ Demote' : '⬆️ Promote'}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="self-action-note">Cannot manage your own account here.</span>
                                                )}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsersPage;