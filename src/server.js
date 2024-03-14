require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRouter = require('./authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Use the authentication routes
app.use('/auth', authRouter);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
