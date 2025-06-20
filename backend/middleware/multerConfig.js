// middleware/multerConfig.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure the uploads directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Storage for script files
const scriptStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/scripts/';
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `script-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`);
  }
});

export const scriptUpload = multer({
  storage: scriptStorage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/\.(py|js|java|c|cpp|rb|go|rs|php)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only script files are allowed!'), false);
    }
  }
});


// Storage for Excel files
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/excel/';
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `excel-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`);
  }
});

export const excelUpload = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/\.(xlsx|xls)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'), false);
    }
  }
});
