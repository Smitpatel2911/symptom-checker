// DB-free smoke tests: routing, auth guard and input validation.
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret';
process.env.AI_SERVICE_URL = 'http://127.0.0.1:9';

const { default: app } = await import('../src/app.js');

describe('Smoke tests (no database)', () => {
  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('unknown route returns 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
  });

  test('protected route without token returns 401', async () => {
    const res = await request(app).get('/api/doctors');
    expect(res.status).toBe(401);
  });

  test('protected route with malformed token returns 401', async () => {
    const res = await request(app).get('/api/appointments/my').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token');
  });

  test('register rejects short password and bad email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'not-an-email', password: '123' });
    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['email', 'password']));
  });

  test('login rejects empty body', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});
