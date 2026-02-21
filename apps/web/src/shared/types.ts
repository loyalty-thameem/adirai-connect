export type FeedPost = {
  _id: string;
  userId: string;
  content: string;
  category: string;
  locationTag?: string;
  likesCount: number;
  commentsCount: number;
  reportsCount: number;
  urgentVotes: number;
  importantVotes: number;
  score?: number;
  createdAt: string;
};

export type Complaint = {
  _id: string;
  title: string;
  description: string;
  category: string;
  area: string;
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: string;
};

export type Listing = {
  _id: string;
  type: 'job' | 'business' | 'offer' | 'freelancer' | 'rental' | 'vehicle';
  title: string;
  description: string;
  area: string;
  contactName?: string;
  contactPhone?: string;
  priceLabel?: string;
  createdAt: string;
};

export type Event = {
  _id: string;
  title: string;
  description: string;
  category: string;
  area: string;
  eventDate: string;
  venue?: string;
};

export type Contact = {
  _id: string;
  type: string;
  name: string;
  phone: string;
  area: string;
  available24x7: boolean;
};

export type Poll = {
  _id: string;
  question: string;
  options: Array<{ id: string; label: string; votes: number }>;
  area: string;
  endsAt: string;
};

export type Group = {
  _id: string;
  name: string;
  area: string;
  privacy: 'public' | 'private' | 'invite_only';
  membersCount: number;
};

export type Suggestions = {
  nearbyUsers: Array<{ _id: string; name: string; area: string }>;
  suggestedGroups: Group[];
  suggestedBusinesses: Listing[];
};

