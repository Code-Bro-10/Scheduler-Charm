import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Always connect to local backend (change to your hosted URL if deployed)
    const socketUrl = 'http://localhost:5000';

    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection error (is backend running?):', err.message);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
