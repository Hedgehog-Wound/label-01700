/**
 * 扑克牌相关功能模块
 */
import { CONFIG } from './config.js';

/**
 * 创建一副完整的牌堆（54张）
 * @returns {Array} 牌堆数组
 */
export function createDeck() {
    const deck = [];
    
    // 添加普通牌（52张）
    for (const suit of CONFIG.SUITS) {
        for (const rank of CONFIG.RANKS) {
            deck.push({
                suit: suit,
                rank: rank,
                value: CONFIG.CARD_VALUES[rank],
                isRed: suit === '♥' || suit === '♦',
                display: rank + suit
            });
        }
    }
    
    // 添加大小王
    deck.push({
        suit: '',
        rank: '小王',
        value: 16,
        isRed: false,
        display: '小王'
    });
    deck.push({
        suit: '',
        rank: '大王',
        value: 17,
        isRed: false,
        display: '大王'
    });
    
    return deck;
}

/**
 * 洗牌（Fisher-Yates算法）
 * @param {Array} deck - 牌堆
 * @returns {Array} 洗好的牌堆
 */
export function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * 排序手牌
 * @param {Array} cards - 手牌数组
 * @returns {Array} 排序后的手牌
 */
export function sortCards(cards) {
    return cards.sort((a, b) => {
        if (a.value !== b.value) {
            return a.value - b.value;
        }
        // 同点数时，按花色排序
        return (CONFIG.SUIT_ORDER[b.suit] || 0) - (CONFIG.SUIT_ORDER[a.suit] || 0);
    });
}

/**
 * 验证牌的唯一性
 * @param {Array} cards - 牌数组
 * @param {string} label - 标签（用于错误提示）
 * @returns {boolean} 是否唯一
 */
export function validateCardsUnique(cards, label) {
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
        return false;
    }
    
    return true;
}
