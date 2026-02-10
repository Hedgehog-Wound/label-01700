/**
 * AI玩家逻辑模块
 */
import { validateCardType } from './cardValidator.js';

/**
 * AI出牌
 * @param {Object} gameState - 游戏状态
 * @returns {Array|null} 要出的牌，如果不出则返回null
 */
export function aiPlay(gameState) {
    const playerId = gameState.currentPlayer;
    if (playerId !== 'left' && playerId !== 'top') {
        return null;
    }
    
    const aiCards = gameState.players[playerId];
    
    // 如果上家出牌，尝试压过
    if (gameState.lastPlayedCards.length > 0 && gameState.lastPlayer !== playerId) {
        const beatCards = findBeatCards(aiCards, gameState.lastPlayedCards);
        if (beatCards && beatCards.length > 0) {
            return beatCards;
        } else {
            // 不要
            return null;
        }
    }
    
    // 主动出牌：出最小的单张或对子
    if (aiCards.length > 0) {
        // 优先出对子
        for (let i = 0; i < aiCards.length - 1; i++) {
            if (aiCards[i].value === aiCards[i + 1].value) {
                return [aiCards[i], aiCards[i + 1]];
            }
        }
        // 没有对子，出最小的单张
        return [aiCards[0]];
    }
    
    return null;
}

/**
 * 查找能压过上家的牌
 * @param {Array} aiCards - AI的手牌
 * @param {Array} lastCards - 上家的牌
 * @returns {Array|null} 能压过的牌
 */
function findBeatCards(aiCards, lastCards) {
    if (!lastCards || lastCards.length === 0) {
        return null;
    }
    
    const lastCardType = validateCardType(lastCards);
    if (!lastCardType.valid) {
        return null;
    }
    
    // 单张
    if (lastCardType.type === 'single') {
        for (const card of aiCards) {
            if (card.value > lastCards[0].value) {
                return [card];
            }
        }
    }
    
    // 对子
    if (lastCardType.type === 'pair') {
        const value = lastCards[0].value;
        for (let i = 0; i < aiCards.length - 1; i++) {
            if (aiCards[i].value === aiCards[i + 1].value && aiCards[i].value > value) {
                return [aiCards[i], aiCards[i + 1]];
            }
        }
    }
    
    // 三张
    if (lastCardType.type === 'triple') {
        const value = lastCards[0].value;
        for (let i = 0; i < aiCards.length - 2; i++) {
            if (aiCards[i].value === aiCards[i + 1].value && 
                aiCards[i + 1].value === aiCards[i + 2].value && 
                aiCards[i].value > value) {
                return [aiCards[i], aiCards[i + 1], aiCards[i + 2]];
            }
        }
    }
    
    // 三带一
    if (lastCardType.type === 'triple_single') {
        const values = lastCards.map(c => c.value).sort();
        const tripleValue = values[1]; // 三张的值
        for (let i = 0; i < aiCards.length - 2; i++) {
            if (aiCards[i].value === aiCards[i + 1].value && 
                aiCards[i + 1].value === aiCards[i + 2].value && 
                aiCards[i].value > tripleValue) {
                // 找到带的一张牌
                for (let j = 0; j < aiCards.length; j++) {
                    if (j !== i && j !== i + 1 && j !== i + 2) {
                        return [aiCards[i], aiCards[i + 1], aiCards[i + 2], aiCards[j]];
                    }
                }
            }
        }
    }
    
    // 炸弹可以压过任何非炸弹
    const bomb = findBomb(aiCards);
    if (bomb && lastCardType.type !== 'bomb' && lastCardType.type !== 'joker_bomb') {
        return bomb;
    }
    
    // 如果上家是炸弹，只能用更大的炸弹或王炸压过
    if (lastCardType.type === 'bomb') {
        const bomb = findBomb(aiCards);
        if (bomb && bomb.length === 4) {
            const bombValue = bomb[0].value;
            if (bombValue > lastCards[0].value) {
                return bomb;
            }
        }
        // 王炸可以压过任何炸弹
        const jokers = aiCards.filter(c => c.rank === '小王' || c.rank === '大王');
        if (jokers.length === 2) {
            return jokers;
        }
    }
    
    return null;
}

/**
 * 查找炸弹
 * @param {Array} cards - 手牌
 * @returns {Array|null} 炸弹
 */
function findBomb(cards) {
    const cardMap = {};
    cards.forEach(card => {
        if (!cardMap[card.value]) {
            cardMap[card.value] = [];
        }
        cardMap[card.value].push(card);
    });
    
    // 查找四张相同的牌
    for (const value in cardMap) {
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

/**
 * AI叫分
 * @param {Object} gameState - 游戏状态
 * @returns {number} 叫分（0=不抢，1-3=叫分）
 */
export function aiBid(gameState) {
    // AI随机决定叫分或不抢（60%概率叫分）
    const shouldBid = Math.random() > 0.4;
    if (shouldBid && gameState.landlordBid < 3) {
        return gameState.landlordBid + 1;
    }
    return 0;
}
