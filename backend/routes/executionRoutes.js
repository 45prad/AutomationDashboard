import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import axios from 'axios'
import dotenv from 'dotenv';
import fetchuser from '../middleware/fetchUser.js';

// Load environment variables from the .env file
dotenv.config();

import Script from '../models/Script.js';
import Execution from '../models/Execution.js';

const router = express.Router();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// router.post('/execute', fetchuser, async (req, res) => {
//   let session;
//   try {
//     session = await mongoose.startSession();
//     session.startTransaction();

//     const { scriptId, targets } = req.body;
//     const startTime = Date.now();

//     const script = await Script.findById(scriptId).session(session);
//     if (!script) {
//       await session.abortTransaction();
//       await session.endSession();
//       return res.status(404).json({ success: false, message: 'Script not found' });
//     }

//     const filePath = path.resolve(__dirname, '../', script.filePath);
//     if (!fs.existsSync(filePath)) {
//       await session.abortTransaction();
//       await session.endSession();
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Script file not found',
//         path: filePath
//       });
//     }

//     const execution = new Execution({
//       script: script._id,
//       scriptName: script.name,
//       status: 'running',
//       targets: targets.map(target => ({
//         user: target.userId,
//         ip: target.ip,
//         description: target.description,
//         status: 'pending'
//       })),
//       startedAt: new Date(startTime)
//     });

//     await execution.save({ session });

//     const language = script.language.toLowerCase();
// for (const target of targets) {
//   let command;
//   switch (language) {
//     case 'python':
//       command = `python ${filePath} ${target.ip}`;
//       break;
//     case 'bash':
//       command = `bash ${filePath} ${target.ip}`;
//       break;
//     default:
//       await session.abortTransaction();
//       await session.endSession();
//       return res.status(400).json({ success: false, message: 'Unsupported script language' });
//   }

//   console.log(`\n[Executing for IP: ${target.ip}]`);
//   console.log(`Command: ${command}`);

//   const { stdout, stderr, error } = await new Promise((resolve) => {
//     exec(command, (error, stdout, stderr) => {
//       resolve({ error, stdout, stderr });
//     });
//   });

//   const targetIndex = execution.targets.findIndex(t => t.ip === target.ip);

//   execution.targets[targetIndex].output = stdout;
//   execution.targets[targetIndex].error = error ? error.message : null;
//   execution.targets[targetIndex].status = error ? 'failed' : 'completed';

//   // Save after each update
//   await execution.save({ session });

//   if (error) {
//     console.error(`[${target.ip}] Error:`, error.message);
//     console.error(`[${target.ip}] STDERR:`, stderr);
//     execution.status = 'failed';
//     break; // This break stops execution for the remaining targets
//   } else {
//     console.log(`[${target.ip}] STDOUT:`, stdout);

//     // Call the challenge API after successful execution for the target
//     try {
//       const challengeId = script.challenge.toString(); // Extract challenge ID from the script
//       const userId = target.userId; // Assuming target.userId corresponds to the user ID
//       const challengeUrl = `${process.env.CHALLENGE_BASE_URL}/${challengeId}/${userId}`;

//       const response = await axios.get(challengeUrl);
//       console.log(`[${target.ip}] Challenge API Response:`, response.data);


//          execution.targets[targetIndex].challengeResponse = {
//         statusCode: response.status,
//         message: response.data.message || '',
         
//       };
//       await execution.save({ session });
//     } catch (apiError) {
//       console.error(`[${target.ip}] Challenge API Error:`, apiError.message);

//        execution.targets[targetIndex].challengeResponse = {
//         statusCode: apiError.response?.status || 500,
//         message: apiError.response?.data?.message || apiError.message,
       
//       };
      
//       await execution.save({ session });
//     }
//   }
// }



//     const endTime = Date.now();
//     const durationMs = endTime - startTime;
//     const duration = `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`;

//     execution.completedAt = new Date(endTime);
//     execution.duration = duration;

//     if (execution.status !== 'failed') {
//       execution.status = 'completed';
//     }
    

