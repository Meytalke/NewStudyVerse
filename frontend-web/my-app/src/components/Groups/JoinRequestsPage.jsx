import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroups } from '../contexts/GroupsContext'; 
import AuthContext from '../contexts/AuthContext'; 
import './JoinRequestsPage.css'; 

const JoinRequestsPage = () => {
  console.log("in JoinRequestsPage");
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); 

  const {
    getGroupById,
    getGroupRequests,
    approveJoinRequest,
    rejectJoinRequest,
    pendingRequests,
    loadingRequests,
    errorRequests,
  } = useGroups();

  const [group, setGroup] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [errorGroup, setErrorGroup] = useState(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    const fetchGroupAndRequests = async () => {
      if (!user) {
        console.log("User not logged in, redirecting to login.");
        navigate('/login', { state: { from: `/groups/${groupId}/requests` } });
        return;
      }

      setLoadingGroup(true);
      setErrorGroup(null);
      setIsUnauthorized(false);

      try {
        const fetchedGroup = await getGroupById(groupId);
        setGroup(fetchedGroup);

        const isCreator = fetchedGroup.creator &&
                          fetchedGroup.creator.user_id && 
                          fetchedGroup.creator.user_id.toString() === user.user_id.toString();

        console.log("Logged in user ID (from AuthContext):", user.user_id);
        console.log("Group creator object (from Backend):", fetchedGroup.creator); 
        console.log("Group creator user_id (from Backend):", fetchedGroup.creator?.user_id); 
        console.log("Is current user the creator?", isCreator);

        if (!isCreator) {
          console.log("Authorization failed: Current user is not the group creator.");
          setIsUnauthorized(true);
          setLoadingGroup(false); 
          return; 
        }

        console.log("User is authorized. Fetching join requests...");
        await getGroupRequests(groupId);

      } catch (err) {
        console.error("Error fetching group or requests:", err);
        setErrorGroup(err.message || 'Failed to load group details or requests.');
      } finally {
        setLoadingGroup(false); 
      }
    };

    fetchGroupAndRequests();
  }, [groupId, user, navigate, getGroupById, getGroupRequests]); 

  const handleApprove = async (requestId) => {
    try {
      console.log(`Approving request ${requestId} for group ${groupId}...`);
      await approveJoinRequest(groupId, requestId);
      alert('Join request approved successfully!');
    } catch (err) {
      console.error('Error approving request:', err);
      alert(err.message || 'Failed to approve request. Please try again.');
    }
  };

  const handleReject = async (requestId) => {
    try {
      console.log(`Rejecting request ${requestId} for group ${groupId}...`);
      await rejectJoinRequest(groupId, requestId);
      alert('Join request rejected successfully!');
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert(err.message || 'Failed to reject request. Please try again.');
    }
  };

  if (loadingGroup) {
    return <div className="loading-message">Loading group details...</div>;
  }

  if (errorGroup) {
    return <div className="error-message">Error: {errorGroup}</div>;
  }

  if (isUnauthorized) {
    return <div className="unauthorized-message">You are not authorized to view join requests for this group.</div>;
  }

  if (!group) {
    return <div className="no-group-found">Group not found or could not be loaded.</div>;
  }

  return (
    <div className="join-requests-page-container" dir="ltr">
      <button className="back-button" onClick={() => navigate(`/groups/`)}>
        &larr; Back to Groups Page
      </button>
      <h1>Join Requests for {group.name}</h1>

      {loadingRequests ? (
        <div className="loading-message">Loading requests...</div>
      ) : errorRequests ? (
        <div className="error-message">Error loading requests: {errorRequests}</div>
      ) : pendingRequests && pendingRequests.length > 0 ? (
        <ul className="requests-list">
          {pendingRequests.map(request => (
            <li key={request._id} className="request-item">
              <span>
                <strong>{request.user ? request.user.username : 'Unknown User'}</strong> ({request.user ? request.user.email : 'No Email'}) wants to join.
              </span>
              <div className="request-actions">
                <button className="approve-button" onClick={() => handleApprove(request._id)}>Approve</button>
                <button className="reject-button" onClick={() => handleReject(request._id)}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-requests">No pending join requests for this group.</div>
      )}
    </div>
  );
};

export default JoinRequestsPage;