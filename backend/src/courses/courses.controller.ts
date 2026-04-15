import { Controller, Get, Param } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller()
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('courses')
  findAll() {
    return this.coursesService.findAll();
  }

  @Get('courses/:id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Get('lessons/:id')
  findLesson(@Param('id') id: string) {
    return this.coursesService.findLesson(id);
  }

  @Get('tasks/:id')
  findTask(@Param('id') id: string) {
    return this.coursesService.findTask(id);
  }
}
