// 扑克牌定义
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
const jokers = ['小王', '大王'];

// 游戏状态
let gameState = {
    deck: [],
    players: {
        left: [],    // 玩家1（AI）
        top: [],     // 玩家2（AI）
        self: []     // 玩家3（用户）
    },
    bottomCards: [],
    playedCards: [],
    selectedCards: [],
    gameStarted: false,
    cheatMode: false,
    cheatType: null, // 作弊类型：'view_all' 或 'best_cards' 或 null
    landlordPhase: false,
    landlord: null,
    landlordBid: 0,
    currentBidder: null,
    bidHistory: [],
    currentPlayer: null, // 当前出牌玩家
    lastPlayedCards: [], // 上次出的牌
    lastPlayer: null // 上次出牌的玩家
};

// 初始化游戏
function initGame() {
    gameState.deck = [];
    gameState.players = {
        left: [],
        top: [],
        self: []
    };
    gameState.bottomCards = [];
    gameState.playedCards = [];
    gameState.selectedCards = [];
    gameState.gameStarted = false;
    gameState.cheatMode = false;
    gameState.cheatType = null;
    gameState.landlordPhase = false;
    gameState.landlord = null;
    gameState.landlordBid = 0;
    gameState.currentBidder = null;
    gameState.bidHistory = [];
    gameState.currentPlayer = null;
    gameState.lastPlayedCards = [];
    gameState.lastPlayer = null;
    
    updateDisplay();
    showMessage('游戏已初始化，点击"发牌"开始游戏');
}

// 创建牌堆
function createDeck() {
    gameState.deck = [];
    
    // 添加普通牌
    for (let suit of suits) {
        for (let rank of ranks) {
            gameState.deck.push({
                suit: suit,
                rank: rank,
                value: getCardValue(rank),
                isRed: suit === '♥' || suit === '♦',
                display: rank + suit
            });
        }
    }
    
    // 添加大小王
    gameState.deck.push({
        suit: '',
        rank: '小王',
        value: 16,
        isRed: false,
        display: '小王'
    });
    gameState.deck.push({
        suit: '',
        rank: '大王',
        value: 17,
        isRed: false,
        display: '大王'
    });
    
    // 洗牌
    shuffleDeck();
}

// 洗牌
function shuffleDeck() {
    for (let i = gameState.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
    }
}

// 获取牌的值（用于比较大小）
function getCardValue(rank) {
    const valueMap = {
        '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15
    };
    return valueMap[rank] || 0;
}

// 发牌
function dealCards() {
    if (gameState.gameStarted) {
        showMessage('游戏已开始，请先重置游戏');
        return;
    }
    
    // 显示作弊询问对话框
    showCheatModal();
}

