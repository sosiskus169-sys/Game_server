const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public'));

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Хранилище игроков
let players = {};

io.on('connection', (socket) => {
    console.log('✅ Игрок подключился:', socket.id);
    
    // Создаём нового игрока со случайной позицией
    players[socket.id] = {
        id: socket.id,
        x: Math.random() * (800 - 40),
        y: Math.random() * (600 - 40)
    };
    
    // Отправляем новому игроку список всех игроков
    socket.emit('currentPlayers', players);
    
    // Сообщаем всем остальным о новом игроке
    socket.broadcast.emit('newPlayer', players[socket.id]);
    
    // Получаем движение игрока
    socket.on('playerMovement', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            // Отправляем обновление всем КРОМЕ отправителя
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });
    
    // Игрок отключился
    socket.on('disconnect', () => {
        console.log('❌ Игрок отключился:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// Добавляем простую страничку для проверки
app.get('/', (req, res) => {
    res.send('🎮 Сервер мультиплеерной игры работает!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
