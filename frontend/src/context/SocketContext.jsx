import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Attempt to connect to the backend
    const newSocket = io('http://localhost:5000', {
      reconnectionAttempts: 3, // Limit reconnection attempts to reduce console noise
      timeout: 5000,
      autoConnect: true
    });

    newSocket.on('connect_error', () => {
      console.warn('Real-time server (Socket.io) is currently offline. Some features may be limited.');
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('connect_error');
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