// 显示作弊询问对话框
function showCheatModal() {
    const modal = document.getElementById('cheat-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// 隐藏作弊询问对话框
function hideCheatModal() {
    const modal = document.getElementById('cheat-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 验证牌的唯一性
function validateCardsUnique(cards, label) {
    const cardMap = new Map();
    const duplicates = [];
    
    cards.forEach((card, index) => {
        const key = `${card.rank}${card.suit}`;
        if (cardMap.has(key)) {
            duplicates.push({ index, card, key });
        } else {
            cardMap.set(key, index);
        }
    });
    
    if (duplicates.length > 0) {
        console.error(`${label} 发现重复的牌:`, duplicates);
        showMessage(`错误：${label} 发现重复的牌！`);
        return false;
    }
    
    return true;
}

// 确认发牌（带作弊选项）
function confirmDeal(cheatType) {
    hideCheatModal();
    
    // 设置作弊类型（一旦设置，本局游戏不能再改变）
    gameState.cheatType = cheatType; // 'view_all' 或 'best_cards' 或 null
    gameState.cheatMode = cheatType !== null;
    
    // 隐藏作弊面板（不再显示）
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
                if (gameState.cheatType === 'view_all') viewAllCards();
            };
        }
        showMessage('作弊模式：查看所有手牌');
    } else if (cheatType === 'best_cards') {
        if (cheatQuickButtons) cheatQuickButtons.style.display = 'flex';
        if (cheatActionBtn) {
            cheatActionBtn.textContent = '获得最好手牌';
            cheatActionBtn.onclick = () => {
                if (gameState.cheatType === 'best_cards') getBestCards();
            };
        }
        showMessage('作弊模式：获得最好手牌');
    } else {
        if (cheatQuickButtons) cheatQuickButtons.style.display = 'none';
        showMessage('正常模式');
    }
    
    // 执行发牌
    createDeck();
    
    // 验证牌堆数量（确保只有54张牌）
    if (gameState.deck.length !== 54) {
        console.error('牌堆数量错误:', gameState.deck.length);
        showMessage('错误：牌堆数量不正确，重新创建');
        createDeck();
        if (gameState.deck.length !== 54) {
            showMessage('严重错误：无法创建正确的牌堆！');
            return;
        }
    }
    
    // 验证牌堆中每张牌的唯一性
    if (!validateCardsUnique(gameState.deck, '牌堆')) {
        showMessage('错误：牌堆中有重复的牌，重新创建');
        createDeck();
    }
    
    gameState.players.left = [];
    gameState.players.top = [];
    gameState.players.self = [];
    gameState.bottomCards = [];
    gameState.selectedCards = [];
    gameState.playedCards = [];
    
    // 斗地主：3个玩家，每人17张，共51张，底牌3张，总共54张
    for (let i = 0; i < 51; i++) {
        if (gameState.deck.length === 0) {
            console.error('发牌时牌堆已空，已发:', i);
            showMessage(`错误：发牌时牌堆已空，已发 ${i} 张`);
            break;
        }
        const card = gameState.deck.pop();
        if (i % 3 === 0) {
            gameState.players.left.push(card);
        } else if (i % 3 === 1) {
            gameState.players.top.push(card);
        } else {
            gameState.players.self.push(card);
        }
    }
    
    // 底牌（3张）
    if (gameState.deck.length < 3) {
        console.error('底牌不足，剩余:', gameState.deck.length);
        showMessage(`错误：底牌不足，剩余 ${gameState.deck.length} 张`);
    }
    gameState.bottomCards = gameState.deck.slice(0, 3);
    gameState.deck = []; // 清空剩余牌堆
    
    // 验证每个玩家的牌数
    if (gameState.players.left.length !== 17 || 
        gameState.players.top.length !== 17 || 
        gameState.players.self.length !== 17) {
        console.error('发牌数量错误:', {
            left: gameState.players.left.length,
            top: gameState.players.top.length,
            self: gameState.players.self.length,
            bottom: gameState.bottomCards.length
        });
        showMessage(`错误：发牌数量不正确 (左:${gameState.players.left.length}, 上:${gameState.players.top.length}, 我:${gameState.players.self.length}, 底:${gameState.bottomCards.length})`);
    }
    
    // 验证每个玩家手牌的唯一性
    validateCardsUnique(gameState.players.left, '玩家1');
    validateCardsUnique(gameState.players.top, '玩家2');
    validateCardsUnique(gameState.players.self, '玩家3');
    validateCardsUnique(gameState.bottomCards, '底牌');
    
    // 验证所有牌加起来是否唯一（检查是否有牌丢失或重复）
    const allCards = [...gameState.players.left, ...gameState.players.top, 
                      ...gameState.players.self, ...gameState.bottomCards];
    if (allCards.length !== 54) {
        console.error('总牌数错误:', allCards.length);
        showMessage(`错误：总牌数不正确，应该是54张，实际是${allCards.length}张`);
    }
    
    if (!validateCardsUnique(allCards, '所有牌')) {
        showMessage('严重错误：发现重复的牌！');
    }
    
    // 排序手牌
    sortCards(gameState.players.left);
    sortCards(gameState.players.top);
    sortCards(gameState.players.self);
    
    gameState.gameStarted = true;
    gameState.landlordPhase = true;
    gameState.landlord = null;
    gameState.landlordBid = 0;
    gameState.currentBidder = 'self'; // 从自己开始叫分
    gameState.bidHistory = [];
    
    updateDisplay();
    enableLandlordControls();
    showMessage('发牌完成！请开始抢地主');
}

// 排序手牌
function sortCards(cards) {
    cards.sort((a, b) => {
        if (a.value !== b.value) {
            return a.value - b.value;
        }
        // 同点数时，红桃>方块>黑桃>梅花
        const suitOrder = { '♥': 4, '♦': 3, '♠': 2, '♣': 1 };
        return (suitOrder[b.suit] || 0) - (suitOrder[a.suit] || 0);
    });
}

// 更新显示
function updateDisplay() {
    displayCards('left', gameState.players.left);
    displayCards('top', gameState.players.top);
    displayCards('self', gameState.players.self);
    displayBottomCards();
    displayPlayedCards();
    updateCardCounts();
}

// 显示手牌
function displayCards(playerId, cards) {
    const container = document.getElementById(`cards-${playerId}`);
    if (!container) return;
    
    container.innerHTML = '';
    
    cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        if (card.isRed) {
            cardElement.classList.add('red');
        } else {
            cardElement.classList.add('black');
        }
        
        // 抢地主阶段：自己的牌显示正面（但不能点击），其他玩家的牌显示背面
        if (gameState.landlordPhase) {
            if (playerId === 'self') {
                // 自己的牌显示正面，但不能点击
                cardElement.textContent = card.display;
                cardElement.classList.add('small'); // 稍微小一点表示不能操作
            } else {
                // AI玩家的牌显示背面
                cardElement.textContent = '🂠';
                cardElement.classList.add('small');
            }
        } else {
            // 抢地主完成后
            if (playerId === 'self') {
                // 自己的牌显示正面，可以点击
                cardElement.textContent = card.display;
                cardElement.addEventListener('click', () => toggleCardSelection(index));
                if (gameState.selectedCards.includes(index)) {
                    cardElement.classList.add('selected');
                }
            } else {
                // AI玩家的牌显示背面
                cardElement.textContent = '🂠';
                cardElement.classList.add('small');
            }
        }
        
        // 作弊模式：查看所有手牌 - 显示所有玩家的牌
        if (gameState.cheatType === 'view_all') {
            if (gameState.landlordPhase) {
                // 抢地主阶段也显示所有玩家的牌
                cardElement.textContent = card.display;
                if (playerId !== 'self') {
                    cardElement.classList.remove('small');
                }
            } else {
                // 抢地主完成后显示所有玩家的牌
                cardElement.textContent = card.display;
                if (playerId !== 'self') {
                    cardElement.classList.remove('small');
                }
            }
        }
        
        container.appendChild(cardElement);
    });
}

