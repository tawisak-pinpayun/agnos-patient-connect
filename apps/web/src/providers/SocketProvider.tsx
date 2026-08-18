'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getSocket, type AppSocket } from '@/lib/socket';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

interface SocketContextValue {
  socket: AppSocket;
  connectionState: ConnectionState;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socket = useMemo(() => getSocket(), []);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    socket.connected ? 'connected' : 'connecting',
  );

  useEffect(() => {
    const onConnect = () => setConnectionState('connected');
    const onDisconnect = () => setConnectionState('disconnected');
    const onReconnectAttempt = () => setConnectionState('connecting');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('error', onDisconnect);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.io.off('error', onDisconnect);
    };
  }, [socket]);

  const value = useMemo(
    () => ({ socket, connectionState }),
    [socket, connectionState],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketContext(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocketContext must be used inside <SocketProvider>');
  return context;
}
