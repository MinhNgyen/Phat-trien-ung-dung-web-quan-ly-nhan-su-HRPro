require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Tai lieu API (Swagger UI) tai /api-docs. Mount TRUOC helmet vi CSP mac dinh cua helmet
// (upgrade-insecure-requests) lam Swagger UI khong tai duoc tai nguyen tren http://localhost.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'HRPro API Docs',
  swaggerOptions: { persistAuthorization: true }, // nho token sau khi F5
}));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

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
