import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/axios';
import { initSocket, disconnectSocket } from '../../utils/socket';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('token', data.token);
    initSocket(data.token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('token', data.token);
    initSocket(data.token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/users/me');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch user');
  }
});

export const sendLoginOtp = createAsyncThunk('auth/sendLoginOtp', async (email, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/send-login-otp', { email });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to send OTP');
  }
});

export const verifyLoginOtp = createAsyncThunk('auth/verifyLoginOtp', async ({ email, otp }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/verify-login-otp', { email, otp });
    localStorage.setItem('token', data.token);
    initSocket(data.token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'OTP verification failed');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
  } catch (e) {}
  localStorage.removeItem('token');
  disconnectSocket();
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    initializing: !!localStorage.getItem('token'), // waits for fetchMe on page refresh
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    updateUser: (state, action) => { state.user = { ...state.user, ...action.payload }; },
    setCredentials: (state, action) => {
      state.user = action.payload.user || state.user;
      state.token = action.payload.token || state.token;
      state.isAuthenticated = !!action.payload.token;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.initializing = false;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
        state.initializing = false;
        localStorage.removeItem('token');
      })
      .addCase(sendLoginOtp.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(sendLoginOtp.fulfilled, (state) => { state.loading = false; })
      .addCase(sendLoginOtp.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(verifyLoginOtp.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(verifyLoginOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(verifyLoginOtp.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, updateUser, setCredentials } = authSlice.actions;
export default authSlice.reducer;
