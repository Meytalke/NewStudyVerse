import { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { groupsService } from '../services/api'; 
import { useAuth } from './AuthContext'; 

const GroupContext = createContext();

export const useGroups = () => useContext(GroupContext);

export const GroupProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [errorGroups, setErrorGroups] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [errorRequests, setErrorRequests] = useState('');

  const { user } = useAuth(); 

  // Function to fetch all groups
  const getGroups = useCallback(async () => {
    setLoadingGroups(true);
    setErrorGroups('');
    try {
      const response = await groupsService.getGroups();
      setGroups(response.data);
    } catch (error) {
      setErrorGroups(error.response?.data?.message || 'Failed to fetch groups.');
      console.error("Error fetching groups:", error);
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  // Function to get a single group by ID
  const getGroupById = useCallback(async (groupId) => {
    setLoadingGroups(true); 
    setErrorGroups(''); // Clear previous errors
    try {
      const response = await groupsService.getGroupById(groupId);
      return response.data;
    } catch (error) {
      setErrorGroups(error.response?.data?.message || `Failed to fetch group with ID: ${groupId}`);
      console.error(`Error fetching group ${groupId}:`, error);
      throw error; 
    } finally {
      setLoadingGroups(false); 
    }
  }, []);

  // Function to create a group
  const createGroup = useCallback(async (groupData) => {
    setLoadingGroups(true);
    setErrorGroups('');
    try {
      const newGroup = await groupsService.createGroup(groupData);
      setGroups((prevGroups) => [newGroup.data, ...prevGroups]);
      return newGroup.data;
    } catch (error) {
      setErrorGroups(error.response?.data?.message || 'Failed to create group.');
      console.error("Error creating group:", error);
      throw error;
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  // Function to update a group
  const updateGroup = useCallback(async (groupId, groupData) => {
    setLoadingGroups(true);
    setErrorGroups('');
    try {
      const response = await groupsService.updateGroup(groupId, groupData);
      // Update the group in the local state
      setGroups(prevGroups =>
        prevGroups.map(group =>
          group._id === groupId ? response.data : group
        )
      );
      return response.data;
    } catch (err) {
      setErrorGroups(err.response?.data?.message || `Failed to update group ${groupId}.`);
      console.error(`Failed to update group ${groupId}:`, err);
      throw err;
    } finally {
      setLoadingGroups(false);
    }
  }, []);


  // Function to delete a group
  const deleteGroup = useCallback(async (groupId) => {
    setLoadingGroups(true);
    setErrorGroups('');
    try {
      await groupsService.deleteGroup(groupId);
      setGroups((prevGroups) => prevGroups.filter(group => group._id !== groupId));
      return true;
    } catch (error) {
      setErrorGroups(error.response?.data?.message || `Failed to delete group with ID: ${groupId}`);
      console.error(`Error deleting group ${groupId}:`, error);
      throw error;
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  // Function to remove a member from a group
  const removeGroupMember = useCallback(async (groupId, memberId) => {
    setLoadingGroups(true);
    setErrorGroups(''); 
    try {
      await groupsService.removeGroupMember(groupId, memberId);
      setGroups(prevGroups =>
        prevGroups.map(group =>
          group._id === groupId
            ? { ...group, members: group.members.filter(m => m._id !== memberId) }
            : group
        )
      );
      return true; 
    } catch (err) {
      setErrorGroups(err.response?.data?.message || `Failed to remove member ${memberId} from group ${groupId}.`); // Use setErrorGroups
      console.error(`Failed to remove member ${memberId} from group ${groupId}:`, err);
      throw err;
    } finally {
      setLoadingGroups(false); 
    }
  }, []);


  // Function to join a group
  const joinGroup = useCallback(async (groupId) => {
    setLoadingGroups(true);
    setErrorGroups('');
    try {
      await groupsService.joinGroup(groupId);
      await getGroups();
      return true;
    } catch (error) {
      setErrorGroups(error.response?.data?.message || `Failed to join group with ID: ${groupId}`);
      console.error(`Error joining group ${groupId}:`, error);
      throw error;
    } finally {
      setLoadingGroups(false);
    }
  }, [getGroups]);

  // Function to leave a group
  const leaveGroup = useCallback(async (groupId, userId) => { 
    setLoadingGroups(true);
    setErrorGroups('');
    try {
        await groupsService.leaveGroup(groupId);

        setGroups((prevGroups) =>
            prevGroups.map(group => {
                if (group._id === groupId) {
                    const newMembers = group.members.filter(member => {
                        const memberId = member?.user_id || member?._id || member; 
                        return memberId?.toString() !== userId?.toString();
                    });

                    return {
                        ...group, 
                        members: newMembers 
                    };
                }
                return group; 
            })
        );
        return true;
    } catch (error) {
        setErrorGroups(error.response?.data?.message || `Failed to leave group with ID: ${groupId}`);
        console.error(`Error leaving group ${groupId}:`, error);
        throw error;
    } finally {
        setLoadingGroups(false);
    }
}, []);

  // Function to fetch group join requests
  const getGroupRequests = useCallback(async (groupId) => {
    setLoadingRequests(true);
    setErrorRequests('');
    try {
      const response = await groupsService.getGroupRequests(groupId);
      setPendingRequests(response.data);
      return response.data;
    } catch (error) {
      setErrorRequests(error.response?.data?.message || 'Failed to fetch group requests.');
      console.error("Error fetching group requests:", error);
      throw error;
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  // Function to send a join request
  const sendJoinRequest = useCallback(async (groupId) => {
    try {
      await groupsService.sendJoinRequest(groupId);
      return true;
    } catch (error) {
      setErrorRequests(error.response?.data?.message || 'Failed to send join request.');
      console.error("Error sending join request:", error);
      throw error;
    }
  }, []);

  // Function to approve a join request
  const approveJoinRequest = useCallback(async (groupId, requestId) => {
    setLoadingRequests(true);
    setErrorRequests('');
    try {
      await groupsService.approveJoinRequest(groupId, requestId);
      await getGroupRequests(groupId); // Re-fetch requests to update UI
      return true;
    } catch (error) {
      setErrorRequests(error.response?.data?.message || 'Failed to approve join request.');
      console.error("Error approving join request:", error);
      throw error;
    } finally {
      setLoadingRequests(false);
    }
  }, [getGroupRequests]);

  // Function to reject a join request
  const rejectJoinRequest = useCallback(async (groupId, requestId) => {
    setLoadingRequests(true);
    setErrorRequests('');
    try {
      await groupsService.rejectJoinRequest(groupId, requestId);
      await getGroupRequests(groupId); // Re-fetch requests to update UI
      return true;
    } catch (error) {
      setErrorRequests(error.response?.data?.message || 'Failed to reject join request.');
      console.error("Error rejecting join request:", error);
      throw error;
    } finally {
      setLoadingRequests(false);
    }
  }, [getGroupRequests]);

  // // TODO
  // // Placeholder for sendAdminPromotionRequest (assuming it exists in groupsService)
  // const sendAdminPromotionRequest = useCallback(async (groupId, userIdToPromote) => {
  //     try {
  //         await groupsService.sendAdminPromotionRequest(groupId, userIdToPromote);
  //         return true;
  //     } catch (error) {
  //         setErrorRequests(error.response?.data?.message || 'Failed to send admin promotion request.');
  //         console.error("Error sending admin promotion request:", error);
  //         throw error;
  //     }
  // }, []);

  // // TODO
  // // Placeholder for approveAdminPromotionRequest (assuming it exists in groupsService)
  // const approveAdminPromotionRequest = useCallback(async (requestId) => { 
  //     setLoadingRequests(true);
  //     setErrorRequests('');
  //     try {
  //         await groupsService.approveAdminPromotionRequest(requestId);
  //         return true;
  //     } catch (error) {
  //         setErrorRequests(error.response?.data?.message || 'Failed to approve admin promotion request.');
  //         console.error("Error approving admin promotion request:", error);
  //         throw error;
  //     } finally {
  //         setLoadingRequests(false);
  //     }
  // }, []);

  // // TODO
  // // Placeholder for rejectAdminPromotionRequest (assuming it exists in groupsService)
  // const rejectAdminPromotionRequest = useCallback(async (requestId) => { 
  //     setLoadingRequests(true);
  //     setErrorRequests('');
  //     try {
  //         await groupsService.rejectAdminPromotionRequest(requestId);
  //         return true;
  //     } catch (error) {
  //         setErrorRequests(error.response?.data?.message || 'Failed to reject admin promotion request.');
  //         console.error("Error rejecting admin promotion request:", error);
  //         throw error;
  //     } finally {
  //         setLoadingRequests(false);
  //     }
  // }, []);

  const checkPendingRequestForUser = useCallback(async (groupId, userId) => {
    try {
      const res = await groupsService.checkPendingRequestForUser(groupId, userId);
      return res.data.isPending;
    } catch (err) {
      console.error(`Failed to check pending request for group ${groupId} and user ${userId}:`, err.response?.data?.message || err.message);
      return false; 
    }
  }, []);

  const isUserInGroup = useCallback((group) => {
    if (!user || !group || !Array.isArray(group.members)) {
        console.warn("isUserInGroup: Missing user, group, or group members array.");
        return false;
    }

    const currentUserId = user.user_id || user._id;
      console.log(currentUserId);
    if (!currentUserId) {
        console.warn("isUserInGroup: Current user ID is undefined.");
        return false;
    }
    const currentUserIdStr = currentUserId.toString(); 

    return group.members.some(member => {
        const memberId = member?.user_id || member?._id;
        if (!memberId) {
            return false; 
        }
        return memberId.toString() === currentUserIdStr;
    });
}, [user]);

const isGroupOwner = useCallback((group) => {
    if (!user || !group || !group.creator) {
        console.warn("isGroupOwner: Missing user, group, or group creator.");
        return false;
    }

    const currentUserId = user.user_id || user._id;
    console.log(group.creator)
    if (!currentUserId) {
        console.warn("isGroupOwner: Current user ID is undefined.");
        return false;
    }
    const currentUserIdStr = currentUserId.toString(); 

    const creatorId = group.creator.user_id || group.creator._id;
    if (!creatorId) {
        console.warn("isGroupOwner: Group creator ID is undefined.");
        return false;
    }

    return creatorId.toString() === currentUserIdStr;
}, [user]);

  // Initial load of groups when the Provider mounts
  useEffect(() => {
    getGroups();
  }, [getGroups]);

  const contextValue = useMemo(() => ({
    groups,
    loadingGroups,
    errorGroups,
    pendingRequests,
    loadingRequests,
    errorRequests,
    getGroups,
    createGroup,
    getGroupById,
    updateGroup, 
    deleteGroup,
    removeGroupMember, 
    joinGroup,
    leaveGroup,
    getGroupRequests,
    sendJoinRequest,
    approveJoinRequest,
    rejectJoinRequest,
    // sendAdminPromotionRequest,
    // approveAdminPromotionRequest,
    // rejectAdminPromotionRequest,
    checkPendingRequestForUser,
    isUserInGroup,
    isGroupOwner,
  }), [
    groups,
    loadingGroups,
    errorGroups,
    pendingRequests,
    loadingRequests,
    errorRequests,
    getGroups,
    createGroup,
    getGroupById,
    updateGroup, 
    deleteGroup,
    removeGroupMember, 
    joinGroup,
    leaveGroup,
    getGroupRequests,
    sendJoinRequest,
    approveJoinRequest,
    rejectJoinRequest,
    // sendAdminPromotionRequest,
    // approveAdminPromotionRequest,
    // rejectAdminPromotionRequest,
    checkPendingRequestForUser,
    isUserInGroup,
    isGroupOwner,
  ]);

  return (
    <GroupContext.Provider value={contextValue}>
      {children}
    </GroupContext.Provider>
  );
};