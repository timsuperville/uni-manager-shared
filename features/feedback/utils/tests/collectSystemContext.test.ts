import { describe, it, expect, beforeEach, vi } from 'vitest';
import { collectSystemContext } from '../collectSystemContext';

describe('collectSystemContext', () => {
  beforeEach(() => {
    // Clear potentially leaky state
    sessionStorage.clear();
  });

  it('should capture recentActivity from sessionStorage if available', () => {
    const mockActivities = [
      'Button "Submit" clicked',
      'Input "Email" focused',
      'Navigation to "/dashboard"'
    ];
    sessionStorage.setItem('userActivities', JSON.stringify(mockActivities));

    const context = collectSystemContext('test-app');

    expect(context.session.recentActivity).toBeDefined();
    expect(context.session.recentActivity).toEqual(mockActivities);
  });

  it('should return an empty array for recentActivity if sessionStorage is empty', () => {
    const context = collectSystemContext('test-app');

    expect(context.session.recentActivity).toBeDefined();
    expect(context.session.recentActivity).toEqual([]);
  });
});
