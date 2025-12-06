import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Generate JWT token
import crypto from 'crypto';

// Securely handle JWT Secret
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET not set. Generating a random secret for this session.');
    console.warn('    Sessions will be invalidated on server restart.');
    JWT_SECRET = crypto.randomBytes(64).toString('hex');
}

const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// @route   POST /auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', async (req, res) => {
    const requestId = Date.now();
    console.log(`[Auth:${requestId}] Signup attempt started`);

    try {
        const { email, password, name } = req.body;
        console.log(`[Auth:${requestId}] Signup request for email: ${email}`);

        // Validation
        if (!email || !password) {
            console.warn(`[Auth:${requestId}] Signup validation failed: Missing email or password`);
            return res.status(400).json({ error: 'Please provide email and password' });
        }

        if (password.length < 8) {
            console.warn(`[Auth:${requestId}] Signup validation failed: Password too short`);
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.warn(`[Auth:${requestId}] Signup failed: Email already exists - ${email}`);
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Create user
        const user = await User.create({
            email,
            password,
            name: name || email.split('@')[0]
        });

        console.log(`[Auth:${requestId}] User created successfully: ${user._id}`);

        // Generate token
        const token = generateToken(user._id);
        console.log(`[Auth:${requestId}] Token generated for user: ${user._id}`);

        res.status(201).json({
            success: true,
            token,
            user: user.getPublicProfile()
        });

        console.log(`[Auth:${requestId}] Signup completed successfully for: ${email}`);

    } catch (error) {
        console.error(`[Auth:${requestId}] Signup error:`, {
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n')
        });
        res.status(500).json({
            error: `Registration failed: ${error.message}`,
            requestId
        });
    }
});

// @route   POST /auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    const requestId = Date.now();
    console.log(`[Auth:${requestId}] Login attempt started`);

    try {
        const { email, password } = req.body;
        console.log(`[Auth:${requestId}] Login request for email: ${email}`);

        // Validation
        if (!email || !password) {
            console.warn(`[Auth:${requestId}] Login validation failed: Missing credentials`);
            return res.status(400).json({ error: 'Please provide email and password' });
        }

        // Find user (password is included by default in JsonModel)
        const user = await User.findOne({ email });

        if (!user) {
            console.warn(`[Auth:${requestId}] Login failed: User not found - ${email}`);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            console.warn(`[Auth:${requestId}] Login failed: Invalid password for - ${email}`);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        console.log(`[Auth:${requestId}] Password validated successfully for: ${email}`);

        // Update last login
        await user.updateLastLogin();

        // Generate token
        const token = generateToken(user._id);
        console.log(`[Auth:${requestId}] Token generated for user: ${user._id}`);

        // Remove password from user object
        user.password = undefined;

        res.json({
            success: true,
            token,
            user: user.getPublicProfile()
        });

        console.log(`[Auth:${requestId}] Login completed successfully for: ${email}`);

    } catch (error) {
        console.error(`[Auth:${requestId}] Login error:`, {
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n')
        });
        res.status(500).json({
            error: 'Login failed. Please try again.',
            requestId
        });
    }
});

// @route   GET /auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
    const requestId = Date.now();
    console.log(`[Auth:${requestId}] Get current user request for userId: ${req.user._id}`);

    try {
        res.json({
            success: true,
            user: req.user.getPublicProfile()
        });
        console.log(`[Auth:${requestId}] User profile returned successfully`);
    } catch (error) {
        console.error(`[Auth:${requestId}] Get user error:`, error.message);
        res.status(500).json({
            error: 'Failed to get user information',
            requestId
        });
    }
});

// @route   POST /auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authMiddleware, async (req, res) => {
    try {
        const token = generateToken(req.user._id);

        res.json({
            success: true,
            token
        });
    } catch (error) {
        console.error('Token Refresh Error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

// @route   POST /auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authMiddleware, async (req, res) => {
    try {
        // In a JWT system, logout is primarily client-side
        // Server doesn't need to do anything
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// @route   GET /auth/google
// @desc    Auth with Google
// @access  Public
// Middleware to check Google Config
const checkGoogleConfig = (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=Google OAuth is not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in backend .env`);
    }
    next();
};

// @route   GET /auth/google
// @desc    Auth with Google
// @access  Public
router.get('/google', checkGoogleConfig, passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get('/google/callback',
    checkGoogleConfig,
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication
        const token = generateToken(req.user._id);
        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth/callback?token=${token}`);
    }
);

export default router;
