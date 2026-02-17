class ReferralSystem {
    constructor(telegramDB, baseCPM = 2.5, referralMultiplier = 0.15) {
        this.db = telegramDB;
        this.baseCPM = baseCPM;
        this.referralMultiplier = referralMultiplier;
        
        // Game rewards configuration
        this.gameRewards = {
            fortnite: {
                name: 'Fortnite',
                currency: 'V-Bucks',
                amounts: [1000, 2500, 5000, 13500],
                icon: 'vbucks'
            },
            cod: {
                name: 'Call of Duty',
                currency: 'COD Points',
                amounts: [1100, 2400, 5000, 9900],
                icon: 'codpoints'
            },
            roblox: {
                name: 'Roblox',
                currency: 'Robux',
                amounts: [800, 1700, 4500, 10000],
                icon: 'robux'
            },
            pubg: {
                name: 'PUBG Mobile',
                currency: 'UC',
                amounts: [600, 1500, 3850, 8100],
                icon: 'uc'
            },
            valorant: {
                name: 'Valorant',
                currency: 'VP',
                amounts: [1000, 2050, 5350, 11000],
                icon: 'vp'
            },
            minecraft: {
                name: 'Minecraft',
                currency: 'Minecoins',
                amounts: [1720, 3500, 8150],
                icon: 'minecoins'
            },
            genshin: {
                name: 'Genshin Impact',
                currency: 'Genesis Crystals',
                amounts: [980, 1980, 3280, 6480],
                icon: 'genesis'
            },
            apexlegends: {
                name: 'Apex Legends',
                currency: 'Apex Coins',
                amounts: [1000, 2150, 4350, 10000],
                icon: 'apexcoins'
            },
            freefire: {
                name: 'Free Fire',
                currency: 'Diamonds',
                amounts: [520, 1080, 2180, 5600],
                icon: 'diamonds'
            },
            mobilelegends: {
                name: 'Mobile Legends',
                currency: 'Diamonds',
                amounts: [720, 1440, 3688, 9288],
                icon: 'mldiamonds'
            }
        };
    }

    // Calculate required referrals based on reward value and CPM
    calculateRequiredReferrals(game, amount) {
        // Estimate reward value in USD
        const rewardValues = {
            fortnite: { 1000: 8, 2500: 20, 5000: 40, 13500: 100 },
            cod: { 1100: 10, 2400: 20, 5000: 40, 9900: 80 },
            roblox: { 800: 10, 1700: 20, 4500: 50, 10000: 100 },
            pubg: { 600: 10, 1500: 25, 3850: 60, 8100: 120 },
            valorant: { 1000: 10, 2050: 20, 5350: 50, 11000: 100 },
            minecraft: { 1720: 20, 3500: 40, 8150: 90 },
            genshin: { 980: 15, 1980: 30, 3280: 50, 6480: 100 },
            apexlegends: { 1000: 10, 2150: 20, 4350: 40, 10000: 100 },
            freefire: { 520: 5, 1080: 10, 2180: 20, 5600: 50 },
            mobilelegends: { 720: 10, 1440: 20, 3688: 50, 9288: 120 }
        };

        const rewardValueUSD = rewardValues[game]?.[amount] || 10;
        
        // Calculate revenue needed per referral
        // Each referral generates: 1 SmartLink click + potential banner impressions
        const revenuePerReferral = this.baseCPM * this.referralMultiplier;
        
        // Calculate required referrals (with 20% buffer for safety)
        const requiredReferrals = Math.ceil((rewardValueUSD / revenuePerReferral) * 1.2);
        
        // Minimum 5 referrals, maximum 50
        return Math.max(5, Math.min(50, requiredReferrals));
    }

    // Create referral link
    createReferralLink(userId, game, amount) {
        const referralCode = Buffer.from(`${userId}_${game}_${amount}_${Date.now()}`).toString('base64url');
        return {
            code: referralCode,
            link: `https://lootglitch.me/?ref=${referralCode}`,
            requiredReferrals: this.calculateRequiredReferrals(game, amount),
            game,
            amount
        };
    }

    // Track referral click
    async trackReferral(referralCode, visitorIP) {
        try {
            const decoded = Buffer.from(referralCode, 'base64url').toString();
            const [userId, game, amount, timestamp] = decoded.split('_');

            // Prevent duplicate referrals from same IP within 24 hours
            const recentReferralKey = `referral_ip_${visitorIP}_${referralCode}`;
            if (this.db.dataCache.has(recentReferralKey)) {
                return { success: false, reason: 'duplicate_ip' };
            }

            // Track referral
            const referralData = {
                userId,
                game,
                amount,
                visitorIP,
                timestamp: Date.now(),
                code: referralCode
            };

            await this.db.saveReferral(referralData);
            
            // Cache IP to prevent duplicates
            this.db.dataCache.set(recentReferralKey, true);
            
            // Update user's referral count
            const userKey = await this.getUserKeyById(userId);
            if (userKey) {
                const userData = this.db.dataCache.get(userKey);
                userData.completedReferrals = (userData.completedReferrals || 0) + 1;
                this.db.dataCache.set(userKey, userData);
            }

            return { success: true };
        } catch (error) {
            console.error('Error tracking referral:', error);
            return { success: false, reason: 'invalid_code' };
        }
    }

    // Check if referral goal is met
    async checkReferralGoal(userId, game, amount) {
        const requiredReferrals = this.calculateRequiredReferrals(game, amount);
        
        // Count completed referrals for this claim
        let completedReferrals = 0;
        for (const [key, value] of this.db.dataCache.entries()) {
            if (key.startsWith('referral_') && value.userId === userId && value.game === game) {
                completedReferrals++;
            }
        }

        return {
            completed: completedReferrals,
            required: requiredReferrals,
            goalMet: completedReferrals >= requiredReferrals,
            progress: Math.min(100, (completedReferrals / requiredReferrals) * 100)
        };
    }

    // Helper to get user key by ID
    async getUserKeyById(userId) {
        for (const [key, value] of this.db.dataCache.entries()) {
            if (key.startsWith('user_') && value.id === userId) {
                return key;
            }
        }
        return null;
    }

    // Get all games list
    getGamesList() {
        return Object.entries(this.gameRewards).map(([key, game]) => ({
            id: key,
            ...game
        }));
    }

    // Get game details
    getGameDetails(gameId) {
        return this.gameRewards[gameId] || null;
    }
}

module.exports = ReferralSystem;
