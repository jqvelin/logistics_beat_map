import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Task } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CompleteTaskDto } from './dto/complete-task.dto';

type QuizTaskContent = {
  type: 'quiz';
  question: string;
  options: string[];
  answer: number;
};

type SanitizedQuizTaskContent = Omit<QuizTaskContent, 'answer'>;

const XP_PER_TASK = 25;

/** At least this many full lessons must be completed. */
const MIN_COMPLETED_LESSONS_FOR_QUICK_PRACTICE = 2;
/** Pool: completed quiz tasks the user may revisit. */
const MIN_COMPLETED_QUIZ_TASKS_FOR_QUICK_PRACTICE = 5;
/** Questions per quick practice session. */
const QUICK_PRACTICE_TASK_COUNT = 5;

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(userId: string) {
    const [completedProgress, courses] = await Promise.all([
      this.prisma.progress.findMany({
        where: {
          userId,
          completed: true,
        },
        select: {
          taskId: true,
          completedAt: true,
        },
      }),
      this.prisma.course.findMany({
        orderBy: { createdAt: 'asc' },
        include: {
          modules: {
            orderBy: { createdAt: 'asc' },
            include: {
              lessons: {
                orderBy: { createdAt: 'asc' },
                include: {
                  tasks: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const completedTaskIds = completedProgress.map((item) => item.taskId);
    const completedTaskIdSet = new Set(completedTaskIds);
    const todayDayNumber = this.toDayNumber(new Date());
    const tasksCompletedToday = completedProgress.filter((item) => {
      return item.completedAt && this.toDayNumber(item.completedAt) === todayDayNumber;
    }).length;

    const coursesProgress = courses.map((course) => {
      const modules = course.modules.map((module) => {
        const lessons = module.lessons.map((lesson) => {
          const totalTasks = lesson.tasks.length;
          const completedTasks = lesson.tasks.filter((task) =>
            completedTaskIdSet.has(task.id),
          ).length;

          return {
            lessonId: lesson.id,
            title: lesson.title,
            totalTasks,
            completedTasks,
            isCompleted: totalTasks > 0 && completedTasks === totalTasks,
          };
        });

        const totalLessons = lessons.length;
        const completedLessons = lessons.filter((lesson) => lesson.isCompleted).length;
        const totalTasks = lessons.reduce((sum, lesson) => sum + lesson.totalTasks, 0);
        const completedTasks = lessons.reduce(
          (sum, lesson) => sum + lesson.completedTasks,
          0,
        );

        return {
          moduleId: module.id,
          title: module.title,
          totalLessons,
          completedLessons,
          totalTasks,
          completedTasks,
          isCompleted: totalTasks > 0 && completedTasks === totalTasks,
          lessons,
        };
      });

      const totalModules = modules.length;
      const completedModules = modules.filter((module) => module.isCompleted).length;
      const totalLessons = modules.reduce((sum, module) => sum + module.totalLessons, 0);
      const completedLessons = modules.reduce(
        (sum, module) => sum + module.completedLessons,
        0,
      );
      const totalTasks = modules.reduce((sum, module) => sum + module.totalTasks, 0);
      const completedTasks = modules.reduce(
        (sum, module) => sum + module.completedTasks,
        0,
      );

      return {
        courseId: course.id,
        title: course.title,
        totalModules,
        completedModules,
        totalLessons,
        completedLessons,
        totalTasks,
        completedTasks,
        isCompleted: totalTasks > 0 && completedTasks === totalTasks,
        modules,
      };
    });

    const overview = coursesProgress.reduce(
      (summary, course) => ({
        totalCourses: summary.totalCourses + 1,
        completedCourses: summary.completedCourses + (course.isCompleted ? 1 : 0),
        totalModules: summary.totalModules + course.totalModules,
        completedModules: summary.completedModules + course.completedModules,
        totalLessons: summary.totalLessons + course.totalLessons,
        completedLessons: summary.completedLessons + course.completedLessons,
        totalTasks: summary.totalTasks + course.totalTasks,
        completedTasks: summary.completedTasks + course.completedTasks,
      }),
      {
        totalCourses: 0,
        completedCourses: 0,
        totalModules: 0,
        completedModules: 0,
        totalLessons: 0,
        completedLessons: 0,
        totalTasks: 0,
        completedTasks: 0,
      },
    );

    const completedQuizCount =
      completedTaskIds.length === 0
        ? 0
        : await this.prisma.task.count({
            where: {
              type: 'quiz',
              id: { in: completedTaskIds },
            },
          });

    const quickPracticeEligible =
      overview.completedLessons >= MIN_COMPLETED_LESSONS_FOR_QUICK_PRACTICE &&
      completedQuizCount >= MIN_COMPLETED_QUIZ_TASKS_FOR_QUICK_PRACTICE;

    return {
      completedTaskIds,
      tasksCompletedToday,
      xpGainedToday: tasksCompletedToday * XP_PER_TASK,
      overview,
      courses: coursesProgress,
      quickPracticeEligible,
    };
  }

  async getQuickPracticeSession(userId: string) {
    const progress = await this.getProgress(userId);

    if (!progress.quickPracticeEligible) {
      throw new BadRequestException(
        'Быстрая практика станет доступна после большего числа пройденных уроков и вопросов.',
      );
    }

    const quizTasks = await this.prisma.task.findMany({
      where: {
        type: 'quiz',
        id: { in: progress.completedTaskIds },
      },
    });

    if (quizTasks.length < QUICK_PRACTICE_TASK_COUNT) {
      throw new BadRequestException(
        'Недостаточно пройденных вопросов для подборки быстрой практики.',
      );
    }

    const pooled = this.shuffleArray(quizTasks);
    const picked = pooled.slice(0, QUICK_PRACTICE_TASK_COUNT);

    return {
      title: 'Быстрая практика',
      tasks: picked.map((task) => this.sanitizeTask(task)),
    };
  }

  async getNextTask(userId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        progress: {
          none: {
            userId,
            completed: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return null;
    }

    return this.sanitizeTask(task);
  }

  async completeTask(userId: string, dto: CompleteTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: dto.taskId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Задание не найдено');
    }

    this.validateQuizAnswer(task, dto);

    const existingProgress = await this.prisma.progress.findUnique({
      where: {
        userId_taskId: {
          userId,
          taskId: dto.taskId,
        },
      },
    });

    const completedAt = new Date();

    const progress = await this.prisma.progress.upsert({
      where: {
        userId_taskId: {
          userId,
          taskId: dto.taskId,
        },
      },
      update: {
        completed: true,
        completedAt,
      },
      create: {
        userId,
        taskId: dto.taskId,
        completed: true,
        completedAt,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        xp: true,
        level: true,
        streak: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    let updatedUser = user;

    if (!existingProgress?.completed) {
      updatedUser = await this.updateGamification(userId, user, completedAt);
    }

    return {
      task: this.sanitizeTask(task),
      progress,
      user: updatedUser,
      awardedXp: existingProgress?.completed ? 0 : XP_PER_TASK,
    };
  }

  private validateQuizAnswer(task: Task, dto: CompleteTaskDto) {
    if (task.type !== 'quiz') {
      return;
    }

    if (dto.selectedOptionIndex === undefined) {
      throw new BadRequestException(
        'Для задания типа quiz требуется selectedOptionIndex',
      );
    }

    const content = task.content as unknown as QuizTaskContent;
    const optionCount = Array.isArray(content.options) ? content.options.length : 0;

    if (
      optionCount === 0 ||
      dto.selectedOptionIndex < 0 ||
      dto.selectedOptionIndex >= optionCount
    ) {
      throw new BadRequestException('Некорректный номер варианта ответа');
    }

    if (content.answer !== dto.selectedOptionIndex) {
      throw new BadRequestException('Ответ неверный');
    }
  }

  private async updateGamification(
    userId: string,
    user: {
      id: string;
      email: string;
      xp: number;
      level: number;
      streak: number;
    },
    completedAt: Date,
  ) {
    const lastCompletedProgress = await this.prisma.progress.findFirst({
      where: {
        userId,
        completed: true,
        completedAt: {
          lt: completedAt,
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    const nextXp = user.xp + XP_PER_TASK;
    const nextLevel = Math.max(1, Math.floor(nextXp / 100) + 1);
    const nextStreak = this.calculateNextStreak(
      user.streak,
      lastCompletedProgress?.completedAt ?? null,
      completedAt,
    );

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        xp: nextXp,
        level: nextLevel,
        streak: nextStreak,
      },
      select: {
        id: true,
        email: true,
        xp: true,
        level: true,
        streak: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private calculateNextStreak(
    currentStreak: number,
    lastCompletedAt: Date | null,
    completedAt: Date,
  ) {
    if (!lastCompletedAt) {
      return 1;
    }

    const previousDay = this.toDayNumber(lastCompletedAt);
    const currentDay = this.toDayNumber(completedAt);
    const dayDiff = currentDay - previousDay;

    if (dayDiff <= 0) {
      return currentStreak;
    }

    if (dayDiff === 1) {
      return currentStreak + 1;
    }

    return 1;
  }

  private toDayNumber(date: Date) {
    const utcDate = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    );
    return Math.floor(utcDate / 86_400_000);
  }

  private shuffleArray<T>(items: T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j]!, out[i]!];
    }
    return out;
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

    return sanitizedContent as unknown as SanitizedQuizTaskContent;
  }
}
