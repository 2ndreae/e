const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let rooms = {}; // 방 리스트
let users = {}; // 유저 리스트

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ username, room }) => {
        if (!rooms[room]) {
            rooms[room] = [];
        }

        socket.join(room);
        rooms[room].push(username);
        users[socket.id] = { username, room };

        io.to(room).emit('roomUsers', rooms[room]);
        io.emit('rooms', Object.keys(rooms));

        socket.on('chatMessage', (message) => {
            io.to(room).emit('message', { username, message });
        });

        socket.on('disconnect', () => {
            if (users[socket.id]) {
                const { username, room } = users[socket.id];
                rooms[room] = rooms[room].filter(user => user !== username);

                if (rooms[room].length === 0) {
                    delete rooms[room];
                } else {
                    io.to(room).emit('roomUsers', rooms[room]);
                }

                delete users[socket.id];
                io.emit('rooms', Object.keys(rooms));
            }
        });
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(8000, () => {
    console.log('Server is running on port 8000');
});
