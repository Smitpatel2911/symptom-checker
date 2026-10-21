import axios from 'axios';
import SymptomLog from '../models/SymptomLog.js';
import Doctor from '../models/Doctor.js';

const aiClient = () =>
  axios.create({
    baseURL: process.env.AI_SERVICE_URL,
    timeout: 15000, // free-tier hosts can take a while to wake up
    headers: { 'X-API-Key': process.env.AI_SERVICE_KEY || '' },
  });

function aiError(err, res) {
  if (err.response) {
    // Pass through validation errors (e.g. no recognisable symptoms)
    const status = err.response.status === 422 ? 400 : 502;
    const message =
      err.response.status === 422
        ? err.response.data?.detail || 'Invalid symptom input'
        : 'Symptom analysis service returned an error';
    return res.status(status).json({ message });
  }
  return res.status(503).json({ message: 'Symptom analysis service is unavailable. Please try again.' });
}

export async function listSymptoms(req, res) {
  try {
    const { data } = await aiClient().get('/symptoms');
    res.json(data);
  } catch (err) {
    aiError(err, res);
  }
}

export async function analyze(req, res) {
  const { symptoms = [], freeText, age, gender } = req.body;

  let ai;
  try {
    const { data } = await aiClient().post('/predict', {
      symptoms,
      free_text: freeText || null,
      age: age ?? null,
      gender: gender || null,
    });
    ai = data;
  } catch (err) {
    return aiError(err, res);
  }

  const log = await SymptomLog.create({
    user: req.user._id,
    symptoms: ai.matched_symptoms,
    freeText: freeText || '',
    age,
    gender,
    results: ai.results,
    recommendedSpecialty: ai.recommended_specialty,
    urgent: ai.urgent,
    urgentReasons: ai.urgent_reasons,
  });

  // Recommend doctors for the specialty; fall back to General Physicians if none exist
  const exact = new RegExp(`^${ai.recommended_specialty.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  let doctors = await Doctor.find({ specialty: exact }).sort({ rating: -1 });
  let fallback = false;
  if (doctors.length === 0) {
    doctors = await Doctor.find({ specialty: /^General Physician$/i }).sort({ rating: -1 });
    fallback = true;
  }

  res.status(201).json({
    log,
    doctors,
    fallbackToGeneralPhysician: fallback,
    disclaimer: ai.disclaimer,
  });
}

export async function history(req, res) {
  const logs = await SymptomLog.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ count: logs.length, logs });
}
