import axios from 'axios';

const api = axios.create({
  baseURL: 'https://studyverse-backend-r31i.onrender.com',
  headers: {
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),

  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  getCurrentUser: () => api.get('/auth/me'),

  resetPassword: (email) => api.post('/auth/reset-password', { email }),
  changePassword: (passwords) => api.post('/auth/change-password', passwords), 
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPasswordWithToken: (token, newPassword, confirmNewPassword) =>
    api.post(`/auth/reset-password/${token}`, { newPassword, confirmNewPassword }),
};

const groupsService = {
  getGroups: (params) => api.get('/groups', { params }),
  getGroupById: (groupId) => api.get(`/groups/${groupId}`),
  
  createGroup: (groupData) => api.post('/groups', groupData),
  updateGroup: (groupId, groupData) => api.put(`/groups/${groupId}`, groupData),
  deleteGroup: (groupId) => api.delete(`/groups/${groupId}`),
  
  joinGroup: (groupId) => api.post(`/groups/${groupId}/join`),
  leaveGroup: (groupId) => api.post(`/groups/${groupId}/leave`),
  
  getGroupMembers: (groupId) => api.get(`/groups/${groupId}/members`),
  getTrendingGroups: () => api.get('/groups/trending'),
  
  checkPendingRequestForUser: (groupId, userId) => api.get(`/groups/${groupId}/requests/pending/${userId}`),  
  sendJoinRequest: (groupId) => api.post(`/groups/${groupId}/request-join`),
  getGroupRequests: (groupId) => api.get(`/groups/${groupId}/join-requests`),
  approveJoinRequest: (groupId, requestId) => api.post(`/groups/${groupId}/join-requests/${requestId}/approve`),
  rejectJoinRequest: (groupId, requestId) => api.post(`/groups/${groupId}/join-requests/${requestId}/reject`),
  removeGroupMember: (groupId, memberId) => api.delete(`/groups/${groupId}/members/${memberId}`),
};

const postsService = {
    getPosts: (params) => api.get('/posts', { params }), 
    getPostById: (postId) => api.get(`/posts/${postId}`), 
    getGroupPosts: (groupId, params) => api.get(`/groups/${groupId}/posts`, { params }), 
    
    createPost: async (postData) => {
        const response = await api.post('/posts', postData); 
        return response.data;
    },
    updatePost: (postId, postData) => api.put(`/posts/${postId}`, postData), 
    deletePost: (postId) => api.delete(`/posts/${postId}`), 

    getRecentPosts: () => api.get('/posts/recent'), 
};

const likesService = {
    toggleLike: (targetType, targetId) => api.put(`/likes/${targetType}/${targetId}`),
    likePost: (postId) => api.put(`/posts/${postId}/like`), 
    unlikePost: (postId) => api.put(`/posts/${postId}/unlike`), 
  }
const commentsService = {
    addComment: (postId, userId ,text) => api.post(`/comments`, { postId, userId ,text }),
    updateComment: (commentId, commentData) => api.put(`/comments/${commentId}`, commentData),
    deleteComment: (commentId) => api.delete(`/comments/${commentId}`)
};

const chatsService = {
    getChats: () => api.get('/chats'), 
    createChat: (recipientId) => api.post('/chats', { recipientId }), 
    getChatMessages: (chatId) => api.get(`/chats/${chatId}/messages`),
    sendMessage: (chatId, messageData) => api.post(`/chats/${chatId}/messages`, messageData), 
    markMessagesAsRead: (chatId, messageIds) => api.put(`/chats/${chatId}/messages/read`, { messageIds }),
    deleteChat: (chatId) => api.delete(`/chats/${chatId}`),
  };

const userService = {
    getUsers: (params) => api.get('/users', { params }),
    getUserById: (userId) => api.get(`/users/${userId}`),
    getUserGroups: (userId) => api.get(`/users/${userId}/groups`),
    getPublicUserProfile: (userId) => api.get(`/users/profile/${userId}`), 
    getUserPosts: (userId) => api.get(`/users/${userId}/posts`),

    updateProfile: (userData) => api.put('/users/profile', userData),
    deleteAccount: () => api.delete('/users/me'),

    getAllUsers: () => api.get('/users/admin/all'),
    deleteUser: (userId) => api.delete(`/users/admin/${userId}`),
    updateUserByAdmin: (userId, userData) => api.put(`/users/admin/${userId}`, userData),
    updateUserRole: (userId, newRoleData) => api.patch(`/users/admin/${userId}/role`, newRoleData),
};

// const searchService = {
//   search: (query) => api.get('/search', { params: { query } }),
//   searchUsers: (query) => api.get('/search/users', { params: { query } }),
//   searchGroups: (query) => api.get('/search/groups', { params: { query } }),
//   searchPosts: (query) => api.get('/search/posts', { params: { query } }),
// };

const statsService = {
  getDashboardStats: () => api.get('/stats/dashboard'),
  getGroupStats: (groupId) => api.get(`/stats/groups/${groupId}`),
  getUserStats: (userId) => api.get(`/stats/users/${userId}`),
};

const filesService = {
  getGroupFiles: (groupId) => api.get(`/groups/${groupId}/files`),
  
  uploadFile: (groupId, formData) => api.post(`/groups/${groupId}/files/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  deleteFile: (groupId, fileId) => api.delete(`/groups/${groupId}/files/${fileId}`),
};
export {
  api,
  authService,
  groupsService,
  postsService,
  likesService,
  commentsService,
  chatsService,
  userService,
  // searchService,
  statsService,
  filesService,
};