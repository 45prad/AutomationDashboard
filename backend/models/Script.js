import mongoose from 'mongoose';

const scriptSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'Python'
  }
}, { timestamps: true });

export default mongoose.model('Script', scriptSchema);