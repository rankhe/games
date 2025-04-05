class GomokuGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 15; // 15x15棋盘
        this.cellSize = 30;
        this.boardPadding = 20;
        this.currentPlayer = 'black'; // 黑子先行
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.gameOver = false;
        this.socket = io();
        this.moveHistory = []; // 记录移动历史

        // 初始化画布大小
        this.canvas.width = this.cellSize * this.boardSize + this.boardPadding * 2;
        this.canvas.height = this.canvas.width;

        // 绑定事件
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.socket.on('move_response', this.handleMoveResponse.bind(this));
        this.socket.on('restart_response', this.restart.bind(this));
        this.socket.on('undo_response', this.handleUndo.bind(this));
        this.socket.on('game_state', this.handleGameState.bind(this));

        // 加入游戏
        this.socket.emit('join_game', { game_id: 'default' });
        console.log('Joining game...');

        // 初始绘制棋盘
        this.drawBoard();
    }

    drawBoard() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制棋盘背景
        this.ctx.fillStyle = '#f8c37d';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格线
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;

        for (let i = 0; i < this.boardSize; i++) {
            // 横线
            this.ctx.beginPath();
            this.ctx.moveTo(this.boardPadding, this.boardPadding + i * this.cellSize);
            this.ctx.lineTo(this.canvas.width - this.boardPadding, this.boardPadding + i * this.cellSize);
            this.ctx.stroke();

            // 竖线
            this.ctx.beginPath();
            this.ctx.moveTo(this.boardPadding + i * this.cellSize, this.boardPadding);
            this.ctx.lineTo(this.boardPadding + i * this.cellSize, this.canvas.height - this.boardPadding);
            this.ctx.stroke();
        }

        // 绘制五个小黑点（天元和四星）
        const starPoints = [
            {x: 3, y: 3}, {x: 11, y: 3},
            {x: 7, y: 7},  // 天元
            {x: 3, y: 11}, {x: 11, y: 11}
        ];

        starPoints.forEach(point => {
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(
                this.boardPadding + point.x * this.cellSize,
                this.boardPadding + point.y * this.cellSize,
                4, 0, Math.PI * 2
            );
            this.ctx.fill();
        });

        // 绘制所有已落子
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j]) {
                    this.drawPiece(j, i, this.board[i][j]);
                }
            }
        }

        // 标记最后一手棋
        if (this.moveHistory.length > 0) {
            const lastMove = this.moveHistory[this.moveHistory.length - 1];
            this.markLastMove(lastMove.x, lastMove.y);
        }
    }

    drawPiece(x, y, color) {
        const posX = this.boardPadding + x * this.cellSize;
        const posY = this.boardPadding + y * this.cellSize;

        this.ctx.fillStyle = color === 'black' ? '#000' : '#fff';
        this.ctx.beginPath();
        this.ctx.arc(posX, posY, this.cellSize / 2 - 2, 0, Math.PI * 2);
        this.ctx.fill();

        // 白子加黑边
        if (color === 'white') {
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(posX, posY, this.cellSize / 2 - 2, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    markLastMove(x, y) {
        const posX = this.boardPadding + x * this.cellSize;
        const posY = this.boardPadding + y * this.cellSize;

        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;

        // 绘制小方框标记
        const markSize = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(posX - markSize, posY - markSize);
        this.ctx.lineTo(posX + markSize, posY - markSize);
        this.ctx.lineTo(posX + markSize, posY + markSize);
        this.ctx.lineTo(posX - markSize, posY + markSize);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    getBoardPosition(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((clientX - rect.left - this.boardPadding + this.cellSize / 2) / this.cellSize);
        const y = Math.floor((clientY - rect.top - this.boardPadding + this.cellSize / 2) / this.cellSize);

        if (x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize) {
            return { x, y };
        }

        return null;
    }

    handleGameState(gameState) {
        console.log('Received game state:', gameState);
        this.currentPlayer = gameState.current_player;

        // 恢复之前的所有移动
        if (gameState.moves) {
            gameState.moves.forEach(move => {
                this.board[move.y][move.x] = move.color;
                this.moveHistory.push(move);
            });
            this.drawBoard();
        }
    }

    handleClick(event) {
        if (this.gameOver) return;

        const pos = this.getBoardPosition(event.clientX, event.clientY);
        if (!pos) return;

        // 如果该位置已经有棋子，不允许落子
        if (this.board[pos.y][pos.x]) return;

        console.log('Attempting move:', pos.x, pos.y, this.currentPlayer);

        // 发送落子信息到服务器
        this.socket.emit('move', {
            x: pos.x,
            y: pos.y,
            color: this.currentPlayer,
            game_id: 'default'  // 添加游戏ID
        });
        console.log('Sent move to server:', pos.x, pos.y, this.currentPlayer);
    }

    handleMoveResponse(data) {
        const { x, y, color } = data;

        // 更新棋盘状态
        this.board[y][x] = color;

        // 记录移动历史
        this.moveHistory.push({ x, y, color });

        // 播放落子音效
        playSound('place');

        // 重绘棋盘
        this.drawBoard();

        // 检查是否获胜
        if (this.checkWin(x, y, color)) {
            this.gameOver = true;
            // 播放获胜音效
            playSound('win');
            setTimeout(() => {
                alert(`${color === 'black' ? '黑子' : '白子'}获胜！`);
                // 发送游戏结束事件
                this.socket.emit('game_over', {
                    winner_id: data.player_id
                });
            }, 100);
            return;
        }

        // 切换当前玩家
        this.currentPlayer = color === 'black' ? 'white' : 'black';
    }

    handleUndo() {
        if (this.moveHistory.length === 0) return;

        // 播放悔棋音效
        playSound('undo');

        // 移除最后一手棋
        const lastMove = this.moveHistory.pop();
        this.board[lastMove.y][lastMove.x] = null;

        // 切换当前玩家为被移除的那一步的颜色（与服务器同步）
        this.currentPlayer = lastMove.color;

        // 重绘棋盘
        this.drawBoard();

        console.log('Undo completed, current player:', this.currentPlayer);
    }

    checkWin(x, y, color) {
        const directions = [
            {dx: 1, dy: 0},  // 水平
            {dx: 0, dy: 1},  // 垂直
            {dx: 1, dy: 1},  // 右下对角线
            {dx: 1, dy: -1}  // 右上对角线
        ];

        for (const dir of directions) {
            let count = 1;  // 当前位置已经有一个棋子

            // 正向检查
            for (let i = 1; i <= 4; i++) {
                const nx = x + dir.dx * i;
                const ny = y + dir.dy * i;

                if (nx < 0 || nx >= this.boardSize || ny < 0 || ny >= this.boardSize) break;
                if (this.board[ny][nx] !== color) break;

                count++;
            }

            // 反向检查
            for (let i = 1; i <= 4; i++) {
                const nx = x - dir.dx * i;
                const ny = y - dir.dy * i;

                if (nx < 0 || nx >= this.boardSize || ny < 0 || ny >= this.boardSize) break;
                if (this.board[ny][nx] !== color) break;

                count++;
            }

            if (count >= 5) return true;
        }

        return false;
    }

    restart() {
        // 重置游戏状态
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.moveHistory = [];

        // 重绘棋盘
        this.drawBoard();
    }
}

// 初始化游戏
const game = new GomokuGame('gameCanvas');

// 悔棋功能
function requestUndo() {
    game.socket.emit('undo_request');
}

// 重新开始功能
function requestRestart() {
    game.socket.emit('restart');
}