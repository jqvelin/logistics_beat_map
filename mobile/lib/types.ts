export type User = {
  id: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type QuizTaskContent = {
  type: 'quiz';
  question: string;
  options: string[];
};

export type SimulationTaskContent = {
  type: 'simulation';
  scenario: string;
  steps: string[];
};

export type TaskContent = QuizTaskContent | SimulationTaskContent;

export type LessonTask = {
  id: string;
  type: 'quiz' | 'simulation';
  content: TaskContent;
  createdAt?: string;
  updatedAt?: string;
};

export type Lesson = {
  id: string;
  title: string;
  module: {
    id: string;
    title: string;
    courseId: string;
  };
  tasks: LessonTask[];
};

export type CourseModuleSummary = {
  id: string;
  title: string;
  _count: {
    lessons: number;
  };
};

export type CourseSummary = {
  id: string;
  title: string;
  modules: CourseModuleSummary[];
  createdAt: string;
  updatedAt: string;
};

export type CourseTask = LessonTask;

export type CourseLesson = {
  id: string;
  title: string;
  tasks: CourseTask[];
  createdAt: string;
  updatedAt: string;
};

export type CourseModule = {
  id: string;
  title: string;
  lessons: CourseLesson[];
  createdAt: string;
  updatedAt: string;
};

export type CourseDetail = {
  id: string;
  title: string;
  modules: CourseModule[];
  createdAt: string;
  updatedAt: string;
};

export type ProgressLesson = {
  lessonId: string;
  title: string;
  totalTasks: number;
  completedTasks: number;
  isCompleted: boolean;
};

export type ProgressModule = {
  moduleId: string;
  title: string;
  totalLessons: number;
  completedLessons: number;
  totalTasks: number;
  completedTasks: number;
  isCompleted: boolean;
  lessons: ProgressLesson[];
};

export type ProgressCourse = {
  courseId: string;
  title: string;
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  completedLessons: number;
  totalTasks: number;
  completedTasks: number;
  isCompleted: boolean;
  modules: ProgressModule[];
};

export type ProgressOverview = {
  totalCourses: number;
  completedCourses: number;
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  completedLessons: number;
  totalTasks: number;
  completedTasks: number;
};

export type ProgressResponse = {
  completedTaskIds: string[];
  tasksCompletedToday: number;
  xpGainedToday: number;
  overview: ProgressOverview;
  courses: ProgressCourse[];
};

export type NextTaskResponse =
  | {
      message: string;
      task: null;
    }
  | (LessonTask & {
      lesson: {
        id: string;
        title: string;
        module: {
          id: string;
          title: string;
          course: {
            id: string;
            title: string;
          };
        };
      };
    });

export type CompleteTaskResponse = {
  task: LessonTask & {
    lesson?: {
      id: string;
      title: string;
      module?: {
        id: string;
        title: string;
        course?: {
          id: string;
          title: string;
        };
      };
    };
  };
  progress: {
    id: string;
    userId: string;
    taskId: string;
    completed: boolean;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  user: User;
  awardedXp: number;
};
