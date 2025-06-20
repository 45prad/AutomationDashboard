


import express from 'express';
import cors from 'cors';
import connectToMongo from './db.js';
import userRoutes from './routes/userRoutes.js';
import scriptRoutes from './routes/scriptRoutes.js';
import executionRoutes from './routes/executionRoutes.js';
import UserIpMappingRoutes from './routes/UserIpMappingRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import challengeRoutes from './routes/challengeRoutes.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
connectToMongo();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const scriptsDir = path.join(uploadsDir, 'scripts');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Uploads directory created');
}

if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
  console.log('Scripts upload directory created');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Infrastructure Script Automation API is running' });
});

app.use('/api/auth', userRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/userIpMapping', UserIpMappingRoutes);
app.use('/api/challenges', challengeRoutes);

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Script uploads directory: ${scriptsDir}`);
});
