const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads/posts");

// Folder nahi hai to automatically create karo
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const timeStamps = Date.now();

    const originalName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.-]/g, "");

    cb(null, `${timeStamps}-${originalName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedType = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "video/mp4",
    "video/mov"
  ];

  if (allowedType.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const postUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024
  }
});

module.exports = postUpload;