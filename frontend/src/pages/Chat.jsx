import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { fetchConversations, fetchMessages, setActiveConversation, addMessage, startConversation } from '../redux/slices/chatSlice';
import { getSocket } from '../utils/socket';
import api from '../utils/axios';
import { Send, Search, MessageSquare } from 'lucide-react';
import { getInitials, timeAgo } from '../utils/helpers';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

const Chat = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const { conversations, activeConversation, messages, loading, typingUsers } = useSelector((s) => s.chat);
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    dispatch(fetchConversations());
    // Start chat from state (coming from job detail or applicants page)
    if (location.state?.startChatWith) {
      dispatch(startConversation(location.state.startChatWith));
    }
    if (location.state?.startChat) {
      dispatch(startConversation(location.state.startChat));
    }
  }, [dispatch, location.state]);

  useEffect(() => {
    if (!activeConversation) return;
    dispatch(fetchMessages(activeConversation._id));
    const socket = getSocket();
    if (!socket) return;

    // Join room for typing indicators; re-join after reconnect
    const joinRoom = () => socket.emit('join_conversation', activeConversation._id);
    joinRoom();
    socket.on('connect', joinRoom);

    return () => {
      socket.off('connect', joinRoom);
      socket.emit('leave_conversation', activeConversation._id);
    };
  }, [activeConversation, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversation]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !activeConversation) return;
    setSending(true);
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('send_message', { conversationId: activeConversation._id, content: content.trim() });
      setContent('');
    } else {
      try {
        const { data } = await api.post(`/chat/conversations/${activeConversation._id}/messages`, { content: content.trim() });
        dispatch(addMessage({ conversationId: activeConversation._id, message: data.message }));
        setContent('');
      } catch { toast.error('Failed to send message'); }
    }
    setSending(false);
  };

  const handleTyping = () => {
    const socket = getSocket();
    if (socket && activeConversation) {
      socket.emit('typing', { conversationId: activeConversation._id });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('stop_typing', { conversationId: activeConversation._id });
      }, 2000);
    }
  };

  const getOtherParticipant = (conv) => conv?.participants?.find(p => p._id !== user?._id);

  const filteredConvs = conversations.filter(c => {
    const other = getOtherParticipant(c);
    return !search || other?.name?.toLowerCase().includes(search.toLowerCase());
  });

  const currentMessages = activeConversation ? (messages[activeConversation._id] || []) : [];
  const otherUser = getOtherParticipant(activeConversation);
  const convTyping = activeConversation ? typingUsers[activeConversation._id] : {};
  const isOtherTyping = convTyping && Object.keys(convTyping).length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 h-[calc(100vh-4rem)]">
      <div className="flex h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-100 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 mb-3">Messages</h2>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <Search size={15} className="text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" placeholder="Search conversations" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <Spinner className="py-8" /> : filteredConvs.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare size={32} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No conversations yet</p>
                <p className="text-xs text-gray-300 mt-1">Start chatting from a job listing</p>
              </div>
            ) : (
              filteredConvs.map((conv) => {
                const other = getOtherParticipant(conv);
                const isActive = activeConversation?._id === conv._id;
                const unread = conv.unreadCount?.[user?._id] || 0;
                return (
                  <button key={conv._id} onClick={() => dispatch(setActiveConversation(conv))}
                    className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors ${isActive ? 'bg-indigo-50 border-r-2 border-indigo-600' : ''}`}>
                    {other?.avatar?.url ? (
                      <img src={other.avatar.url} alt={other.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">{getInitials(other?.name)}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${isActive ? 'text-indigo-700' : 'text-gray-800'} line-clamp-1`}>{other?.name}</p>
                        {unread > 0 && <span className="bg-indigo-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0">{unread}</span>}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{conv.lastMessage?.content || 'No messages yet'}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              {otherUser?.avatar?.url ? (
                <img src={otherUser.avatar.url} alt={otherUser.name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">{getInitials(otherUser?.name)}</div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{otherUser?.name}</p>
                <p className="text-xs text-gray-400 capitalize">{otherUser?.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? <Spinner className="py-8" /> : currentMessages.map((msg) => {
                const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 mr-2 shrink-0 self-end">{getInitials(msg.sender?.name)}</div>
                    )}
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>{timeAgo(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              {isOtherTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                    {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-3">
              <input value={content} onChange={(e) => { setContent(e.target.value); handleTyping(); }}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={`Message ${otherUser?.name}...`} />
              <button type="submit" disabled={!content.trim() || sending} className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40">
                <Send size={18} />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare size={48} className="text-gray-200 mb-3" />
            <h3 className="font-semibold text-gray-500">Select a conversation</h3>
            <p className="text-sm text-gray-400 mt-1">Choose from your conversations on the left to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
