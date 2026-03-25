const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || '.png');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({ storage });

router.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

router.put('/me/avatar/preset', authMiddleware, async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar || typeof avatar !== 'string') {
      return res.status(400).json({ message: 'Avatar invalide' });
    }

    req.user.avatar = avatar;
    await req.user.save();
    res.json({ message: 'Avatar mis à jour', user: req.user });
  } catch (error) {
    console.error('Preset avatar error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/me/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Fichier avatar requis' });
    }

    req.user.avatar = `/uploads/${req.file.filename}`;
    await req.user.save();
    res.json({ message: 'Avatar mis à jour', user: req.user });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
