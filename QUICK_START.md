# ⚡ LootGlitch Quick Start Guide

Get your LootGlitch platform running in **under 10 minutes**!

## 🚀 Super Fast Setup (Local)

### Step 1: Clone & Install (2 minutes)
```bash
# Clone the repository
git clone https://github.com/yourusername/lootglitch.git
cd lootglitch

# Install dependencies
npm install
```

### Step 2: Setup Telegram Bot (3 minutes)

#### A. Create Bot
1. Open Telegram
2. Search for **@BotFather**
3. Send `/newbot`
4. Name it: `LootGlitch Bot`
5. Username: `LootGlitchBot` (or any available)
6. **Save the token!** 

#### B. Get Your Telegram ID
1. Search for **@userinfobot**
2. Send `/start`
3. **Copy your ID!**

#### C. Create Storage Group
1. Create new Telegram group
2. Add your bot to the group
3. Make bot admin
4. Get group ID from bot message

### Step 3: Configure Environment (2 minutes)
```bash
# Copy example env file
cp .env.example .env

# Edit .env file
nano .env
```

**Required variables:**
```env
TELEGRAM_BOT_TOKEN=paste_token_here
TELEGRAM_ADMIN_ID=paste_your_id_here
TELEGRAM_GROUP_ID=paste_group_id_here
```

### Step 4: Run! (1 minute)
```bash
npm start
```

**That's it!** Visit: http://localhost:3000 🎉

---

## 🌐 Deploy to Render (10 minutes)

### Quick Deploy Button
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Manual Deploy

#### 1. Push to GitHub (2 minutes)
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

#### 2. Create Render Service (3 minutes)
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub repo
4. Service name: `lootglitch`
5. Click "Create"

#### 3. Add Environment Variables (3 minutes)
In Render dashboard, add:
```
TELEGRAM_BOT_TOKEN = your_token
TELEGRAM_ADMIN_ID = your_id
TELEGRAM_GROUP_ID = your_group_id
```

#### 4. Deploy! (2 minutes)
Click "Deploy" - Wait for build to complete.

**Live at:** `https://lootglitch.onrender.com` 🚀

---

## 🧪 Test Your Setup

### Test 1: Homepage
```
✅ Visit your URL
✅ See games grid
✅ Responsive on mobile
```

### Test 2: Telegram Bot
```
✅ Open Telegram
✅ Send /stats to your bot
✅ Receive statistics message
```

### Test 3: User Registration
```
✅ Click user icon
✅ Register account
✅ Check Telegram for confirmation
```

### Test 4: Claim Process
```
✅ Login
✅ Select game
✅ Choose reward
✅ See troll popup 😂
✅ Get referral link
```

---

## 🎯 Essential Commands

### Development
```bash
npm run dev          # Start with nodemon
npm start           # Start production
npm test            # Run tests (when added)
```

### Telegram Bot Commands
```
/stats              # View statistics
/ban username       # Ban user
/unban username     # Unban user
```

### Git Commands
```bash
git add .                    # Stage changes
git commit -m "message"      # Commit
git push                     # Deploy (auto-deploy enabled)
```

---

## 🔧 Common Issues & Fixes

### Issue: "Cannot find module"
**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Port already in use"
**Fix:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Issue: "Telegram bot not responding"
**Fix:**
```bash
# Check bot token
# Verify admin ID
# Ensure bot is group admin
# Restart server
```

### Issue: "Site loading slow"
**Fix:**
```bash
# Enable compression (already done)
# Check Render logs
# Upgrade to paid tier
```

---

## 📦 What's Included?

```
✅ Modern glitchy design
✅ 10 popular games
✅ User authentication
✅ Referral system
✅ Telegram integration
✅ Admin dashboard
✅ SEO optimization
✅ Mobile responsive
✅ Security features
✅ Analytics ready
```

---

## 🎨 Customize Your Site

### Change Colors
Edit `public/css/styles.css`:
```css
:root {
    --primary: #00ff88;    /* Change this */
    --secondary: #00d9ff;  /* And this */
    --accent: #ff00ff;     /* And this */
}
```

### Add New Games
Edit `utils/referralSystem.js`:
```javascript
this.gameRewards = {
    // Add your game here
    newgame: {
        name: 'Game Name',
        currency: 'Currency',
        amounts: [1000, 2000, 5000],
        icon: 'emoji'
    }
}
```

### Change Requirements
Edit `.env`:
```env
BASE_CPM=2.5              # Adjust revenue
REFERRAL_MULTIPLIER=0.15  # Adjust requirements
```

---

## 🚀 Next Steps

1. ✅ **Add Adsterra Ads**
   - Sign up at adsterra.com
   - Get ad codes
   - Replace placeholders

2. ✅ **Submit to Google**
   - Google Search Console
   - Submit sitemap
   - Request indexing

3. ✅ **Social Media**
   - Create accounts
   - Share content
   - Build community

4. ✅ **Monitor & Optimize**
   - Check analytics
   - Test conversions
   - Improve UX

---

## 💡 Pro Tips

1. **Use UptimeRobot** to keep site alive (free tier sleeps)
2. **Enable auto-deploy** from GitHub
3. **Monitor Telegram** for claim notifications
4. **Test on mobile** regularly
5. **Back up** your .env file securely

---

## 📚 Documentation

- [Full README](README.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [SEO Strategy](SEO_STRATEGY.md)
- [API Documentation](#) (Coming soon)

---

## 🆘 Need Help?

- 📧 Email: support@lootglitch.me
- 💬 Telegram: @LootGlitchBot
- 🐛 Issues: GitHub Issues
- 💼 Business: contact@lootglitch.me

---

**🎉 You're all set! Time to start trolling... I mean serving users!** 😂

Happy coding! 🚀
