import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/apiClient';

export const fetchShowSeats = createAsyncThunk(
  'booking/fetchShowSeats',
  async (showId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/shows/${showId}/seats`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const lockSeatsThunk = createAsyncThunk(
  'booking/lockSeats',
  async ({ showId, seatIds }, { rejectWithValue }) => {
    try {
      const response = await API.post('/bookings/lock-seats', { showId, seatIds });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const unlockSeatsThunk = createAsyncThunk(
  'booking/unlockSeats',
  async ({ showId, seatIds }, { rejectWithValue }) => {
    try {
      const response = await API.post('/bookings/unlock-seats', { showId, seatIds });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const payAndConfirmBooking = createAsyncThunk(
  'booking/payAndConfirmBooking',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await API.post('/bookings/pay', paymentData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMyBookings = createAsyncThunk(
  'booking/fetchMyBookings',
  async (tab = 'all', { rejectWithValue }) => {
    try {
      const response = await API.get(`/bookings/my?tab=${tab}`);
      return response.data.bookings;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchBookingById = createAsyncThunk(
  'booking/fetchBookingById',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const cancelBookingThunk = createAsyncThunk(
  'booking/cancelBooking',
  async ({ bookingId, reason }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/bookings/${bookingId}/cancel`, { reason });
      return response.data.booking;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchPaymentConfig = createAsyncThunk(
  'booking/fetchPaymentConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/payments/config');
      return response.data.config;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    show: null,
    seats: [],
    selectedSeats: [], // Array of seat objects { seatId, price, tier, row, number }
    lockExpiresAt: null,
    totalAmount: 0,
    activeBooking: null,
    myBookings: [],
    paymentConfig: { razorpayAvailable: false, razorpayKeyId: null },
    isLoading: false,
    isProcessingPayment: false,
    error: null,
  },
  reducers: {
    toggleSeatSelection: (state, action) => {
      const seat = action.payload;
      const index = state.selectedSeats.findIndex((s) => s.seatId === seat.seatId);
      if (index >= 0) {
        state.selectedSeats.splice(index, 1);
      } else {
        if (state.selectedSeats.length >= 10) return; // Max 10
        state.selectedSeats.push(seat);
      }
      state.totalAmount = state.selectedSeats.reduce((sum, s) => sum + s.price, 0);
    },
    clearSelectedSeats: (state) => {
      state.selectedSeats = [];
      state.totalAmount = 0;
      state.lockExpiresAt = null;
    },
    updateSeatStatusFromSocket: (state, action) => {
      const { seatIds, status, lockedBy } = action.payload;
      state.seats = state.seats.map((seat) => {
        if (seatIds.includes(seat.seatId)) {
          return {
            ...seat,
            status,
            isMine: lockedBy ? seat.isMine : false,
          };
        }
        return seat;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch seats
      .addCase(fetchShowSeats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchShowSeats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.show = action.payload.show;
        state.seats = action.payload.seats;
      })
      .addCase(fetchShowSeats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Lock seats
      .addCase(lockSeatsThunk.fulfilled, (state, action) => {
        state.lockExpiresAt = action.payload.lockExpiresAt;
        state.totalAmount = action.payload.totalAmount;
      })
      // Pay and confirm
      .addCase(payAndConfirmBooking.pending, (state) => {
        state.isProcessingPayment = true;
        state.error = null;
      })
      .addCase(payAndConfirmBooking.fulfilled, (state, action) => {
        state.isProcessingPayment = false;
        state.activeBooking = action.payload.booking;
        state.selectedSeats = [];
        state.lockExpiresAt = null;
      })
      .addCase(payAndConfirmBooking.rejected, (state, action) => {
        state.isProcessingPayment = false;
        state.error = action.payload;
      })
      // Fetch My Bookings
      .addCase(fetchMyBookings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myBookings = action.payload;
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Cancel Booking
      .addCase(cancelBookingThunk.fulfilled, (state, action) => {
        state.myBookings = state.myBookings.map((b) =>
          b._id === action.payload._id ? { ...b, status: 'cancelled' } : b
        );
      })
      // Payment config
      .addCase(fetchPaymentConfig.fulfilled, (state, action) => {
        state.paymentConfig = action.payload;
      });
  },
});

export const { toggleSeatSelection, clearSelectedSeats, updateSeatStatusFromSocket } =
  bookingSlice.actions;
export default bookingSlice.reducer;
