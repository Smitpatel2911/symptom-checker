import Appointment from '../models/Appointment.js';
import Doctor, { DAYS } from '../models/Doctor.js';
import SymptomLog from '../models/SymptomLog.js';

export async function createAppointment(req, res) {
  const { doctorId, date, timeSlot, symptomLogId, notes } = req.body;

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

  const today = new Date().toISOString().slice(0, 10);
  if (date < today) return res.status(400).json({ message: 'Cannot book an appointment in the past' });

  // The slot must exist in the doctor's weekly availability for that weekday
  const dayName = DAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
  const day = doctor.availability.find((a) => a.day === dayName);
  if (!day || !day.slots.includes(timeSlot)) {
    return res.status(400).json({ message: `Doctor is not available at ${timeSlot} on ${dayName}` });
  }

  // Attach a symptom report only if it belongs to this patient
  let symptomLog;
  if (symptomLogId) {
    symptomLog = await SymptomLog.findOne({ _id: symptomLogId, user: req.user._id });
    if (!symptomLog) return res.status(400).json({ message: 'Symptom report not found' });
  }

  try {
    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctor._id,
      date,
      timeSlot,
      symptomLog: symptomLog?._id,
      notes,
    });
    await appointment.populate('doctor', 'name specialty fees');
    res.status(201).json({ appointment });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This slot has just been booked. Please choose another.' });
    }
    throw err;
  }
}

export async function myAppointments(req, res) {
  const appointments = await Appointment.find({ patient: req.user._id })
    .populate('doctor', 'name specialty fees')
    .populate('symptomLog', 'recommendedSpecialty symptoms')
    .sort({ date: -1, timeSlot: -1 });
  res.json({ count: appointments.length, appointments });
}

export async function cancelAppointment(req, res) {
  // Only the owner can cancel their own appointment
  const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
  if (appointment.status === 'Cancelled') {
    return res.status(400).json({ message: 'Appointment is already cancelled' });
  }
  appointment.status = 'Cancelled';
  await appointment.save();
  res.json({ appointment });
}

// ---- Admin ----
export async function allAppointments(req, res) {
  const appointments = await Appointment.find()
    .populate('doctor', 'name specialty')
    .populate('patient', 'name email')
    .sort({ date: -1 });
  res.json({ count: appointments.length, appointments });
}
