const userSchema = new mongoose.Schema({
  email: {type: String, required: true},
  password: {type: String, required: true},
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

module.exports = mongoose.model('User', userSchema);
