import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import passport from 'passport';
import { configurePassport } from './config/passport.js';

import authRoutes from './routes/auth.routes.js';

import { errorHandler } from './middleware/error-handler.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

configurePassport();
app.use(passport.initialize());

app.use('/auth', authRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Messaging API is running.',
  });
});

app.use(errorHandler);

export default app;
