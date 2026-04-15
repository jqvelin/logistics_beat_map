import type { CourseSummary, ProgressModule, ProgressResponse } from '@/lib/types';

export type HomeModuleRow = {
  moduleId: string;
  courseId: string;
  title: string;
  subtitle: string;
  completionRatio: number;
  status: 'completed' | 'active' | 'locked';
  percentLabel: string;
};

export function buildHomeModules(
  courses: CourseSummary[],
  progress: ProgressResponse | null,
): HomeModuleRow[] {
  const progressModules = progress?.courses.flatMap((course) =>
    course.modules.map((module) => ({
      ...module,
      courseId: course.courseId,
    })),
  );

  const sourceModules =
    progressModules && progressModules.length > 0
      ? progressModules
      : courses.flatMap((course) =>
          course.modules.map((module) => ({
            moduleId: module.id,
            courseId: course.id,
            title: module.title,
            totalLessons: module._count.lessons,
            completedLessons: 0,
            totalTasks: 0,
            completedTasks: 0,
            isCompleted: false,
            lessons: [],
          })),
        );

  return sourceModules.map((module, index) => {
    const isCompleted = module.isCompleted;
    const isActive =
      !isCompleted &&
      sourceModules.slice(0, index).every((previousModule) => previousModule.isCompleted);
    const completionRatio =
      module.totalTasks > 0
        ? module.completedTasks / module.totalTasks
        : module.totalLessons > 0
          ? module.completedLessons / module.totalLessons
          : 0;

    return {
      moduleId: module.moduleId,
      courseId: module.courseId,
      title: module.title,
      subtitle: isCompleted
        ? `Выполнено • ${module.totalLessons} уроков`
        : isActive
          ? `${module.completedLessons}/${module.totalLessons} уроков`
          : 'Закрыто • Завершите предыдущий урок',
      completionRatio,
      status: isCompleted ? 'completed' : isActive ? 'active' : 'locked',
      percentLabel: `${Math.round(completionRatio * 100)}%`,
    };
  });
}

export function findModuleByLessonId(
  progress: ProgressResponse | null,
  lessonId: string,
): ProgressModule | null {
  if (!progress) {
    return null;
  }

  for (const course of progress.courses) {
    for (const module of course.modules) {
      if (module.lessons.some((lesson) => lesson.lessonId === lessonId)) {
        return module;
      }
    }
  }

  return null;
}
