/**
 * Centralized Query Key Factory
 *
 * This factory standardizes React Query keys across all Uni-Manager applications,
 * preventing cache collisions and providing a predictable structure for
 * query invalidation and optimistic updates.
 */

export const queryKeys = {
  // Personal App Domain
  personal: {
    all: ['personal'] as const,
    tasks: {
      all: () => [...queryKeys.personal.all, 'tasks'] as const,
      list: (filters?: Record<string, any>) =>
        filters
          ? ([...queryKeys.personal.tasks.all(), filters] as const)
          : queryKeys.personal.tasks.all(),
      detail: (id: string) => [...queryKeys.personal.tasks.all(), id] as const
    },
    secondBrain: {
      all: () => [...queryKeys.personal.all, 'secondBrain'] as const,
      list: (filters?: Record<string, any>) =>
        filters
          ? ([...queryKeys.personal.secondBrain.all(), filters] as const)
          : queryKeys.personal.secondBrain.all(),
      detail: (id: string) =>
        [...queryKeys.personal.secondBrain.all(), id] as const
    },
    profile: {
      all: () => [...queryKeys.personal.all, 'profile'] as const,
      stats: () => [...queryKeys.personal.profile.all(), 'stats'] as const
    },
    journal: {
      all: () => [...queryKeys.personal.all, 'journal'] as const,
      list: (filters?: Record<string, any>) =>
        filters
          ? ([...queryKeys.personal.journal.all(), filters] as const)
          : queryKeys.personal.journal.all(),
      detail: (id: string) => [...queryKeys.personal.journal.all(), id] as const
    },
    habits: {
      all: () => [...queryKeys.personal.all, 'habits'] as const,
      list: (filters?: Record<string, any>) =>
        filters
          ? ([...queryKeys.personal.habits.all(), filters] as const)
          : queryKeys.personal.habits.all(),
      detail: (id: string) => [...queryKeys.personal.habits.all(), id] as const
    },
    goals: {
      all: () => [...queryKeys.personal.all, 'goals'] as const,
      list: (filters?: Record<string, any>) =>
        filters
          ? ([...queryKeys.personal.goals.all(), filters] as const)
          : queryKeys.personal.goals.all(),
      detail: (id: string) => [...queryKeys.personal.goals.all(), id] as const
    },
    calendarBridge: {
      all: () => [...queryKeys.personal.all, 'calendarBridge'] as const,
      ghostNodes: (date: string) =>
        [
          ...queryKeys.personal.calendarBridge.all(),
          'ghostNodes',
          date
        ] as const
    }
  },

  // Finance Domain
  finance: {
    all: ['finance'] as const,
    overview: () => [...queryKeys.finance.all, 'all'] as const,
    accounts: {
      all: () => [...queryKeys.finance.all, 'accounts'] as const,
      list: (filters?: Record<string, any>) =>
        filters
          ? ([...queryKeys.finance.accounts.all(), filters] as const)
          : queryKeys.finance.accounts.all(),
      detail: (id: string) => [...queryKeys.finance.accounts.all(), id] as const
    },
    transactions: {
      all: () => [...queryKeys.finance.all, 'transactions'] as const,
      list: (filters?: Record<string, any>) =>
        filters
          ? ([...queryKeys.finance.transactions.all(), filters] as const)
          : queryKeys.finance.transactions.all(),
      detail: (id: string) =>
        [...queryKeys.finance.transactions.all(), id] as const
    },
    budget: {
      all: () => [...queryKeys.finance.all, 'budget'] as const
    },
    savings: {
      all: () => [...queryKeys.finance.all, 'savings'] as const,
      list: (filters?: Record<string, any>) =>
        filters
          ? ([...queryKeys.finance.savings.all(), filters] as const)
          : queryKeys.finance.savings.all(),
      detail: (id: string) => [...queryKeys.finance.savings.all(), id] as const
    },
    subscriptions: {
      all: () => [...queryKeys.finance.all, 'subscriptions'] as const,
      list: (filters?: Record<string, any>) =>
        filters
          ? ([...queryKeys.finance.subscriptions.all(), filters] as const)
          : queryKeys.finance.subscriptions.all(),
      detail: (id: string) =>
        [...queryKeys.finance.subscriptions.all(), id] as const
    }
  },

  // Church Domain
  church: {
    all: ['church'] as const
  },

  // Admin Domain
  admin: {
    all: ['admin'] as const
  }
};
