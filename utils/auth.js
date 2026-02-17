const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class AuthSystem {
    constructor(telegramDB) {
        this.db = telegramDB;
        this.sessions = new Map();
    }

    // Register new user
    async register(username, password) {
        // Check if user exists
        if (this.db.dataCache.has(`user_${username}`)) {
            return { success: false, error: 'Username already exists' };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = {
            id: uuidv4(),
            username,
            password: hashedPassword,
            createdAt: Date.now(),
            referrals: [],
            completedReferrals: 0,
            claims: [],
            totalRevenue: 0
        };

        // Save to Telegram DB
        await this.db.saveUser(user);

        // Create session
        const sessionToken = uuidv4();
        this.sessions.set(sessionToken, user.id);

        return {
            success: true,
            sessionToken,
            user: {
                id: user.id,
                username: user.username
            }
        };
    }

    // Login user
    async login(username, password) {
        const userData = this.db.dataCache.get(`user_${username}`);
        
        if (!userData) {
            return { success: false, error: 'Invalid credentials' };
        }

        // Check if banned
        if (await this.db.isUserBanned(username)) {
            return { success: false, error: 'Account suspended. Contact support.' };
        }

        // Verify password
        const isValid = await bcrypt.compare(password, userData.password);
        
        if (!isValid) {
            return { success: false, error: 'Invalid credentials' };
        }

        // Create session
        const sessionToken = uuidv4();
        this.sessions.set(sessionToken, userData.id);

        return {
            success: true,
            sessionToken,
            user: {
                id: userData.id,
                username: userData.username
            }
        };
    }

    // Verify session
    verifySession(sessionToken) {
        const userId = this.sessions.get(sessionToken);
        if (!userId) return null;

        // Find user by ID
        for (const [key, value] of this.db.dataCache.entries()) {
            if (key.startsWith('user_') && value.id === userId) {
                return value;
            }
        }
        return null;
    }

    // Logout
    logout(sessionToken) {
        this.sessions.delete(sessionToken);
    }
}

module.exports = AuthSystem;
