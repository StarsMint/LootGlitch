require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import our custom modules
const TelegramDB = require('./bot/telegramDB');
const AuthSystem = require('./utils/auth');
const ReferralSystem = require('./utils/referralSystem');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for ads
}));
app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Serve static files
app.use(express.static('public'));

// Initialize systems
const telegramDB = new TelegramDB(
    process.env.TELEGRAM_BOT_TOKEN,
    process.env.TELEGRAM_ADMIN_ID,
    process.env.TELEGRAM_GROUP_ID
);

const authSystem = new AuthSystem(telegramDB);
const referralSystem = new ReferralSystem(telegramDB);

// Keep-alive ping system for Render
const keepAlive = () => {
    setInterval(() => {
        console.log('🔄 Keep-alive ping');
    }, 5 * 60 * 1000); // Every 5 minutes
};

// API Routes

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ error: 'Username must be 3-20 characters' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const result = await authSystem.register(username, password);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const result = await authSystem.login(username, password);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(401).json(result);
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Verify session
app.post('/api/auth/verify', (req, res) => {
    try {
        const { sessionToken } = req.body;
        const user = authSystem.verifySession(sessionToken);
        
        if (user) {
            res.json({ valid: true, user: { id: user.id, username: user.username } });
        } else {
            res.json({ valid: false });
        }
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Get games list
app.get('/api/games', (req, res) => {
    try {
        const games = referralSystem.getGamesList();
        res.json({ games });
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ error: 'Failed to fetch games' });
    }
});

// Get game details
app.get('/api/games/:gameId', (req, res) => {
    try {
        const game = referralSystem.getGameDetails(req.params.gameId);
        
        if (game) {
            res.json({ game });
        } else {
            res.status(404).json({ error: 'Game not found' });
        }
    } catch (error) {
        console.error('Error fetching game:', error);
        res.status(500).json({ error: 'Failed to fetch game' });
    }
});

// Create claim
app.post('/api/claim', async (req, res) => {
    try {
        const { sessionToken, game, amount } = req.body;
        const user = authSystem.verifySession(sessionToken);
        
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const referralLink = referralSystem.createReferralLink(user.id, game, amount);
        
        res.json({
            success: true,
            referralLink: referralLink.link,
            requiredReferrals: referralLink.requiredReferrals,
            code: referralLink.code
        });
    } catch (error) {
        console.error('Claim error:', error);
        res.status(500).json({ error: 'Failed to create claim' });
    }
});

// Track referral click
app.get('/api/track/:code', async (req, res) => {
    try {
        const visitorIP = req.ip || req.connection.remoteAddress;
        const result = await referralSystem.trackReferral(req.params.code, visitorIP);
        
        res.json(result);
    } catch (error) {
        console.error('Tracking error:', error);
        res.status(500).json({ error: 'Tracking failed' });
    }
});

// Check referral progress
app.post('/api/progress', async (req, res) => {
    try {
        const { sessionToken, game, amount } = req.body;
        const user = authSystem.verifySession(sessionToken);
        
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const progress = await referralSystem.checkReferralGoal(user.id, game, amount);
        
        res.json(progress);
    } catch (error) {
        console.error('Progress check error:', error);
        res.status(500).json({ error: 'Failed to check progress' });
    }
});

// Submit final claim
app.post('/api/submit-claim', async (req, res) => {
    try {
        const { sessionToken, game, amount, telegramUsername } = req.body;
        const user = authSystem.verifySession(sessionToken);
        
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const progress = await referralSystem.checkReferralGoal(user.id, game, amount);
        
        if (!progress.goalMet) {
            return res.status(400).json({ error: 'Referral goal not met' });
        }

        const gameDetails = referralSystem.getGameDetails(game);
        const claimData = {
            userId: user.id,
            username: user.username,
            telegramUsername,
            game: gameDetails.name,
            amount,
            currency: gameDetails.currency,
            referralsCompleted: progress.completed,
            referralsRequired: progress.required,
            revenueGenerated: progress.required * referralSystem.baseCPM * referralSystem.referralMultiplier
        };

        await telegramDB.saveRewardClaim(claimData);
        
        res.json({ success: true, message: 'Claim submitted successfully!' });
    } catch (error) {
        console.error('Submit claim error:', error);
        res.status(500).json({ error: 'Failed to submit claim' });
    }
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 LootGlitch server running on port ${PORT}`);
    console.log(`🤖 Telegram Bot initialized`);
    keepAlive();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
