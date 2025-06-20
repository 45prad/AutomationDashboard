import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import axios from 'axios'
import dotenv from 'dotenv';
import fetchuser from '../middleware/fetchUser.js';
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
//     for (const target of targets) {
//       let command;
//       switch (language) {
//         case 'python':
//           command = `python ${filePath} ${target.ip}`;
//           break;
//         case 'bash':
//           command = `bash ${filePath} ${target.ip}`;
//           break;
//         default:
//           await session.abortTransaction();
//           await session.endSession();
//           return res.status(400).json({ success: false, message: 'Unsupported script language' });
//       }

//       console.log(`\n[Executing for IP: ${target.ip}]`);
//       console.log(`Command: ${command}`);

//       // Execute command and explicitly check exit code
//       const { stdout, stderr, code } = await new Promise((resolve) => {
//         exec(command, (error, stdout, stderr) => {
//           // Explicit exit code handling per attacker script convention
//           // 0 = success, 1 = failure, anything else = failure
//           const exitCode = error ? (error.code === 0 ? 0 : 1) : 0;
//           resolve({
//             stdout,
//             stderr,
//             code: exitCode
//           });
//         });
//       });

//       const targetIndex = execution.targets.findIndex(t => t.ip === target.ip);
//       execution.targets[targetIndex].output = stdout;
//       execution.targets[targetIndex].error = stderr || null;
//       execution.targets[targetIndex].status = code === 0 ? 'completed' : 'failed';

//       await execution.save({ session});

//       console.log(`[${target.ip}] Exit Code: ${code}`);
//       console.log(`[${target.ip}] STDOUT: ${stdout}`);
//       if (code !== 0) {
//         console.error(`[${target.ip}] STDERR: ${stderr}`);
//       }

//       // Only proceed if attack was successful (exit code 0)
//       if (code === 0) {
//         try {
//           const challengeId = script.challenge.toString();
//           const userId = target.userId;
//           const challengeUrl = `${process.env.CHALLENGE_BASE_URL}/${challengeId}/${userId}`;

//           const response = await axios.get(challengeUrl);
//           console.log(`[${target.ip}] Challenge API Response:`, response.data);

//           execution.targets[targetIndex].challengeResponse = {
//             statusCode: response.status,
//             message: response.data.message || 'Challenge completed successfully',
//             success: true
//           };
//         } catch (apiError) {
//           console.error(`[${target.ip}] Challenge API Error:`, apiError.message);
//           execution.targets[targetIndex].challengeResponse = {
//             statusCode: apiError.response?.status || 500,
//             message: apiError.message || 'Challenge API failed',
//             success: false
//           };
//         }
//         await execution.save({ session });
//       }
//     }

//     // Determine final execution status
//     execution.status = execution.targets.every(t => t.status === 'completed') 
//       ? 'completed' 
//       : 'failed';

//     execution.completedAt = new Date();
//     execution.duration = `${Math.floor((Date.now() - startTime) / 60000)}m ${Math.floor((Date.now() - startTime) % 60000 / 1000)}s`;

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

// router.post('/execute', fetchuser, async (req, res) => {
//   let session;

//   try {
//     session = await mongoose.startSession();
//     session.startTransaction();

//     const { scriptId, targets } = req.body;

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
//       startedAt: new Date()
//     });

//     await execution.save({session});

// // Loop through each target
//     for (const target of targets) {
//       console.log(`\n[Running script for ${target.ip}]`);

//       // Spawn process safely with separate arguments
//       let cmd = script.language.toLowerCase() === 'python' ? 'python' : 'bash';
//       let args = [filePath, target.ip ];

//       const child = spawn(cmd, args);

//       let stdout = '';
//       let stderr = '';
//       let exitCode = 0;

//       child.stdout.on('data', (data) => {
//         stdout += data.toString();
//       });

//       child.stderr.on('data', (data) => {
//         stderr += data.toString();
//       });

//       await new Promise((resolve) => {
//         child.on('close', (code) => {
//           exitCode = code;
//           resolve();
//         });
//       });

//       console.log(`[${target.ip}] Exit code: ${exitCode}`);

//       // Update execution
//       const targetIndex = execution.targets.findIndex(t => t.ip === target.ip);
//       execution.targets[targetIndex].output = stdout.trim();
//       execution.targets[targetIndex].error = stderr.trim() ? stderr.trim() : null;
//       execution.targets[targetIndex].status = exitCode === 0 ? 'completed' : 'failed';
//       await execution.save({session});

// // Handle API callback if script was successful
//       if (exitCode === 0) {
//         try {
//           const challengeId = script.challenge.toString();
//           const userId = target.userId;
//           const challengeUrl = `${process.env.CHALLENGE_BASE_URL}/${challengeId}/${userId}`;