// 显示底牌
function displayBottomCards() {
    const container = document.getElementById('bottom-cards');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 抢地主阶段显示背面
    if (gameState.landlordPhase && !gameState.landlord) {
        for (let i = 0; i < gameState.bottomCards.length; i++) {
            const cardElement = document.createElement('div');
            cardElement.className = 'card small';
            cardElement.textContent = '🂠';
            container.appendChild(cardElement);
        }
    } else if (gameState.landlord) {
        // 抢地主完成后显示底牌
        gameState.bottomCards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            if (card.isRed) {
                cardElement.classList.add('red');
            } else {
                cardElement.classList.add('black');
            }
            cardElement.textContent = card.display;
            container.appendChild(cardElement);
        });
    }
}

// 显示已出牌
function displayPlayedCards() {
    const container = document.getElementById('played-cards');
    if (!container) return;
    
    container.innerHTML = '';
    
    gameState.lastPlayedCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        if (card.isRed) {
            cardElement.classList.add('red');
        } else {
            cardElement.classList.add('black');
        }
        cardElement.textContent = card.display;
        container.appendChild(cardElement);
    });
}

// 更新手牌数量
function updateCardCounts() {
    const countLeft = document.getElementById('count-left');
    const countTop = document.getElementById('count-top');
    const countSelf = document.getElementById('count-self');
    
    if (countLeft) countLeft.textContent = gameState.players.left.length;
    if (countTop) countTop.textContent = gameState.players.top.length;
    if (countSelf) countSelf.textContent = gameState.players.self.length;
    
    // 显示地主标识
    const players = ['left', 'top', 'self'];
    players.forEach(playerId => {
        const playerElement = document.getElementById(`player-${playerId}`);
        if (!playerElement) return;
        
        const h3 = playerElement.querySelector('h3');
        if (h3) {
            if (gameState.landlord === playerId) {
                h3.textContent = h3.textContent.replace(' [地主]', '') + ' [地主]';
                playerElement.style.border = '3px solid #ff6b6b';
            } else {
                h3.textContent = h3.textContent.replace(' [地主]', '');
                playerElement.style.border = '';
            }
        }
    });
}

