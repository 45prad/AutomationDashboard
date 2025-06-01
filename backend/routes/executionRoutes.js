import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import axios from 'axios'
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

import Script from '../models/Script.js';
import Execution from '../models/Execution.js';

const router = express.Router();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



router.post('/execute', async (req, res) => {
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

  const { stdout, stderr, error } = await new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr });
    });
  });

  const targetIndex = execution.targets.findIndex(t => t.ip === target.ip);

  execution.targets[targetIndex].output = stdout;
  execution.targets[targetIndex].error = error ? error.message : null;
  execution.targets[targetIndex].status = error ? 'failed' : 'completed';

  // Save after each update
  await execution.save({ session });

  if (error) {
    console.error(`[${target.ip}] Error:`, error.message);
    console.error(`[${target.ip}] STDERR:`, stderr);
    execution.status = 'failed';
    break; // This break stops execution for the remaining targets
  } else {
    console.log(`[${target.ip}] STDOUT:`, stdout);

    // Call the challenge API after successful execution for the target
    try {
      const challengeId = script.challenge.toString(); // Extract challenge ID from the script
      const userId = target.userId; // Assuming target.userId corresponds to the user ID
      const challengeUrl = `${process.env.CHALLENGE_BASE_URL}/${challengeId}/${userId}`;

      const response = await axios.get(challengeUrl);
      console.log(`[${target.ip}] Challenge API Response:`, response.data);


         execution.targets[targetIndex].challengeResponse = {
        statusCode: response.status,
        message: response.data.message || '',
         
      };
      await execution.save({ session });
    } catch (apiError) {
      console.error(`[${target.ip}] Challenge API Error:`, apiError.message);

       execution.targets[targetIndex].challengeResponse = {
        statusCode: apiError.response?.status || 500,
        message: apiError.response?.data?.message || apiError.message,
       
      };
      
      await execution.save({ session });
    }
  }
}



    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const duration = `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`;

    execution.completedAt = new Date(endTime);
    execution.duration = duration;

    if (execution.status !== 'failed') {
      execution.status = 'completed';
    }
    

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
router.get('/', async (req, res) => {
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

export default router;