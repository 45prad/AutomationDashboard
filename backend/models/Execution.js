import mongoose from 'mongoose';

const ExecutionSchema = new mongoose.Schema({
  script: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Script',
    required: true
  },
  scriptName: {
    type: String,
    required: true
  },
  challenge: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge'
    },
    name: String
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  targets: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      email: String,
      ips: [String], 
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
      },
      output: String,
      error: String,
       challengeResponse: {
        statusCode: Number,  // 'success', 'already_solved', 'error'
        message: String // The response message from the API
      }
    }
  ],
  duration: String,
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
}, { timestamps: true });

export default mongoose.model('Execution', ExecutionSchema);
