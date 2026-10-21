import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { getErrorMessage } from '../api/axios.js';

export const fetchMyAppointments = createAsyncThunk('appointments/mine', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/appointments/my');
    return data.appointments;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const bookAppointment = createAsyncThunk('appointments/book', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/appointments', payload);
    return data.appointment;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const cancelAppointment = createAsyncThunk('appointments/cancel', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/appointments/${id}/cancel`);
    return data.appointment;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState: { items: [], loading: false, booking: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAppointments.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchMyAppointments.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
      })
      .addCase(fetchMyAppointments.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(bookAppointment.pending, (s) => {
        s.booking = true;
      })
      .addCase(bookAppointment.fulfilled, (s) => {
        s.booking = false;
      })
      .addCase(bookAppointment.rejected, (s) => {
        s.booking = false;
      })
      .addCase(cancelAppointment.fulfilled, (s, a) => {
        const i = s.items.findIndex((x) => x._id === a.payload._id);
        if (i !== -1) s.items[i].status = a.payload.status;
      });
  },
});

export default appointmentSlice.reducer;
