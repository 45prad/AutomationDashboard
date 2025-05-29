import mongoose from 'mongoose';

const userIpMappingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ip: {
    type: String,
    required: true,
    trim: true
  },
  subnet: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, { timestamps: true });

export default mongoose.model('UserIpMapping', userIpMappingSchema);