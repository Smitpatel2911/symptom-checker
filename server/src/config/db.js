import dns from 'node:dns';
import mongoose from 'mongoose';

export async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) throw new Error('MONGO_URI is not set');
  if (process.env.DNS_SERVERS) dns.setServers(process.env.DNS_SERVERS.split(','));
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}