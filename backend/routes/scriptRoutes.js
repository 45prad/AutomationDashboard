import express from 'express';
import multer from 'multer';
import Script from '../models/Script.js';
import Challenge from '../models/challenge.js';
import fetchuser from '../middleware/fetchuser.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/scripts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = file.originalname.split('.').pop();
    cb(null, `script-${uniqueSuffix}.${fileExtension}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept only .py, .js, .java files etc.
    if (file.originalname.match(/\.(py|js|java|c|cpp|rb|go|rs|php)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only script files are allowed!'), false);
    }
  }
});

// POST / - Add a new script with file upload
router.post('/',fetchuser, upload.single('file'), async (req, res) => {
  try {
    const { name, description, challenge, language } = req.body;

    // Validate required fields
    if (!name || !description || !challenge || !language || !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, challenge, language, or file'
      });
    }

    // Check if challenge exists
    const existingChallenge = await Challenge.findById(challenge);
    if (!existingChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Validate language is supported
    const supportedLanguages = ['Python', 'JavaScript', 'Java', 'C', 'C++', 'Ruby', 'Go', 'Rust', 'PHP'];
    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported language',
        supportedLanguages
      });
    }

    // Create new script
    const newScript = new Script({
      name,
      description,
      challenge,
      filePath: req.file.path,
      language // Taken from frontend
    });

    const savedScript = await newScript.save();

    res.status(201).json({
      success: true,
      message: 'Script added successfully',
      script: {
        id: savedScript._id,
        name: savedScript.name,
        challenge: savedScript.challenge,
        language: savedScript.language,
        filePath: savedScript.filePath
      }
    });

  } catch (error) {
    console.error('Error adding script:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add script',
      error: error.message
    });
  }
});


// router.get('/', fetchuser, async (req, res) => {
//   try {
//     const scripts = await Script.find()
//       .populate('challenge', 'name _id') // Only include challenge name and id
//       .sort({ createdAt: -1 }); // Newest first

//     const formattedScripts = scripts.map(script => ({
//       id: script._id,
//       name: script.name,
//       description: script.description,
//       language: script.language,
//       challenge: {
//         id: script.challenge._id,
//         name: script.challenge.name
//       },
//       filePath: script.filePath,
//       createdAt: script.createdAt,
//       updatedAt: script.updatedAt
//     }));

//     res.status(200).json({
//       success: true,
//       count: formattedScripts.length,
//       scripts: formattedScripts
//     });
//   } catch (error) {
//     console.error('Error fetching scripts:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch scripts',
//       error: error.message
//     });
//   }
// });

router.get('/', fetchuser, async (req, res) => {
  try {
    const scripts = await Script.find()
      .populate('challenge', 'name _id') // Only include challenge name and id
      .sort({ createdAt: -1 }); // Newest first

    const formattedScripts = scripts.map(script => ({
      id: script._id,
      name: script.name,
      description: script.description,
      language: script.language,
      challenge: script.challenge ? {
        id: script.challenge._id,
        name: script.challenge.name
      } : null, // Handle null challenge case
      filePath: script.filePath,
      createdAt: script.createdAt,
      updatedAt: script.updatedAt
    }));

    res.status(200).json({
      success: true,
      count: formattedScripts.length,
      scripts: formattedScripts
    });
  } catch (error) {
    console.error('Error fetching scripts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scripts',
      error: error.message
    });
  }
});

router.delete('/delete-script/:id', fetchuser, async (req, res) => {
  const { id } = req.params;

  if (!id || id === 'undefined') {
    return res.status(400).json({ success: false, message: 'Invalid script ID.' });
  }

  try {
    const deletedScript = await Script.findByIdAndDelete(id);

    if (!deletedScript) {
      return res.status(404).json({ success: false, message: 'Script not found.' });
    }

    res.json({ success: true, message: 'Script deleted successfully.' });
  } catch (err) {
    console.error('Error deleting script:', err);
    res.status(500).json({ success: false, message: 'Server error while deleting script.' });
  }
});


// New route to get script count
router.get('/count/scripts', fetchuser, async (req, res) => {
  try {
    const count = await Script.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error counting scripts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


export default router;