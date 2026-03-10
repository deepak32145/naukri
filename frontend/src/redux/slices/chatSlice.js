import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/axios';

export const fetchConversations = createAsyncThunk('chat/fetchConversations', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/chat/conversations');
    return data.conversations;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async (conversationId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/chat/conversations/${conversationId}/messages`);
    return { conversationId, messages: data.messages };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const startConversation = createAsyncThunk('chat/startConversation', async (participantId, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/chat/conversations', { participantId });
    return data.conversation;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations: [],
    activeConversation: null,
    messages: {},
    typingUsers: {},
    onlineUserIds: [],
    loading: false,
    error: null,
  },
  reducers: {
    setActiveConversation: (state, action) => { state.activeConversation = action.payload; },
    setOnlineUsers: (state, action) => { state.onlineUserIds = action.payload; },
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) state.messages[conversationId] = [];
      const exists = state.messages[conversationId].find(m => m._id === message._id);
      if (!exists) state.messages[conversationId].push(message);
      // Update last message in conversation
      const conv = state.conversations.find(c => c._id === conversationId);
      if (conv) conv.lastMessage = message;
    },
    setTyping: (state, action) => {
      const { conversationId, userId, name } = action.payload;
      if (!state.typingUsers[conversationId]) state.typingUsers[conversationId] = {};
      state.typingUsers[conversationId][userId] = name;
    },
    clearTyping: (state, action) => {
      const { conversationId, userId } = action.payload;
      if (state.typingUsers[conversationId]) delete state.typingUsers[conversationId][userId];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.fulfilled, (state, action) => { state.conversations = action.payload; })
      .addCase(fetchMessages.pending, (state) => { state.loading = true; })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages[action.payload.conversationId] = action.payload.messages;
      })
      .addCase(startConversation.fulfilled, (state, action) => {
        const exists = state.conversations.find(c => c._id === action.payload._id);
        if (!exists) state.conversations.unshift(action.payload);
        state.activeConversation = action.payload;
      });
  },
});

export const { setActiveConversation, addMessage, setTyping, clearTyping, setOnlineUsers } = chatSlice.actions;
export default chatSlice.reducer;
