import express, { json } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';
import path from 'path';

import authRouter from './routes/authRouter.js';
// import usersRouter from './routes/usersRouter.js';
// import calendarsRouter from './routes/calendarsRouter.js';
// import eventsRouter from './routes/eventsRouter.js';
// import tagsRouter from './routes/tagsRouter.js';

import { notFoundError, serverError } from './middlewares/errorMiddleware.js';

const app = express();

const hostname = 'localhost';
const port = process.env.API_PORT;

app.use('/api/avatars', express.static(path.join('db', 'avatars')));

app.use(json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: `http://localhost:${process.env.APP_PORT}` }));
app.use(morgan('common'));

app.use('/api/auth', authRouter);
// app.use('/api/users', usersRouter);
// app.use('/api/calendars', calendarsRouter);
// app.use('/api/events', eventsRouter);
// app.use('/api/tags', tagsRouter);

app.use(notFoundError);
app.use(serverError);

mongoose.connect('mongodb+srv://prezchyk:oDpY8Sh75bhJ568j@chronos.uvtbggy.mongodb.net/chronos?appName=chronos') // TODO maybe replace with random user, move to .env
  .then(() => {
    app.listen(port, () => {
      console.log(`API server running at http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error(err);
  });
