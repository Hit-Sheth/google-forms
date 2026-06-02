import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true
  },
  otp: { 
    type: String, 
    required: true 
  },
  purpose: {
    type: String,
    enum: ['register', 'reset_password'],
    required: true
  },
  // The 'expires' property automatically deletes the document after 300 seconds (5 minutes)
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 300 
  }
});

export default mongoose.models.OTP || mongoose.model('OTP', OTPSchema);