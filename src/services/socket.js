import io from 'socket.io-client';
import { Platform } from 'react-native';

// Production Socket URL - Render backend
const SOCKET_URL = 'https://uberappbackend.onrender.com';
// const SOCKET_URL = 'http://172.20.216.100:2000';

class SocketService {
    socket = null;
    userId = null;

    connect(userId) {
        if (!userId) return;

        this.userId = userId;

        if (this.socket) {
            if (this.socket.connected) {
                // If already connected, ensure we are in the room
                this.socket.emit('join_user_room', userId);
            } else {
                // If socket exists but disconnected, connect manually
                this.socket.connect();
            }
        } else {
            // Create new socket connection
            this.socket = io(SOCKET_URL, {
                transports: ['polling', 'websocket'], // Fallback to polling if websocket fails
                reconnection: true,
                reconnectionAttempts: Infinity, // Keep trying
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
                forceNew: true
            });
        }

        // Ensure listeners are set up (idempotent check inside 'on')
        // We need to re-attach basic listeners if it's a new instance
        this.socket.on('connect', () => {
            console.log('✅ Socket connected:', this.socket.id);
            if (this.userId) {
                this.socket.emit('join_user_room', this.userId);
            }
        });

        // ... other listeners handled by component registrations ...




        this.socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.log('🔴 Socket connection error:', error.message);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
            if (this.userId) {
                this.socket.emit('join_user_room', this.userId);
            }
        });
    }

    disconnect() {
        if (this.socket) {
            if (this.userId) {
                this.socket.emit('user_disconnected', this.userId);
            }
            this.socket.disconnect();
            this.socket = null;
            this.userId = null;
        }
    }

    emit(event, data) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn('Socket not connected, cannot emit:', event);
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            if (callback) {
                this.socket.off(event, callback);
            } else {
                this.socket.off(event);
            }
        }
    }

    isConnected() {
        return this.socket?.connected || false;
    }
}

export default new SocketService();
