/**
 * 牌型验证模块
 */

/**
 * 验证牌型
 * @param {Array} cards - 要验证的牌
 * @returns {Object} {valid: boolean, type: string, value: number, message: string}
 */
export function validateCardType(cards) {
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

/**
 * 判断是否能压过
 * @param {Array} myCards - 我的牌
 * @param {Array} lastCards - 上家的牌
 * @param {Object} myCardType - 我的牌型
 * @returns {boolean} 是否能压过
 */
export function canBeat(myCards, lastCards, myCardType) {
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
