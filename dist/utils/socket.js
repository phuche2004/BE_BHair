"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const initSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*', // Allow all origins for now (Dev mode)
            methods: ['GET', 'POST']
        }
    });
    io.on('connection', (socket) => {
        console.log('🔌 Client connected:', socket.id);
        // User joins their own room (identified by userId)
        socket.on('join_room', (userId) => {
            console.log(`👤 User ${userId} joined room`);
            socket.join(userId);
        });
        socket.on('disconnect', () => {
            // console.log('Client disconnected:', socket.id);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
exports.getIO = getIO;
