/**
 * UI显示和交互模块
 */
import { CONFIG } from './config.js';
import { validateCardsUnique } from './card.js';

/**
 * 获取玩家显示名称
 * @param {string} playerId - 玩家ID
 * @returns {string} 玩家显示名称
 */
export function getPlayerName(playerId) {
    const playerNames = {
        'left': '玩家1',
        'top': '玩家2',
        'self': '你'
    };
    return playerNames[playerId] || playerId;
}

/**
 * 更新状态提示
 * @param {string} message - 提示消息
 */
export function updateStatusMessage(message) {
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

/**
 * 显示消息到操作记录
 * @param {string} msg - 消息内容
 */
export function showMessage(msg) {
    const messageArea = document.getElementById('message-area');
    if (!messageArea) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.textContent = msg;
    messageArea.appendChild(messageDiv);
    
    messageArea.scrollTop = messageArea.scrollHeight;
}

/**
 * 显示手牌
 * @param {string} playerId - 玩家ID
 * @param {Array} cards - 手牌数组
 * @param {Object} gameState - 游戏状态
 * @param {Function} onCardClick - 卡片点击回调
 */
export function displayCards(playerId, cards, gameState, onCardClick) {
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
                cardElement.textContent = card.display;
                cardElement.classList.add('small');
            } else {
                cardElement.textContent = '🂠';
                cardElement.classList.add('small');
            }
        } else {
            // 抢地主完成后
            if (playerId === 'self') {
                cardElement.textContent = card.display;
                if (onCardClick) {
                    cardElement.addEventListener('click', () => onCardClick(index));
                }
                if (gameState.selectedCards.includes(index)) {
                    cardElement.classList.add('selected');
                }
            } else {
                cardElement.textContent = '🂠';
                cardElement.classList.add('small');
            }
        }
        
        // 作弊模式：查看所有手牌
        if (gameState.cheatType === 'view_all') {
            cardElement.textContent = card.display;
            if (playerId !== 'self') {
                cardElement.classList.remove('small');
            }
        }
        
        container.appendChild(cardElement);
    });
}

/**
 * 显示底牌
 * @param {Array} bottomCards - 底牌数组
 * @param {Object} gameState - 游戏状态
 */
export function displayBottomCards(bottomCards, gameState) {
    const container = document.getElementById('bottom-cards');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 抢地主阶段显示背面
    if (gameState.landlordPhase && !gameState.landlord) {
        for (let i = 0; i < bottomCards.length; i++) {
            const cardElement = document.createElement('div');
            cardElement.className = 'card small';
            cardElement.textContent = '🂠';
            container.appendChild(cardElement);
        }
    } else if (gameState.landlord) {
        // 抢地主完成后显示底牌
        bottomCards.forEach(card => {
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

/**
 * 显示已出牌
 * @param {Array} playedCards - 已出的牌
 */
export function displayPlayedCards(playedCards) {
    const container = document.getElementById('played-cards');
    if (!container) return;
    
    container.innerHTML = '';
    
    playedCards.forEach(card => {
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

/**
 * 更新手牌数量
 * @param {Object} players - 玩家对象
 * @param {Object} gameState - 游戏状态
 */
export function updateCardCounts(players, gameState) {
    const countLeft = document.getElementById('count-left');
    const countTop = document.getElementById('count-top');
    const countSelf = document.getElementById('count-self');
    
    if (countLeft) countLeft.textContent = players.left.length;
    if (countTop) countTop.textContent = players.top.length;
    if (countSelf) countSelf.textContent = players.self.length;
    
    // 显示地主标识
    const playersList = ['left', 'top', 'self'];
    playersList.forEach(playerId => {
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

/**
 * 更新整个游戏显示
 * @param {Object} gameState - 游戏状态
 * @param {Function} onCardClick - 卡片点击回调
 */
export function updateDisplay(gameState, onCardClick) {
    displayCards('left', gameState.players.left, gameState);
    displayCards('top', gameState.players.top, gameState);
    displayCards('self', gameState.players.self, gameState, onCardClick);
    displayBottomCards(gameState.bottomCards, gameState);
    displayPlayedCards(gameState.lastPlayedCards);
    updateCardCounts(gameState.players, gameState);
}
