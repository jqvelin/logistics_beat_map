import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.progress.deleteMany();
  await prisma.task.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  const user1 = await prisma.user.create({
    data: {
      email: 'student@example.com',
      password: passwordHash,
      xp: 100,
      level: 2,
      streak: 3,
    },
  });

  await prisma.user.create({
    data: {
      email: 'learner@example.com',
      password: passwordHash,
      xp: 0,
      level: 1,
      streak: 0,
    },
  });

  const course = await prisma.course.create({
    data: {
      title: 'Introduction to Logistics',
    },
  });

  const mod = await prisma.module.create({
    data: {
      title: 'Warehousing basics',
      courseId: course.id,
    },
  });

  const lesson1 = await prisma.lesson.create({
    data: {
      title: 'Terminology',
      moduleId: mod.id,
    },
  });

  const lesson2 = await prisma.lesson.create({
    data: {
      title: 'Inventory flow',
      moduleId: mod.id,
    },
  });

  const task1 = await prisma.task.create({
    data: {
      lessonId: lesson1.id,
      type: 'quiz',
      content: {
        type: 'quiz',
        question: 'What does SKU stand for?',
        options: [
          'Stock Keeping Unit',
          'Shipping Key Utility',
          'Storage Kit Unit',
        ],
        answer: 0,
      },
    },
  });

  await prisma.task.create({
    data: {
      lessonId: lesson1.id,
      type: 'quiz',
      content: {
        type: 'quiz',
        question: 'Which mode is typically fastest for long distances?',
        options: ['Air freight', 'Sea freight', 'Rail'],
        answer: 0,
      },
    },
  });

  await prisma.task.create({
    data: {
      lessonId: lesson2.id,
      type: 'simulation',
      content: {
        type: 'simulation',
        scenario: 'Route a pallet from dock to staging.',
        steps: [],
      },
    },
  });

  await prisma.progress.create({
    data: {
      userId: user1.id,
      taskId: task1.id,
      completed: true,
      completedAt: new Date(),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
