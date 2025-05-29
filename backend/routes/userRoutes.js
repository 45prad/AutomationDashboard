
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import fetchuser from '../middleware/fetchUser.js';

const router = express.Router();



// Environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const BT = process.env.BT;
const WT = process.env.WT;



// Login Route
router.post('/login', async (req, res) => {
  let success = false;

  try {
    const user = await User.findOne({ email: req.body.email, userVisibility: true });

    if (user) {
      if (user.role !== BT && user.role !== WT) {
        return res.status(403).json({ error: "Bad Request" });
      }

      const comparePass = bcrypt.compareSync(req.body.password, user.password);

      if (comparePass) {
        const data = {
          user: {
            id: user.id
          }
        };

        success = true;
        const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: '1h' });

        return res.json({ success, authtoken });
      } else {
        return res.status(400).json({
          error: "User does not Exist / Invalid Credentials"
        });
      }

    } else {
      return res.status(400).json({
        error: "User does not Exist / Invalid Credentials"
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error occurred while authenticating");
  }
});

router.post('/getuser', fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    // Find the user by ID, ensure userVisibility is true, and exclude the password field
    const user = await User.findOne({ _id: userId, userVisibility: true }).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found or not visible' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).send('Internal Server Error occurred while retrieving the user');
  }
});

router.get('/getallusers', async (req, res) => {
  try {
   
    const users = await User.find({ role: BT  }, '-password'); // Exclude password field
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


export default router;
