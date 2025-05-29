
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const UserSchema = new Schema({
  profile: {
    type: String,
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  userVisibility: {
    type: Boolean,
    default: true,
  },
  assignedTeams: {
    type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const User = model('User', UserSchema);

export default User;
