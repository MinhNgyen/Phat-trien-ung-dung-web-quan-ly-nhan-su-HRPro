require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Bao mat HTTP header
app.use(helmet({ crossOriginResourcePolicy: false }));

// Cho phep frontend goi API
app.use(cors({
  origin: process.env.CORS_ORIGIN === '*' || !process.env.CORS_ORIGIN
    ? true
    : process.env.CORS_ORIGIN.split(','),
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Tat ca API nam duoi prefix /api
app.use('/api', routes);

app.get('/', (req, res) => res.json({ success: true, message: 'HRPro API - xem tai /api/health' }));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
