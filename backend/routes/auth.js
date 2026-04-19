const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const APP_JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, APP_JWT_SECRET, { expiresIn: '24h' });
};

const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  return email.trim().toLowerCase();
};

const sanitizeUsername = (value) => {
  if (!value || typeof value !== 'string') return 'user';
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 24);

  if (normalized.length >= 3) return normalized;
  return `user${Date.now().toString().slice(-6)}`;
};

const buildAuthResponse = (user, message) => ({
  message,
  user: {
    id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    scores: user.scores,
    playtime: user.playtime
  },
  token: generateToken(user._id.toString())
});

const generateUniqueUsername = async (baseCandidate) => {
  const base = sanitizeUsername(baseCandidate);

  for (let i = 0; i < 100; i += 1) {
    const suffix = i === 0 ? '' : `${i}`;
    const username = `${base}${suffix}`.slice(0, 30);
    const existing = await User.findOne({ username }).select('_id');
    if (!existing) return username;
  }

  return `user${crypto.randomBytes(4).toString('hex')}`;
};

const findOrCreateOAuthUser = async ({ provider, providerId, email, displayName }) => {
  const providerField = 'googleId';

  let user = await User.findOne({ [providerField]: providerId });
  if (user) {
    return user;
  }

  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) {
    user = await User.findOne({ email: normalizedEmail });
    if (user) {
      if (!user[providerField]) {
        user[providerField] = providerId;
      }
      if (!user.authProvider || user.authProvider === 'local') {
        user.authProvider = provider;
      }
      if (displayName && !user.displayName) {
        user.displayName = displayName;
      }
      await user.save();
      return user;
    }
  }

  if (!normalizedEmail) {
    throw new Error('OAUTH_EMAIL_REQUIRED');
  }

  const usernameBase = normalizedEmail.split('@')[0] || provider;
  const username = await generateUniqueUsername(usernameBase);
  const randomPassword = crypto.randomBytes(32).toString('hex');
  const password = await bcrypt.hash(randomPassword, 10);

  return User.create({
    username,
    email: normalizedEmail,
    password,
    authProvider: provider,
    [providerField]: providerId,
    displayName
  });
};

router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ message: 'username, password et email sont requis' });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email: email.toLowerCase() }]
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Utilisateur ou email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    const token = generateToken(newUser._id.toString());
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        scores: newUser.scores,
        playtime: newUser.playtime
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, identifier, password } = req.body;
    const loginValue = (identifier || username || '').trim();

    if (!loginValue || !password) {
      return res.status(400).json({ message: 'username/email et password sont requis' });
    }

    const isEmailLogin = loginValue.includes('@');
    const user = isEmailLogin
      ? await User.findOne({ email: loginValue.toLowerCase() })
      : await User.findOne({ username: loginValue });

    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const token = generateToken(user._id.toString());
    res.json({
      message: 'Connexion réussie',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        scores: user.scores,
        playtime: user.playtime
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/oauth/google/config', (req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
  res.json({
    configured: Boolean(googleClientId),
    clientId: googleClientId
  });
});

router.post('/oauth/google', async (req, res) => {
  try {
    const { idToken, accessToken } = req.body;
    if (!idToken && !accessToken) {
      return res.status(400).json({ message: 'idToken ou accessToken Google requis' });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return res.status(500).json({ message: 'GOOGLE_CLIENT_ID non configuré' });
    }

    let payload;

    if (idToken) {
      const client = new OAuth2Client(googleClientId);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: googleClientId
      });
      payload = ticket.getPayload();
    } else {
      const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
      if (!tokenInfoResponse.ok) {
        return res.status(401).json({ message: 'Access token Google invalide' });
      }

      const tokenInfo = await tokenInfoResponse.json();
      if (!tokenInfo || tokenInfo.aud !== googleClientId) {
        return res.status(401).json({ message: 'Audience Google invalide' });
      }

      payload = {
        sub: tokenInfo.sub,
        email: tokenInfo.email,
        email_verified: tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true,
        name: tokenInfo.name
      };
    }

    if (!payload || !payload.sub || !payload.email || payload.email_verified === false) {
      return res.status(401).json({ message: 'Token Google invalide' });
    }

    const user = await findOrCreateOAuthUser({
      provider: 'google',
      providerId: payload.sub,
      email: payload.email,
      displayName: payload.name
    });

    return res.json(buildAuthResponse(user, 'Connexion Google réussie'));
  } catch (error) {
    console.error('Google OAuth error:', error);
    return res.status(401).json({ message: 'Échec de vérification Google' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
