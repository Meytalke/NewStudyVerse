import { useState, useEffect,useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, Edit, Save, XCircle, UserX, ArrowLeft } from 'lucide-react';
import './GroupAdminSettings.css';
import { useAuth } from '../contexts/AuthContext';
import { useGroups } from '../contexts/GroupsContext';
import { institutions} from '../utils/types';

const GroupAdminSettings = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { getGroupById, updateGroup, deleteGroup, removeGroupMember } = useGroups(); // <--- קבלת פונקציות מהקונטקסט

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // States for editable fields
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editInstitution, setEditInstitution] = useState('');
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [currentMembers, setCurrentMembers] = useState([]); 

  const fetchGroupDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedGroup = await getGroupById(groupId);
            setGroup(fetchedGroup); // Update the main group state

            // Populate edit states with fetched group data
            setEditName(fetchedGroup.name);
            setEditDescription(fetchedGroup.description);
            setEditInstitution(fetchedGroup.institution || '');
            setEditCourseCode(fetchedGroup.courseCode || '');
            setEditIsPrivate(fetchedGroup.isPrivate);
            setCurrentMembers(fetchedGroup.members || []); // Update currentMembers state

            if (!isAuthenticated || !user || !fetchedGroup.creator) {
                alert("You are not authorized to manage this group.");
                navigate(`/groups/${groupId}`);
                return;
            }

        } catch (err) {
            console.error("Failed to fetch group details:", err);
            setError("Failed to load group details. Please try again. " + (err.response?.data?.message || err.message));
            if (err.response && (err.response.status === 403 || err.response.status === 401 || err.response.status === 404)) {
                navigate(`/groups/${groupId}`);
            }
        } finally {
            setLoading(false);
        }
    }, [
        groupId,
        user, 
        isAuthenticated,
        navigate,
        getGroupById, 
        setGroup,
        setEditName,
        setEditDescription,
        setEditInstitution,
        setEditCourseCode,
        setEditIsPrivate,
        setCurrentMembers,
        setLoading,
        setError
    ]);

    useEffect(() => {
        fetchGroupDetails(); // This now calls the memoized function
    }, [fetchGroupDetails]);

  // Function to handle saving all group details
  const handleSaveChanges = async () => {
    setError(null);
    try {
      const updatedGroupData = {
        name: editName,
        description: editDescription,
        institution: editInstitution,
        courseCode: editCourseCode,
        isPrivate: editIsPrivate,
      };

      const response = await updateGroup(groupId, updatedGroupData);
      setGroup(response); // Context already returns the updated data
      setIsEditing(false);
      alert('Group details updated successfully!');
      fetchGroupDetails();
    } catch (err) {
      console.error("Failed to update group:", err);
      setError("Failed to update group. " + (err.response?.data?.message || err.message));
    }
  };

  // Function to handle removing a member
  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member from the group?")) {
      return;
    }
    setError(null);
    try {
      await removeGroupMember(groupId, memberId);
      setCurrentMembers(currentMembers.filter(member => member._id !== memberId));
      const updatedGroup = await getGroupById(groupId);
      setGroup(updatedGroup);
      navigate(`/groups/`);

      alert('Member removed successfully!');
    } catch (err) {
      console.error("Failed to remove member:", err);
      setError("Failed to remove member. " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteGroup = async () => {
    if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      setError(null);
      try {
        await deleteGroup(groupId);
        alert('Group deleted successfully!');
        navigate('/groups');
      } catch (err) {
        console.error("Failed to delete group:", err);
        setError("Failed to delete group. " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleGoBack = () => {
    navigate(`/groups/`);
  };

  if (loading) {
    return <div className="group-settings-container loading">Loading group settings...</div>;
  }

  if (error) {
    return (
      <div className="group-settings-container">
        <div className="error-message">{error}</div>
        <button onClick={handleGoBack} className="back-button-error">
          <ArrowLeft size={16} /> Back to Group
        </button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-settings-container">
        <div className="not-found-container">
            <div className="not-found-icon">😕</div>
            <h3 className="not-found-title">Group Not Found or Access Denied</h3>
            <p className="not-found-message">
                The group you're looking for doesn't exist or you don't have permission to manage it.
            </p>
            <button onClick={() => navigate('/groups')} className="back-to-groups-link">
                Back to Groups List
            </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !group.creator || (user.id !== group.creator._id && user.id !== group.creator.id)) {
    return (
      <div className="group-settings-container">
        <div className="not-found-container">
            <div className="not-found-icon">⛔</div>
            <h3 className="not-found-title">Unauthorized Access</h3>
            <p className="not-found-message">
                You do not have permission to manage this group.
            </p>
            <button onClick={handleGoBack} className="back-to-groups-link">
                Back to Group
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group-settings-container ltr">
      <button onClick={handleGoBack} className="back-button">
        <ArrowLeft size={16} className="back-button-icon" /> Back to all Groups
      </button>

      <h1>Admin Settings for {group.name}</h1>
      <p className="group-id">Group ID: {group._id}</p>
      
      {error && <div className="error-message">{error}</div>}

      <div className="settings-section group-details-management">
        <div className="section-header">
          <h2>Group Details</h2>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="action-button edit-button-icon">
              <Edit size={18} /> Edit Details
            </button>
          ) : (
            <div className="edit-buttons-group">
              <button onClick={handleSaveChanges} className="action-button save-button-icon">
                <Save size={18} /> Save Changes
              </button>
              <button onClick={() => setIsEditing(false)} className="action-button cancel-button-icon">
                <XCircle size={18} /> Cancel
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="edit-form-grid">
            <div className="form-field">
              <label htmlFor="groupName">Group Name:</label>
              <input
                id="groupName"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Group Name"
                className="settings-input"
              />
            </div>
            <div className="form-field">
              <label htmlFor="groupDescription">Description:</label>
              <textarea
                id="groupDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Group Description"
                className="settings-textarea"
              />
            </div>
            <div className="form-field">
              <label htmlFor="groupInstitution">Institution:</label>
              <select
                    id="groupInstitution"
                    className="settings-input"
                    placeholder="Institution"
                    value={editInstitution}
                    onChange={(e) => setEditInstitution(e.target.value)}
                    >
                    {institutions.map((field) => (
                        <option key={field} value={field}>
                            {field}
                        </option>
                    ))}                
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="groupCourseCode">Course Code:</label>
              <input
                id="groupCourseCode"
                type="text"
                value={editCourseCode}
                onChange={(e) => setEditCourseCode(e.target.value)}
                placeholder="Course Code (e.g., CS101)"
                className="settings-input"
              />
            </div>
            <div className="form-field checkbox-field">
              <input
                id="groupIsPrivate"
                type="checkbox"
                checked={editIsPrivate}
                onChange={(e) => setEditIsPrivate(e.target.checked)}
                className="settings-checkbox"
              />
              <label htmlFor="groupIsPrivate">Private Group</label>
            </div>
          </div>
        ) : (
          <div className="group-details-display">
            <p><strong>Name:</strong> {group.name}</p>
            <p><strong>Description:</strong> {group.description}</p>
            <p><strong>Institution:</strong> {group.institution || 'N/A'}</p>
            <p><strong>Course Code:</strong> {group.courseCode || 'N/A'}</p>
            <p><strong>Privacy:</strong> {group.isPrivate ? 'Private' : 'Public'}</p>
          </div>
        )}
      </div>

      <div className="settings-section member-management">
        <div className="section-header">
          <h2>Group Members ({currentMembers.length})</h2>
        </div>
        <ul className="member-list">
          {currentMembers.length > 0 ? (
            currentMembers.map(member => (
              <li key={member._id} className="member-item">
                <div className="member-info">
                  <div className="member-avatar-small">
                    {member.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="member-username">{member.username}</span>
                  <span className="member-email">({member.email})</span>
                </div>
                {member._id !== group.creator._id && (
                  <button onClick={() => handleRemoveMember(member.user_id)} className="remove-member-button">
                    <UserX size={16} /> Remove
                  </button>
                )}
              </li>
            ))
          ) : (
            <p className="no-members-message">No members in this group yet.</p>
          )}
        </ul>
      </div>

      <div className="settings-section danger-zone">
        <div className="section-header">
          <h2>Danger Zone</h2>
        </div>
        <p>This action cannot be undone.</p>
        <button onClick={handleDeleteGroup} className="delete-group-button">
          <Trash2 size={18} /> Delete Group Permanently
        </button>
      </div>
    </div>
  );
};

export default GroupAdminSettings;