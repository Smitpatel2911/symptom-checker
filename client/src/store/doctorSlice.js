import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { getErrorMessage } from '../api/axios.js';

export const fetchDoctors = createAsyncThunk('doctors/fetch', async ({ specialty, sort } = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/doctors', { params: { specialty: specialty || undefined, sort: sort || undefined } });
    return data.doctors;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const fetchSpecialties = createAsyncThunk('doctors/specialties', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/doctors/specialties');
    return data.specialties;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const doctorSlice = createSlice({
  name: 'doctors',
  initialState: { items: [], specialties: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctors.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchDoctors.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
      })
      .addCase(fetchDoctors.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(fetchSpecialties.fulfilled, (s, a) => {
        s.specialties = a.payload;
      });
  },
});

export default doctorSlice.reducer;
