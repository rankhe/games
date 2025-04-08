// 游戏常量
const TILE_SIZE = 16;
const CANVAS_WIDTH = 416;
const CANVAS_HEIGHT = 416;
const GRID_WIDTH = CANVAS_WIDTH / TILE_SIZE;
const GRID_HEIGHT = CANVAS_HEIGHT / TILE_SIZE;
const SCALE = 2; // 增加缩放因子以提高清晰度

// 获取画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 获取 DOM 元素
const levelElement = document.getElementById('level');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const enemiesElement = document.getElementById('enemies');
const startButton = document.getElementById('startButton');

// 游戏变量
let player;
let enemyTanks = [];
let bullets = [];
let walls = [];
let gameStarted = false;
let level = 1;
let score = 0;
let lives = 3;
let enemies = 20;
let lastEnemySpawnTime = 0;
const ENEMY_SPAWN_INTERVAL = 3000; // 敌方坦克生成间隔（毫秒）

// 玩家坦克类
class Tank {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.direction = 'up';
        this.speed = 2;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, TILE_SIZE, TILE_SIZE);
        // 绘制炮管
        ctx.fillStyle = 'black';
        switch (this.direction) {
            case 'up':
                ctx.fillRect(this.x + 6, this.y - 4, 4, 8);
                break;
            case 'down':
                ctx.fillRect(this.x + 6, this.y + TILE_SIZE - 4, 4, 8);
                break;
            case 'left':
                ctx.fillRect(this.x - 4, this.y + 6, 8, 4);
                break;
            case 'right':
                ctx.fillRect(this.x + TILE_SIZE - 4, this.y + 6, 8, 4);
                break;
        }
        // 绘制坦克细节
        ctx.fillStyle = 'darkgray';
        ctx.fillRect(this.x + 3, this.y + 3, 10, 10);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 5, this.y + 5, 6, 6);
    }

    move(direction) {
        this.direction = direction;
        switch (direction) {
            case 'up':
                if (this.y > 0) this.y -= this.speed;
                break;
            case 'down':
                if (this.y < CANVAS_HEIGHT - TILE_SIZE) this.y += this.speed;
                break;
            case 'left':
                if (this.x > 0) this.x -= this.speed;
                break;
            case 'right':
                if (this.x < CANVAS_WIDTH - TILE_SIZE) this.x += this.speed;
                break;
        }
    }

    shoot() {
        bullets.push(new Bullet(this.x + TILE_SIZE / 2, this.y + TILE_SIZE / 2, this.direction, this.color === 'blue'));
    }
}

// 子弹类
class Bullet {
    constructor(x, y, direction, isPlayerBullet) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.speed = 4;
        this.isPlayerBullet = isPlayerBullet;
    }

    draw() {
        ctx.fillStyle = this.isPlayerBullet ? 'yellow' : 'red';
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    }

    move() {
        switch (this.direction) {
            case 'up':
                this.y -= this.speed;
                break;
            case 'down':
                this.y += this.speed;
                break;
            case 'left':
                this.x -= this.speed;
                break;
            case 'right':
                this.x += this.speed;
                break;
        }
    }
}

// 墙壁类
class Wall {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'brick' or 'steel'
    }

    draw() {
        ctx.fillStyle = this.type === 'brick' ? '#8B4513' : '#808080';
        ctx.fillRect(this.x, this.y, TILE_SIZE, TILE_SIZE);

        // 添加墙壁纹理
        ctx.fillStyle = this.type === 'brick' ? '#A0522D' : '#A9A9A9';
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if ((i + j) % 2 === 0) {
                    ctx.fillRect(this.x + i * 4, this.y + j * 4, 4, 4);
                }
            }
        }
    }
}

// 初始化游戏
function initGame() {
    console.log('Initializing game');
    // 设置画布尺寸和缩放
    canvas.width = CANVAS_WIDTH * SCALE;
    canvas.height = CANVAS_HEIGHT * SCALE;
    ctx.scale(SCALE, SCALE);
    ctx.imageSmoothingEnabled = false; // 禁用图像平滑，保持像素风格

    player = new Tank(CANVAS_WIDTH / 2 - TILE_SIZE / 2, CANVAS_HEIGHT - TILE_SIZE * 2, 'blue');
    enemyTanks = [];
    bullets = [];
    walls = [];

    // 创建墙壁布局
    createWalls();

    // 重置游戏状态
    if (!gameStarted) {
        level = 1;
        score = 0;
        lives = 3;
    }
    enemies = 20 + (level - 1) * 5;
    lastEnemySpawnTime = Date.now();
    updateGameInfo();
    console.log('Game initialized');
}

