/**
 * 扑克牌功能测试
 */
import { createDeck, shuffleDeck, sortCards, validateCardsUnique } from '../card.js';
import { CONFIG } from '../config.js';

/**
 * 测试创建牌堆
 */
export function testCreateDeck() {
    const deck = createDeck();
    console.assert(deck.length === CONFIG.TOTAL_CARDS, '牌堆应该有54张牌');
    console.assert(validateCardsUnique(deck, '测试牌堆'), '牌堆中每张牌应该唯一');
    console.log('✓ 创建牌堆测试通过');
}

/**
 * 测试洗牌
 */
export function testShuffleDeck() {
    const deck1 = createDeck();
    const deck2 = createDeck();
    const shuffled1 = shuffleDeck([...deck1]);
    const shuffled2 = shuffleDeck([...deck2]);
    
    console.assert(shuffled1.length === CONFIG.TOTAL_CARDS, '洗牌后应该有54张牌');
    console.assert(validateCardsUnique(shuffled1, '洗牌后牌堆'), '洗牌后每张牌应该唯一');
    console.log('✓ 洗牌测试通过');
}

/**
 * 测试排序
 */
export function testSortCards() {
    const deck = createDeck();
    const shuffled = shuffleDeck([...deck]);
    const sorted = sortCards([...shuffled.slice(0, 10)]);
    
    console.assert(sorted.length === 10, '排序后应该有10张牌');
    for (let i = 0; i < sorted.length - 1; i++) {
        console.assert(sorted[i].value <= sorted[i + 1].value, '排序后应该按值递增');
    }
    console.log('✓ 排序测试通过');
}

// 运行测试
if (typeof window === 'undefined') {
    testCreateDeck();
    testShuffleDeck();
    testSortCards();
}
