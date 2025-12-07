# Challenge Based Learning (CBL)

This document contains a short description of our progress after every completed **[CBL](https://education.apple.com/learning-center/R006554)** stage of working on **[chronos](https://github.com/VeronikaSukhonos/chronos.git)**.

## Engage

**Big Idea**: Time management.

**Essential Question**: How can technology help you stay organized and manage your time?

**Challenge**: Build a simple and powerful time planner.

## Investigate

This section contains short conclusions we have made after completing guiding questions and activities.

### Guiding Questions

***What is business logic?***

Business logic is a set of rules, principles and dependencies of the behavior of domain objects that defines how the service will process data, implement operations and react on users' actions. This is the "brain" of the system, which sits between the user interface and the database, managing what and how happens to the data in response to requests.

***From a technical point of view, what are the differences between an arrangement, a reminder, and a task?***

An arrangement is an event that has specific duration. A reminder is a peculiar notification about what has to be done that doesn't have specific time boundaries. A task is an event that has a deadline and has to be done.

***What are the main advantages of process automation? What about disadvantages?***

The main advantage of process automation is that after setting some process, you don't have to control it later: the program will do it instead. Automation also saves a lot of time. Nevertheless, there can occur many issues while the process is underway, so the user must handle errors and fix bugs by themselves.

***Why do unit tests save a lot of time during development?***

Unit tests save a lot of time during development because while you run unit tests, you won't have to write tests every time you test the program and you may see results and issues on spot.

***What is the difference between relational and non-relational databases?***

A relational database is a database where data is stored in tables.  A non-relational database is a database where data is stored not in tables, but in other ways (for example, objects).

***What is a Docker container? Why do developers use Docker?***

Docker containers are isolated processes for each of the app's components. Each component - the frontend, the API engine, and the database - runs in its own isolated environment, completely isolated from everything else on the machine. Developers use Docker because applications built in Docker can be run in different operating system.

***How is a Docker container different from just installing the app on your computer?***

Installing an application directly on the computer means the application's files and dependencies are placed directly within the operating system's file system and registered with the system. This can lead to conflicts if different applications require different versions of the same dependency. A Docker container, in contrast, provides a lightweight, isolated environment for an application and all its necessary components (libraries, frameworks, dependencies).

***What is the difference between Docker and traditional deployment?***

Docker deployment packages apps and dependencies into isolated, portable containers that share the host OS kernel, ensuring consistency and speed, while traditional deployment manually installs everything directly on servers, leading to environment variability, dependency conflicts, and slower setup. Docker offers "works on my machine" consistency, rapid scaling, and simplified environments, whereas traditional methods struggle with setup repeatability and can be resource-heavy.

***What is an image in Docker? How does it relate to a container?***

While a container is an isolated process, a container image is a standardized package that includes all of the files, binaries, libraries, and configurations to run a container.

### Guiding Activities

***Find the information about where to start developing a full-stack service.***

We started implementing our full-stack application about refreshing our knowledge in building APIs by Node.js and Express.js and frontend by React and discovering usage of MongoDB and Docker. The blueprints of design were created in Figma.

***Find the web service testing tool that you like the most.***

We usually test our programs by ourselves without any tools by using console logs in terminal (for backend) and browser (for frontend).

***Write some JavaScript code that counts how many days are left from 'date1' to 'date2'.***

We wrote JavaScript code for calculating quantity of days between two days while developing the API.

***Investigate what default duration for arrangements is set in Google Calendar (or similar services).***

In Teams, the default duration of arrangements is 30 minutes, the same as for Google-accounts in Google Calendar (for non-Google accounts - 1 hour). In our application, the default duration of arrangements is 1 hour.

***Research and decide how to implement the different views of the calendar (week, month) with minimum effort.***

For implementing different views of calendars easily, there are many React-components and npm-packages, for example, fullCalendar component or react big calendar package. While developing calendar views, we decided to use fullCalendar.

***Find out how the process of automatic user notification is implemented in any calendar you like.***

In Teams, notifications about creating new events and tasks are sent by push-notifications on user's devices (for meetings, e-mails are also sent). There are also reminders in push-notifications 15 minutes before meetings.

## Act

1. First, the database was created. It consists of MongoDB objects for users (id, login, email, password, fullName, dob, avatar, registerDate, isConfirmed, pendingEmail, passwordToken, refreshToken and visibilitySettings), calendars (id, authorId, participants, followers, name, description, color, isHidden, isPublic and type), events (id, authorId, calendarId, name, description, startDate, endDate, link, doneDate, color, repeat, participants, tags, createDate, type, visibleForAll and allDay) and tags (id, authorId and title).
2. Then, the authentication and user module was implemented. There is registration, email address confirmation, logging in and out, password reset, get users, edit own account data and delete their own account. This part was done by Veronika Sukhonos.
3. Next, other API endpoints were developed. Users can implement all CRUD actions with calendars, events and tags, invite other users to calendars/events and accept invitations, follow and archive/dearchive calendars and mark tasks done/undone. Particularly Yevheniia Rezchyk implemented calendars module and Polina - events and tags module.
4. After that, the interface was implemented. The application provides user-friendly and intuitive design that is oriented on all categories of users. Personal users' data (tokens) is stored in cookies. Veronika was the most responsible for the design, but every team member worked on the frontend.
5. Finally, the application was tested. During tests, the API and UI/UX were improved and bugs were fixed.

## Share

➔ **[LinkedIn post](TODO)**
