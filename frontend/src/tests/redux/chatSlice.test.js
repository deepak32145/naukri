import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import chatReducer, {
  setActiveConversation, setOnlineUsers, addMessage, setTyping, clearTyping,
  fetchConversations, startConversation,
} from '../../redux/slices/chatSlice';

const makeStore = (preloadedState) =>
  configureStore({ reducer: { chat: chatReducer }, preloadedState });

// ─── SYNC REDUCERS ───────────────────────────────────────────────────────────

describe('chatSlice — setActiveConversation reducer', () => {
  it('sets the activeConversation field', () => {
    const store = makeStore();
    store.dispatch(setActiveConversation('conv1'));
    expect(store.getState().chat.activeConversation).toBe('conv1');
  });
});

describe('chatSlice — setOnlineUsers reducer', () => {
  it('replaces the onlineUserIds array', () => {
    const store = makeStore({ chat: { onlineUserIds: [] } });
    store.dispatch(setOnlineUsers(['u1', 'u2', 'u3']));
    expect(store.getState().chat.onlineUserIds).toEqual(['u1', 'u2', 'u3']);
  });
});

describe('chatSlice — addMessage reducer', () => {
  it('adds a new message to the correct conversation bucket', () => {
    const store = makeStore({ chat: { messages: {}, conversations: [] } });
    const msg = { _id: 'm1', content: 'Hello!', sender: 'u1' };
    store.dispatch(addMessage({ conversationId: 'conv1', message: msg }));
    const state = store.getState().chat;
    expect(state.messages['conv1']).toHaveLength(1);
    expect(state.messages['conv1'][0]._id).toBe('m1');
  });

  it('does not add duplicate messages (same _id)', () => {
    const msg = { _id: 'm1', content: 'Hello!' };
    const store = makeStore({
      chat: { messages: { conv1: [msg] }, conversations: [] },
    });
    store.dispatch(addMessage({ conversationId: 'conv1', message: msg }));
    expect(store.getState().chat.messages['conv1']).toHaveLength(1);
  });

  it('updates the lastMessage on the matching conversation', () => {
    const conv = { _id: 'conv1', lastMessage: null };
    const store = makeStore({ chat: { messages: {}, conversations: [conv] } });
    const msg = { _id: 'm1', content: 'Hey' };
    store.dispatch(addMessage({ conversationId: 'conv1', message: msg }));
    const updatedConv = store.getState().chat.conversations[0];
    expect(updatedConv.lastMessage._id).toBe('m1');
  });
});

describe('chatSlice — setTyping / clearTyping reducers', () => {
  it('sets typing indicator for a user in a conversation', () => {
    const store = makeStore({ chat: { typingUsers: {} } });
    store.dispatch(setTyping({ conversationId: 'conv1', userId: 'u2', name: 'Alice' }));
    expect(store.getState().chat.typingUsers['conv1']['u2']).toBe('Alice');
  });

  it('clears typing indicator for a user', () => {
    const store = makeStore({
      chat: { typingUsers: { conv1: { u2: 'Alice' } } },
    });
    store.dispatch(clearTyping({ conversationId: 'conv1', userId: 'u2' }));
    expect(store.getState().chat.typingUsers['conv1']['u2']).toBeUndefined();
  });
});

// ─── THUNK: fetchConversations ───────────────────────────────────────────────

describe('chatSlice — fetchConversations thunk', () => {
  it('populates conversations from API', async () => {
    const store = makeStore();
    await store.dispatch(fetchConversations());
    const state = store.getState().chat;
    expect(state.conversations).toHaveLength(1);
    expect(state.conversations[0]._id).toBe('conv1');
  });
});

// ─── THUNK: startConversation ────────────────────────────────────────────────

describe('chatSlice — startConversation thunk', () => {
  it('adds conversation to list and sets it as activeConversation', async () => {
    const store = makeStore({ chat: { conversations: [], activeConversation: null } });
    await store.dispatch(startConversation('u2'));
    const state = store.getState().chat;
    expect(state.conversations).toHaveLength(1);
    expect(state.activeConversation._id).toBe('conv1');
  });

  it('does not add duplicate conversation if already in list', async () => {
    const existingConv = { _id: 'conv1', participants: [] };
    const store = makeStore({ chat: { conversations: [existingConv], activeConversation: null } });
    await store.dispatch(startConversation('u2'));
    expect(store.getState().chat.conversations).toHaveLength(1);
  });
});
