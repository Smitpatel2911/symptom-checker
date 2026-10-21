import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'] },
    timeSlot: { type: String, required: true, match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Slot must be HH:mm'] },
    status: { type: String, enum: ['Confirmed', 'Cancelled'], default: 'Confirmed' },
    symptomLog: { type: mongoose.Schema.Types.ObjectId, ref: 'SymptomLog' },
    notes: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

// Prevents double booking: only one *Confirmed* appointment per doctor/date/slot.
// Cancelled appointments free the slot again.
appointmentSchema.index(
  { doctor: 1, date: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { status: 'Confirmed' } }
);

export default mongoose.model('Appointment', appointmentSchema);