//     await execution.save({ session });
//     await session.commitTransaction();
//     await session.endSession();

//     return res.json({
//       success: true,
//       execution: execution.toObject(),
//       message: 'Execution completed'
//     });

//   } catch (err) {
//     console.error('Execution error:', err);
//     if (session && session.inTransaction()) {
//       await session.abortTransaction();
//     }
//     if (session) {
//       await session.endSession();
//     }
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// });


router.post('/execute', fetchuser, async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const { scriptId, targets } = req.body;
    const startTime = Date.now();

    const script = await Script.findById(scriptId).session(session);
    if (!script) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(404).json({ success: false, message: 'Script not found' });
    }

    const filePath = path.resolve(__dirname, '../', script.filePath);
    if (!fs.existsSync(filePath)) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(404).json({ 
        success: false, 
        message: 'Script file not found',
        path: filePath
      });
    }

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
      startedAt: new Date(startTime)
    });

    await execution.save({ session });

    const language = script.language.toLowerCase();
    for (const target of targets) {
      let command;
      switch (language) {
        case 'python':
          command = `python ${filePath} ${target.ip}`;
          break;
        case 'bash':
          command = `bash ${filePath} ${target.ip}`;
          break;
        default:
          await session.abortTransaction();
          await session.endSession();
          return res.status(400).json({ success: false, message: 'Unsupported script language' });
      }

      console.log(`\n[Executing for IP: ${target.ip}]`);
      console.log(`Command: ${command}`);

      // Execute command and explicitly check exit code
      const { stdout, stderr, code } = await new Promise((resolve) => {
        exec(command, (error, stdout, stderr) => {
          // Explicit exit code handling per attacker script convention
          // 0 = success, 1 = failure, anything else = failure
          const exitCode = error ? (error.code === 0 ? 0 : 1) : 0;
          resolve({
            stdout,
            stderr,
            code: exitCode
          });
        });
      });

      const targetIndex = execution.targets.findIndex(t => t.ip === target.ip);
      execution.targets[targetIndex].output = stdout;
      execution.targets[targetIndex].error = stderr || null;
      execution.targets[targetIndex].status = code === 0 ? 'completed' : 'failed';

      await execution.save({ session});

      console.log(`[${target.ip}] Exit Code: ${code}`);
      console.log(`[${target.ip}] STDOUT: ${stdout}`);
      if (code !== 0) {
        console.error(`[${target.ip}] STDERR: ${stderr}`);
      }

      // Only proceed if attack was successful (exit code 0)
      if (code === 0) {
        try {
          const challengeId = script.challenge.toString();
          const userId = target.userId;
          const challengeUrl = `${process.env.CHALLENGE_BASE_URL}/${challengeId}/${userId}`;

          const response = await axios.get(challengeUrl);
          console.log(`[${target.ip}] Challenge API Response:`, response.data);

          execution.targets[targetIndex].challengeResponse = {
            statusCode: response.status,
            message: response.data.message || 'Challenge completed successfully',
            success: true
          };
        } catch (apiError) {
          console.error(`[${target.ip}] Challenge API Error:`, apiError.message);
          execution.targets[targetIndex].challengeResponse = {
            statusCode: apiError.response?.status || 500,
            message: apiError.message || 'Challenge API failed',
            success: false
          };
        }
        await execution.save({ session });
      }
    }

    // Determine final execution status
    execution.status = execution.targets.every(t => t.status === 'completed') 
      ? 'completed' 
      : 'failed';

    execution.completedAt = new Date();
    execution.duration = `${Math.floor((Date.now() - startTime) / 60000)}m ${Math.floor((Date.now() - startTime) % 60000 / 1000)}s`;

    await execution.save({ session });
    await session.commitTransaction();
    await session.endSession();

    return res.json({
      success: true,
      execution: execution.toObject(),
      message: 'Execution completed'
    });

  } catch (err) {
    console.error('Execution error:', err);
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    if (session) {
      await session.endSession();
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all executions
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