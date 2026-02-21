import { Router } from 'express';
import { requireAuth, requireRoles } from '../../common/middleware/auth.js';
import {
  addKeyword,
  createModerationFlag,
  dashboardAnalytics,
  dashboardSecurity,
  forceLogoutByAdmin,
  getMobileConfig,
  getModerationSettings,
  getUser,
  getUserInsights,
  listCampaigns,
  listComplaints,
  listAuditLogs,
  listGroups,
  listModerationFlags,
  listUsers,
  permanentDeleteUser,
  removeGroup,
  resetUserPasswordByAdmin,
  resolveModerationFlag,
  sendBroadcastMessage,
  sendBulkMessage,
  sendPersonalMessage,
  softDeleteUser,
  updateComplaint,
  updateGroupState,
  updateModerationSettings,
  updateMobileConfig,
  updateUserStatus,
  updateUserVerification,
} from './admin.controller.js';

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use(requireRoles(['super_admin', 'admin', 'moderator']));

adminRouter.get('/dashboard/analytics', dashboardAnalytics);
adminRouter.get('/dashboard/security', dashboardSecurity);
adminRouter.get('/security/audit-logs', listAuditLogs);

adminRouter.get('/users', listUsers);
adminRouter.get('/users/:userId', getUser);
adminRouter.get('/users/:userId/insights', getUserInsights);
adminRouter.patch('/users/:userId/status', updateUserStatus);
adminRouter.patch('/users/:userId/verify', updateUserVerification);
adminRouter.post('/users/:userId/force-logout', forceLogoutByAdmin);
adminRouter.post('/users/:userId/reset-password', resetUserPasswordByAdmin);
adminRouter.delete('/users/:userId', softDeleteUser);
adminRouter.delete('/users/:userId/permanent', requireRoles(['super_admin', 'admin']), permanentDeleteUser);

adminRouter.get('/complaints', listComplaints);
adminRouter.patch('/complaints/:complaintId', updateComplaint);

adminRouter.get('/moderation/flags', listModerationFlags);
adminRouter.post('/moderation/flags', createModerationFlag);
adminRouter.patch('/moderation/flags/:flagId', resolveModerationFlag);
adminRouter.get('/moderation/settings', getModerationSettings);
adminRouter.patch('/moderation/settings', updateModerationSettings);
adminRouter.post('/moderation/keywords', addKeyword);

adminRouter.post('/messaging/personal', sendPersonalMessage);
adminRouter.post('/messaging/bulk', sendBulkMessage);
adminRouter.post('/messaging/broadcast', sendBroadcastMessage);
adminRouter.get('/messaging/campaigns', listCampaigns);

adminRouter.get('/groups', listGroups);
adminRouter.patch('/groups/:groupId/state', updateGroupState);
adminRouter.delete('/groups/:groupId', removeGroup);

adminRouter.get('/mobile/config', getMobileConfig);
adminRouter.patch('/mobile/config', requireRoles(['super_admin', 'admin']), updateMobileConfig);
