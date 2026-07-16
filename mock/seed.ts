import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_SALT_ROUNDS } from '../src/lib/coreconstants';

const prisma = new PrismaClient();

function readMockFile<T>(fileName: string): T {
  const filePath = path.join(__dirname, fileName);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

const mockUsers = readMockFile<Prisma.UserUncheckedCreateInput[]>('user.json');
const mockPosts = readMockFile<Prisma.PostUncheckedCreateInput[]>('post.json');
const mockComments =
  readMockFile<Prisma.CommentUncheckedCreateInput[]>('comment.json');

async function seedUsers() {
  for (const mockUser of mockUsers) {
    const hashedPassword = await bcrypt.hash(
      mockUser.password,
      DEFAULT_SALT_ROUNDS,
    );

    await prisma.user.upsert({
      where: { id: mockUser.id },
      update: {},
      create: { ...mockUser, password: hashedPassword },
    });
  }

  console.log(`✅ Seeded ${mockUsers.length} users`);
}

async function seedPosts() {
  for (const mockPost of mockPosts) {
    await prisma.post.upsert({
      where: { id: mockPost.id },
      update: {},
      create: mockPost,
    });
  }

  console.log(`✅ Seeded ${mockPosts.length} posts`);
}

async function seedComments() {
  for (const mockComment of mockComments) {
    await prisma.comment.upsert({
      where: { id: mockComment.id },
      update: {},
      create: mockComment,
    });
  }

  console.log(`✅ Seeded ${mockComments.length} comments`);
}

async function resetSequence(table: string) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1))`,
  );
}

async function main() {
  await seedUsers();
  await seedPosts();
  await seedComments();

  for (const table of ['User', 'Post', 'Comment']) {
    await resetSequence(table);
  }
}

main()
  .catch((e) => {
    console.error('Error during mock seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
