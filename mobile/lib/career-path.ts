export type CareerMilestone = {
  title: string;
  summary: string;
  emoji: string;
};

/** Пример типичной траектории для целевой роли «менеджер по логистике» в компаниях РФ. */
export const LOGISTICS_MANAGER_CAREER_MILESTONES: CareerMilestone[] = [
  {
    emoji: '📋',
    title: 'Специалист по логистике',
    summary:
      'Заявки на перевозку, маршруты, базовые документы (накладные, ЭТрН), взаимодействие с перевозчиками и складом.',
  },
  {
    emoji: '🧭',
    title: 'Ведущий логист / координатор',
    summary:
      'Оптимизация поставок, контроль SLA, переговоры по тарифам, закрепление типовых сценариев доставки.',
  },
  {
    emoji: '👥',
    title: 'Руководитель группы логистики',
    summary:
      'Постановка задач команде, распределение нагрузки, контроль операционных показателей участка.',
  },
  {
    emoji: '📊',
    title: 'Менеджер по логистике',
    summary:
      'Ответственность за процессы и бюджет логистики: склад, транспорт, взаимодействие с продажами и закупками.',
  },
  {
    emoji: '🏛️',
    title: 'Директор по логистике / руководитель SCM',
    summary:
      'Стратегия цепочки поставок, договорная работа, цифровизация (WMS/TMS), KPI и развитие сервиса.',
  },
];

/**
 * Индекс текущего этапа карьеры по доле завершённых курсов (0 … milestones-1).
 * При отсутствии курсов в каталоге возвращается 0.
 */
export function getCareerStepIndexFromCourses(
  completedCourses: number,
  totalCourses: number,
  milestonesCount = LOGISTICS_MANAGER_CAREER_MILESTONES.length,
): number {
  if (milestonesCount <= 0) {
    return 0;
  }
  if (totalCourses <= 0) {
    return 0;
  }
  const ratio = completedCourses / totalCourses;
  if (ratio >= 1) {
    return milestonesCount - 1;
  }
  return Math.min(Math.floor(ratio * milestonesCount), milestonesCount - 1);
}
