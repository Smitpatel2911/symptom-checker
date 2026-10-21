import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice.js';
import symptoms from './symptomSlice.js';
import doctors from './doctorSlice.js';
import appointments from './appointmentSlice.js';

export const store = configureStore({
  reducer: { auth, symptoms, doctors, appointments },
});
