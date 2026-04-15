import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { LearningService } from './learning.service';

@Controller('learning')
@UseGuards(JwtAuthGuard)
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Get('progress')
  getProgress(@CurrentUser() user: { sub: string }) {
    return this.learningService.getProgress(user.sub);
  }

  @Get('next-task')
  async getNextTask(@CurrentUser() user: { sub: string }) {
    const task = await this.learningService.getNextTask(user.sub);

    if (!task) {
      return {
        message: 'Все задания уже завершены',
        task: null,
      };
    }

    return task;
  }

  @Post('complete-task')
  @HttpCode(200)
  completeTask(
    @CurrentUser() user: { sub: string },
    @Body() dto: CompleteTaskDto,
  ) {
    return this.learningService.completeTask(user.sub, dto);
  }
}