// 切换选牌
function toggleCardSelection(index) {
    if (!gameState.gameStarted || gameState.landlordPhase || gameState.currentPlayer !== 'self') {
        return;
    }
    
    const idx = gameState.selectedCards.indexOf(index);
    if (idx > -1) {
        gameState.selectedCards.splice(idx, 1);
    } else {
        gameState.selectedCards.push(index);
    }
    updateDisplay();
}

// 出牌
function playCards() {
    if (gameState.landlordPhase) {
        showMessage('请先完成抢地主');
        return;
    }
    
    if (gameState.currentPlayer !== 'self') {
        showMessage('不是你的回合');
        return;
    }
    
    if (gameState.selectedCards.length === 0) {
        showMessage('请先选择要出的牌');
        return;
    }
    
    const selectedCards = gameState.selectedCards
        .sort((a, b) => b - a)
        .map(idx => gameState.players.self[idx]);
    
    // 验证牌型
    const cardType = validateCardType(selectedCards);
    if (!cardType.valid) {
        showMessage(cardType.message || '无效的牌型，请重新选择');
        return;
    }
    
    // 检查是否能压过上家
    if (gameState.lastPlayedCards.length > 0 && gameState.lastPlayer !== 'self') {
        if (!canBeat(selectedCards, gameState.lastPlayedCards, cardType)) {
            showMessage('不能压过上家的牌');
            return;
        }
    }
    
    // 移除选中的牌
    gameState.selectedCards
        .sort((a, b) => b - a)
        .forEach(idx => {
            gameState.players.self.splice(idx, 1);
        });
    
    gameState.lastPlayedCards = selectedCards;
    gameState.lastPlayer = 'self';
    gameState.selectedCards = [];
    
    updateDisplay();
    
    if (gameState.players.self.length === 0) {
        showMessage('🎉 恭喜！你赢了！');
        disableControls();
        showNewGameButton();
        return;
    }
    
    showMessage('出牌成功！');
    
    // 切换到下一个玩家
    nextPlayer();
}

// 不要（过）
function passTurn() {
    if (gameState.landlordPhase) {
        return;
    }
    
    if (gameState.currentPlayer !== 'self') {
        showMessage('不是你的回合');
        return;
    }
    
    if (gameState.lastPlayer === 'self' || gameState.lastPlayedCards.length === 0) {
        showMessage('不能跳过，必须出牌');
        return;
    }
    
    showMessage('你选择了"不要"');
    gameState.selectedCards = [];
    updateDisplay();
    
    // 切换到下一个玩家
    nextPlayer();
}

// 下一个玩家
function nextPlayer() {
    const players = ['self', 'left', 'top'];
    const currentIndex = players.indexOf(gameState.currentPlayer);
    const nextIndex = (currentIndex + 1) % players.length;
    gameState.currentPlayer = players[nextIndex];
    
    updateDisplay();
    
    // 如果上家出牌后没人要，清空上次出牌
    if (gameState.lastPlayer === gameState.currentPlayer) {
        gameState.lastPlayedCards = [];
        gameState.lastPlayer = null;
    }
    
    // AI自动出牌
    if (gameState.currentPlayer === 'left' || gameState.currentPlayer === 'top') {
        setTimeout(() => {
            aiPlay();
        }, 1500);
    }
}

// AI出牌
function aiPlay() {
    if (gameState.currentPlayer !== 'left' && gameState.currentPlayer !== 'top') {
        return;
    }
    
    const aiCards = gameState.players[gameState.currentPlayer];
    
    // 如果上家出牌，尝试压过
    if (gameState.lastPlayedCards.length > 0 && gameState.lastPlayer !== gameState.currentPlayer) {
        const beatCards = findBeatCards(aiCards, gameState.lastPlayedCards);
        if (beatCards && beatCards.length > 0) {
            // 出牌压过
            playAICards(beatCards);
            return;
        } else {
            // 不要
            showMessage(`玩家 ${gameState.currentPlayer} 不要`);
            nextPlayer();
            return;
        }
    }
    
    // 主动出牌：出最小的单张或对子
    if (aiCards.length > 0) {
        const playCards = [aiCards[0]]; // 出最小的单张
        playAICards(playCards);
    }
}

