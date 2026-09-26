const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {type: String, unique: true ,require: true, trim: true, minlength: 3, maxlength: 40},
  email: {type: String, require: true, unique: true, trim: true, lowercase: true},
  password: {type: String, require: true},
  profileName: {type: String},
  bio: {type: String, maxlength: 150},
  accountStatus: {type: String, enum: ["active", "disabled", "banned"], default: "active"},
  isVerified: {type: Boolean, default: false},
  gender: {type: String, enum: ["male", "female", "non-binary"]},
  phoneNumber: {type: String, trim: true},
  refreshToken: {type: String},
  resetToken: {type: String},
  resetTokenExpireies: {type: Date},
  followers: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
  following: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
  followRequest: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
  isPrivate: {
  type: Boolean,
  default: false
},
});

const User = mongoose.model("User", userSchema);

module.exports = User;