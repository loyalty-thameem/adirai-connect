# Community API (Step 4)

Base URL: `http://localhost:4000/api/v1/community`

## Feed + Posts

- `GET /feed?area=Adirai%20East`
- `POST /posts`
- `POST /posts/:postId/react` with body `{ "userId": "...", "action": "like|comment|report" }`
- `POST /posts/:postId/urgent` with body `{ "userId": "..." }`
- `POST /posts/:postId/important` with body `{ "userId": "..." }`
- `GET /posts/:postId/signals` (accepted/rejected signal audit)

## Complaints

- `POST /complaints`
- `GET /complaints/me?userId=<userId>`

## Job + Business Board

- `GET /listings?type=job`
- `POST /listings`

## Events

- `GET /events`
- `POST /events`

## Contacts

- `GET /contacts`
- `POST /contacts/seed`

## Polls

- `GET /polls`
- `POST /polls`
- `POST /polls/vote`

## Groups

- `GET /groups`
- `POST /groups` (max 3 groups per creator)

## Suggestions

- `GET /suggestions?area=Adirai%20East`

## Anti-Manipulation Rules (Step 5)

- One `urgent` vote per user per post.
- One `important` vote per user per post.
- Cannot mark your own post as urgent/important.
- User rate limit: max `20` urgent/important actions per hour.
- IP/device rate limit: max `60` urgent/important actions per hour.
- Suspicious clustering from same IP increments `suspiciousSignalsCount` and reduces feed score.
