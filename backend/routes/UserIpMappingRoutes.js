import express from 'express';
import UserIpMapping from '../models/UserIpMapping.js';
import User from '../models/User.js';

const router = express.Router();

// Add this new route to get all mappings with user details populated
router.get('/', async (req, res) => {
  try {
    const mappings = await UserIpMapping.find().populate('user', 'username email role createdAt');
    res.json(mappings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new IP mapping for a user
router.post('/', async (req, res) => {
  try {
    // Validate user exists
    const user = await User.findById(req.body.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newMapping = new UserIpMapping({
      user: req.body.user,
      ip: req.body.ip,
      subnet: req.body.subnet,
      description: req.body.description || ''
    });

    const savedMapping = await newMapping.save();
    res.status(201).json(savedMapping);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all IP mappings for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const mappings = await UserIpMapping.find({ user: req.params.userId });
    res.json(mappings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific IP mapping by ID
router.get('/:id', async (req, res) => {
  try {
    const mapping = await UserIpMapping.findById(req.params.id);
    if (!mapping) {
      return res.status(404).json({ message: 'IP mapping not found' });
    }
    res.json(mapping);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update an IP mapping
router.patch('/:id', async (req, res) => {
  try {
    const updatedMapping = await UserIpMapping.findByIdAndUpdate(
      req.params.id,
      {
        ip: req.body.ip,
        subnet: req.body.subnet,
        description: req.body.description
      },
      { new: true }
    );

    if (!updatedMapping) {
      return res.status(404).json({ message: 'IP mapping not found' });
    }

    res.json(updatedMapping);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete an IP mapping
router.delete('/:id', async (req, res) => {
  try {
    const deletedMapping = await UserIpMapping.findByIdAndDelete(req.params.id);
    if (!deletedMapping) {
      return res.status(404).json({ message: 'IP mapping not found' });
    }
    res.json({ message: 'IP mapping deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;