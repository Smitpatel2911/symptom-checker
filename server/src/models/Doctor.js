import mongoose from 'mongoose';

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const availabilitySchema = new mongoose.Schema(
  {
    day: { type: String, enum: DAYS, required: true },
    slots: [{ type: String, match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Slot must be HH:mm'] }],
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    specialty: { type: String, required: true, trim: true, index: true },
    experience: { type: Number, required: true, min: 0, max: 60 },
    fees: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 4, min: 0, max: 5 },
    bio: { type: String, trim: true, maxlength: 500, default: '' },
    availability: { type: [availabilitySchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Doctor', doctorSchema);
