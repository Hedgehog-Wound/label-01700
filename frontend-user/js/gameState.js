/**
 * 游戏状态管理模块
 */
import { CONFIG } from './config.js';

/**
 * 初始化游戏状态
 * @returns {Object} 游戏状态对象
 */
export function createGameState() {
    return {
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
}

/**
 * 重置游戏状态
 * @param {Object} gameState - 游戏状态对象
 */
export function resetGameState(gameState) {
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
    gameState.landlordPhase = false;
    gameState.landlord = null;
    gameState.landlordBid = 0;
    gameState.currentBidder = null;
    gameState.bidHistory = [];
    gameState.currentPlayer = null;
    gameState.lastPlayedCards = [];
    gameState.lastPlayer = null;
}
