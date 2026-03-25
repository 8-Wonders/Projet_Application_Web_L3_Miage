const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: '/assets/img/pdp/pdp1.png'
  },
  scores: {
    dom: { type: Number, default: 0 },
    canvas: { type: Number, default: 0 },
    babylone: { type: Number, default: 0 }
  },
  playtime: {
    dom: { type: Number, default: 0 },
    canvas: { type: Number, default: 0 },
    babylone: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
