const express = require('express');
const router = express.Router();
const groupsController = require('../controllers/groupsController');
const postController = require('../controllers/postsController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const filesController = require('../controllers/filesController');

router.post('/', auth, groupsController.createGroup);
router.get('/', groupsController.getAllGroups);
router.get('/:groupId', groupsController.getGroupById);
router.get('/:groupId/posts', auth, postController.getGroupPosts);

router.post('/:groupId/request-join', auth, groupsController.requestToJoinGroup);
router.get('/:groupId/join-requests', auth, groupsController.getJoinRequests);
router.post('/:groupId/join-requests/:requestId/approve', auth, groupsController.approveJoinRequest);
router.post('/:groupId/join-requests/:requestId/reject', auth, groupsController.rejectJoinRequest);

router.post('/:groupId/join', auth, groupsController.joinGroup);
router.post('/:groupId/leave', auth, groupsController.leaveGroup);
router.get('/:groupId/members', groupsController.getGroupMembers);

router.get('/trending', groupsController.getTrendingGroups);

router.put('/:groupId', auth, groupsController.updateGroup);

router.delete('/:groupId/members/:memberId', auth, groupsController.removeGroupMember); 
router.delete('/:groupId', auth, groupsController.deleteGroup);

router.get('/:groupId/files', auth, filesController.getGroupFiles);

router.post('/:groupId/files/upload', auth, upload.single('file'), filesController.uploadFile);

router.delete('/:groupId/files/:fileId', auth, filesController.deleteFile);

module.exports = router;