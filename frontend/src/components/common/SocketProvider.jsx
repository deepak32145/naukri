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

    // Keep named references so cleanup removes ONLY these handlers,
    // not unrelated listeners added by other components (e.g. Chat.jsx)
    const onNotification = (notification) => {
      dispatch(addNotification(notification));
      toast(notification.title, { icon: '🔔', duration: 4000 });
    };
    const onReceiveMessage = (message) => {
      // String() ensures the key is always a plain string regardless of
      // how socket.io serialises the Mongoose ObjectId on the wire
      dispatch(addMessage({ conversationId: String(message.conversationId), message }));
    };
    const onTyping = ({ userId, name, conversationId }) => {
      dispatch(setTyping({ conversationId, userId, name }));
    };
    const onStopTyping = ({ userId, conversationId }) => {
      dispatch(clearTyping({ conversationId, userId }));
    };
    const onAppStatus = ({ jobTitle, status }) => {
      toast.success(`Application for "${jobTitle}" is now ${status.replace(/_/g, ' ')}`, { duration: 5000 });
    };
    const onOnlineUsers = (userIds) => dispatch(setOnlineUsers(userIds));

    socket.on('notification', onNotification);
    socket.on('receive_message', onReceiveMessage);
    socket.on('typing_indicator', onTyping);
    socket.on('stop_typing_indicator', onStopTyping);
    socket.on('application_status_update', onAppStatus);
    socket.on('online_users', onOnlineUsers);

    return () => {
      socket.off('notification', onNotification);
      socket.off('receive_message', onReceiveMessage);
      socket.off('typing_indicator', onTyping);
      socket.off('stop_typing_indicator', onStopTyping);
      socket.off('application_status_update', onAppStatus);
      socket.off('online_users', onOnlineUsers);
    };
  }, [isAuthenticated, dispatch]);

  return children;
};

export default SocketProvider;