// 创建墙壁布局
function createWalls() {
    // 创建基地周围的墙
    for (let x = CANVAS_WIDTH / 2 - TILE_SIZE * 2; x <= CANVAS_WIDTH / 2 + TILE_SIZE; x += TILE_SIZE) {
        walls.push(new Wall(x, CANVAS_HEIGHT - TILE_SIZE * 2, 'steel'));
    }
    walls.push(new Wall(CANVAS_WIDTH / 2 - TILE_SIZE * 2, CANVAS_HEIGHT - TILE_SIZE, 'steel'));
    walls.push(new Wall(CANVAS_WIDTH / 2 + TILE_SIZE, CANVAS_HEIGHT - TILE_SIZE, 'steel'));

    // 创建随机墙壁
    for (let i = 0; i < 40; i++) {
        let x = Math.floor(Math.random() * GRID_WIDTH) * TILE_SIZE;
        let y = Math.floor(Math.random() * (GRID_HEIGHT - 4)) * TILE_SIZE;
        // 确保不会在玩家坦克周围生成墙壁
        if (Math.abs(x - player.x) > TILE_SIZE * 2 || Math.abs(y - player.y) > TILE_SIZE * 2) {
            walls.push(new Wall(x, y, Math.random() < 0.8 ? 'brick' : 'steel'));
        }
    }
}

// 更新游戏信息显示
function updateGameInfo() {
    levelElement.textContent = level;
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    enemiesElement.textContent = enemies;
}

// 游戏主循环
function gameLoop() {
    console.log('Game loop running');
    if (!gameStarted) {
        console.log('Game not started, exiting game loop');
        return;
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 绘制背景网格
    drawBackground();

    // 绘制墙壁
    walls.forEach(wall => wall.draw());

    // 处理子弹
    processBullets();

    // 绘制玩家坦克
    player.draw();

    // 处理敌方坦克
    processEnemyTanks();

    // 生成新的敌方坦克
    const currentTime = Date.now();
    if (currentTime - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL) {
        spawnEnemyTank();
        lastEnemySpawnTime = currentTime;
    }

    // 检查游戏是否结束
    if (enemies === 0 && enemyTanks.length === 0) {
        levelComplete();
    }

    requestAnimationFrame(gameLoop);
}

// 处理子弹移动和碰撞
function processBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.move();
        bullet.draw();

        // 检查子弹是否出界
        if (bullet.x < 0 || bullet.x > CANVAS_WIDTH || bullet.y < 0 || bullet.y > CANVAS_HEIGHT) {
            bullets.splice(i, 1);
            continue;
        }

        // 检查子弹是否击中墙壁
        let hitWall = false;
        for (let j = walls.length - 1; j >= 0; j--) {
            const wall = walls[j];
            if (bullet.x > wall.x && bullet.x < wall.x + TILE_SIZE &&
                bullet.y > wall.y && bullet.y < wall.y + TILE_SIZE) {
                bullets.splice(i, 1);
                if (wall.type === 'brick') {
                    walls.splice(j, 1);
                }
                hitWall = true;
                break;
            }
        }
        if (hitWall) continue;

        // 检查子弹是否击中坦克
        if (bullet.isPlayerBullet) {
            // 玩家子弹击中敌方坦克
            for (let j = enemyTanks.length - 1; j >= 0; j--) {
                const enemyTank = enemyTanks[j];
                if (bullet.x > enemyTank.x && bullet.x < enemyTank.x + TILE_SIZE &&
                    bullet.y > enemyTank.y && bullet.y < enemyTank.y + TILE_SIZE) {
                    bullets.splice(i, 1);
                    enemyTanks.splice(j, 1);
                    score += 100;
                    updateGameInfo();
                    break;
                }
            }
        } else {
            // 敌方子弹击中玩家
            if (bullet.x > player.x && bullet.x < player.x + TILE_SIZE &&
                bullet.y > player.y && bullet.y < player.y + TILE_SIZE) {
                bullets.splice(i, 1);
                lives--;
                updateGameInfo();
                if (lives <= 0) {
                    gameOver();
                }
            }
        }
    }
}

// 处理敌方坦克
function processEnemyTanks() {
    enemyTanks.forEach(enemyTank => {
        enemyTank.draw();
        enemyTank.moveRandomly();

        // 随机射击
        if (Math.random() < 0.01) { // 1% 的概率射击
            enemyTank.shoot();
        }

        // 检测与墙壁的碰撞
        walls.forEach(wall => {
            if (checkCollision(enemyTank, wall)) {
                // 简单的碰撞响应：改变方向
                const directions = ['up', 'down', 'left', 'right'];
                enemyTank.direction = directions[Math.floor(Math.random() * directions.length)];
            }
        });
    });
}

// 碰撞检测辅助函数
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + TILE_SIZE &&
           obj1.x + TILE_SIZE > obj2.x &&
           obj1.y < obj2.y + TILE_SIZE &&
           obj1.y + TILE_SIZE > obj2.y;
}

// 游戏结束
function gameOver() {
    gameStarted = false;
    alert('游戏结束！你的得分是: ' + score);
    startButton.textContent = '重新开始';
}

// 关卡完成
function levelComplete() {
    level++;
    enemies = 20 + (level - 1) * 5; // 每关增加5个敌人
    alert('恭喜！进入第 ' + level + ' 关');
    initGame();
}