//           const response = await axios.get(challengeUrl);
//           console.log(`[${target.ip}] Challenge API Response:`, response.data);

//           execution.targets[targetIndex].challengeResponse = {
//             statusCode: response.status,
//             message: response.data.message || 'Challenge completed successfully',
//             success: true
//           };
//         } catch (apiError) {
//           console.error(`[${target.ip}] Challenge API Error:`, apiError.message);
//           execution.targets[targetIndex].challengeResponse = {
//             statusCode: apiError.response?.status || 500,
//             message: apiError.message || 'Challenge API failed',
//             success: false
//           };
//         }
//         await execution.save({session});
//       }
//     }

//     // Finalize execution
//     execution.status = execution.targets.every(t => t.status === 'completed') ? 'completed' : 'failed';
//     execution.completedAt = new Date();

//     execution.duration = `${Math.floor((Date.now() - execution.startedAt) / 60000)}m ${Math.floor(((Date.now() - execution.startedAt) % 60000) / 1000)}s`;

//     await execution.save({session});
//     await session.commitTransaction();
//     await session.endSession();

//     res.json({ success: true, execution, message: 'Execution completed' });

//   } catch (err) {
//     console.error('Execution error!', err);
//     if (session && session.inTransaction()) {
//       await session.abortTransaction();
//     }
//     if (session) {
//       await session.endSession();
//     }
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });


// Get all executions


// router.post('/execute', fetchuser, async (req, res) => {
//   try {
//     const { scriptId, targets } = req.body;

//     const script = await Script.findById(scriptId);
//     if (!script) {
//       return res.status(404).json({ success: false, message: 'Script not found' });
//     }

//     const filePath = path.resolve(__dirname, '../', script.filePath);
//     if (!fs.existsSync(filePath)) {
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
//       startedAt: new Date()
//     });

//     await execution.save();

//     // Loop through each target
//     for (const target of targets) {
//       console.log(`\n[Running script for ${target.ip}]`);

//       // Spawn process safely with separate arguments
//       let cmd = script.language.toLowerCase() === 'python' ? 'python' : 'bash';
//       let args = [filePath, target.ip];

//       const child = spawn(cmd, args);

//       let stdout = '';
//       let stderr = '';
//       let exitCode = 0;

//       child.stdout.on('data', (data) => {
//         stdout += data.toString();
//       });

//       child.stderr.on('data', (data) => {
//         stderr += data.toString();
//       });

//       await new Promise((resolve) => {
//         child.on('close', (code) => {
//           exitCode = code;
//           resolve();
//         });
//       });

//       console.log(`[${target.ip}] Exit code: ${exitCode}`);

//       // Update execution
//       const targetIndex = execution.targets.findIndex(t => t.ip === target.ip);
//       execution.targets[targetIndex].output = stdout.trim();
//       execution.targets[targetIndex].error = stderr.trim() ? stderr.trim() : null;
//       execution.targets[targetIndex].status = exitCode === 0 ? 'completed' : 'failed';
//       await execution.save();

//       // Handle API callback if script was successful
//       if (exitCode === 0) {
//         try {
//           const challengeId = script.challenge.toString();
//           const userId = target.userId;
//           const challengeUrl = `${process.env.CHALLENGE_BASE_URL}/${challengeId}/${userId}`;

//           const response = await axios.get(challengeUrl);
//           console.log(`[${target.ip}] Challenge API Response:`, response.data);

//           execution.targets[targetIndex].challengeResponse = {
//             statusCode: response.status,
//             message: response.data.message || 'Challenge completed successfully',
//             success: true
//           };
//         } catch (apiError) {
//           console.error(`[${target.ip}] Challenge API Error:`, apiError.message);
//           execution.targets[targetIndex].challengeResponse = {
//             statusCode: apiError.response?.status || 500,
//             message: apiError.message || 'Challenge API failed',
//             success: false
//           };
//         }
//         await execution.save();
//       }
//     }

//     // Finalize execution
//     execution.status = execution.targets.every(t => t.status === 'completed') ? 'completed' : 'failed';
//     execution.completedAt = new Date();
//     execution.duration = `${Math.floor((Date.now() - execution.startedAt) / 60000)}m ${Math.floor(((Date.now() - execution.startedAt) % 60000) / 1000)}s`;

//     await execution.save();

//     res.json({ success: true, execution, message: 'Execution completed' });

//   } catch (err) {
//     console.error('Execution error!', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });


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

        return { ip: target.ip, updateData };

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
        filter: { _id: execution._id, 'targets.ip': result.ip },
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