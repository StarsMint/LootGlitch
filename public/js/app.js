// ========================================
// LootGlitch - Main Application
// ========================================

class LootGlitch {
    constructor() {
        this.currentUser = null;
        this.currentGame = null;
        this.currentAmount = null;
        this.sessionToken = localStorage.getItem('sessionToken');
        this.init();
    }

    async init() {
        // Hide loading screen after 2 seconds
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('app').style.display = 'block';
        }, 2000);

        // Check if user is logged in
        if (this.sessionToken) {
            await this.verifySession();
        }

        // Load games
        await this.loadGames();

        // Setup event listeners
        this.setupEventListeners();

        // Check for referral code
        this.checkReferralCode();
    }

    setupEventListeners() {
        // Home link
        document.getElementById('home-link').addEventListener('click', () => {
            this.showView('home');
        });

        // User button
        document.getElementById('user-btn').addEventListener('click', () => {
            if (this.currentUser) {
                this.logout();
            } else {
                this.showView('auth');
            }
        });

        // Back button
        document.getElementById('back-btn').addEventListener('click', () => {
            this.showView('home');
        });

        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Auth form
        document.getElementById('auth-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuth();
        });

        // Modal handlers
        document.getElementById('terms-link').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('terms-modal').classList.add('active');
        });

        document.getElementById('privacy-link').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('privacy-modal').classList.add('active');
        });

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('active');
                });
            });
        });

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    showView(viewName) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}-view`).classList.add('active');
    }

    async verifySession() {
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sessionToken: this.sessionToken })
            });

            const data = await response.json();

            if (data.valid) {
                this.currentUser = data.user;
                this.updateUserButton();
            } else {
                localStorage.removeItem('sessionToken');
                this.sessionToken = null;
            }
        } catch (error) {
            console.error('Session verification failed:', error);
        }
    }

    updateUserButton() {
        const userBtn = document.getElementById('user-btn');
        if (this.currentUser) {
            userBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 13c-1.1 0-2 .9-2 2v4H2v-4c0-1.1-.9-2-2-2v-2h18v2zm-8-6c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3-1.34-3-3z"/>
                </svg>
            `;
            userBtn.title = 'Logout';
        }
    }

    async loadGames() {
        try {
            const response = await fetch('/api/games');
            const data = await response.json();

            const gamesGrid = document.getElementById('games-grid');
            gamesGrid.innerHTML = '';

            data.games.forEach(game => {
                const gameCard = this.createGameCard(game);
                gamesGrid.appendChild(gameCard);
            });
        } catch (error) {
            console.error('Error loading games:', error);
        }
    }

    createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <div class="game-icon">${this.getGameEmoji(game.id)}</div>
            <h3 class="game-name">${game.name}</h3>
            <p class="game-currency">${game.currency}</p>
            <div class="game-rewards">
                ${game.amounts.map(amount => `
                    <span class="reward-badge">${amount.toLocaleString()}</span>
                `).join('')}
            </div>
        `;

        card.addEventListener('click', () => {
            this.selectGame(game);
        });

        return card;
    }

    getGameEmoji(gameId) {
        const emojis = {
            fortnite: '🎮',
            cod: '🎯',
            roblox: '🎲',
            pubg: '🔫',
            valorant: '⚔️',
            minecraft: '⛏️',
            genshin: '🗡️',
            apexlegends: '🏆',
            freefire: '💥',
            mobilelegends: '🛡️'
        };
        return emojis[gameId] || '🎮';
    }

    selectGame(game) {
        if (!this.currentUser) {
            this.showView('auth');
            return;
        }

        this.currentGame = game;
        this.showClaimView(game);
    }

    showClaimView(game) {
        this.showView('claim');

        const claimContent = document.getElementById('claim-content');
        claimContent.innerHTML = `
            <div class="claim-header">
                <div class="claim-game-icon">${this.getGameEmoji(game.id)}</div>
                <h2 class="claim-title">${game.name}</h2>
                <p class="claim-subtitle">Select your reward amount</p>
            </div>

            <div class="reward-selector" id="reward-selector">
                ${game.amounts.map(amount => `
                    <div class="reward-option" data-amount="${amount}">
                        <div class="reward-amount">${amount.toLocaleString()}</div>
                        <div class="reward-label">${game.currency}</div>
                    </div>
                `).join('')}
            </div>

            <div class="claim-action">
                <button class="btn btn-primary" id="claim-btn" disabled>
                    <span class="btn-text">Claim Reward</span>
                    <span class="btn-glow"></span>
                </button>
            </div>
        `;

        // Setup reward selection
        document.querySelectorAll('.reward-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.reward-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                this.currentAmount = parseInt(option.dataset.amount);
                document.getElementById('claim-btn').disabled = false;
            });
        });

        // Setup claim button
        document.getElementById('claim-btn').addEventListener('click', () => {
            this.startClaim();
        });
    }

    async startClaim() {
        // Show SmartLink ad (simulate)
        await this.showSmartLink();

        // Show troll popup
        this.showTrollPopup();
    }

    async showSmartLink() {
        // In production, replace with actual Adsterra SmartLink
        return new Promise(resolve => {
            // Simulate ad loading
            setTimeout(() => {
                console.log('SmartLink ad shown');
                resolve();
            }, 1000);
        });
    }

    showTrollPopup() {
        const popup = document.getElementById('troll-popup');
        const requiredRefs = document.getElementById('required-refs');
        
        // Calculate required referrals
        const required = this.calculateRequiredReferrals();
        requiredRefs.textContent = required;

        popup.classList.add('active');

        // Setup real claim button
        document.getElementById('start-real-claim').addEventListener('click', () => {
            popup.classList.remove('active');
            this.startRealClaim();
        }, { once: true });
    }

    calculateRequiredReferrals() {
        // Simple calculation - in production, this comes from backend
        const baseRefs = 5;
        const amountMultiplier = Math.floor(this.currentAmount / 1000);
        return Math.min(50, baseRefs + amountMultiplier);
    }

    async startRealClaim() {
        try {
            const response = await fetch('/api/claim', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionToken: this.sessionToken,
                    game: this.currentGame.id,
                    amount: this.currentAmount
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showReferralProgress(data);
            }
        } catch (error) {
            console.error('Error starting claim:', error);
            alert('Something went wrong. Please try again.');
        }
    }

    showReferralProgress(claimData) {
        const claimContent = document.getElementById('claim-content');
        claimContent.innerHTML = `
            <div class="claim-header">
                <div class="claim-game-icon">${this.getGameEmoji(this.currentGame.id)}</div>
                <h2 class="claim-title">Share & Earn!</h2>
                <p class="claim-subtitle">Share your link to unlock your reward</p>
            </div>

            <div class="progress-container">
                <div class="progress-header">
                    <span class="progress-title">Referral Progress</span>
                    <span class="progress-count">
                        <span id="completed-refs">0</span>/<span id="required-refs">${claimData.requiredReferrals}</span>
                    </span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" id="progress-bar" style="width: 0%"></div>
                </div>

                <div class="referral-link-container">
                    <h3 class="progress-title">Your Referral Link</h3>
                    <div class="referral-link-box">
                        <input type="text" class="referral-input" value="${claimData.referralLink}" readonly id="ref-link">
                        <button class="copy-btn" id="copy-btn">COPY</button>
                    </div>
                    <p style="margin-top: 1rem; color: var(--text-dim); text-align: center;">
                        Share this link with your friends. Each unique click counts!
                    </p>
                </div>
            </div>

            <div class="claim-action" id="submit-claim-section" style="display: none;">
                <div class="form-group">
                    <label for="telegram-username">Your Telegram Username</label>
                    <input type="text" id="telegram-username" placeholder="@username" class="referral-input">
                </div>
                <button class="btn btn-primary" id="submit-claim-btn">
                    <span class="btn-text">Submit Claim</span>
                    <span class="btn-glow"></span>
                </button>
            </div>
        `;

        // Copy button
        document.getElementById('copy-btn').addEventListener('click', () => {
            const input = document.getElementById('ref-link');
            input.select();
            document.execCommand('copy');
            
            const btn = document.getElementById('copy-btn');
            btn.textContent = 'COPIED!';
            setTimeout(() => {
                btn.textContent = 'COPY';
            }, 2000);
        });

        // Start polling for progress
        this.pollProgress(claimData.requiredReferrals, claimData.code);
    }

    async pollProgress(requiredReferrals, code) {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch('/api/progress', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessionToken: this.sessionToken,
                        game: this.currentGame.id,
                        amount: this.currentAmount
                    })
                });

                const data = await response.json();

                // Update UI
                document.getElementById('completed-refs').textContent = data.completed;
                document.getElementById('progress-bar').style.width = `${data.progress}%`;

                // Check if goal met
                if (data.goalMet) {
                    clearInterval(pollInterval);
                    document.getElementById('submit-claim-section').style.display = 'block';
                    this.setupSubmitClaim();
                }
            } catch (error) {
                console.error('Error polling progress:', error);
            }
        }, 5000); // Poll every 5 seconds
    }

    setupSubmitClaim() {
        document.getElementById('submit-claim-btn').addEventListener('click', async () => {
            const telegramUsername = document.getElementById('telegram-username').value.trim();

            if (!telegramUsername || !telegramUsername.startsWith('@')) {
                alert('Please enter a valid Telegram username (e.g., @username)');
                return;
            }

            try {
                const response = await fetch('/api/submit-claim', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessionToken: this.sessionToken,
                        game: this.currentGame.id,
                        amount: this.currentAmount,
                        telegramUsername
                    })
                });

                const data = await response.json();

                if (data.success) {
                    alert('🎉 Claim submitted successfully! Our team will contact you on Telegram soon.');
                    this.showView('home');
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                console.error('Error submitting claim:', error);
                alert('Something went wrong. Please try again.');
            }
        });
    }

    async handleAuth() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const isLogin = document.querySelector('.auth-tab.active').dataset.tab === 'login';
        const errorDiv = document.getElementById('auth-error');

        errorDiv.textContent = '';

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                this.sessionToken = data.sessionToken;
                localStorage.setItem('sessionToken', data.sessionToken);
                this.currentUser = data.user;
                this.updateUserButton();
                this.showView('home');
            } else {
                errorDiv.textContent = data.error;
            }
        } catch (error) {
            console.error('Auth error:', error);
            errorDiv.textContent = 'Something went wrong. Please try again.';
        }
    }

    logout() {
        this.currentUser = null;
        this.sessionToken = null;
        localStorage.removeItem('sessionToken');
        location.reload();
    }

    checkReferralCode() {
        const params = new URLSearchParams(window.location.search);
        const refCode = params.get('ref');

        if (refCode) {
            this.trackReferral(refCode);
        }
    }

    async trackReferral(code) {
        try {
            await fetch(`/api/track/${code}`);
            // Show SmartLink for referral traffic
            await this.showSmartLink();
        } catch (error) {
            console.error('Error tracking referral:', error);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LootGlitch();
});
