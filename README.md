# 在线游戏平台

一个基于Flask的在线多人游戏平台，目前支持五子棋对战和贪吃蛇游戏。

## 功能特性

### 用户系统
- 用户注册和登录
- 个人资料页面
- 游戏统计（对战次数、胜利次数）
- 最近对战记录查看

### 五子棋游戏
- 实时在线对战
- 支持悔棋功能
- 游戏音效
- 对战记录保存
- 实时显示当前玩家

### 贪吃蛇游戏
- 经典贪吃蛇玩法
- 音效反馈
- 分数记录

## 技术栈
- 后端：Python Flask
- 数据库：SQLite
- 实时通信：Flask-SocketIO
- 前端：HTML5 + CSS3 + JavaScript
- 用户认证：Flask-Login
- ORM：Flask-SQLAlchemy

## 安装步骤

1. 克隆项目到本地
```bash
git clone [你的仓库URL]
cd games
```

2. 创建并激活虚拟环境
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/Mac
python3 -m venv .venv
source .venv/bin/activate
```

3. 安装依赖
```bash
pip install flask flask-socketio flask-sqlalchemy flask-login werkzeug
```

4. 初始化数据库
```bash
python app.py
```

## 运行项目
1. 确保在虚拟环境中
```bash
# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate
```

2. 启动服务器
```bash
python app.py
```

3. 访问网站
打开浏览器访问 `http://localhost:5000`

## 游戏玩法

### 五子棋
- 登录后进入主页面默认显示五子棋游戏
- 等待对手加入游戏
- 黑方先手，轮流落子
- 五子连线（横、竖、斜）即可获胜
- 支持悔棋和重新开始功能
- 可以开关音效

### 贪吃蛇
- 点击左侧菜单中的"贪吃蛇"进入游戏
- 使用方向键控制蛇的移动
- 吃到食物增加分数和长度
- 撞到墙壁或自身游戏结束

## 项目结构
```
.
├── static/                 # 静态文件
│   ├── css/               # 样式文件
│   ├── js/                # JavaScript文件
│   ├── images/            # 图片资源
│   └── sounds/            # 音效文件
├── templates/             # HTML模板
├── app.py                 # 主应用文件
├── game.db               # SQLite数据库
└── requirements.txt      # 项目依赖
```

## 开发计划
- [ ] 添加更多游戏类型
- [ ] 实现游戏房间系统
- [ ] 添加排行榜功能
- [ ] 支持观战模式
- [ ] 添加聊天功能
- [ ] 优化移动端体验

## 贡献指南
欢迎提交问题和功能建议！如果您想贡献代码：
1. Fork 本仓库
2. 创建您的特性分支
3. 提交您的改动
4. 确保提交信息清晰明了
5. 提交 Pull Request

## 许可证
MIT License