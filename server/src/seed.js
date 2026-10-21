// Seeds demo doctors and an admin user.
// Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='...' npm run seed
// (or put them in your local .env). Safe to run multiple times.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Doctor from './models/Doctor.js';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const morning = ['10:00', '10:30', '11:00', '11:30'];
const afternoon = ['14:00', '14:30', '15:00', '15:30', '16:00'];
const avail = (days, slots) => days.map((day) => ({ day, slots }));

// Fictional demo data
const doctors = [
  { name: 'Dr. Aarav Mehta', specialty: 'General Physician', experience: 12, fees: 500, rating: 4.6, bio: 'Family medicine and preventive care.', availability: avail(weekdays, [...morning, ...afternoon]) },
  { name: 'Dr. Neha Shah', specialty: 'General Physician', experience: 8, fees: 400, rating: 4.4, bio: 'Fever, infections and lifestyle disorders.', availability: avail(['Mon', 'Wed', 'Fri', 'Sat'], morning) },
  { name: 'Dr. Rohan Desai', specialty: 'Pulmonologist', experience: 15, fees: 900, rating: 4.8, bio: 'Asthma, COPD and respiratory infections.', availability: avail(weekdays, afternoon) },
  { name: 'Dr. Kavya Iyer', specialty: 'Neurologist', experience: 14, fees: 1000, rating: 4.7, bio: 'Migraine, epilepsy and neuropathy.', availability: avail(['Tue', 'Thu', 'Sat'], [...morning, ...afternoon]) },
  { name: 'Dr. Vikram Patel', specialty: 'Cardiologist', experience: 20, fees: 1200, rating: 4.9, bio: 'Hypertension, arrhythmia and heart disease.', availability: avail(weekdays, morning) },
  { name: 'Dr. Ananya Joshi', specialty: 'Gastroenterologist', experience: 10, fees: 800, rating: 4.5, bio: 'Digestive disorders and liver care.', availability: avail(['Mon', 'Tue', 'Thu'], afternoon) },
  { name: 'Dr. Sameer Khan', specialty: 'Dermatologist', experience: 9, fees: 700, rating: 4.3, bio: 'Skin, hair and allergy conditions.', availability: avail(weekdays, [...morning, ...afternoon]) },
  { name: 'Dr. Priya Nair', specialty: 'Orthopedist', experience: 13, fees: 850, rating: 4.6, bio: 'Joint pain, arthritis and sports injuries.', availability: avail(['Mon', 'Wed', 'Fri'], afternoon) },
  { name: 'Dr. Arjun Rao', specialty: 'Endocrinologist', experience: 11, fees: 900, rating: 4.5, bio: 'Diabetes, thyroid and hormonal disorders.', availability: avail(['Tue', 'Thu'], [...morning, ...afternoon]) },
  { name: 'Dr. Meera Kulkarni', specialty: 'ENT Specialist', experience: 7, fees: 600, rating: 4.2, bio: 'Ear, nose and throat conditions.', availability: avail(weekdays, morning) },
  { name: 'Dr. Rahul Gupta', specialty: 'Dentist', experience: 6, fees: 350, rating: 4.1, bio: 'General dentistry and oral care.', availability: avail(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], afternoon) },
  { name: 'Dr. Ishita Banerjee', specialty: 'Psychiatrist', experience: 12, fees: 1100, rating: 4.7, bio: 'Anxiety, depression and sleep disorders.', availability: avail(['Wed', 'Fri', 'Sat'], [...morning, ...afternoon]) },
];

async function run() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars) before seeding.');
    process.exit(1);
  }
  await connectDB();

  for (const d of doctors) {
    await Doctor.updateOne({ name: d.name }, { $set: d }, { upsert: true });
  }
  console.log(`Doctors seeded: ${doctors.length}`);

  const email = ADMIN_EMAIL.toLowerCase();
  if (!(await User.findOne({ email }))) {
    await User.create({
      name: 'Admin',
      email,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
      role: 'admin',
    });
    console.log(`Admin created: ${email}`);
  } else {
    console.log(`Admin already exists: ${email}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
