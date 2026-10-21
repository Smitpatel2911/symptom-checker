import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { getErrorMessage } from '../api/axios.js';

export const fetchSymptomList = createAsyncThunk('symptoms/list', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/symptoms/list');
    return data.symptoms;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const analyzeSymptoms = createAsyncThunk('symptoms/analyze', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/symptoms/analyze', payload);
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const fetchHistory = createAsyncThunk('symptoms/history', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/symptoms/history');
    return data.logs;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const symptomSlice = createSlice({
  name: 'symptoms',
  initialState: {
    list: [],
    listLoading: false,
    listError: null,
    result: null, // { log, doctors, fallbackToGeneralPhysician, disclaimer }
    analyzing: false,
    analyzeError: null,
    history: [],
    historyLoading: false,
  },
  reducers: {
    clearResult(state) {
      state.result = null;
      state.analyzeError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSymptomList.pending, (s) => {
        s.listLoading = true;
        s.listError = null;
      })
      .addCase(fetchSymptomList.fulfilled, (s, a) => {
        s.listLoading = false;
        s.list = a.payload;
      })
      .addCase(fetchSymptomList.rejected, (s, a) => {
        s.listLoading = false;
        s.listError = a.payload;
      })
      .addCase(analyzeSymptoms.pending, (s) => {
        s.analyzing = true;
        s.analyzeError = null;
      })
      .addCase(analyzeSymptoms.fulfilled, (s, a) => {
        s.analyzing = false;
        s.result = a.payload;
      })
      .addCase(analyzeSymptoms.rejected, (s, a) => {
        s.analyzing = false;
        s.analyzeError = a.payload;
      })
      .addCase(fetchHistory.pending, (s) => {
        s.historyLoading = true;
      })
      .addCase(fetchHistory.fulfilled, (s, a) => {
        s.historyLoading = false;
        s.history = a.payload;
      })
      .addCase(fetchHistory.rejected, (s) => {
        s.historyLoading = false;
      });
  },
});

export const { clearResult } = symptomSlice.actions;
export default symptomSlice.reducer;
