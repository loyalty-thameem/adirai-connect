export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Adirai Connect API',
    version: '0.1.0',
  },
  servers: [{ url: 'http://localhost:4000/api/v1' }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          '200': { description: 'OK' },
        },
      },
    },
    '/health/live': {
      get: {
        summary: 'Liveness probe endpoint',
        responses: {
          '200': { description: 'Live' },
        },
      },
    },
    '/health/ready': {
      get: {
        summary: 'Readiness probe endpoint',
        responses: {
          '200': { description: 'Ready' },
          '503': { description: 'Not ready' },
        },
      },
    },
    '/health/metrics': {
      get: {
        summary: 'Runtime metrics endpoint',
        responses: {
          '200': { description: 'Metrics payload' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register user',
        responses: {
          '201': { description: 'Created' },
        },
      },
    },
    '/auth/otp/request': {
      post: {
        summary: 'Request OTP for register/login/password_reset',
        responses: {
          '200': { description: 'OTP issued' },
        },
      },
    },
    '/auth/otp/verify': {
      post: {
        summary: 'Verify OTP (login or password reset pre-check)',
        responses: {
          '200': { description: 'Verified' },
        },
      },
    },
    '/auth/password/forgot': {
      post: {
        summary: 'Request password reset OTP',
        responses: {
          '200': { description: 'OTP issued for password reset' },
        },
      },
    },
    '/auth/login/password': {
      post: {
        summary: 'Password login',
        responses: {
          '200': { description: 'Logged in' },
        },
      },
    },
    '/auth/login/oauth': {
      post: {
        summary: 'OAuth login bridge for Google/Microsoft',
        responses: {
          '200': { description: 'Logged in' },
        },
      },
    },
    '/auth/token/refresh': {
      post: {
        summary: 'Refresh access token with refresh token rotation',
        responses: {
          '200': { description: 'Tokens rotated' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Logout current session',
        responses: {
          '200': { description: 'Logged out' },
        },
      },
    },
    '/auth/logout-all': {
      post: {
        summary: 'Logout all sessions for current user',
        responses: {
          '200': { description: 'All sessions revoked' },
        },
      },
    },
    '/auth/password/reset': {
      post: {
        summary: 'Reset password with reset token',
        responses: {
          '200': { description: 'Password reset' },
        },
      },
    },
    '/auth/sessions/me': {
      get: {
        summary: 'Get my login/session history',
        responses: {
          '200': { description: 'History list' },
        },
      },
    },
    '/auth/sessions/force-logout': {
      post: {
        summary: 'Admin force logout all user sessions',
        responses: {
          '200': { description: 'User sessions revoked' },
        },
      },
    },
    '/auth/privacy/consent': {
      patch: {
        summary: 'Update user privacy consent preferences',
        responses: {
          '200': { description: 'Consent updated' },
        },
      },
    },
    '/admin/dashboard/analytics': {
      get: {
        summary: 'Admin analytics dashboard',
        responses: {
          '200': { description: 'Analytics payload' },
        },
      },
    },
    '/admin/dashboard/security': {
      get: {
        summary: 'Admin security dashboard',
        responses: {
          '200': { description: 'Security payload' },
        },
      },
    },
    '/admin/security/audit-logs': {
      get: {
        summary: 'Admin audit trail for mutating requests',
        responses: {
          '200': { description: 'Audit logs list' },
        },
      },
    },
    '/admin/mobile/config': {
      get: {
        summary: 'Get mobile runtime config',
        responses: {
          '200': { description: 'Mobile config' },
        },
      },
      patch: {
        summary: 'Update mobile runtime config',
        responses: {
          '200': { description: 'Mobile config updated' },
        },
      },
    },
    '/admin/users': {
      get: {
        summary: 'List users with filters',
        responses: {
          '200': { description: 'Users list' },
        },
      },
    },
    '/admin/complaints': {
      get: {
        summary: 'List complaints',
        responses: {
          '200': { description: 'Complaints list' },
        },
      },
    },
    '/admin/moderation/flags': {
      get: {
        summary: 'List moderation flags',
        responses: {
          '200': { description: 'Flag list' },
        },
      },
      post: {
        summary: 'Create moderation flag',
        responses: {
          '201': { description: 'Flag created' },
        },
      },
    },
    '/admin/messaging/broadcast': {
      post: {
        summary: 'Send broadcast campaign',
        responses: {
          '201': { description: 'Campaign created' },
        },
      },
    },
    '/community/feed': {
      get: {
        summary: 'Community feed with ranking score',
        responses: {
          '200': { description: 'Feed items' },
        },
      },
    },
    '/community/mobile-config': {
      get: {
        summary: 'Public mobile config endpoint for app bootstrap',
        responses: {
          '200': { description: 'Mobile runtime config' },
        },
      },
    },
    '/community/mobile/telemetry': {
      post: {
        summary: 'Collect mobile telemetry event',
        responses: {
          '201': { description: 'Telemetry accepted' },
        },
      },
    },
    '/community/posts': {
      post: {
        summary: 'Create community post',
        responses: {
          '201': { description: 'Post created' },
        },
      },
    },
    '/community/posts/{postId}/urgent': {
      post: {
        summary: 'Mark post as urgent (anti-manipulation protected)',
        responses: {
          '200': { description: 'Urgent accepted' },
          '409': { description: 'Already marked urgent' },
          '429': { description: 'Rate limited' },
        },
      },
    },
    '/community/posts/{postId}/important': {
      post: {
        summary: 'Mark post as important (anti-manipulation protected)',
        responses: {
          '200': { description: 'Important accepted' },
          '409': { description: 'Already marked important' },
          '429': { description: 'Rate limited' },
        },
      },
    },
    '/community/posts/{postId}/signals': {
      get: {
        summary: 'Signal audit for a post',
        responses: {
          '200': { description: 'Signal counters' },
        },
      },
    },
    '/community/complaints': {
      post: {
        summary: 'Create complaint',
        responses: {
          '201': { description: 'Complaint created' },
        },
      },
    },
    '/community/listings': {
      get: {
        summary: 'List jobs/business/offers',
        responses: {
          '200': { description: 'Listings' },
        },
      },
      post: {
        summary: 'Create listing',
        responses: {
          '201': { description: 'Listing created' },
        },
      },
    },
    '/community/events': {
      get: {
        summary: 'List events and announcements',
        responses: {
          '200': { description: 'Events list' },
        },
      },
      post: {
        summary: 'Create event',
        responses: {
          '201': { description: 'Event created' },
        },
      },
    },
    '/community/contacts': {
      get: {
        summary: 'Emergency and important contacts',
        responses: {
          '200': { description: 'Contacts list' },
        },
      },
    },
    '/community/polls': {
      get: {
        summary: 'List polls',
        responses: {
          '200': { description: 'Polls list' },
        },
      },
      post: {
        summary: 'Create poll',
        responses: {
          '201': { description: 'Poll created' },
        },
      },
    },
    '/community/groups': {
      get: {
        summary: 'List groups',
        responses: {
          '200': { description: 'Groups list' },
        },
      },
      post: {
        summary: 'Create group (max 3 per user)',
        responses: {
          '201': { description: 'Group created' },
        },
      },
    },
    '/community/suggestions': {
      get: {
        summary: 'Suggested nearby users/groups/business',
        responses: {
          '200': { description: 'Suggestions' },
        },
      },
    },
  },
};