// AI出牌
function playAICards(cards) {
    const playerId = gameState.currentPlayer;
    const indices = cards.map(card => {
        return gameState.players[playerId].indexOf(card);
    }).filter(idx => idx !== -1);
    
    indices.sort((a, b) => b - a);
    indices.forEach(idx => {
        gameState.players[playerId].splice(idx, 1);
    });
    
    gameState.lastPlayedCards = cards;
    gameState.lastPlayer = playerId;
    
    showMessage(`玩家 ${playerId} 出牌`);
    updateDisplay();
    
    if (gameState.players[playerId].length === 0) {
        showMessage(`玩家 ${playerId} 赢了！`);
        disableControls();
        showNewGameButton();
        return;
    }
    
    nextPlayer();
}

// 查找能压过上家的牌
function findBeatCards(aiCards, lastCards) {
    // 简化版：找相同数量且更大的牌
    if (lastCards.length === 1) {
        // 单张
        for (let card of aiCards) {
            if (card.value > lastCards[0].value) {
                return [card];
            }
        }
    } else if (lastCards.length === 2 && lastCards[0].value === lastCards[1].value) {
        // 对子
        const value = lastCards[0].value;
        for (let i = 0; i < aiCards.length - 1; i++) {
            if (aiCards[i].value === aiCards[i + 1].value && aiCards[i].value > value) {
                return [aiCards[i], aiCards[i + 1]];
            }
        }
    }
    
    // 炸弹
    const bomb = findBomb(aiCards);
    if (bomb) return bomb;
    
    return null;
}

// 查找炸弹
function findBomb(cards) {
    const cardMap = {};
    cards.forEach(card => {
        if (!cardMap[card.value]) {
            cardMap[card.value] = [];
        }
        cardMap[card.value].push(card);
    });
    
    for (let value in cardMap) {
        if (cardMap[value].length >= 4) {
            return cardMap[value].slice(0, 4);
        }
    }
    
    // 王炸
    const jokers = cards.filter(c => c.rank === '小王' || c.rank === '大王');
    if (jokers.length === 2) {
        return jokers;
    }
    
    return null;
}

// 验证牌型
function validateCardType(cards) {
    if (cards.length === 0) {
        return { valid: false, message: '请选择要出的牌' };
    }
    
    if (cards.length === 1) {
        return { valid: true, type: 'single', value: cards[0].value };
    }
    
    if (cards.length === 2) {
        if (cards[0].value === cards[1].value) {
            return { valid: true, type: 'pair', value: cards[0].value };
        }
        // 王炸
        if ((cards[0].rank === '小王' && cards[1].rank === '大王') ||
            (cards[0].rank === '大王' && cards[1].rank === '小王')) {
            return { valid: true, type: 'joker_bomb', value: 100 };
        }
        return { valid: false, message: '无效的对子' };
    }
    
    if (cards.length === 3) {
        if (cards[0].value === cards[1].value && cards[1].value === cards[2].value) {
            return { valid: true, type: 'triple', value: cards[0].value };
        }
        return { valid: false, message: '无效的三张' };
    }
    
    if (cards.length === 4) {
        const values = cards.map(c => c.value).sort();
        if (values[0] === values[3]) {
            // 炸弹
            return { valid: true, type: 'bomb', value: values[0] };
        }
        if (values[0] === values[2] || values[1] === values[3]) {
            // 三带一
            return { valid: true, type: 'triple_single', value: values[1] };
        }
        return { valid: false, message: '无效的牌型' };
    }
    
    // 更多牌型可以在这里添加
    return { valid: true, type: 'other', value: 0 };
}

// 判断是否能压过
function canBeat(myCards, lastCards, myCardType) {
    const lastCardType = validateCardType(lastCards);
    if (!lastCardType.valid) return true;
    
    // 炸弹可以压过任何非炸弹
    if (myCardType.type === 'bomb' || myCardType.type === 'joker_bomb') {
        if (lastCardType.type !== 'bomb' && lastCardType.type !== 'joker_bomb') {
            return true;
        }
    }
    
    // 王炸最大
    if (myCardType.type === 'joker_bomb') {
        return true;
    }
    
    // 同类型比较
    if (myCardType.type === lastCardType.type && myCards.length === lastCards.length) {
        return myCardType.value > lastCardType.value;
    }
    
    return false;
}

