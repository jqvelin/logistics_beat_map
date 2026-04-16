import { env } from '@/lib/env';
import type {
  AchievementDefinition,
  AuthResponse,
  CompleteTaskResponse,
  CourseDetail,
  CourseSummary,
  Lesson,
  NextTaskResponse,
  ProgressResponse,
  QuickPracticeSession,
  User,
} from '@/lib/types';

type RequestOptions = RequestInit & {
  token?: string | null;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set('Content-Type', 'application/json');

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${env.apiUrl}${path}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      (payload &&
        typeof payload === 'object' &&
        'message' in payload &&
        typeof payload.message === 'string' &&
        payload.message) ||
      'Не удалось выполнить запрос к серверу';

    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export const api = {
  register(email: string, password: string) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  login(email: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  getMe(token: string) {
    return request<User>('/users/me', { token });
  },
  getCourses() {
    return request<CourseSummary[]>('/courses');
  },
  getCourse(courseId: string) {
    return request<CourseDetail>(`/courses/${courseId}`);
  },
  getLesson(lessonId: string) {
    return request<Lesson>(`/lessons/${lessonId}`);
  },
  getProgress(token: string) {
    return request<ProgressResponse>('/learning/progress', { token });
  },
  getAchievements(token: string) {
    return request<AchievementDefinition[]>('/learning/achievements', { token });
  },
  getQuickPracticeSession(token: string) {
    return request<QuickPracticeSession>('/learning/quick-practice', { token });
  },
  getNextTask(token: string) {
    return request<NextTaskResponse>('/learning/next-task', { token });
  },
  completeTask(token: string, taskId: string, selectedOptionIndex?: number) {
    return request<CompleteTaskResponse>('/learning/complete-task', {
      method: 'POST',
      token,
      body: JSON.stringify(
        selectedOptionIndex === undefined
          ? { taskId }
          : { taskId, selectedOptionIndex },
      ),
    });
  },
};
