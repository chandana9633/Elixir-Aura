const mongoose = require('mongoose');

const userOTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
},
otp: {
    type: String,
    required: true
},
createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 
}
});

const Otp = mongoose.model('Otp', userOTPSchema);
module.exports = Otp;