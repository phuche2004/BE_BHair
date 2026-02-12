import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*', // Allow all origins for now (Dev mode)
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log('🔌 Client connected:', socket.id);

        // User joins their own room (identified by userId)
        socket.on('join_room', (userId: string) => {
            console.log(`👤 User ${userId} joined room`);
            socket.join(userId);
        });

        socket.on('disconnect', () => {
            // console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
