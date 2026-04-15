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

const XP_PER_TASK = 25;

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

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

    return task;
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
      task,
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
    const utcDate = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return Math.floor(utcDate / 86_400_000);
  }
}