// 抢地主
function bidLandlord() {
    if (!gameState.landlordPhase || gameState.currentBidder !== 'self') {
        return;
    }
    
    const currentBid = gameState.landlordBid;
    if (currentBid < 3) {
        gameState.landlordBid = currentBid + 1;
        gameState.bidHistory.push({ player: 'self', bid: gameState.landlordBid });
        showMessage(`你叫了 ${gameState.landlordBid} 分`);
        nextBidder();
    } else {
        showMessage('已经是最高分了');
    }
}

// 不抢地主
function noBid() {
    if (!gameState.landlordPhase || gameState.currentBidder !== 'self') {
        return;
    }
    
    gameState.bidHistory.push({ player: 'self', bid: 0 });
    showMessage('你不抢');
    nextBidder();
}

// 下一个叫分玩家
function nextBidder() {
    const players = ['self', 'left', 'top'];
    const currentIndex = players.indexOf(gameState.currentBidder);
    const nextIndex = (currentIndex + 1) % players.length;
    gameState.currentBidder = players[nextIndex];
    
    // 如果所有玩家都叫过，确定地主
    if (gameState.bidHistory.length >= 3 && gameState.bidHistory.length % 3 === 0) {
        const hasBid = gameState.bidHistory.some(h => h.bid > 0);
        if (!hasBid) {
            showMessage('没人叫分，重新发牌');
            resetGame();
            setTimeout(() => dealCards(), 500);
            return;
        }
        
        // 找到最后一个叫分的玩家作为地主
        let lastBidder = null;
        let maxBid = 0;
        for (let i = gameState.bidHistory.length - 1; i >= 0; i--) {
            if (gameState.bidHistory[i].bid > maxBid) {
                maxBid = gameState.bidHistory[i].bid;
                lastBidder = gameState.bidHistory[i].player;
            }
        }
        
        if (lastBidder) {
            gameState.landlord = lastBidder;
            gameState.landlordPhase = false;
            
            // 地主获得底牌
            gameState.players[lastBidder].push(...gameState.bottomCards);
            sortCards(gameState.players[lastBidder]);
            
            showMessage(`🎉 玩家 ${lastBidder === 'self' ? '你' : lastBidder} 抢到了地主！获得了底牌`);
            
            updateDisplay();
            disableLandlordControls();
            enableControls();
            
            // 地主先出牌
            gameState.currentPlayer = lastBidder;
            if (gameState.currentPlayer === 'self') {
                showMessage('你是地主，请先出牌');
            } else {
                setTimeout(() => aiPlay(), 1500);
            }
        }
    } else {
        // AI玩家自动叫分
        setTimeout(() => {
            if (gameState.currentBidder === 'left' || gameState.currentBidder === 'top') {
                aiBid();
            }
        }, 1000);
    }
}

// AI叫分
function aiBid() {
    if (!gameState.landlordPhase || gameState.currentBidder === 'self') {
        return;
    }
    
    const shouldBid = Math.random() > 0.4; // 60%概率叫分
    if (shouldBid && gameState.landlordBid < 3) {
        gameState.landlordBid = gameState.landlordBid + 1;
        gameState.bidHistory.push({ player: gameState.currentBidder, bid: gameState.landlordBid });
        showMessage(`玩家 ${gameState.currentBidder} 叫了 ${gameState.landlordBid} 分`);
    } else {
        gameState.bidHistory.push({ player: gameState.currentBidder, bid: 0 });
        showMessage(`玩家 ${gameState.currentBidder} 不抢`);
    }
    
    nextBidder();
}

// 启用抢地主控制按钮
function enableLandlordControls() {
    const bidBtn = document.getElementById('bid-landlord-btn');
    const noBidBtn = document.getElementById('no-bid-btn');
    if (bidBtn) bidBtn.style.display = 'inline-block';
    if (noBidBtn) noBidBtn.style.display = 'inline-block';
    disableControls();
}

// 禁用抢地主控制按钮
function disableLandlordControls() {
    const bidBtn = document.getElementById('bid-landlord-btn');
    const noBidBtn = document.getElementById('no-bid-btn');
    if (bidBtn) bidBtn.style.display = 'none';
    if (noBidBtn) noBidBtn.style.display = 'none';
}

// 启用游戏控制按钮
function enableControls() {
    const playBtn = document.getElementById('play-btn');
    const passBtn = document.getElementById('pass-btn');
    if (playBtn) playBtn.disabled = false;
    if (passBtn) passBtn.disabled = false;
}

