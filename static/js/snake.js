class SnakeGame {
    constructor(canvas, scoreElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scoreElement = scoreElement;
        this.gridSize = 20;
        this.tileCount = canvas.width / this.gridSize;
        this.reset();

        // 初始化音效
        this.eatSound = new Audio('static/sounds/place.mp3');
        this.gameOverSound = new Audio('static/sounds/undo.mp3');

        // 安全播放音频的辅助方法
        this.playSound = async (sound) => {
            try {
                await sound.play();
            } catch (error) {
                console.log('音频播放失败:', error);
            }
        };

        // 绑定键盘事件
        document.addEventListener('keydown', this.onKeyPress.bind(this));
    }

    reset() {
        // 蛇的初始位置和方向
        this.snake = [{x: 10, y: 10}];
        this.direction = {x: 0, y: 0};
        this.nextDirection = {x: 0, y: 0};

        // 食物位置
        this.food = this.generateFood();

        // 游戏状态
        this.score = 0;
        this.gameOver = false;
        this.speed = 150;
        this.lastUpdate = 0;

        // 更新分数显示
        this.updateScore();
    }

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        return food;
    }

    update(timestamp) {
        if (this.gameOver) {
            return;
        }

        if (timestamp - this.lastUpdate > this.speed) {
            this.lastUpdate = timestamp;
            this.direction = this.nextDirection;

            // 计算新的蛇头位置
            const head = {
                x: (this.snake[0].x + this.direction.x + this.tileCount) % this.tileCount,
                y: (this.snake[0].y + this.direction.y + this.tileCount) % this.tileCount
            };

            // 检查是否撞到自己
            if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
                this.gameOver = true;
                this.playSound(this.gameOverSound);
                return;
            }

            // 移动蛇
            this.snake.unshift(head);

            // 检查是否吃到食物
            if (head.x === this.food.x && head.y === this.food.y) {
                this.score += 10;
                this.updateScore();
                this.food = this.generateFood();
                this.playSound(this.eatSound);

                // 加快游戏速度
                if (this.speed > 50) {
                    this.speed -= 2;
                }
            } else {
                this.snake.pop();
            }
        }
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i < this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }

        // 绘制食物
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 2,
            this.gridSize - 2
        );

        // 绘制蛇
        this.snake.forEach((segment, index) => {
            // 蛇头使用不同的颜色
            this.ctx.fillStyle = index === 0 ? '#2ecc71' : '#27ae60';
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // 游戏结束显示
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.font = 'bold 30px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏结束!', this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('按空格键重新开始', this.canvas.width / 2, this.canvas.height / 2 + 20);
        }
    }

    updateScore() {
        this.scoreElement.textContent = `分数: ${this.score}`;
    }

    onKeyPress(event) {
        const key = event.key;

        if (this.gameOver && key === ' ') {
            this.reset();
            return;
        }

        // 防止与当前移动方向相反
        switch (key) {
            case 'ArrowUp':
                if (this.direction.y !== 1) {
                    this.nextDirection = {x: 0, y: -1};
                }
                break;
            case 'ArrowDown':
                if (this.direction.y !== -1) {
                    this.nextDirection = {x: 0, y: 1};
                }
                break;
            case 'ArrowLeft':
                if (this.direction.x !== 1) {
                    this.nextDirection = {x: -1, y: 0};
                }
                break;
            case 'ArrowRight':
                if (this.direction.x !== -1) {
                    this.nextDirection = {x: 1, y: 0};
                }
                break;
        }
    }

    gameLoop(timestamp) {
        this.update(timestamp);
        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    start() {
        this.reset();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}