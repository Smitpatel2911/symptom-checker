import Doctor, { DAYS } from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';

const SORTS = {
  rating: { rating: -1 },
  fees: { fees: 1 },
  experience: { experience: -1 },
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function listDoctors(req, res) {
  const { specialty, sort } = req.query;
  const filter = specialty ? { specialty: new RegExp(`^${escapeRegex(String(specialty))}$`, 'i') } : {};
  const doctors = await Doctor.find(filter).sort(SORTS[sort] || SORTS.rating);
  res.json({ count: doctors.length, doctors });
}

export async function listSpecialties(req, res) {
  const specialties = await Doctor.distinct('specialty');
  res.json({ specialties: specialties.sort() });
}

export async function getDoctor(req, res) {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  res.json({ doctor });
}

// Slots for a doctor on a given date, flagged if already booked
export async function getSlots(req, res) {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

  const { date } = req.query;
  const dayName = DAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
  const dayAvailability = doctor.availability.find((a) => a.day === dayName);
  const allSlots = dayAvailability ? [...dayAvailability.slots].sort() : [];

  const booked = await Appointment.find({ doctor: doctor._id, date, status: 'Confirmed' }).select('timeSlot');
  const bookedSet = new Set(booked.map((b) => b.timeSlot));

  res.json({
    date,
    day: dayName,
    slots: allSlots.map((time) => ({ time, available: !bookedSet.has(time) })),
  });
}

// ---- Admin only ----
export async function createDoctor(req, res) {
  const doctor = await Doctor.create(req.body);
  res.status(201).json({ doctor });
}

export async function updateDoctor(req, res) {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  res.json({ doctor });
}

export async function deleteDoctor(req, res) {
  const doctor = await Doctor.findByIdAndDelete(req.params.id);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  res.json({ message: 'Doctor deleted' });
}
