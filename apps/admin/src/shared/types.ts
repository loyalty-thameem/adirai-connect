export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'user' | 'business_user';
export type UserStatus = 'active' | 'blocked' | 'suspended' | 'deleted';

export type AdminUser = {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  verifiedBadge: boolean;
  area: string;
  shadowBanned?: boolean;
  loginMeta?: {
    isOnline?: boolean;
    lastSeenAt?: string;
    lastLoginAt?: string;
  };
  analyticsMeta?: {
    timeSpentMinutes?: number;
    engagementScore?: number;
    urgentPostsCount?: number;
    importantPostsCount?: number;
  };
  createdAt?: string;
};

export type Complaint = {
  _id: string;
  title: string;
  description: string;
  category: string;
  area: string;
  status: 'pending' | 'in_progress' | 'resolved';
  assignedDepartment?: string;
  createdAt: string;
};

export type ModerationFlag = {
  _id: string;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  aiToxicityScore: number;
  fakeNewsScore: number;
  resolved: boolean;
  createdAt: string;
};

export type Campaign = {
  _id: string;
  mode: 'personal' | 'bulk' | 'broadcast';
  channels: Array<'in_app' | 'email' | 'whatsapp'>;
  title: string;
  status: 'queued' | 'sent' | 'failed';
  deliveryStats?: {
    totalTargets: number;
    sentCount: number;
    failedCount: number;
  };
  createdAt: string;
};

export type Group = {
  _id: string;
  name: string;
  area: string;
  privacy: 'public' | 'private' | 'invite_only';
  membersCount: number;
  isMuted: boolean;
  isFrozen: boolean;
};

export type MobileConfig = {
  _id?: string;
  minAndroidVersion: string;
  minIosVersion: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  forceUpdate: boolean;
  pushEnabled: boolean;
  apiTimeoutMs: number;
  releaseChannel: string;
  featureFlags?: {
    chatEnabled?: boolean;
    marketplaceEnabled?: boolean;
    pollsEnabled?: boolean;
    groupsEnabled?: boolean;
  };
};
