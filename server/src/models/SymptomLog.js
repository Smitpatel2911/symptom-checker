import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    name: String,
    specialty: String,
    severity: String,
    confidence: Number,
  },
  { _id: false }
);

const symptomLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    symptoms: [{ type: String }],
    freeText: { type: String, default: '' },
    age: Number,
    gender: String,
    results: [resultSchema],
    recommendedSpecialty: { type: String, required: true },
    urgent: { type: Boolean, default: false },
    urgentReasons: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model('SymptomLog', symptomLogSchema);
