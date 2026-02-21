# Community API (Step 4)

Base URL: `http://localhost:4000/api/v1/community`

## Feed + Posts

- `GET /feed?area=Adirai%20East`
- `POST /posts`
- `POST /posts/:postId/react` with `action` = `like` | `comment` | `report`
- `POST /posts/:postId/urgent`
- `POST /posts/:postId/important`

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

