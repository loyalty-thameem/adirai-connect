import { Router } from 'express';
import {
  createComplaint,
  createEvent,
  createGroup,
  createListing,
  createPoll,
  createPost,
  createMobileTelemetry,
  getFeed,
  getMobileRuntimeConfig,
  getSuggestions,
  listContacts,
  listEvents,
  listGroups,
  listListings,
  listPolls,
  markImportant,
  markUrgent,
  myComplaints,
  reactPost,
  getPostSignals,
  seedContacts,
  votePoll,
} from './community.controller.js';

export const communityRouter = Router();

communityRouter.get('/feed', getFeed);
communityRouter.get('/mobile-config', getMobileRuntimeConfig);
communityRouter.post('/mobile/telemetry', createMobileTelemetry);
communityRouter.post('/posts', createPost);
communityRouter.post('/posts/:postId/react', reactPost);
communityRouter.post('/posts/:postId/urgent', markUrgent);
communityRouter.post('/posts/:postId/important', markImportant);
communityRouter.get('/posts/:postId/signals', getPostSignals);

communityRouter.post('/complaints', createComplaint);
communityRouter.get('/complaints/me', myComplaints);

communityRouter.post('/listings', createListing);
communityRouter.get('/listings', listListings);

communityRouter.post('/events', createEvent);
communityRouter.get('/events', listEvents);

communityRouter.get('/contacts', listContacts);
communityRouter.post('/contacts/seed', seedContacts);

communityRouter.post('/polls', createPoll);
communityRouter.get('/polls', listPolls);
communityRouter.post('/polls/vote', votePoll);

communityRouter.post('/groups', createGroup);
communityRouter.get('/groups', listGroups);

communityRouter.get('/suggestions', getSuggestions);
