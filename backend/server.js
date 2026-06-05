require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = async () => {
  try {
    const mongoose = require('mongoose');
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nutrimate');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const pantryRoutes = require('./routes/pantry');
const trackerRoutes = require('./routes/tracker');
const plannerRoutes = require('./routes/planner');
const chatRoutes = require('./routes/chat');

// Connect to database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/chat', chatRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'NutriMate AI API is running...' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});
