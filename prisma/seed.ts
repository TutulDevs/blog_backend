import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  DEFAULT_SALT_ROUNDS,
  StaffRole,
  StaffStatus,
} from '../src/lib/coreconstants';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin@123', DEFAULT_SALT_ROUNDS);

  const superAdmin = await prisma.staff.create({
    data: {
      email: 'admin@email.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: StaffRole.ADMIN,
      status: StaffStatus.ACTIVE,
    },
  });

  console.log('✅ Super admin created successfully:');
  console.log(`   Email: ${superAdmin.email}`);
  console.log(`   Role: ${superAdmin.role}`);
  console.log(`   ID: ${superAdmin.id}`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
