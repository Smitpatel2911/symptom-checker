// Integration tests against an in-memory MongoDB and a fake AI service.
// NOTE: mongodb-memory-server downloads a MongoDB binary on first run (needs internet).
import http from 'node:http';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

const AI_RESPONSE = {
  matched_symptoms: ['cough', 'fever'],
  results: [
    { name: 'Influenza (Flu)', specialty: 'General Physician', severity: 'medium', confidence: 76.9 },
  ],
  recommended_specialty: 'General Physician',
  urgent: false,
  urgent_reasons: [],
  disclaimer: 'This is not a medical diagnosis. Please consult a qualified doctor.',
};

// Next Monday strictly in the future, as YYYY-MM-DD
function nextMonday() {
  const d = new Date();
  do {
    d.setUTCDate(d.getUTCDate() + 1);
  } while (d.getUTCDay() !== 1);
  return d.toISOString().slice(0, 10);
}

let mongod, aiServer, app, User, Doctor, Appointment;
let tokenA, tokenB, adminToken, doctorId, logId, appointmentId;
const monday = nextMonday();

const auth = (t) => ({ Authorization: `Bearer ${t}` });

beforeAll(async () => {
  aiServer = http.createServer((req, res) => {
    req.on('data', () => {});
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/predict') return res.end(JSON.stringify(AI_RESPONSE));
      if (req.url === '/symptoms') return res.end(JSON.stringify({ symptoms: ['cough', 'fever'] }));
      res.statusCode = 404;
      res.end('{}');
    });
  });
  await new Promise((resolve) => aiServer.listen(0, resolve));

  process.env.JWT_SECRET = 'test-secret';
  process.env.AI_SERVICE_URL = `http://127.0.0.1:${aiServer.address().port}`;

  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  ({ default: app } = await import('../src/app.js'));
  ({ default: User } = await import('../src/models/User.js'));
  ({ default: Doctor } = await import('../src/models/Doctor.js'));
  ({ default: Appointment } = await import('../src/models/Appointment.js'));
  await Appointment.init(); // make sure the unique partial index exists

  const doctor = await Doctor.create({
    name: 'Dr. Test',
    specialty: 'General Physician',
    experience: 5,
    fees: 300,
    availability: [{ day: 'Mon', slots: ['10:00', '10:30'] }],
  });
  doctorId = doctor._id.toString();

  await User.create({
    name: 'Admin',
    email: 'admin@test.com',
    passwordHash: await bcrypt.hash('AdminPass123', 4),
    role: 'admin',
  });
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
  if (aiServer) await new Promise((resolve) => aiServer.close(resolve));
});

describe('Auth', () => {
  test('register succeeds and never returns the password hash', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Patient A', email: 'a@test.com', password: 'Password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('patient');
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
    tokenA = res.body.token;
  });

  test('duplicate email returns 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Patient A', email: 'a@test.com', password: 'Password123' });
    expect(res.status).toBe(409);
  });

  test('wrong password returns 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@test.com', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  test('login works and /me returns the user', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'a@test.com', password: 'Password123' });
    expect(login.status).toBe(200);
    const me = await request(app).get('/api/auth/me').set(auth(login.body.token));
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('a@test.com');
  });

  test('second patient and admin can log in', async () => {
    const b = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Patient B', email: 'b@test.com', password: 'Password123' });
    tokenB = b.body.token;
    const admin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'AdminPass123' });
    expect(admin.status).toBe(200);
    expect(admin.body.user.role).toBe('admin');
    adminToken = admin.body.token;
  });
});

