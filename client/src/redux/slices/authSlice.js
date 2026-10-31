import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/apiClient';

const initialToken = localStorage.getItem('imovies_token') || null;
const initialUser = localStorage.getItem('imovies_user')
  ? JSON.parse(localStorage.getItem('imovies_user'))
  : null;

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await API.post('/auth/register', formData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const loadMe = createAsyncThunk(
  'auth/loadMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/auth/me');
      return response.data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await API.put('/auth/profile', userData);
      return response.data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    token: initialToken,
    isAuthenticated: Boolean(initialToken),
    isLoading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('imovies_token');
      localStorage.removeItem('imovies_user');
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        localStorage.setItem('imovies_token', action.payload.token);
        localStorage.setItem('imovies_user', JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        localStorage.setItem('imovies_token', action.payload.token);
        localStorage.setItem('imovies_user', JSON.stringify(action.payload.user));
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Load Me
      .addCase(loadMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        localStorage.setItem('imovies_user', JSON.stringify(action.payload));
      })
      .addCase(loadMe.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('imovies_token');
        localStorage.removeItem('imovies_user');
      })
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('imovies_user', JSON.stringify(state.user));
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
