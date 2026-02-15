const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');

const router = express.Router();

const allowedPresetAvatars = [
  '/assets/img/pdp/pdp1.png',
  '/assets/img/pdp/pdp2.png',
  '/assets/img/pdp/pdp3.png',
  '/assets/img/pdp/pdp4.png',
  '/assets/img/pdp/pdp5.png',
  '/assets/img/pdp/pdp6.png',
  '/assets/img/pdp/pdp7.png',
  '/assets/img/pdp/pdp8.png',
  '/assets/img/pdp/pdp9.png'
];

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${req.userId}-${Date.now()}${ext}`;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error('Format de fichier non supporté'), false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

// Profil utilisateur
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Upload avatar
router.put('/me/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Fichier manquant' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar: avatarUrl },
      { returnDocument: 'after' }
    ).select('-password');

    res.json({ message: 'Avatar mis à jour', user });
  } catch (error) {
    console.error('Erreur upload avatar:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Choisir un avatar prédéfini
router.put('/me/avatar/preset', authMiddleware, async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar || !allowedPresetAvatars.includes(avatar)) {
      return res.status(400).json({ message: 'Avatar invalide' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar },
      { returnDocument: 'after' }
    ).select('-password');

    res.json({ message: 'Avatar mis à jour', user });
  } catch (error) {
    console.error('Erreur avatar preset:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = { router };