// 禁用控制按钮
function disableControls() {
    const playBtn = document.getElementById('play-btn');
    const passBtn = document.getElementById('pass-btn');
    if (playBtn) playBtn.disabled = true;
    if (passBtn) passBtn.disabled = true;
}

// 显示消息（保留所有记录，不自动删除）
function showMessage(msg) {
    const messageArea = document.getElementById('message-area');
    if (!messageArea) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.textContent = msg;
    messageArea.appendChild(messageDiv);
    
    messageArea.scrollTop = messageArea.scrollHeight;
    
    // 不再自动删除消息，保留所有操作记录
}

// ========== 作弊功能 ==========

// 切换作弊面板（仅在作弊模式下可用）
function toggleCheatPanel() {
    if (!gameState.cheatMode) {
        showMessage('作弊功能仅在发牌时开启');
        return;
    }
    
    const panel = document.getElementById('cheat-panel');
    if (!panel) return;
    
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    updateDisplay();
}

// 查看所有玩家手牌
function viewAllCards() {
    if (gameState.cheatType !== 'view_all') {
        showMessage('未选择此作弊方式');
        return;
    }
    updateDisplay();
    showMessage('已显示所有玩家手牌');
}

// 获得最好手牌
function getBestCards() {
    if (gameState.cheatType !== 'best_cards') {
        showMessage('未选择此作弊方式');
        return;
    }
    
    if (!gameState.gameStarted) {
        showMessage('请先发牌');
        return;
    }
    
    // 收集所有牌（但不包括自己的手牌，避免重复）
    const allCards = [...gameState.players.left, ...gameState.players.top, 
                      ...gameState.bottomCards];
    
    // 创建牌的唯一标识映射（使用rank+suit作为唯一键）
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
    
    // 优先选择炸弹（每个点数最多4张）
    for (let value in cardMap) {
        if (cardMap[value].length >= 4) {
            bestCards.push(...cardMap[value].slice(0, 4));
        }
    }
    
    // 添加大小王（最多2张）
    const jokers = uniqueCards.filter(c => c.rank === '小王' || c.rank === '大王');
    bestCards.push(...jokers.slice(0, 2));
    
    // 添加高牌（每个点数最多4张）
    const highValues = [17, 16, 15, 14, 13, 12, 11];
    for (let value of highValues) {
        const cards = uniqueCards.filter(c => c.value === value);
        if (cards.length > 0 && bestCards.length < 17) {
            const needed = Math.min(4, 17 - bestCards.length);
            bestCards.push(...cards.slice(0, needed));
        }
    }
    
    // 如果还不够17张，补充其他牌（每个点数最多4张）
    if (bestCards.length < 17) {
        const usedKeys = new Set(bestCards.map(c => `${c.rank}${c.suit}`));
        const remaining = uniqueCards.filter(c => !usedKeys.has(`${c.rank}${c.suit}`));
        const needed = 17 - bestCards.length;
        bestCards.push(...remaining.slice(0, needed));
    }
    
    // 确保只有17张牌
    gameState.players.self = bestCards.slice(0, 17);
    
    // 验证手牌唯一性
    if (!validateCardsUnique(gameState.players.self, '最好手牌')) {
        showMessage('警告：最好手牌中有重复的牌');
    }
    
    sortCards(gameState.players.self);
    updateDisplay();
    showMessage('已获得最好手牌！');
}

// 清空对手手牌
function clearOpponentCards() {
    if (!gameState.gameStarted) {
        showMessage('请先发牌');
        return;
    }
    
    gameState.players.left = [];
    gameState.players.top = [];
    updateDisplay();
    showMessage('已清空所有对手手牌！');
}

// 添加炸弹
function addBomb() {
    if (!gameState.gameStarted) {
        showMessage('请先发牌');
        return;
    }
    
    const bombCards = [];
    for (let i = 0; i < 4; i++) {
        bombCards.push({
            suit: suits[i % 4],
            rank: '2',
            value: 15,
            isRed: suits[i % 4] === '♥' || suits[i % 4] === '♦',
            display: '2' + suits[i % 4]
        });
    }
    
    gameState.players.self.push(...bombCards);
    sortCards(gameState.players.self);
    updateDisplay();
    showMessage('已添加炸弹（四个2）！');
}

