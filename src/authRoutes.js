require('dotenv').config();
import {messages} from '../public/lang/messages/en/messages.js';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {sendPasswordResetEmail} = require('../config/mailer'); // Ensure this function is correctly implemented in ../config/mailer.js

const router = express.Router();

// User Registration Endpoint
router.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      email: req.body.email,
      password: hashedPassword,
    });
    await user.save();
    res.status(201).send(messages.userRegistered);
  } catch (error) {
    console.error(error);
    res.status(500).send(messages.registerError);
  }
});

// User Login Endpoint
router.post('/login', async (req, res) => {
  const user = await User.findOne({email: req.body.email});
  if (user && await bcrypt.compare(req.body.password, user.password)) {
    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: '1h'});
    res.json({token: token});
  } else {
    res.status(400).send(messages.incorrectPassword);
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  const user = await User.findOne({email: req.body.email});
  if (!user) {
    return res.status(404).send(messages.userNotFound);
  }

  const token = require('crypto').randomBytes(20).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 600000; // 10 minutes
  await user.save();

  sendPasswordResetEmail(user.email, token); // Make sure your domain is correct in the function

  res.send(messages.resetSent);
});


// Reset password endpoint
router.post('/reset-password/:token', async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {$gt: Date.now()}
  });

  if (!user) {
    return res.status(400).send(messages.invalidToken);
  }

  if (req.body.password !== req.body.confirmPassword) {
    return res.status(400).send(messages.mismatchPassword);
  }

  user.password = await bcrypt.hash(req.body.password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.send(messages.updatePassword);
});


module.exports = router;
