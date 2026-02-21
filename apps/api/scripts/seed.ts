/* eslint-disable no-console */
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { UserModel } from '../src/modules/users/user.model.js';

async function seed(): Promise<void> {
  await mongoose.connect(env.MONGO_URI);

  await UserModel.deleteMany({ mobile: { $in: ['9000000001', '9000000002'] } });

  await UserModel.insertMany([
    {
      name: 'System Admin',
      mobile: '9000000001',
      area: 'Adirai Central',
      role: 'super_admin',
      status: 'active',
      verifiedBadge: true,
      language: 'en',
    },
    {
      name: 'Demo User',
      mobile: '9000000002',
      area: 'Adirai East',
      role: 'user',
      status: 'active',
      language: 'ta',
    },
  ]);

  console.log('Seed complete');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