// 显示再来一局按钮
function showNewGameButton() {
    const controls = document.querySelector('.controls');
    if (!controls) return;
    
    // 检查是否已存在按钮
    if (document.getElementById('new-game-btn')) return;
    
    const newGameBtn = document.createElement('button');
    newGameBtn.id = 'new-game-btn';
    newGameBtn.className = 'btn btn-primary';
    newGameBtn.textContent = '再来一局';
    newGameBtn.addEventListener('click', () => {
        newGameBtn.remove();
        resetGame();
    });
    
    controls.appendChild(newGameBtn);
}

// 重置游戏（不清空操作记录）
function resetGame() {
    gameState.deck = [];
    gameState.players = {
        left: [],
        top: [],
        self: []
    };
    gameState.bottomCards = [];
    gameState.playedCards = [];
    gameState.selectedCards = [];
    gameState.gameStarted = false;
    // 注意：不重置作弊模式，保持当前设置
    // gameState.cheatMode = false;
    gameState.landlordPhase = false;
    gameState.landlord = null;
    gameState.landlordBid = 0;
    gameState.currentBidder = null;
    gameState.bidHistory = [];
    gameState.currentPlayer = null;
    gameState.lastPlayedCards = [];
    gameState.lastPlayer = null;
    
    const panel = document.getElementById('cheat-panel');
    if (panel) panel.style.display = 'none';
    
    hideCheatModal();
    
    // 移除再来一局按钮
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) newGameBtn.remove();
    
    // 保持作弊快捷按钮的显示状态
    const cheatQuickButtons = document.getElementById('cheat-quick-buttons');
    const cheatActionBtn = document.getElementById('cheat-action-btn');
    if (gameState.cheatType === 'view_all') {
        if (cheatQuickButtons) cheatQuickButtons.style.display = 'flex';
        if (cheatActionBtn) {
            cheatActionBtn.textContent = '查看所有手牌';
            cheatActionBtn.onclick = () => {
                if (gameState.cheatType === 'view_all') viewAllCards();
            };
        }
    } else if (gameState.cheatType === 'best_cards') {
        if (cheatQuickButtons) cheatQuickButtons.style.display = 'flex';
        if (cheatActionBtn) {
            cheatActionBtn.textContent = '获得最好手牌';
            cheatActionBtn.onclick = () => {
                if (gameState.cheatType === 'best_cards') getBestCards();
            };
        }
    } else {
        if (cheatQuickButtons) cheatQuickButtons.style.display = 'none';
    }
    
    disableControls();
    disableLandlordControls();
    updateDisplay();
    showMessage('========== 新一局开始 ==========');
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    
    const dealBtn = document.getElementById('deal-btn');
    const playBtn = document.getElementById('play-btn');
    const passBtn = document.getElementById('pass-btn');
    const bidBtn = document.getElementById('bid-landlord-btn');
    const noBidBtn = document.getElementById('no-bid-btn');
    
    if (dealBtn) dealBtn.addEventListener('click', dealCards);
    if (playBtn) playBtn.addEventListener('click', playCards);
    if (passBtn) passBtn.addEventListener('click', passTurn);
    if (bidBtn) bidBtn.addEventListener('click', bidLandlord);
    if (noBidBtn) noBidBtn.addEventListener('click', noBid);
    
    // 作弊询问对话框按钮
    const cheatViewAllBtn = document.getElementById('cheat-view-all-btn');
    const cheatBestCardsBtn = document.getElementById('cheat-best-cards-btn');
    const noCheatBtn = document.getElementById('no-cheat-btn');
    
    if (cheatViewAllBtn) cheatViewAllBtn.addEventListener('click', () => confirmDeal('view_all'));
    if (cheatBestCardsBtn) cheatBestCardsBtn.addEventListener('click', () => confirmDeal('best_cards'));
    if (noCheatBtn) noCheatBtn.addEventListener('click', () => confirmDeal(null));
    
    // 作弊功能按钮（面板中的，已废弃，保留以防万一）
    const viewAllBtn = document.getElementById('view-all-cards');
    const getBestBtn = document.getElementById('get-best-cards');
    
    if (viewAllBtn) viewAllBtn.addEventListener('click', () => {
        if (gameState.cheatType === 'view_all') viewAllCards();
        else showMessage('未选择此作弊方式');
    });
    if (getBestBtn) getBestBtn.addEventListener('click', () => {
        if (gameState.cheatType === 'best_cards') getBestCards();
        else showMessage('未选择此作弊方式');
    });
});
