const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedType = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "video/mp4",
    "video/quicktime",
  ];

  if (allowedType.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const postUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024,
  },
});

module.exports = postUpload;