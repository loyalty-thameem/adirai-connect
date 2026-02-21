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
  },
};
