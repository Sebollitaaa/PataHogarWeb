import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { notificationsApi } from '../api/notifications';
import { conversationsApi } from '../api/conversations';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  // Conversación abierta en pantalla: sus mensajes se leen al llegar, no suman al contador.
  const activeConversation = useRef(null);

  const refreshUnreadMessages = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { count } = await conversationsApi.unreadCount();
      setUnreadMessages(count);
    } catch {
      // sin conexión: se mantiene el valor anterior
    }
  }, [isAuthenticated]);

  const setActiveConversation = useCallback((id) => {
    activeConversation.current = id ? String(id) : null;
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    const [{ count }, { notifications }] = await Promise.all([
      notificationsApi.unreadCount(),
      notificationsApi.list(1),
    ]);
    setUnreadCount(count);
    setRecent(notifications.slice(0, 6));
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
      refreshUnreadMessages();
    } else {
      setUnreadCount(0);
      setRecent([]);
      setUnreadMessages(0);
    }
  }, [isAuthenticated, refresh, refreshUnreadMessages]);

  // Mensaje nuevo de otra persona: se suma al contador del chat (salvo que esa conversación esté abierta).
  useEffect(() => {
    if (!socket) return undefined;
    const handler = ({ conversationId, message }) => {
      if (user && message.senderId === user.id) return;
      if (activeConversation.current === String(conversationId)) return;
      setUnreadMessages((c) => c + 1);
    };
    socket.on('message:new', handler);
    return () => socket.off('message:new', handler);
  }, [socket, user]);

  useEffect(() => {
    if (!socket) return;
    const handler = (notification) => {
      setUnreadCount((c) => c + 1);
      setRecent((list) => [notification, ...list].slice(0, 6));
    };
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [socket]);

  const markRead = useCallback(async (id) => {
    await notificationsApi.markRead(id);
    setRecent((list) => list.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    setRecent((list) => list.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  return (
    <NotificationsContext.Provider value={{ unreadCount, recent, refresh, markRead, markAllRead, unreadMessages, refreshUnreadMessages, setActiveConversation }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications debe usarse dentro de <NotificationsProvider>');
  return ctx;
}
