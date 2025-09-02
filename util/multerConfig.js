const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('./appError');

// Ensure directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = file.fieldname === 'images' 
      ? 'public/uploads/posts/images' 
      : 'public/uploads/posts/videos';
    
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `post-${req.user.id}-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'images') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed for images field', 400), false);
    }
  } else if (file.fieldname === 'videos') {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only video files are allowed for videos field', 400), false);
    }
  } else {
    cb(new AppError('Invalid field name', 400), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files per request
  }
});

// Middleware for handling multiple files
exports.uploadPostMedia = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'videos', maxCount: 3 }
]);

// Single file upload for testing
exports.uploadSingleMedia = upload.single('media');