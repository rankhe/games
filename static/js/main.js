document.addEventListener('DOMContentLoaded', () => {
    // 初始化五子棋游戏
    const gomokuGame = new GomokuGame('gomoku-board');

    // 绑定重新开始按钮事件
    document.getElementById('restart-btn').addEventListener('click', () => {
        const socket = io();
        socket.emit('restart');
    });

    // 绑定游戏选项卡切换事件
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有选项卡的active类
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            // 为当前选项卡添加active类
            tab.classList.add('active');

            // 获取游戏类型
            const gameType = tab.getAttribute('data-game');

            // 根据游戏类型切换游戏区域内容
            // 目前只有五子棋，后续可以扩展
        });
    });
});