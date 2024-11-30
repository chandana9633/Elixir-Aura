const path = require('path');
const fs = require("fs")
const multer = require('multer');

 const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Use the upload directory
    },
    filename: function (req, file, cb) {
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().replace(/:/g, '-').replace(/\..+/, '');
        const name = formattedDate + '_' + file.originalname;
        cb(null, name);
    },
});

const upload = multer({ storage:storage});

module.exports = upload