describe('Symptom checker', () => {
  test('analyze returns a log and recommended doctors', async () => {
    const res = await request(app)
      .post('/api/symptoms/analyze')
      .set(auth(tokenA))
      .send({ symptoms: ['fever', 'cough'], age: 25, gender: 'female' });
    expect(res.status).toBe(201);
    expect(res.body.log.recommendedSpecialty).toBe('General Physician');
    expect(res.body.doctors).toHaveLength(1);
    logId = res.body.log._id;
  });

  test('analyze requires authentication', async () => {
    const res = await request(app).post('/api/symptoms/analyze').send({ symptoms: ['fever'] });
    expect(res.status).toBe(401);
  });

  test('analyze validates age', async () => {
    const res = await request(app).post('/api/symptoms/analyze').set(auth(tokenA)).send({ symptoms: ['fever'], age: 500 });
    expect(res.status).toBe(400);
  });

  test('history lists only my logs', async () => {
    const mine = await request(app).get('/api/symptoms/history').set(auth(tokenA));
    expect(mine.body.count).toBe(1);
    const other = await request(app).get('/api/symptoms/history').set(auth(tokenB));
    expect(other.body.count).toBe(0);
  });
});

describe('Doctors', () => {
  test('filter by specialty', async () => {
    const res = await request(app).get('/api/doctors?specialty=general physician').set(auth(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  test('patient cannot create a doctor (403)', async () => {
    const res = await request(app)
      .post('/api/doctors')
      .set(auth(tokenA))
      .send({ name: 'Dr. X', specialty: 'Dentist', experience: 3, fees: 200 });
    expect(res.status).toBe(403);
  });

  test('admin can create a doctor', async () => {
    const res = await request(app)
      .post('/api/doctors')
      .set(auth(adminToken))
      .send({ name: 'Dr. X', specialty: 'Dentist', experience: 3, fees: 200 });
    expect(res.status).toBe(201);
  });
});

describe('Appointments', () => {
  test('slots show both times as available', async () => {
    const res = await request(app).get(`/api/doctors/${doctorId}/slots?date=${monday}`).set(auth(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.slots).toEqual([
      { time: '10:00', available: true },
      { time: '10:30', available: true },
    ]);
  });

  test('book an appointment with a symptom report', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set(auth(tokenA))
      .send({ doctorId, date: monday, timeSlot: '10:00', symptomLogId: logId });
    expect(res.status).toBe(201);
    expect(res.body.appointment.status).toBe('Confirmed');
    appointmentId = res.body.appointment._id;
  });

  test('double booking the same slot returns 409', async () => {
    const res = await request(app).post('/api/appointments').set(auth(tokenB)).send({ doctorId, date: monday, timeSlot: '10:00' });
    expect(res.status).toBe(409);
  });

  test('slot is now flagged unavailable', async () => {
    const res = await request(app).get(`/api/doctors/${doctorId}/slots?date=${monday}`).set(auth(tokenB));
    expect(res.body.slots.find((s) => s.time === '10:00').available).toBe(false);
  });

  test('time outside availability returns 400', async () => {
    const res = await request(app).post('/api/appointments').set(auth(tokenB)).send({ doctorId, date: monday, timeSlot: '18:00' });
    expect(res.status).toBe(400);
  });

  test('past date returns 400', async () => {
    const res = await request(app).post('/api/appointments').set(auth(tokenB)).send({ doctorId, date: '2020-01-06', timeSlot: '10:00' });
    expect(res.status).toBe(400);
  });

  test("another user cannot cancel someone else's appointment", async () => {
    const res = await request(app).patch(`/api/appointments/${appointmentId}/cancel`).set(auth(tokenB));
    expect(res.status).toBe(404);
  });

  test('owner can cancel, and the slot becomes bookable again', async () => {
    const cancel = await request(app).patch(`/api/appointments/${appointmentId}/cancel`).set(auth(tokenA));
    expect(cancel.status).toBe(200);
    expect(cancel.body.appointment.status).toBe('Cancelled');

    const rebook = await request(app).post('/api/appointments').set(auth(tokenB)).send({ doctorId, date: monday, timeSlot: '10:00' });
    expect(rebook.status).toBe(201);
  });

  test('my appointments lists only my own', async () => {
    const res = await request(app).get('/api/appointments/my').set(auth(tokenA));
    expect(res.body.count).toBe(1);
    expect(res.body.appointments[0].status).toBe('Cancelled');
  });
});
