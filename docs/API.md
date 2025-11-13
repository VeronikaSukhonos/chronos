# API documentation

This document contains a short description of all [**chronos API**](https://github.com/VeronikaSukhonos/chronos/tree/main/backend) endpoints.

Unless otherwise specified, all request bodies must be sent as `application/json`.

Response structure:
* always - `message` (string)
* if returns data - `data` (object with a property corresponding to the entity, e.g., `user: {}` or `users: [ {}, {} ]`)
* in case of validation errors - `errors` (array of objects, e.g., `{ param: 'login', error: 'Login is required' }`)

## Authentication module

1. `POST /api/auth/register` - registers a new user

**Parameters**: `login`, `email`, `password`

**Important**: sends an email confirmation link to the user's email

2. `POST /api/auth/login` - logs in a registered user (issues a pair of access and refresh tokens)

**Parameters**: `login` or `email`, `password`

**Data**: logged-in user data (`login`, `email`, `fullName`, `dob`, `registerDate`), access token

**Important**: only for users with a confirmed email

3. `POST /api/auth/logout` - logs out an authorized user

**Important**: requires authorization **\***

4. `POST /api/auth/password-reset` - sends a password reset link to the user's email

**Parameter**: `email`

**Important**: only for users with a confirmed email

5. `POST /api/auth/password-reset/:confirmToken` - confirms a new password with a token from the email

**Parameter**: `password`

6. `POST /api/auth/email-confirmation` - repeats sending an email confirmation link to the user's email

**Parameter**: `login`, optional `email` (opportunity to provide another email address)

**Important**: works only for users who have not confirmed their email address after registration

7. `POST /api/auth/email-confirmation/:confirmToken` - confirms an email address with a token from the email

8. `POST /api/auth/refresh` - issues a new pair of access and refresh tokens

**Data**: access token

**Important**: refresh token must be provided in the cookies (`refreshToken=<token>`)

**\*** here and in other endpoints requiring authorization an access token must be provided in the `Authorization` header (`Bearer <token>`)

# Users module

All endpoints require authorization.

1. `GET /api/users` - gets all users

**Filtering**:
* by login (`?login=choronosuser`)
* by email (`?email=chronosuser@gmail.com`)

**Data**: array of users (`id`, `login`, `avatar`)

**Important**: only the first value of a parameter is used if multiple provided

2. `GET /api/users/:userId` - gets specified user data

**Data**: user data (`login`, `email` (only visible to profile owners), `fullName`, `dob`, `registerDate`)

3. `PATCH /api/users/avatar` - uploads a user avatar

**Parameter**: `avatar` (1 file)

**Important**: accepts file upload - requires `multipart/form-data`

4. `PATCH /api/users` - updates a user profile

**Parameters**: at least one of `login` (cannot be empty if provided), `fullName`, `dob`

5. `DELETE /api/users/avatar` - deletes a user avatar

6. `PATCH /api/users/email` - updates a user email

**Parameters**: `password`, `email`

**Important**: sends an email confirmation link to the user's email, new email must be confirmed to be updated

7. `PATCH /api/users/password` - updates a user password

**Parameters**: `oldPassword`, `password`

8. `POST /api/users` - deletes a user profile

**Parameter**: `password`

// TODO add enpoint for adding other user's dob to an authorized user calendar

# Calendars module

All endpoints require authorization.

1. `GET /api/calendars` - gets all calendars an authorized user owns or has access to

**Filtering**:
* by hidden (`?hidden=true`)

**Data**: array of calendars (`id`, `name`, `color`)

**Important**: only the first value of a parameter is used if multiple provided, hidden calendars can be seen only by authors

2. `GET /api/calendars/:calendarId` - gets information about specified calendar

**Data**: calendar data (everything) // TODO think if regular users can see participants, or only author can, maybe participants should be another endpoint???

**Important:** works if an authorized user has access to the calendar

3. `POST /api/calendars` - creates a new calendar

**Parameters**: `name`, optional `description`, `color` (default `#ade4ff`), `participants`

**Data**: created calendar data (everything)

4. `POST /api/calendars/:calendarId/events` - creates a new event in a calendar

**Parameters**: `name`, `type`, `startDate`, optional `description`, `color` (default - color of calendar), `participants` (default - author, all calendar participants), `repeat`, `tags`, optional for arrangements `endDate` (default is `startDate` + 1 hour), `link`

**Data**: created event data (everything)

**Important**: works if an authorized user is an author or participant of a calendar

// TODO can select event participants only from calendar participants or from all users (in this case a user is added as calendar participant)???

5. `PATCH /api/calendars/:calendarId` - updates a calendar

**Parameters**: at least one of `name` (cannot be empty if provided), `description`, `color`, `participants`

**Data**: updated calendar data (everything)

**Important**: works if an authorized user is an author of a calendar

6. `POST /api/calendars/:calendarId/confirm` - confirms adding a calendar

**Important**: works only for participant or follower // TODO (how we will know if user is a participant or follower if we update participants array on this stage???)

(Possible solution:
when author adds participant to calendar,
we write token to participants array (or another field in db), and send link /api/calendars/:calendarId/confirm/:confirmToken,
if user accepts, we remove token from db and add user to participants array
if user rejects, we just remove token from db,
if no token provided, add user to followers array if this user is not already in participants)

7. `DELETE /api/calendars/calendarId` - deletes a calendar

**Important**: if an authorized user is an author of the calendar, it is deleted completely, if an autorized user is a participant/follower, the calendar is deleted only for them

# Events module

All endpoints require authorization.

1. `GET /api/events` - gets all events an authorized user can see

**Filtering**:
* by calendars (`?calendar=main&&calendar=holidays`)
* by types (`?type=arrangement&&type=task`)
* by tags (`tag=work&&tag=uni`)
* by year // TODO
* by month // TODO
* by day // TODO
* by name (`?search=Dancing`)

**Data**: array of events (everything except participants)

2. `GET /api/events/:eventId` - gets information about a specified event

**Data**: event data (everything) // TODO think if regular users can see participants, or only author can, maybe participants should be another endpoint???

**Important:** works if an authorized user has access to the event

3. `PATCH /api/events/:eventId` - updates an event

**Parameters**: at least one of `name` (cannot be empty if provided), `description`, `color`, `participants`, `tags`, `repeat`, `link` (if an arrangement)

**Data**: updated event data (everything)

**Important**: works if an authorized user is an author of a event

4. `POST /api/events/:eventId/done` - does a task

**Important**: works if an authorized user is an author or participant of an event

5. `DELETE /api/events/:eventId/done` - undoes a task

**Important**: works if an authorized user is an author or participant of an event

6. `DELETE /api/events/eventId` - deletes an event

**Important**: works if an authorized user is an author of an event

# Tags Module

All endpoints require authorization.

1. `GET /api/tags` - gets all tags of an authorized user

**Data**: array of tags (everything)

2. `POST /api/tags` - creates a new tag

**Data**: created tag data (everything)

**Parameter**: `title`

3. `PATCH /api/tags/tagId` - updates a tag title

**Data**: updated tag data (everything)

**Parameter**: `title`

4. `DELETE /api/tags/tagId` - deletes a tag
