import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import axios from 'axios'
import dotenv from 'dotenv';
import fetchuser from '../middleware/fetchuser.js';
import multer from 'multer';
import xlsx from 'xlsx';

// Configure multer for file uploads


// Load environment variables from the .env file
dotenv.config();

import Script from '../models/Script.js';
import Execution from '../models/Execution.js';

const router = express.Router();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);







import { spawn } from 'child_process';



import { excelUpload } from '../middleware/multerConfig.js';


router.post('/execute-from-excel', fetchuser, excelUpload.single('excelFile'), async (req, res) => {
  try {
    const { scriptId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Validate script exists
    const script = await Script.findById(scriptId);
    if (!script) {
      // Clean up uploaded file if script not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Script not found' });
    }

    // Read the Excel file
    let workbook;
    try {
      workbook = xlsx.readFile(req.file.path);
    } catch (err) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Excel file format' 
      });
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Validate data format
    if (!data.length || !data[0].hasOwnProperty('IP') || !data[0].hasOwnProperty('UserEmail')) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Excel format. Required columns: IP, UserEmail, Description (optional)' 
      });
    }

    // Get user IDs for the emails
    const User = mongoose.model('User');
    const users = await User.find({ email: { $in: data.map(row => row.UserEmail) } });
    
    // Prepare targets
    const targets = [];
    const errors = [];
    
    data.forEach(row => {
      const user = users.find(u => u.email === row.UserEmail);
      if (!user) {
        errors.push(`User not found: ${row.UserEmail}`);
        return;
      }
      
      targets.push({
        userId: user._id,
        userEmail: row.UserEmail,
        ip: row.IP,
        description: row.Description || ''
      });
    });

    if (errors.length > 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Some users not found',
        errors 
      });
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Prepare execution data
    const executionData = {
      scriptId,
      targets
    };

    // Call the existing execute endpoint
    const response = await axios.post(`${process.env.BACKEND_URL}/api/executions/execute`, executionData, {
      headers: {
        'Content-Type': 'application/json',
        'Auth-token': req.header('Auth-token')
      }
    });

    res.json(response.data);

  } catch (err) {
    console.error('Excel execution error:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path); // Clean up on error
    }
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Server error',
      error: err.stack 
    });
  }
});




router.post('/execute', fetchuser, async (req, res) => {
  try {
    const { scriptId, targets } = req.body;

    // Validate script exists
    const script = await Script.findById(scriptId);
    if (!script) {
      return res.status(404).json({ success: false, message: 'Script not found' });
    }

    // Validate script file exists
    const filePath = path.resolve(__dirname, '../', script.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Script file not found',
        path: filePath
      });
    }

    // Create execution record
    const execution = new Execution({ 
      script: script._id,
      scriptName: script.name,
      status: 'running',
      targets: targets.map(target => ({
        user: target.userId,
        ip: target.ip,
        description: target.description,
        status: 'pending'
      })),
      startedAt: new Date()
    });

    await execution.save();

    // Process all targets in parallel
    const results = await Promise.all(targets.map(async (target) => {
      try {
        console.log(`\n[Running script for ${target.ip}]`);

        // Spawn process safely with separate arguments
        const cmd = script.language.toLowerCase() === 'python' ? 'python' : 'bash';
        const args = [filePath, target.ip];

        const child = spawn(cmd, args);

        let stdout = '';
        let stderr = '';
        
        // Collect output streams
        child.stdout.on('data', (data) => stdout += data.toString());
        child.stderr.on('data', (data) => stderr += data.toString());

        // Wait for process completion
        const exitCode = await new Promise((resolve) => {
          child.on('close', resolve);
        });

        console.log(`[${target.ip}] Exit code: ${exitCode}`);
        console.log(`[${target.ip}] Script output:`, stdout); // Debug log

        // Prepare update data
        const updateData = {
          'targets.$.output': stdout.trim(),
          'targets.$.error': stderr.trim() || null,
          'targets.$.status': exitCode === 0 ? 'completed' : 'failed'
        };

        // Handle API callback if script was successful
        if (exitCode === 0) {
          try {
            const challengeId = script.challenge.toString();
            const userId = target.userId;
            const challengeUrl = `${process.env.CHALLENGE_BASE_URL}/${challengeId}/${userId}`;

            const response = await axios.get(challengeUrl);
            console.log(`[${target.ip}] Challenge API Response:`, response.data);

            updateData['targets.$.challengeResponse'] = {
              statusCode: response.status,
              message: response.data.message || 'Challenge completed successfully',
              success: true
            };
          } catch (apiError) {
            console.error(`[${target.ip}] Challenge API Error:`, apiError.message);
            updateData['targets.$.challengeResponse'] = {
              statusCode: apiError.response?.status || 500,
              message: apiError.message || 'Challenge API failed',
              success: false
            };
          }
        }

        return { ip: target.ip, updateData, userId: target.userId, };

      } catch (err) {
        console.error(`Error processing target ${target.ip}:`, err);
        return { 
          ip: target.ip, 
          updateData: {
            'targets.$.error': err.message,
            'targets.$.status': 'failed'
          }
        };
      }
    }));

    // Apply all updates in a single operation
    const bulkOps = results.map(result => ({
      updateOne: {
        filter: { _id: execution._id, 'targets.ip': result.ip,  'targets.user': result.userId, },
        update: { $set: result.updateData }
      }
    }));

    // console.log('Bulk operations to perform:', JSON.stringify(bulkOps, null, 2)); // Debug log
    await Execution.bulkWrite(bulkOps);

    // Finalize execution
    const updatedExecution = await Execution.findByIdAndUpdate(
      execution._id,
      {
        $set: {
          status: results.some(result => 
            result.updateData['targets.$.status'] === 'completed'
          ) ? 'completed' : 'failed',
          completedAt: new Date(),
          duration: `${Math.floor((Date.now() - execution.startedAt) / 60000)}m ${Math.floor(((Date.now() - execution.startedAt) % 60000) / 1000)}s`
        }
      },
      { new: true }
    );

    res.json({ success: true, execution: updatedExecution, message: 'Execution completed' });

  } catch (err) {
    console.error('Execution error!', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/',fetchuser, async (req, res) => {
  try {
    const executions = await Execution.find()
      .sort({ createdAt: -1 })
      .populate('script', 'name language')
      .populate('targets.user', 'email');

    res.json({ success: true, executions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// New route to get execution count
router.get('/count/executions', fetchuser, async (req, res) => {
  try {
    const count = await Execution.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error counting executions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Updated executions route to return only recent executions
router.get('/recent', fetchuser, async (req, res) => {
  try {
    const executions = await Execution.find()
      .sort({ createdAt: -1 })
      .limit(4) // Only get the 4 most recent
      .populate('script', 'name language')
      .populate('targets.user', 'email');

    res.json({ success: true, executions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;