from flask import Flask, render_template, request, redirect, url_for, flash
from flask_socketio import SocketIO, emit
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///game.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

socketio = SocketIO(app)
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# 存储当前游戏状态
current_games = {}

# 用户模型
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    games_played = db.Column(db.Integer, default=0)
    games_won = db.Column(db.Integer, default=0)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# 对战记录模型
class GameRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    black_player_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    white_player_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    winner_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    moves = db.Column(db.Text)  # 存储对局移动记录
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def index():
    if current_user.is_authenticated:
        return render_template('index.html')
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('index'))

        flash('Invalid username or password')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        if User.query.filter_by(username=username).first():
            flash('Username already exists')
            return redirect(url_for('register'))

        user = User(username=username)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/snake')
@login_required
def snake():
    return render_template('snake.html')

@app.route('/memory')
def memory():
    return render_template('memory.html')

@app.route('/tank')
def tank():
    return render_template('tank.html')
    return render_template('memory.html')

@app.route('/profile')
@login_required
def profile():
    games = GameRecord.query.filter(
        (GameRecord.black_player_id == current_user.id) |
        (GameRecord.white_player_id == current_user.id)
    ).order_by(GameRecord.timestamp.desc()).limit(10).all()

    return render_template('profile.html', user=current_user, games=games, User=User)

# 游戏相关的WebSocket事件
current_games = {}  # 存储当前进行中的游戏

@socketio.on('connect')
def handle_connect():
    if not current_user.is_authenticated:
        return False
    print(f"User {current_user.username} connected")

@socketio.on('join_game')
def handle_join_game(data):
    game_id = data.get('game_id', 'default')
    print(f"User {current_user.username} joining game {game_id}")

    if game_id not in current_games:
        current_games[game_id] = {
            'black_player': current_user.id,
            'moves': [],
            'current_player': 'black'
        }
        print(f"Created new game with {current_user.username} as black player")
    elif 'white_player' not in current_games[game_id]:
        current_games[game_id]['white_player'] = current_user.id
        print(f"Added {current_user.username} as white player")
    else:
        # 如果游戏已满，作为观察者加入
        print(f"{current_user.username} joining as observer")

    # 发送当前游戏状态给新加入的玩家
    emit('game_state', current_games[game_id], room=request.sid)

@socketio.on('move')
def handle_move(data):
    game_id = data.get('game_id', 'default')
    game = current_games.get(game_id)

    if not game:
        # 如果游戏不存在，创建新游戏
        current_games[game_id] = {
            'black_player': current_user.id,
            'moves': [],
            'current_player': 'black'
        }
        game = current_games[game_id]
        print(f"Created new game for move request with {current_user.username} as black player")

    print(f"Received move: {data} from user {current_user.username}")

    # 检查是否是当前玩家的回合
    current_color = game.get('current_player', 'black')
    if data['color'] != current_color:
        print(f"Not player's turn. Expected {current_color}, got {data['color']}")
        return

    # 记录移动
    move_data = {
        'x': data['x'],
        'y': data['y'],
        'color': data['color'],
        'player_id': current_user.id
    }
    game['moves'].append(move_data)

    # 切换当前玩家
    game['current_player'] = 'white' if current_color == 'black' else 'black'

    print(f"Broadcasting move: {move_data}")
    # 广播移动信息
    emit('move_response', move_data, broadcast=True)

@socketio.on('game_over')
def handle_game_over(data):
    game_id = data.get('game_id', 'default')
    game = current_games.get(game_id)

    if not game:
        return

    # 记录游戏结果
    record = GameRecord(
        black_player_id=game['black_player'],
        white_player_id=game['white_player'],
        winner_id=data['winner_id'],
        moves=str(game['moves'])
    )
    db.session.add(record)

    # 更新获胜者统计
    winner = User.query.get(data['winner_id'])
    if winner:
        winner.games_won += 1
        winner.games_played += 1

    # 更新失败者统计
    loser_id = game['black_player'] if data['winner_id'] == game['white_player'] else game['white_player']
    loser = User.query.get(loser_id)
    if loser:
        loser.games_played += 1

    db.session.commit()

    # 清理游戏状态
    del current_games[game_id]

@socketio.on('undo_request')
def handle_undo_request(data):
    game_id = data.get('game_id', 'default')
    game = current_games.get(game_id)

    if not game or not game['moves']:
        return

    # 移除最后一步
    last_move = game['moves'].pop()
    # 切换当前玩家为被移除的那一步的颜色
    game['current_player'] = last_move['color']
    emit('undo_response', last_move, broadcast=True)

@socketio.on('restart')
def handle_restart():
    emit('restart_response', broadcast=True)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True)