import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '../../utils/socket';
import { addNotification } from '../../redux/slices/notificationSlice';
import { addMessage, setTyping, clearTyping, setOnlineUsers } from '../../redux/slices/chatSlice';
import toast from 'react-hot-toast';

const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { activeConversation } = useSelector((s) => s.chat);

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    if (!socket) return;

    socket.on('notification', (notification) => {
      dispatch(addNotification(notification));
      toast(notification.title, { icon: '🔔', duration: 4000 });
    });

    socket.on('receive_message', (message) => {
      dispatch(addMessage({ conversationId: message.conversationId, message }));
    });

    socket.on('typing_indicator', ({ userId, name, conversationId }) => {
      dispatch(setTyping({ conversationId, userId, name }));
    });

    socket.on('stop_typing_indicator', ({ userId, conversationId }) => {
      dispatch(clearTyping({ conversationId, userId }));
    });

    socket.on('application_status_update', ({ jobTitle, status }) => {
      toast.success(`Application for "${jobTitle}" is now ${status.replace(/_/g, ' ')}`, { duration: 5000 });
    });

    socket.on('online_users', (userIds) => {
      dispatch(setOnlineUsers(userIds));
    });

    return () => {
      socket.off('notification');
      socket.off('receive_message');
      socket.off('typing_indicator');
      socket.off('stop_typing_indicator');
      socket.off('application_status_update');
      socket.off('online_users');
    };
  }, [isAuthenticated, dispatch]);

  return children;
};

export default SocketProvider;
