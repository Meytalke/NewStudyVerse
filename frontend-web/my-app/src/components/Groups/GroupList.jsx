import { useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './GroupList.css';
import { useGroups } from '../contexts/GroupsContext';
import AuthContext from '../contexts/AuthContext';

const GroupList = ({ groups }) => {
  const { user } = useContext(AuthContext); 
  const navigate = useNavigate();
  const { deleteGroup, getGroups, joinGroup ,sendJoinRequest} = useGroups(); // אנחנו צריכים את getGroups כדי לרענן

  const isUserInGroup = useCallback((group) => {
    console.log("user " + user); 
    if (!user || !user.user_id || !Array.isArray(group.members)) {
        return false;
    }
    return group.members.some(member => {
        console.log("member " + member); 
        const memberId = member._id ? member._id.toString() : member.toString();
        return memberId === user.user_id.toString();
    });
}, [user]);

  const isGroupOwner = useCallback((group) => {
    return user && group.creator === user.user_id;
  }, [user]);

  if (!Array.isArray(groups) || groups.length === 0) {
    return <div className="noResults">No groups available.</div>;
  }

  const handleJoinGroup = async (group) => { 
    console.log('handleJoinGroup: group object received:', group);
    console.log('handleJoinGroup: group._id:', group ? group._id : 'group or group._id is undefined');
    if (!user) {
      navigate('/login', { state: { from: `/groups`, message: 'You must be logged in to join a group' } });
      return;
    }

    if (group.isPrivate) {
      try {
        await sendJoinRequest(group._id); 
        alert('Your join request has been sent to the group admin for approval.');
      } catch (error) {
        console.error('Error sending join request:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to send join request. Please try again.';
        alert(errorMessage);
      }
    } else {
      try {
        await joinGroup(group._id); 
        alert('You have successfully joined the public group!');
      } catch (error) {
        console.error('Error joining group:', error);
        alert(error.message || 'Failed to join group. Please try again.');
      }
    }
  };

  const handleViewGroup = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

  const handleViewGroupDashboard = (groupId) => {
    const targetPath = `/groups/${groupId}/dashboard`;
    console.log('Attempting to navigate to:', targetPath); 
    navigate(targetPath);
};

  const handleViewRequests = (groupId) => {
    navigate(`/groups/${groupId}/requests`);
  };

  const handleDeleteGroup = async (groupId) => {
    if (!user) {
      navigate('/login', { state: { from: `/groups`, message: 'You must be logged in to delete a group' } });
      return;
    }

    const isConfirmed = window.confirm('Are you sure you want to delete this group? This action cannot be undone.');

    if (isConfirmed) {
      try {
        await deleteGroup(groupId); 
        console.log(`Group ${groupId} deleted successfully`);
        alert(`Group deleted successfully`);
        getGroups(); 
      } catch (error) {
        console.error('Error deleting group:', error);
        alert('Failed to delete group');
      }
    } else {
      console.log('Delete action cancelled by user.');
    }
  };

  const handleEditGroup = (groupId) => {
    navigate(`/groups/${groupId}/settings`);
  };

  return (
    <div className="groupListContainer">
      <table className="groupsTable">
        <thead>
          <tr>
            <th>Group Name</th>
            <th>Description</th>
            <th>Institution</th>
            <th>Course Code</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(group => (
            <tr key={group._id}>
              <td>{group.name}</td>
              <td>{group.description}</td>
              <td>{group.institution}</td>
              <td>{group.courseCode}</td>
              <td className="actions">
                <button className="view-details-btn" onClick={() => handleViewGroup(group._id)}>Details</button>
                {user ? (
                    !isUserInGroup(group) ? (
                    <button
                        className={`join-btn ${group.isPrivate ? 'private' : 'public'}`}
                        onClick={() => handleJoinGroup(group)}
                    >
                        Join
                    </button>
                    ) : (
                    <button className="view-group-btn" onClick={() => handleViewGroupDashboard(group._id)}>
                       View
                       </button>
                    )
                ) : (
                    <button className="join-btn" onClick={() => navigate('/login')}>Login to Join</button>
                )}
                {isGroupOwner(group) && (
                  <>
                    <button className="edit-btn" onClick={() => handleEditGroup(group._id)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDeleteGroup(group._id)}>Delete</button>
                    <button className="requests-btn" onClick={() => handleViewRequests(group._id)}>Requests</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GroupList;