import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/apiClient';

export const fetchMovies = createAsyncThunk(
  'movies/fetchMovies',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/movies', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMovieById = createAsyncThunk(
  'movies/fetchMovieById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/movies/${id}`);
      return response.data.movie;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchFilterOptions = createAsyncThunk(
  'movies/fetchFilterOptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/movies/filters/options');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const movieSlice = createSlice({
  name: 'movies',
  initialState: {
    movies: [],
    selectedMovie: null,
    total: 0,
    totalPages: 1,
    currentPage: 1,
    filterOptions: {
      genres: [],
      languages: [],
      cities: ['Bhopal', 'Indore', 'Mumbai'],
    },
    filters: {
      search: '',
      genre: 'all',
      language: 'all',
      city: 'Bhopal',
      date: '',
      status: 'nowShowing',
      sort: 'rating_desc',
      page: 1,
    },
    isLoading: false,
    error: null,
  },
  reducers: {
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload, page: 1 };
    },
    setPage: (state, action) => {
      state.filters.page = action.payload;
    },
    setCity: (state, action) => {
      state.filters.city = action.payload;
      state.filters.page = 1;
    },
    resetFilters: (state) => {
      state.filters = {
        search: '',
        genre: 'all',
        language: 'all',
        city: state.filters.city || 'Bhopal',
        date: '',
        status: 'nowShowing',
        sort: 'rating_desc',
        page: 1,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch movies
      .addCase(fetchMovies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.movies = action.payload.movies;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchMovies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch single movie
      .addCase(fetchMovieById.pending, (state) => {
        state.isLoading = true;
        state.selectedMovie = null;
      })
      .addCase(fetchMovieById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedMovie = action.payload;
      })
      .addCase(fetchMovieById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Filter options
      .addCase(fetchFilterOptions.fulfilled, (state, action) => {
        state.filterOptions.genres = action.payload.genres || [];
        state.filterOptions.languages = action.payload.languages || [];
        if (action.payload.cities && action.payload.cities.length > 0) {
          state.filterOptions.cities = action.payload.cities;
        }
      });
  },
});

export const { setFilter, setPage, setCity, resetFilters } = movieSlice.actions;
export default movieSlice.reducer;
