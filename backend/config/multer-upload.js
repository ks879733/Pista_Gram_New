const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/posts")
  },
  filename: (req, file, cb) => {
    const timeStamps = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-1]/g, "")
    cb(null, `${timeStamps}-${originalName}`)
  }
})
const fileFilter = (req, file, cb) => {
  const allowedType = ["image/jpeg", "image/jpg", "image/png", "image/gif", "video/mp4", "video/mov"];
  if(allowedType.includes(file.mimetype)) {
    cb(null, true)
  }else{
    cb(new Error("invalid file type"), false)
  }
}
const postUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {fileSize: 30 * 1024 * 1024}

});

module.exports = postUpload