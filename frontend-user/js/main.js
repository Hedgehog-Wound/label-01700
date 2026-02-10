/**
 * 主入口文件
 * 负责初始化游戏和绑定事件
 */
import { GameController } from './gameLogic.js';
import { showMessage, updateStatusMessage } from './ui.js';

// 创建游戏控制器实例
const gameController = new GameController();

/**
 * 初始化主菜单
 */
function initMainMenu() {
    const mainMenu = document.getElementById('main-menu');
    const gameContainer = document.getElementById('game-container');
    const startGameBtn = document.getElementById('start-game-btn');
    const gameRulesBtn = document.getElementById('game-rules-btn');
    const backToMenuBtn = document.getElementById('back-to-menu-btn');
    const closeRulesBtn = document.getElementById('close-rules-btn');
    
    // 开始游戏
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            if (mainMenu) mainMenu.style.display = 'none';
            if (gameContainer) gameContainer.style.display = 'block';
            gameController.init();
        });
    }
    
    // 显示游戏规则
    if (gameRulesBtn) {
        gameRulesBtn.addEventListener('click', () => {
            const rulesModal = document.getElementById('rules-modal');
            if (rulesModal) {
                rulesModal.style.display = 'flex';
            }
        });
    }
    
    // 关闭游戏规则
    if (closeRulesBtn) {
        closeRulesBtn.addEventListener('click', () => {
            const rulesModal = document.getElementById('rules-modal');
            if (rulesModal) {
                rulesModal.style.display = 'none';
            }
        });
    }
    
    // 返回主菜单
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', () => {
            if (mainMenu) mainMenu.style.display = 'flex';
            if (gameContainer) gameContainer.style.display = 'none';
            gameController.resetGame();
        });
    }
}

/**
 * 初始化游戏事件
 */
function initGameEvents() {
    // 发牌按钮
    const dealBtn = document.getElementById('deal-btn');
    if (dealBtn) {
        dealBtn.addEventListener('click', () => gameController.dealCards());
    }
    
    // 出牌按钮
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', () => gameController.playCards());
    }
    
    // 不要按钮
    const passBtn = document.getElementById('pass-btn');
    if (passBtn) {
        passBtn.addEventListener('click', () => gameController.passTurn());
    }
    
    // 抢地主按钮
    const bidBtn = document.getElementById('bid-landlord-btn');
    if (bidBtn) {
        bidBtn.addEventListener('click', () => gameController.bidLandlord());
    }
    
    // 不抢按钮
    const noBidBtn = document.getElementById('no-bid-btn');
    if (noBidBtn) {
        noBidBtn.addEventListener('click', () => gameController.noBid());
    }
    
    // 作弊询问对话框按钮
    const cheatViewAllBtn = document.getElementById('cheat-view-all-btn');
    const cheatBestCardsBtn = document.getElementById('cheat-best-cards-btn');
    const noCheatBtn = document.getElementById('no-cheat-btn');
    
    if (cheatViewAllBtn) {
        cheatViewAllBtn.addEventListener('click', () => gameController.confirmDeal('view_all'));
    }
    if (cheatBestCardsBtn) {
        cheatBestCardsBtn.addEventListener('click', () => gameController.confirmDeal('best_cards'));
    }
    if (noCheatBtn) {
        noCheatBtn.addEventListener('click', () => gameController.confirmDeal(null));
    }
}

/**
 * 页面加载完成后初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    initMainMenu();
    initGameEvents();
    gameController.init();
});
