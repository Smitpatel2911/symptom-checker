import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { getErrorMessage } from '../api/axios.js';

const hasToken = Boolean(localStorage.getItem('token'));

export const registerUser = createAsyncThunk('auth/register', async (form, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', form);
    localStorage.setItem('token', data.token);
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const loginUser = createAsyncThunk('auth/login', async (form, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', form);
    localStorage.setItem('token', data.token);
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Restores the session on page load
export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data.user;
  } catch (err) {
    localStorage.removeItem('token');
    return rejectWithValue(getErrorMessage(err));
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    // true while we are validating a stored token on first load
    initializing: hasToken,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      localStorage.removeItem('token');
      state.user = null;
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.loading = true;
      state.error = null;
    };
    const authenticated = (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
    };
    const failed = (state, action) => {
      state.loading = false;
      state.error = action.payload;
    };
    builder
      .addCase(registerUser.pending, pending)
      .addCase(registerUser.fulfilled, authenticated)
      .addCase(registerUser.rejected, failed)
      .addCase(loginUser.pending, pending)
      .addCase(loginUser.fulfilled, authenticated)
      .addCase(loginUser.rejected, failed)
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.initializing = false;
        state.user = action.payload;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.initializing = false;
        state.user = null;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
