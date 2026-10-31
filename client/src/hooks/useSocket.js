import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const useSocket = (showId, onEvent) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('imovies_token');

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      if (showId) {
        socket.emit('join:show', { showId });
      }
    });

    if (showId) {
      socket.on('seat:lock', (data) => {
        if (data.showId === showId && onEvent?.onSeatLock) {
          onEvent.onSeatLock(data);
        }
      });

      socket.on('seat:unlock', (data) => {
        if (data.showId === showId && onEvent?.onSeatUnlock) {
          onEvent.onSeatUnlock(data);
        }
      });

      socket.on('seat:booked', (data) => {
        if (data.showId === showId && onEvent?.onSeatBooked) {
          onEvent.onSeatBooked(data);
        }
      });

      socket.on('seat:released', (data) => {
        if (data.showId === showId && onEvent?.onSeatReleased) {
          onEvent.onSeatReleased(data);
        }
      });
    }

    return () => {
      if (showId && socket) {
        socket.emit('leave:show', { showId });
      }
      socket.disconnect();
    };
  }, [showId]);

  return socketRef.current;
};

export default useSocket;
