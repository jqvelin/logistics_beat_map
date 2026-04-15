import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.course.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        modules: {
          orderBy: { createdAt: 'asc' },
          include: {
            _count: {
              select: {
                lessons: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { createdAt: 'asc' },
          include: {
            lessons: {
              orderBy: { createdAt: 'asc' },
              include: {
                tasks: {
                  orderBy: { createdAt: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Курс не найден');
    }

    return course;
  }

  async findLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            courseId: true,
          },
        },
        tasks: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Урок не найден');
    }

    return lesson;
  }

  async findTask(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            moduleId: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Задание не найдено');
    }

    return task;
  }
}
