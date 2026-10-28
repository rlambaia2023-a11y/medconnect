'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const db = require('./src/db');
const authRoutes = require('./src/routes/auth');
const doctorsRoutes = require('./src/routes/doctors');
const appointmentsRoutes = require('./src/routes/appointments');
const reviewsRoutes = require('./src/routes/reviews');
const contentRoutes = require('./src/routes/content');
const messagesRoutes = require('./src/routes/messages');
const adminRoutes = require('./src/routes/admin');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(rateLimit({ windowMs: 60*1000, max: 300 }));

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/admin', adminRoutes);

// health
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'medconnect' }));

// export for serverless (Vercel)
module.exports = { app };

// listen only when run directly
if (require.main === module) {
  const http = require('http');
  const { Server } = require('socket.io');
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: true, credentials: true } });
  io.on('connection', (socket) => {
    socket.on('join', (room) => socket.join(room));
    socket.on('message', (payload) => {
      io.to(payload.room).emit('message', { ...payload, created_at: new Date().toISOString() });
    });
  });
  const PORT = Number(process.env.PORT || 4000);
  server.listen(PORT, () => {
    console.log(`MedConnect backend running on http://localhost:${PORT}`);
  });
}