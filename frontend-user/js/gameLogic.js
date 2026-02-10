/**
 * 游戏核心逻辑模块
 */
import { CONFIG } from './config.js';
import { createDeck, shuffleDeck, sortCards, validateCardsUnique } from './card.js';
import { createGameState, resetGameState } from './gameState.js';
import { validateCardType, canBeat } from './cardValidator.js';
import { aiPlay as aiPlayCards, aiBid } from './ai.js';
import { updateDisplay, showMessage, updateStatusMessage, getPlayerName } from './ui.js';

/**
 * 游戏逻辑控制器
 */
export class GameController {
    constructor() {
        this.gameState = createGameState();
        this.onCardClick = null;
    }

    /**
     * 初始化游戏
     */
    init() {
        this.gameState = createGameState();
        updateDisplay(this.gameState, (index) => this.toggleCardSelection(index));
        showMessage('游戏已初始化，点击"发牌"开始游戏');
        updateStatusMessage('等待开始游戏...');
    }

    /**
     * 发牌
     */
    dealCards() {
        if (this.gameState.gameStarted) {
            showMessage('游戏已开始，请先重置游戏');
            return;
        }
        
        // 显示作弊询问对话框
        this.showCheatModal();
    }

    /**
     * 显示作弊询问对话框
     */
    showCheatModal() {
        const modal = document.getElementById('cheat-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    /**
     * 隐藏作弊询问对话框
     */
    hideCheatModal() {
        const modal = document.getElementById('cheat-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 确认发牌（带作弊选项）
     */
    confirmDeal(cheatType) {
        this.hideCheatModal();
        
        // 设置作弊类型
        this.gameState.cheatType = cheatType;
        this.gameState.cheatMode = cheatType !== null;
        
        // 隐藏作弊面板
        const panel = document.getElementById('cheat-panel');
        if (panel) {
            panel.style.display = 'none';
        }
        
        // 显示/隐藏作弊快捷按钮
        const cheatQuickButtons = document.getElementById('cheat-quick-buttons');
        const cheatActionBtn = document.getElementById('cheat-action-btn');
        
        if (cheatType === 'view_all') {
            if (cheatQuickButtons) cheatQuickButtons.style.display = 'flex';
            if (cheatActionBtn) {
                cheatActionBtn.textContent = '查看所有手牌';
                cheatActionBtn.onclick = () => {
                    if (this.gameState.cheatType === 'view_all') this.viewAllCards();
                };
            }
            showMessage('作弊模式：查看所有手牌');
        } else if (cheatType === 'best_cards') {
            if (cheatQuickButtons) cheatQuickButtons.style.display = 'flex';
            if (cheatActionBtn) {
                cheatActionBtn.textContent = '获得最好手牌';
                cheatActionBtn.onclick = () => {
                    if (this.gameState.cheatType === 'best_cards') this.getBestCards();
                };
            }
            showMessage('作弊模式：获得最好手牌');
        } else {
            if (cheatQuickButtons) cheatQuickButtons.style.display = 'none';
            showMessage('正常模式');
        }
        
        // 执行发牌
        this.performDeal();
    }

    /**
     * 执行发牌逻辑
     */
    performDeal() {
        // 创建并洗牌
        let deck = createDeck();
        deck = shuffleDeck(deck);
        
        // 验证牌堆
        if (deck.length !== CONFIG.TOTAL_CARDS) {
            console.error('牌堆数量错误:', deck.length);
            showMessage('错误：牌堆数量不正确，重新创建');
            deck = createDeck();
            deck = shuffleDeck(deck);
            if (deck.length !== CONFIG.TOTAL_CARDS) {
                showMessage('严重错误：无法创建正确的牌堆！');
                return;
            }
        }
        
        // 验证牌堆唯一性
        if (!validateCardsUnique(deck, '牌堆')) {
            showMessage('错误：牌堆中有重复的牌，重新创建');
            deck = createDeck();
            deck = shuffleDeck(deck);
        }
        
        this.gameState.deck = deck;
        this.gameState.players.left = [];
        this.gameState.players.top = [];
        this.gameState.players.self = [];
        this.gameState.bottomCards = [];
        this.gameState.selectedCards = [];
        this.gameState.playedCards = [];
        
        // 发牌给3个玩家
        for (let i = 0; i < CONFIG.CARDS_PER_PLAYER * CONFIG.PLAYERS; i++) {
            if (this.gameState.deck.length === 0) {
                console.error('发牌时牌堆已空，已发:', i);
                showMessage(`错误：发牌时牌堆已空，已发 ${i} 张`);
                break;
            }
            const card = this.gameState.deck.pop();
            if (i % 3 === 0) {
                this.gameState.players.left.push(card);
            } else if (i % 3 === 1) {
                this.gameState.players.top.push(card);
            } else {
                this.gameState.players.self.push(card);
            }
        }
        
        // 底牌
        if (this.gameState.deck.length < CONFIG.BOTTOM_CARDS) {
            console.error('底牌不足，剩余:', this.gameState.deck.length);
            showMessage(`错误：底牌不足，剩余 ${this.gameState.deck.length} 张`);
        }
        this.gameState.bottomCards = this.gameState.deck.slice(0, CONFIG.BOTTOM_CARDS);
        this.gameState.deck = [];
        
        // 验证发牌结果
        this.validateDeal();
        
        // 排序手牌
        sortCards(this.gameState.players.left);
        sortCards(this.gameState.players.top);
        sortCards(this.gameState.players.self);
        
        // 开始抢地主阶段
        this.gameState.gameStarted = true;
        this.gameState.landlordPhase = true;
        this.gameState.landlord = null;
        this.gameState.landlordBid = 0;
        this.gameState.currentBidder = 'self';
        this.gameState.bidHistory = [];
        
        updateDisplay(this.gameState, (index) => this.toggleCardSelection(index));
        this.enableLandlordControls();
        showMessage('发牌完成！请开始抢地主');
        updateStatusMessage('请开始抢地主');
    }

    /**
     * 验证发牌结果
     */
    validateDeal() {
        // 验证每个玩家的牌数
        if (this.gameState.players.left.length !== CONFIG.CARDS_PER_PLAYER || 
            this.gameState.players.top.length !== CONFIG.CARDS_PER_PLAYER || 
            this.gameState.players.self.length !== CONFIG.CARDS_PER_PLAYER) {
            console.error('发牌数量错误:', {
                left: this.gameState.players.left.length,
                top: this.gameState.players.top.length,
                self: this.gameState.players.self.length,
                bottom: this.gameState.bottomCards.length
            });
            showMessage(`错误：发牌数量不正确`);
        }
        
        // 验证唯一性
        validateCardsUnique(this.gameState.players.left, '玩家1');
        validateCardsUnique(this.gameState.players.top, '玩家2');
        validateCardsUnique(this.gameState.players.self, '玩家3');
        validateCardsUnique(this.gameState.bottomCards, '底牌');
        
        // 验证总牌数
        const allCards = [...this.gameState.players.left, ...this.gameState.players.top, 
                          ...this.gameState.players.self, ...this.gameState.bottomCards];
        if (allCards.length !== CONFIG.TOTAL_CARDS) {
            console.error('总牌数错误:', allCards.length);
            showMessage(`错误：总牌数不正确，应该是${CONFIG.TOTAL_CARDS}张，实际是${allCards.length}张`);
        }
        
        if (!validateCardsUnique(allCards, '所有牌')) {
            showMessage('严重错误：发现重复的牌！');
        }
    }

    /**
     * 切换选牌
     */
    toggleCardSelection(index) {
        if (!this.gameState.gameStarted || this.gameState.landlordPhase || 
            this.gameState.currentPlayer !== 'self') {
            return;
        }
        
        const idx = this.gameState.selectedCards.indexOf(index);
        if (idx > -1) {
            this.gameState.selectedCards.splice(idx, 1);
        } else {
            this.gameState.selectedCards.push(index);
        }
        updateDisplay(this.gameState, (index) => this.toggleCardSelection(index));
    }

    /**
     * 出牌
     */
    playCards() {
        if (this.gameState.landlordPhase) {
            showMessage('请先完成抢地主');
            updateStatusMessage('请先完成抢地主');
            return;
        }
        
        if (this.gameState.currentPlayer !== 'self') {
            showMessage('不是你的回合');
            return;
        }
        
        if (this.gameState.selectedCards.length === 0) {
            showMessage('请先选择要出的牌');
            updateStatusMessage('请先选择要出的牌');
            return;
        }
        
        const selectedCards = this.gameState.selectedCards
            .sort((a, b) => b - a)
            .map(idx => this.gameState.players.self[idx]);
        
        // 验证牌型
        const cardType = validateCardType(selectedCards);
        if (!cardType.valid) {
            showMessage(cardType.message || '无效的牌型，请重新选择');
            updateStatusMessage(cardType.message || '无效的牌型');
            return;
        }
        
        // 检查是否能压过
        if (this.gameState.lastPlayedCards.length > 0 && this.gameState.lastPlayer !== 'self') {
            if (!canBeat(selectedCards, this.gameState.lastPlayedCards, cardType)) {
                showMessage('不能压过上家的牌');
                updateStatusMessage('不能压过上家的牌');
                return;
            }
        }
        
        // 移除选中的牌
        this.gameState.selectedCards
            .sort((a, b) => b - a)
            .forEach(idx => {
                this.gameState.players.self.splice(idx, 1);
            });
        
        this.gameState.lastPlayedCards = selectedCards;
        this.gameState.lastPlayer = 'self';
        this.gameState.selectedCards = [];
        
        updateDisplay(this.gameState, (index) => this.toggleCardSelection(index));
        
        if (this.gameState.players.self.length === 0) {
            showMessage('🎉 恭喜！你赢了！');
            updateStatusMessage('🎉 恭喜！你赢了！');
            this.disableControls();
            this.showNewGameButton();
            return;
        }
        
        showMessage('出牌成功！');
        updateStatusMessage('出牌成功！等待其他玩家...');
        
        // 切换到下一个玩家
        this.nextPlayer();
    }

    /**
     * 不要（过）
     */
    passTurn() {
        if (this.gameState.landlordPhase) {
            return;
        }
        
        if (this.gameState.currentPlayer !== 'self') {
            showMessage('不是你的回合');
            return;
        }
        
        if (this.gameState.lastPlayer === 'self' || this.gameState.lastPlayedCards.length === 0) {
            showMessage('不能跳过，必须出牌');
            updateStatusMessage('不能跳过，必须出牌');
            return;
        }
        
        showMessage('你选择了"不要"');
        updateStatusMessage('你选择了"不要"');
        this.gameState.selectedCards = [];
        updateDisplay(this.gameState, (index) => this.toggleCardSelection(index));
        
        // 切换到下一个玩家
        this.nextPlayer();
    }

    /**
     * 下一个玩家
     */
    nextPlayer() {
        const players = ['self', 'left', 'top'];
        const currentIndex = players.indexOf(this.gameState.currentPlayer);
        const nextIndex = (currentIndex + 1) % players.length;
        this.gameState.currentPlayer = players[nextIndex];
        
        updateDisplay(this.gameState, (index) => this.toggleCardSelection(index));
        
        // 如果上家出牌后没人要，清空上次出牌
        if (this.gameState.lastPlayer === this.gameState.currentPlayer) {
            this.gameState.lastPlayedCards = [];
            this.gameState.lastPlayer = null;
        }
        
        // 更新状态提示
        if (this.gameState.currentPlayer === 'self') {
            updateStatusMessage('轮到你了，请选择要出的牌');
        } else {
            updateStatusMessage(`等待玩家 ${this.gameState.currentPlayer} 出牌...`);
        }
        
        // AI自动出牌
        if (this.gameState.currentPlayer === 'left' || this.gameState.currentPlayer === 'top') {
            setTimeout(() => {
                this.aiPlay();
            }, 1500);
        }
    }

    /**
     * AI出牌
     */
    aiPlay() {
        const cards = aiPlayCards(this.gameState);
        if (cards && cards.length > 0) {
            this.playAICards(cards);
        } else {
            const playerName = getPlayerName(this.gameState.currentPlayer);
            showMessage(`${playerName} 不要`);
            updateStatusMessage(`${playerName} 不要`);
            this.nextPlayer();
        }
    }

    /**
     * AI出牌执行
     */
    playAICards(cards) {
        const playerId = this.gameState.currentPlayer;
        const indices = cards.map(card => {
            return this.gameState.players[playerId].indexOf(card);
        }).filter(idx => idx !== -1);
        
        indices.sort((a, b) => b - a);
        indices.forEach(idx => {
            this.gameState.players[playerId].splice(idx, 1);
        });
        
        this.gameState.lastPlayedCards = cards;
        this.gameState.lastPlayer = playerId;
        
        const playerName = getPlayerName(playerId);
        showMessage(`${playerName} 出牌`);
        updateStatusMessage(`${playerName} 出牌`);
        updateDisplay(this.gameState, (index) => this.toggleCardSelection(index));
        
        if (this.gameState.players[playerId].length === 0) {
            showMessage(`${playerName} 赢了！`);
            updateStatusMessage(`${playerName} 赢了！`);
            this.disableControls();
            this.showNewGameButton();
            return;
        }
        
        this.nextPlayer();
    }

    /**
     * 抢地主
     */
    bidLandlord() {
        if (!this.gameState.landlordPhase || this.gameState.currentBidder !== 'self') {
            return;
        }
        
        const currentBid = this.gameState.landlordBid;
        if (currentBid < 3) {
            this.gameState.landlordBid = currentBid + 1;
            this.gameState.bidHistory.push({ player: 'self', bid: this.gameState.landlordBid });
            showMessage(`你叫了 ${this.gameState.landlordBid} 分`);
            updateStatusMessage(`你叫了 ${this.gameState.landlordBid} 分`);
            this.nextBidder();
        } else {
            showMessage('已经是最高分了');
        }
    }

    /**
     * 不抢地主
     */
    noBid() {
        if (!this.gameState.landlordPhase || this.gameState.currentBidder !== 'self') {
            return;
        }
        
        this.gameState.bidHistory.push({ player: 'self', bid: 0 });
        showMessage('你不抢');
        updateStatusMessage('你不抢');
        this.nextBidder();
    }

    /**
     * 下一个叫分玩家
     */
    nextBidder() {
        const players = ['self', 'left', 'top'];
        const currentIndex = players.indexOf(this.gameState.currentBidder);
        const nextIndex = (currentIndex + 1) % players.length;
        this.gameState.currentBidder = players[nextIndex];
        
        // 如果所有玩家都叫过，确定地主
        if (this.gameState.bidHistory.length >= 3 && this.gameState.bidHistory.length % 3 === 0) {
            const hasBid = this.gameState.bidHistory.some(h => h.bid > 0);
            if (!hasBid) {
                showMessage('没人叫分，重新发牌');
                this.resetGame();
                setTimeout(() => this.dealCards(), 500);
                return;
            }
            
            // 找到最后一个叫分的玩家作为地主
            let lastBidder = null;
            let maxBid = 0;
            for (let i = this.gameState.bidHistory.length - 1; i >= 0; i--) {
                if (this.gameState.bidHistory[i].bid > maxBid) {
                    maxBid = this.gameState.bidHistory[i].bid;
                    lastBidder = this.gameState.bidHistory[i].player;
                }
            }
            
            if (lastBidder) {
                this.gameState.landlord = lastBidder;
                this.gameState.landlordPhase = false;
                
                // 地主获得底牌
                this.gameState.players[lastBidder].push(...this.gameState.bottomCards);
                sortCards(this.gameState.players[lastBidder]);
                
                const landlordName = getPlayerName(lastBidder);
                showMessage(`🎉 ${landlordName} 抢到了地主！获得了底牌`);
                updateStatusMessage(`${landlordName} 是地主，开始出牌`);
                
                updateDisplay(this.gameState, (index) => this.toggleCardSelection(index));
                this.disableLandlordControls();
                this.enableControls();
                
                // 地主先出牌
                this.gameState.currentPlayer = lastBidder;
                if (this.gameState.currentPlayer === 'self') {
                    updateStatusMessage('你是地主，请先出牌');
                } else {
                    updateStatusMessage(`${landlordName} 是地主，等待出牌...`);
                    setTimeout(() => this.aiPlay(), 1500);
                }
            }
        } else {
            // AI玩家自动叫分
            if (this.gameState.currentBidder === 'left' || this.gameState.currentBidder === 'top') {
                setTimeout(() => {
                    const bid = aiBid(this.gameState);
                    const bidderName = getPlayerName(this.gameState.currentBidder);
                    if (bid > 0) {
                        this.gameState.landlordBid = bid;
                        this.gameState.bidHistory.push({ player: this.gameState.currentBidder, bid: bid });
                        showMessage(`${bidderName} 叫了 ${bid} 分`);
                        updateStatusMessage(`${bidderName} 叫了 ${bid} 分`);
                    } else {
                        this.gameState.bidHistory.push({ player: this.gameState.currentBidder, bid: 0 });
                        showMessage(`${bidderName} 不抢`);
                        updateStatusMessage(`${bidderName} 不抢`);
                    }
                    this.nextBidder();
                }, 1000);
            } else {
                updateStatusMessage('请选择是否抢地主');
            }
        }
    }

    /**
     * 查看所有手牌（作弊功能）
     */
    viewAllCards() {
        if (this.gameState.cheatType !== 'view_all') {
            showMessage('未选择此作弊方式');
            return;
        }
        updateDisplay(this.gameState, (index) => this.toggleCardSelection(index));
        showMessage('已显示所有玩家手牌');
    }

    /**
     * 获得最好手牌（作弊功能）
     */
    getBestCards() {
        if (this.gameState.cheatType !== 'best_cards') {
            showMessage('未选择此作弊方式');
            return;
        }
        
        if (!this.gameState.gameStarted) {
            showMessage('请先发牌');
            return;
        }
        
        // 收集所有牌（但不包括自己的手牌，避免重复）
        const allCards = [...this.gameState.players.left, ...this.gameState.players.top, 
                          ...this.gameState.bottomCards];
        
        // 创建牌的唯一标识映射
        const cardKeyMap = new Map();
        allCards.forEach(card => {
            const key = `${card.rank}${card.suit}`;
            if (!cardKeyMap.has(key)) {
                cardKeyMap.set(key, card);
            }
        });
        
        // 从唯一牌中构建最好手牌
        const uniqueCards = Array.from(cardKeyMap.values());
        const bestCards = [];
        const cardMap = {};
        
        uniqueCards.forEach(card => {
            if (!cardMap[card.value]) {
                cardMap[card.value] = [];
            }
            cardMap[card.value].push(card);
        });
        
        // 优先选择炸弹
        for (const value in cardMap) {
            if (cardMap[value].length >= 4) {
                bestCards.push(...cardMap[value].slice(0, 4));
            }
        }
        
        // 添加大小王
        const jokers = uniqueCards.filter(c => c.rank === '小王' || c.rank === '大王');
        bestCards.push(...jokers.slice(0, 2));
        
        // 添加高牌
        const highValues = [17, 16, 15, 14, 13, 12, 11];
        for (const value of highValues) {
            const cards = uniqueCards.filter(c => c.value === value);
            if (cards.length > 0 && bestCards.length < CONFIG.CARDS_PER_PLAYER) {
                const needed = Math.min(4, CONFIG.CARDS_PER_PLAYER - bestCards.length);
                bestCards.push(...cards.slice(0, needed));
            }
        }
        
        // 如果还不够，补充其他牌
        if (bestCards.length < CONFIG.CARDS_PER_PLAYER) {
            const usedKeys = new Set(bestCards.map(c => `${c.rank}${c.suit}`));
            const remaining = uniqueCards.filter(c => !usedKeys.has(`${c.rank}${c.suit}`));
            const needed = CONFIG.CARDS_PER_PLAYER - bestCards.length;
            bestCards.push(...remaining.slice(0, needed));
        }
        
        this.gameState.players.self = bestCards.slice(0, CONFIG.CARDS_PER_PLAYER);
        
        // 验证手牌唯一性
        if (!validateCardsUnique(this.gameState.players.self, '最好手牌')) {
            showMessage('警告：最好手牌中有重复的牌');
        }
        
        sortCards(this.gameState.players.self);
        updateDisplay(this.gameState, (index) => this.toggleCardSelection(index));
        showMessage('已获得最好手牌！');
    }

    /**
     * 启用抢地主控制按钮
     */
    enableLandlordControls() {
        const bidBtn = document.getElementById('bid-landlord-btn');
        const noBidBtn = document.getElementById('no-bid-btn');
        if (bidBtn) bidBtn.style.display = 'inline-block';
        if (noBidBtn) noBidBtn.style.display = 'inline-block';
        this.disableControls();
    }

    /**
     * 禁用抢地主控制按钮
     */
    disableLandlordControls() {
        const bidBtn = document.getElementById('bid-landlord-btn');
        const noBidBtn = document.getElementById('no-bid-btn');
        if (bidBtn) bidBtn.style.display = 'none';
        if (noBidBtn) noBidBtn.style.display = 'none';
    }

    /**
     * 启用游戏控制按钮
     */
    enableControls() {
        const playBtn = document.getElementById('play-btn');
        const passBtn = document.getElementById('pass-btn');
        if (playBtn) playBtn.disabled = false;
        if (passBtn) passBtn.disabled = false;
    }

    /**
     * 禁用控制按钮
     */
    disableControls() {
        const playBtn = document.getElementById('play-btn');
        const passBtn = document.getElementById('pass-btn');
        if (playBtn) playBtn.disabled = true;
        if (passBtn) passBtn.disabled = true;
    }

    /**
     * 显示再来一局按钮
     */
    showNewGameButton() {
        const controls = document.querySelector('.controls');
        if (!controls) return;
        
        if (document.getElementById('new-game-btn')) return;
        
        const newGameBtn = document.createElement('button');
        newGameBtn.id = 'new-game-btn';
        newGameBtn.className = 'btn btn-primary';
        newGameBtn.textContent = '再来一局';
        newGameBtn.addEventListener('click', () => {
            newGameBtn.remove();
            this.resetGame();
        });
        
        controls.appendChild(newGameBtn);
    }

    /**
     * 重置游戏
     */
    resetGame() {
        // 保持作弊设置
        const cheatType = this.gameState.cheatType;
        resetGameState(this.gameState);
        this.gameState.cheatType = cheatType;
        this.gameState.cheatMode = cheatType !== null;
        
        const panel = document.getElementById('cheat-panel');
        if (panel) panel.style.display = 'none';
        
        this.hideCheatModal();
        
        // 保持作弊快捷按钮的显示状态
        const cheatQuickButtons = document.getElementById('cheat-quick-buttons');
        const cheatActionBtn = document.getElementById('cheat-action-btn');
        if (cheatType === 'view_all') {
            if (cheatQuickButtons) cheatQuickButtons.style.display = 'flex';
            if (cheatActionBtn) {
                cheatActionBtn.textContent = '查看所有手牌';
                cheatActionBtn.onclick = () => {
                    if (this.gameState.cheatType === 'view_all') this.viewAllCards();
                };
            }
        } else if (cheatType === 'best_cards') {
            if (cheatQuickButtons) cheatQuickButtons.style.display = 'flex';
            if (cheatActionBtn) {
                cheatActionBtn.textContent = '获得最好手牌';
                cheatActionBtn.onclick = () => {
                    if (this.gameState.cheatType === 'best_cards') this.getBestCards();
                };
            }
        } else {
            if (cheatQuickButtons) cheatQuickButtons.style.display = 'none';
        }
        
        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) newGameBtn.remove();
        
        this.disableControls();
        this.disableLandlordControls();
        updateDisplay(this.gameState, (index) => this.toggleCardSelection(index));
        showMessage('========== 新一局开始 ==========');
        updateStatusMessage('等待开始游戏...');
    }
}
