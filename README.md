# Chronos

> A service that helps organize meetings, tasks for the day/month/year, and events.

## What you need to do first

### Required stack and applications

* [Node.js](https://nodejs.org/en/download)
* [Docker Desktop](https://docs.docker.com/get-started/introduction/get-docker-desktop/)

### Build project

First, launch the Docker Desktop.     
Next, in the same directory where `docker-compose.yml` file is located run command:

```
docker compose build <app-dev/app-prod>
```

Write `app-dev` after `docker compose build` if you want to run development build, and `app-prod` to run production build (PRODUCTION BUILD WAS NOT TESTED YET).     
In development build you can change files both in `backend` and `frontent` directories (except Docker-related files like Dockerfile) and servers will be re-compiled automatically.

## How to run the app

```
docker compose up <app-dev/app-prod>
```

> You can run this command without `docker compose build`, in that case the application will be build first (if not yet builded) and then automatically launched.

API server will run at `http://localhost:8080` in development build and at `http://localhost:8888` in production build,     
the web application will run at `http://localhost:3000` in development build and at `http://localhost:8000` in production build.

If you want to see some container's console logs, in Docker Desktop click on the corresponding container and open Logs tab.

![Open container's console logs](/open_container_logs.png)

## How to tear the app down

```
docker compose down
```
