const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const rooms = {};  // 방 정보를 저장하는 객체

io.on('connection', (socket) => {
  console.log('새로운 유저가 연결되었습니다.');

  socket.on('joinRoom', (roomName, userName) => {
    socket.join(roomName);

    if (!rooms[roomName]) {
      rooms[roomName] = [];
    }
    rooms[roomName].push({ id: socket.id, userName });

    io.to(roomName).emit('roomUsers', rooms[roomName].map(user => user.userName));
    socket.emit('roomList', Object.keys(rooms));  // 방 리스트 요청한 클라이언트에게만 전송
  });

  socket.on('leaveRoom', (roomName, userName) => {
    socket.leave(roomName);

    if (rooms[roomName]) {
      rooms[roomName] = rooms[roomName].filter(user => user.userName !== userName);
      io.to(roomName).emit('roomUsers', rooms[roomName].map(user => user.userName));
      if (rooms[roomName].length === 0) {
        delete rooms[roomName];  // 방에 유저가 없으면 삭제
      }
      socket.emit('roomList', Object.keys(rooms));  // 방 리스트 요청한 클라이언트에게만 전송
    }
  });

  socket.on('disconnect', () => {
    console.log('유저가 연결을 해제했습니다.');

    for (const roomName in rooms) {
      rooms[roomName] = rooms[roomName].filter(user => user.id !== socket.id);
      io.to(roomName).emit('roomUsers', rooms[roomName].map(user => user.userName));
      if (rooms[roomName].length === 0) {
        delete rooms[roomName];  // 방에 유저가 없으면 삭제
      }
    }

    socket.emit('roomList', Object.keys(rooms));  // 방 리스트 요청한 클라이언트에게만 전송
  });

  socket.on('requestRoomList', () => {
    socket.emit('roomList', Object.keys(rooms));
  });

  socket.on('sendMessage', (roomName, userName, message) => {
    const formattedMessage = `${userName}: ${message}`;
    io.to(roomName).emit('receiveMessage', formattedMessage);  // 방에 있는 모든 클라이언트에게 메시지 전송
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));}); // `public` 폴더를 정적 파일 제공 폴더로 설정

server.listen(8000, () => {
  console.log('서버가 8000번 포트에서 실행 중입니다.');
});
