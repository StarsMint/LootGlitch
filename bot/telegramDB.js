const TelegramBot = require('node-telegram-bot-api');

class TelegramDB {
    constructor(token, adminId, groupId) {
        this.bot = new TelegramBot(token, { polling: true });
        this.adminId = adminId;
        this.groupId = groupId;
        this.dataCache = new Map();
        this.setupAdminCommands();
        this.setupUserSupport();
    }

    // Store data in Telegram (as messages that we can parse later)
    async saveData(key, data) {
        try {
            const message = `🗄️ DATA_STORE\n📦 Key: ${key}\n📊 Data: ${JSON.stringify(data)}\n⏰ Time: ${new Date().toISOString()}`;
            await this.bot.sendMessage(this.adminId, message);
            this.dataCache.set(key, data);
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    // Save user registration
    async saveUser(userData) {
        const key = `user_${userData.username}`;
        await this.saveData(key, userData);
    }

    // Save referral data
    async saveReferral(referralData) {
        const key = `referral_${referralData.userId}_${Date.now()}`;
        await this.saveData(key, referralData);
    }

    // Save reward claim
    async saveRewardClaim(claimData) {
        const message = `
🎁 NEW REWARD CLAIM

👤 User: @${claimData.telegramUsername}
🎮 Game: ${claimData.game}
💎 Reward: ${claimData.amount} ${claimData.currency}
📊 Referrals: ${claimData.referralsCompleted}/${claimData.referralsRequired}
💰 Revenue Generated: $${claimData.revenueGenerated.toFixed(2)}
🆔 User ID: ${claimData.userId}
⏰ Time: ${new Date().toISOString()}

━━━━━━━━━━━━━━━
Actions:`;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '✅ Delivered', callback_data: `delivered_${claimData.userId}` },
                    { text: '❌ Rejected', callback_data: `rejected_${claimData.userId}` }
                ],
                [
                    { text: '💬 Contact User', callback_data: `contact_${claimData.userId}` }
                ]
            ]
        };

        await this.bot.sendMessage(this.adminId, message, { reply_markup: keyboard });
        await this.saveData(`claim_${claimData.userId}_${Date.now()}`, claimData);
    }

    // Setup admin commands
    setupAdminCommands() {
        // Admin statistics
        this.bot.onText(/\/stats/, async (msg) => {
            if (msg.from.id !== parseInt(this.adminId)) return;

            const stats = await this.getStats();
            const message = `
📊 LOOTGLITCH STATISTICS

👥 Total Users: ${stats.totalUsers}
🎯 Active Claims: ${stats.activeClaims}
💰 Total Revenue: $${stats.totalRevenue.toFixed(2)}
📈 Today's Revenue: $${stats.todayRevenue.toFixed(2)}
🔗 Total Referrals: ${stats.totalReferrals}
✅ Completed Claims: ${stats.completedClaims}
⏰ Updated: ${new Date().toLocaleString()}`;

            await this.bot.sendMessage(this.adminId, message);
        });

        // Handle callback queries for claim management
        this.bot.on('callback_query', async (query) => {
            if (query.from.id !== parseInt(this.adminId)) return;

            const [action, userId] = query.data.split('_');
            
            if (action === 'delivered') {
                await this.bot.answerCallbackQuery(query.id, { text: '✅ Marked as delivered' });
                await this.updateClaimStatus(userId, 'delivered');
            } else if (action === 'rejected') {
                await this.bot.answerCallbackQuery(query.id, { text: '❌ Marked as rejected' });
                await this.updateClaimStatus(userId, 'rejected');
            } else if (action === 'contact') {
                await this.bot.answerCallbackQuery(query.id, { text: '💬 Opening chat...' });
                await this.bot.sendMessage(this.adminId, `Use @LootGlitchBot to contact user: ${userId}`);
            }
        });

        // Ban user
        this.bot.onText(/\/ban (.+)/, async (msg, match) => {
            if (msg.from.id !== parseInt(this.adminId)) return;
            const username = match[1];
            await this.saveData(`banned_${username}`, { banned: true, timestamp: Date.now() });
            await this.bot.sendMessage(this.adminId, `🚫 User ${username} has been banned`);
        });

        // Unban user
        this.bot.onText(/\/unban (.+)/, async (msg, match) => {
            if (msg.from.id !== parseInt(this.adminId)) return;
            const username = match[1];
            await this.saveData(`banned_${username}`, { banned: false, timestamp: Date.now() });
            await this.bot.sendMessage(this.adminId, `✅ User ${username} has been unbanned`);
        });
    }

    // Setup user support system
    setupUserSupport() {
        this.bot.on('message', async (msg) => {
            // Ignore commands and admin messages
            if (msg.text?.startsWith('/') || msg.from.id === parseInt(this.adminId)) return;

            // Forward user messages to admin with context
            const supportMessage = `
💬 USER SUPPORT MESSAGE

From: ${msg.from.first_name} ${msg.from.last_name || ''}
Username: @${msg.from.username || 'N/A'}
User ID: ${msg.from.id}
Message: ${msg.text || '[Media/Attachment]'}

Reply to this message to respond to the user.`;

            const sent = await this.bot.sendMessage(this.adminId, supportMessage);
            
            // Store mapping for replies
            this.dataCache.set(`support_${sent.message_id}`, msg.from.id);
        });

        // Handle admin replies
        this.bot.on('message', async (msg) => {
            if (msg.from.id !== parseInt(this.adminId)) return;
            if (!msg.reply_to_message) return;

            const originalUserId = this.dataCache.get(`support_${msg.reply_to_message.message_id}`);
            if (originalUserId) {
                await this.bot.sendMessage(originalUserId, `
📩 Response from LootGlitch Support:

${msg.text}

━━━━━━━━━━━━━━━
Reply to continue the conversation.`);
                
                await this.bot.sendMessage(this.adminId, '✅ Message sent to user');
            }
        });
    }

    // Get statistics
    async getStats() {
        // In production, parse messages from Telegram to calculate stats
        // For now, return mock data that would be calculated from cached data
        return {
            totalUsers: this.dataCache.size,
            activeClaims: 0,
            totalRevenue: 0,
            todayRevenue: 0,
            totalReferrals: 0,
            completedClaims: 0
        };
    }

    // Update claim status
    async updateClaimStatus(userId, status) {
        await this.saveData(`claim_status_${userId}`, { status, timestamp: Date.now() });
    }

    // Check if user is banned
    async isUserBanned(username) {
        const banData = this.dataCache.get(`banned_${username}`);
        return banData?.banned || false;
    }
}

module.exports = TelegramDB;
