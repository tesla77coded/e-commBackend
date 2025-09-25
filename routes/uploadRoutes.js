/**
 * @swagger
 * /api/uploads:
 *   post:
 *     summary: Upload an image file
 *     tags:
 *       - Uploads
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 image:
 *                   type: string
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 */


import path from 'path';
import express from 'express';
import multer from 'multer';

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, res, cb) {
    cb(null, 'uploads/');
  },

  //inside multer.diskstorage
  filename(req, res, cb) {
    cb(null,
      `${file.fieldname
      } - ${Date.now()}${path.extname(file.originalname)}`

    )
  }
});

function checkFileType(file, cb) {

  const filetypes = /jpeg|jpg|png|gif/;

  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only! (jpeg,jpg,png,gif)'), false);
  }
};


const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});


router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file uploaded.');
  }

  res.status(200).send({
    message: "Image uploaded succesfully.",
    image: `/${req.file.path.replace(/\\/g, '/')}`, // Standardize path separators
  });
});

export default router;
