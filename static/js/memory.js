/**
 * 记忆配对游戏
 */
class MemoryGame {
    constructor() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.gameStarted = false;
        this.timerInterval = null;
        this.startTime = null;

        this.boardElement = document.getElementById('gameBoard');
        this.movesElement = document.getElementById('moves');
        this.pairsElement = document.getElementById('pairs');
        this.timerElement = document.getElementById('timer');

        this.restartBtn = document.getElementById('restartBtn');
        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', () => this.restart());
        }

        this.init();
    }

    init() {
        // 初始化卡片
        const emojis = ['🍎', '🍌', '🍒', '🍓', '🍊', '🍋', '🥝', '🍇'];
        const cardValues = [...emojis, ...emojis]; // 每个表情出现两次，形成配对

        // 洗牌算法
        for (let i = cardValues.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cardValues[i], cardValues[j]] = [cardValues[j], cardValues[i]];
        }

        this.boardElement.innerHTML = '';
        this.cards = [];

        // 创建卡片元素
        cardValues.forEach((value, index) => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.index = index;
            card.dataset.value = value;

            // 背面不显示任何文字，我们将使用CSS的::before伪元素来显示星星
            card.textContent = '';

            card.addEventListener('click', () => this.flipCard(card));
            this.boardElement.appendChild(card);
            this.cards.push(card);
        });

        // 重置游戏状态
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.updateMoves();
        this.updatePairs();
        this.resetTimer();
    }

    flipCard(card) {
        // 如果卡片已经翻开或已匹配，或者已经有两张卡片翻开，则不处理
        if (
            card.classList.contains('flipped') ||
            card.classList.contains('matched') ||
            this.flippedCards.length >= 2
        ) {
            return;
        }

        // 开始计时（第一次翻卡时）
        if (!this.gameStarted) {
            this.startTimer();
            this.gameStarted = true;
        }

        // 翻转卡片
        card.classList.add('flipped');
        card.textContent = card.dataset.value;
        this.flippedCards.push(card);

        // 播放翻牌音效
        playSound('flip');

        // 如果翻开了两张卡片，检查是否匹配
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateMoves();

            const [card1, card2] = this.flippedCards;

            if (card1.dataset.value === card2.dataset.value) {
                // 匹配成功
                setTimeout(() => {
                    card1.classList.add('matched');
                    card2.classList.add('matched');
                    this.flippedCards = [];
                    this.matchedPairs++;
                    this.updatePairs();

                    // 播放匹配音效
                    playSound('match');

                    // 检查游戏是否结束
                    if (this.matchedPairs === 8) {
                        this.gameOver();
                    }
                }, 500);
            } else {
                // 匹配失败，翻回去
                setTimeout(() => {
                    card1.classList.remove('flipped');
                    card2.classList.remove('flipped');
                    card1.textContent = '';
                    card2.textContent = '';
                    this.flippedCards = [];
                }, 1000);
            }
        }
    }

    updateMoves() {
        this.movesElement.textContent = `移动次数: ${this.moves}`;
    }

    updatePairs() {
        this.pairsElement.textContent = `配对数: ${this.matchedPairs}/8`;
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
            const seconds = (elapsedTime % 60).toString().padStart(2, '0');
            this.timerElement.textContent = `用时: ${minutes}:${seconds}`;
        }, 1000);
    }

    resetTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerElement.textContent = '用时: 00:00';
        this.gameStarted = false;
    }

    gameOver() {
        clearInterval(this.timerInterval);

        // 播放胜利音效
        playSound('win');

        // 显示游戏结束信息
        setTimeout(() => {
            const timeText = this.timerElement.textContent.replace('用时: ', '');
            alert(`恭喜！你赢了！\n用时: ${timeText}\n移动次数: ${this.moves}`);
        }, 500);
    }

    restart() {
        this.resetTimer();
        this.init();
    }
}

// 当DOM加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new MemoryGame();
});