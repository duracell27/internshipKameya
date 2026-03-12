const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const traineeRoutes = require('./routes/trainee');
const dayPlanRoutes = require('./routes/dayplan');
const aiRoutes = require('./routes/ai');
const eventRoutes = require('./routes/events');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Internship API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/trainees', traineeRoutes);
app.use('/api/dayplans', dayPlanRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/events', eventRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
