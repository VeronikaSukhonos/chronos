# API documentation

This document contains a short description of all [**chronos API**](https://github.com/VeronikaSukhonos/chronos/tree/main/backend) endpoints.

Unless otherwise specified, all request bodies must be sent as `application/json`.

Response structure:
* always - `message` (string)
* if returns data - `data` (object with a property corresponding to the entity, e.g., `user: {}` or `users: [ {}, {} ]`)
* in case of validation errors - `errors` (array of objects, e.g., `{ param: 'login', error: 'Login is required' }`)

## Authentication module

1. `POST /api/auth/register` - registers a new user

**Parameters**: `login` (can specify login or email), `password`

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
* by login - can be partial, by email - must be exact (`?login=choronosuser` or `?login=chronosuser@gmail.com`)

**Data**: array of users (`id`, `login`, `avatar`, if present - `fullName`, `dob`)

**Important**: only the first value of a parameter is used if multiple provided

2. `GET /api/users/:userId` - gets specified user data

**Data**: user data (`login`, `email` (only visible to profile owners), `fullName`, `dob`)

3. `PATCH /api/users/avatar` - uploads a user avatar

**Parameter**: `avatar` (1 file)

**Important**: accepts file upload - requires `multipart/form-data`

4. `PATCH /api/users` - updates a user profile

**Parameters**: at least one of `login` (cannot be empty if provided), `fullName`, `dob` (YYYY-MM-DD format)

5. `DELETE /api/users/avatar` - deletes a user avatar

6. `PATCH /api/users/email` - updates a user email

**Parameters**: `password`, `email`

**Important**: sends an email confirmation link to the user's email, new email must be confirmed to be updated

7. `PATCH /api/users/password` - updates a user password

**Parameters**: `curPassword`, `password`

8. `POST /api/users` - deletes a user profile

**Parameter**: `password`

9. `GET /api/users/visibility-settings` - gets an authorized user visibility settings for events to be displayed

**Data**: visibility settings data (`calendars`, `eventTypes`, `tags`)

# Calendars module

All endpoints require authorization.

1. `GET /api/calendars` - gets all calendars an authorized user owns or has access to

**Filtering**:
* by name (`?name=Chronos`) - gets public calendars with this name
* by author (`?author=chronosuser`) - gets public calendars with this author
* by limit (`?limit=10`) - how many items returns at most

**Sorting:**
* always sorts in an alphabetical order (main and holidays are first)

**Data**: array of calendars (`id`, `name`, `color`, `author` (`id`, `login` and `avatar`), `type`, `role` (role of an authorized user in the calendar), `isPublic`)

**Important**: only the first value of a parameter is used if multiple provided, hidden calendars can be seen only by authors

2. `GET /api/calendars/hidden` - gets all hidden calendars of an authorized user

**Sorting:**
* always sorts in alphabetical order

**Data**: array of calendars (`id`, `name`, `color`, `isPublic`, `eventsCount`, `participantsCount`, `followersCount`)

3. `GET /api/calendars/:calendarId` - gets information about the specified calendar

**Data**: calendar data (everything, including role, participants and followers are arrays (`id`, `login`, `avatar`, for participants - `isConfirmed`), author is an object (`id`, `login`, `avatar`))

**Important**: works if an authorized user has access to the calendar, not authours cannot see unconfirmed participants

4. `POST /api/calendars` - creates a new calendar

**Parameters**: `name`, optional `description`, `color` (default `#ade4ff`), `participants` (array of IDs), `isPublic` (true or "true")

**Data**: created calendar data (without participants and followers)

**Important**: adding a participant sends a single-use confirmation link to them

5. `PATCH /api/calendars/:calendarId` - updates the specified calendar

**Parameters**: at least one of `name` (cannot be empty if provided), `description`, `color`, `participants` (array of IDs), `followers` (array of IDs), `isPublic` (true or "true")

**Data**: updated calendar data (without participants and followers)

**Important**: works if an authorized user is an author of a calendar; adding a participant sends a single-use confirmation link to them; main and holidays calendars can be changed in no way, except color

6. `POST /api/calendars/:calendarId/archive` - archives the specified calendar

**Important**: works if an authorized user is an author of a calendar

7. `DELETE /api/calendars/:calendarId/archive` - dearchives the specified calendar

**Important**: works if an authorized user is an author of a calendar

8. `GET /api/calendars/confirm/:confirmToken` - views information about a calendar participation in which an authorized user should confirm

**Data**: calendar data(`id`, `name`, `author` (`id` and `login`))

9. `POST /api/calendars/:calendarId/confirm` - (re)sends a calendar participation link to the user

**Parameters**: `participantId`

10. `POST /api/calendars/confirm/:confirmToken` - confirms an authorized user's participation in the calendar

11. `POST /api/calendars/:calendarId/follow` - adds a follower to the calendar

12. `DELETE /api/calendars/:calendarId` - deletes a calendar

**Important**: if an authorized user is an author of the calendar, it is deleted completely, if an autorized user is a participant/follower, the calendar is deleted only for them; main and holidays calendars cannot be deleted

13. `POST /api/calendars/:calendarId/events` - creates a new event in the calendar

**Parameters**: `name`, `type`, `startDate`, optional `description`, `color` (default - color of calendar), `participants` (if isn't visible for all, default - author, calendar's author), `repeat`, `tags`, optional for arrangements `endDate` (default is `startDate` + 1 hour), `link`, `visibleForAll` (default - false)

**Data**: created event data (everything except participants, author is an object (`id`, `login`, `avatar`))

**Important**: works if an authorized user is an author or participant of a calendar; can select event participants from all users, in this case a user is added as calendar participant

# Events module

All endpoints require authorization.

1. `POST /api/events` - gets all events an authorized user can see

**Filtering**:
* by calendars (`"calendar": "calendarId"` or `"calendar": ["Id1", "Id2"]`) - gets events from calendars with these Ids
* by types (`"type": "arrangement"` or `"type": ["arrangement", "task"]`) - gets events of these types
* by tags (`"tag": "work"` or `"tag": ["work", "uni"]`) - gets events with these tags
* by country code (`"country": "UA"`) - gets this country's holidays
* by year (`"year": 2026`) - gets events of this year or current year if nothing is provided, must be greater than current year - 50 and less than current year + 50 (it seems such way)
* by week (`"week": 2`) - gets events of this week of the year (for example, week 2 of year 2026 starts from January 5th), must be a positive number, if provided - `month` and `day` aren't taken into account
* by month (`"month": 1`) - gets events of this month or current month if nothing is provided (except case when `year` is provided but `day` isn't), must be a not-negative number
* by day (`"day": 15`) - gets events of this day or current day if nothing is provided (except case when `year` or `month` is provided), must be a positive number
* by name (`"search": "Dancing"`) - gets events with this name
* by limit (`"limit": 10`) - how many items returns at most if `name` is provided

**Data**: array of events (everything except participants, author is an object (`id`, `login`, `avatar`))

**Important**: if search is performed, first come future events sorted from late to recent, then past events sorted from recent to late, and every event is unique (no event's clones if it has `repeat` parameter); otherwice events are sorted from late to recent and event's repetitions of this time range are included

2. `GET /api/events/:eventId` - gets information about a specified event

**Data**: event data (everything, participants are arrays (`id`, `login`, `avatar` and `isConfirmed`), author is an object (`id`, `login`, `avatar`), calendar is an object (`id`, `name`, `color` and `authorId`))

**Important:** works if an authorized user has access to the event

3. `GET /api/events/confirm/:confirmToken` - views information about an event participation in which an authorized user should confirm

**Data**: event data(`id`, `name`, `author` (`id` and `login`), `calendar` (`id` and `name`))

4. `POST /api/events/:eventId/confirm` - (re)sends an event participation link to the user

**Parameters**: `participantId`

5. `POST /api/events/confirm/:confirmToken` - confirms an authorized user's participation in the event

6. `PATCH /api/events/:eventId` - updates an event

**Parameters**: at least one of `name` (cannot be empty if provided), `description`, `startDate`, `endDate`, `color`, `participants` (if it's an event not from Main or Holidays calendars), `tags`, `repeat` (if an arrangement or reminder), `link` (if an arrangement), `visibleForAll` (if it's an event not from Main or Holidays calendars)

**Data**: updated event data (everything except participants, author is an object (`id`, `login`, `avatar`))

**Important**: works if an authorized user is an author of a event

7. `POST /api/events/:eventId/done` - does a task

**Important**: works if an authorized user is an author or participant of an event

8. `DELETE /api/events/:eventId/done` - undoes a task

**Important**: works if an authorized user is an author or participant of an event

9. `DELETE /api/events/eventId` - deletes an event

**Important**: works if an authorized user is an author of an event

# Tags Module

All endpoints require authorization.

1. `GET /api/tags` - gets all tags of an authorized user

**Data**: array of tags (everything)

2. `POST /api/tags` - creates a new tag

**Data**: created tag data (everything)

**Parameter**: `title`

3. `PATCH /api/tags/:tagId` - updates a tag title

**Data**: updated tag data (everything)

**Parameter**: `title`

4. `DELETE /api/tags/:tagId` - deletes a tag
