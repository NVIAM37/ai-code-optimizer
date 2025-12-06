import express from 'express';
import User from '../models/User.js';
import ExecutionHistory from '../models/ExecutionHistory.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// @route   GET /user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user.getPublicProfile()
        });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// @route   PUT /user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, preferences } = req.body;

        const user = await User.findById(req.user._id);

        if (name) user.name = name;
        if (preferences) {
            user.preferences = { ...user.preferences, ...preferences };
        }

        await user.save();

        res.json({
            success: true,
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// @route   PUT /user/api-keys
// @desc    Update API keys
// @access  Private
router.put('/api-keys', authMiddleware, async (req, res) => {
    try {
        const { gemini, groq } = req.body;

        const updateData = { apiKeys: { ...req.user.apiKeys } };
        if (gemini !== undefined) updateData.apiKeys.gemini = gemini;
        if (groq !== undefined) updateData.apiKeys.groq = groq;

        await User.updateOne({ _id: req.user._id }, { $set: updateData });

        res.json({
            success: true,
            message: 'API keys updated successfully',
            apiKeys: updateData.apiKeys
        });
    } catch (error) {
        console.error('Update API Keys Error:', error);
        res.status(500).json({ error: 'Failed to update API keys' });
    }
});

// @route   GET /user/api-keys
// @desc    Get user's API keys
// @access  Private
router.get('/api-keys', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.json({
            success: true,
            apiKeys: {
                gemini: user.apiKeys.gemini,
                groq: user.apiKeys.groq
            }
        });
    } catch (error) {
        console.error('Get API Keys Error:', error);
        res.status(500).json({ error: 'Failed to get API keys' });
    }
});

// @route   GET /user/history
// @desc    Get execution history
// @access  Private
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, language, sortBy = 'timestamp', order = 'desc' } = req.query;

        const query = { userId: req.user._id };
        if (language) query.language = language;

        const sortOrder = order === 'desc' ? -1 : 1;
        const sortOptions = { [sortBy]: sortOrder };

        const total = await ExecutionHistory.countDocuments(query);
        let history = await ExecutionHistory.find(query);

        // Manual sorting
        history.sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            if (aVal < bVal) return sortOrder === -1 ? 1 : -1;
            if (aVal > bVal) return sortOrder === -1 ? -1 : 1;
            return 0;
        });

        // Manual pagination
        const startIdx = (parseInt(page) - 1) * parseInt(limit);
        history = history.slice(startIdx, startIdx + parseInt(limit));

        res.json({
            success: true,
            history,
            pagination: {
                current: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get History Error:', error);
        res.status(500).json({ error: 'Failed to get execution history' });
    }
});

// @route   GET /user/statistics
// @desc    Get user statistics
// @access  Private
router.get('/statistics', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;

        // Get all user's execution history
        const allHistory = await ExecutionHistory.find({ userId });

        // Manual aggregation for statistics
        let totalRuns = 0;
        let totalPerformanceGain = 0;
        let totalTimeSaved = 0;
        let totalEnergySaved = 0;
        const languageCounts = {};

        allHistory.forEach(record => {
            totalRuns++;
            totalPerformanceGain += record.performanceGain || 0;

            // Handle both old and new metrics structures for backward compatibility
            // New format: metrics.original.duration
            // Old format: metrics.original.metrics.duration
            if (record.metrics) {
                let origMetrics = record.metrics.original;
                let optMetrics = record.metrics.optimized;

                // Backward compatibility: if original/optimized contain a nested 'metrics' object, use that
                if (origMetrics && origMetrics.metrics) {
                    origMetrics = origMetrics.metrics;
                }
                if (optMetrics && optMetrics.metrics) {
                    optMetrics = optMetrics.metrics;
                }

                // Now calculate if both metrics exist
                if (origMetrics && optMetrics) {
                    const origDuration = Number(origMetrics.duration) || 0;
                    const optDuration = Number(optMetrics.duration) || 0;
                    totalTimeSaved += (origDuration - optDuration);

                    const origEnergy = Number(origMetrics.energy_joules) || 0;
                    const optEnergy = Number(optMetrics.energy_joules) || 0;
                    totalEnergySaved += (origEnergy - optEnergy);
                }
            }

            // Count by language
            const lang = record.language;
            languageCounts[lang] = (languageCounts[lang] || 0) + 1;
        });

        const avgPerformanceGain = totalRuns > 0 ? totalPerformanceGain / totalRuns : 0;

        // Format language stats
        const languageStats = Object.keys(languageCounts).map(lang => ({
            _id: lang,
            count: languageCounts[lang]
        }));

        // Recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let recentActivity = allHistory.filter(item => new Date(item.timestamp) >= thirtyDaysAgo);

        // Manual sorting and limiting
        recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        recentActivity = recentActivity.slice(0, 10);

        const result = {
            totalRuns,
            avgPerformanceGain,
            totalTimeSaved,
            totalEnergySaved
        };

        // console.log(`📊 Statistics for user ${req.user.email}:`, { ... });

        res.json({
            success: true,
            statistics: {
                ...result,
                languages: languageStats,
                recentActivity
            }
        });
    } catch (error) {
        console.error('Get Statistics Error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// @route   DELETE /user/data
// @desc    Delete all user data
// @access  Private
router.delete('/data', authMiddleware, async (req, res) => {
    try {
        const { confirm } = req.body;

        if (confirm !== 'DELETE') {
            return res.status(400).json({
                error: 'Please confirm deletion by sending { confirm: "DELETE" }'
            });
        }

        // Delete all user's execution history
        await ExecutionHistory.deleteMany({ userId: req.user._id });

        // Delete user account
        await User.findByIdAndDelete(req.user._id);

        res.json({
            success: true,
            message: 'All user data deleted successfully'
        });
    } catch (error) {
        console.error('Delete Data Error:', error);
        res.status(500).json({ error: 'Failed to delete user data' });
    }
});

// @route   GET /user/export
// @desc    Export all user data
// @access  Private
router.get('/export', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const history = await ExecutionHistory.find({ userId: req.user._id });

        const exportData = {
            user: {
                email: user.email,
                name: user.name,
                preferences: user.preferences,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            },
            executionHistory: history,
            exportedAt: new Date()
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="green-code-optimizer-data-${Date.now()}.json"`);
        res.json(exportData);
    } catch (error) {
        console.error('Export Data Error:', error);
        res.status(500).json({ error: 'Failed to export user data' });
    }
});

export default router;
