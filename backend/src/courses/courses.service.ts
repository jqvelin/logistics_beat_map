import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type QuizTaskContent = {
  type: 'quiz';
  question: string;
  options: string[];
  answer: number;
};

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

    return {
      ...course,
      modules: course.modules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => ({
          ...lesson,
          tasks: lesson.tasks.map((task) => this.sanitizeTask(task)),
        })),
      })),
    };
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

    return {
      ...lesson,
      tasks: lesson.tasks.map((task) => this.sanitizeTask(task)),
    };
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

    return this.sanitizeTask(task);
  }

  private sanitizeTask<T extends { type: string; content: Prisma.JsonValue }>(task: T) {
    return {
      ...task,
      content: this.sanitizeTaskContent(task.type, task.content),
    };
  }

  private sanitizeTaskContent(type: string, content: Prisma.JsonValue) {
    if (type !== 'quiz' || !content || Array.isArray(content) || typeof content !== 'object') {
      return content;
    }

    const { answer: _answer, ...sanitizedContent } =
      content as unknown as QuizTaskContent;

    return sanitizedContent;
  }
}
