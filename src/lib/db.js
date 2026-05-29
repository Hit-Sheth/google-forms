import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in Development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    
    // Seed admin user after successful connection
    await seedAdminUser();
    
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

async function seedAdminUser() {
  try {
    // Dynamic import to avoid circular dependency or schema load order issue
    const User = mongoose.models.User || (await import('../models/User')).default;
    
    const adminEmail = 'hittsheth@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      console.log('Seeding Admin user...');
      const hashedPassword = await bcrypt.hash('123', 10);
      await User.create({
        name: 'Hitt Sheth',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });
      console.log('Admin user seeded successfully!');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

export default dbConnect;
