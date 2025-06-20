import express from 'express';
import Challenge from '../models/challenge.js'; // Adjust path as needed
import fetchuser from '../middleware/fetchuser.js';
const router = express.Router();

// GET /all - Get all challenge names and IDs for dropdown
router.get('/all', fetchuser, async (req, res) => {
    try {
        const challenges = await Challenge.find({ 
            state: "visible" 
        }).select('name _id').sort({ name: 1 });

        res.json(challenges);
    } catch (error) {
        console.error('Error in /all endpoint:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch challenges' 
        });
    }
});

export default router;