require('dotenv').config();
const { messages } = require('../public/lang/messages/en/messages.js');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./user');
const { sendPasswordResetEmail } = require('./mailer');
const router = express.Router();

// User Registration Endpoint
router.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      firstName: req.body.firstName,
      email: req.body.email,
      password: hashedPassword,
    });
    await user.save();

    const confirmationPage = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="refresh" content="5;url=/login.html">
        <title>Registration Successful</title>
      </head>
      <body>
        <h1>Registration Successful!</h1>
        <p>You will be redirected to the login page in 5 seconds. If not, click <a href="/login.html">here</a> to go to the login page.</p>
      </body>
      </html>
    `;
    res.send(confirmationPage);
  } catch (error) {
    console.error(error);
    res.status(500).send(messages.registerError);
  }
});

// User Login Endpoint
router.post('/login', async (req, res) => {
  // Admin user authentication
  if (req.body.email === 'admin@admin.com' && req.body.password === '111') {
    const adminToken = jwt.sign({ adminId: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('adminToken', adminToken, { httpOnly: true });
    return res.redirect('/admin.html'); // Return here to prevent further execution
  }

  // Regular user authentication
  const user = await User.findOne({ email: req.body.email });
  if (user && await bcrypt.compare(req.body.password, user.password)) {
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, { httpOnly: true });
    return res.redirect('/home.html'); // Return here as well
  }

  return res.status(400).send("Incorrect password or email."); // Return here to ensure response is sent only once
});

// Get users endpoint
router.get('/users', async (req, res) => {
  try {
    // Retrieve all users but exclude password and __v fields
    const users = await User.find().select('-password -__v');
    res.json(users);
  } catch (error) {
    console.error('Failed to retrieve users:', error);
    res.status(500).send('Failed to get users.');
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).send(messages.userNotFound);
  }

  const token = require('crypto').randomBytes(20).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 600000; // 10 minutes, can change
  await user.save();

  sendPasswordResetEmail(user.email, token);

  res.send(messages.resetSent);
});

// Reset password endpoint
// TODO: Test this
router.post('/reset-password/:token', async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
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
