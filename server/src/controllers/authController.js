import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

export async function register(req, res) {
  const { name, email, password } = req.body;
  if (await User.findOne({ email: email.toLowerCase() })) {
    return res.status(409).json({ message: 'Email already registered' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  // Public registration always creates a patient. Admins are created via the seed script.
  const user = await User.create({ name, email, passwordHash, role: 'patient' });
  res.status(201).json({ token: signToken(user), user: user.toSafeObject() });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  // Same message for both cases so attackers cannot discover which emails exist
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({ token: signToken(user), user: user.toSafeObject() });
}

export function me(req, res) {
  res.json({ user: req.user.toSafeObject() });
}
