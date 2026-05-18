import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { expect } from 'vitest';
import '@testing-library/jest-dom';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MockUser {
  id: number;
  name: string;
  email: string;
}

type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'>;

// ---------------------------------------------------------------------------
// Test wrapper with providers
// ---------------------------------------------------------------------------

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

export const renderWithProviders = (
  ui: React.ReactElement,
  options: RenderWithProvidersOptions = {}
): RenderResult => render(ui, { wrapper: Wrapper, ...options });

// ---------------------------------------------------------------------------
// Mock API responses
// ---------------------------------------------------------------------------

export const mockApiResponse = <T,>(data: T, status = 200): void => {
  const mockFetch = async () => ({
    ok: status < 400,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data)
  });

  const globalFetch = globalThis.fetch as unknown as {
    mockResolvedValue?: (v: unknown) => void;
  };

  if (globalFetch?.mockResolvedValue) {
    globalFetch.mockResolvedValue({
      ok: status < 400,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data)
    });
  } else {
    globalThis.fetch = () => mockFetch() as Promise<Response>;
  }
};

export const mockApiError = (error: string, status = 500): void => {
  const globalFetch = globalThis.fetch as unknown as {
    mockRejectedValue?: (v: unknown) => void;
  };
  if (globalFetch?.mockRejectedValue) {
    globalFetch.mockRejectedValue({ status, message: error });
  }
};

// ---------------------------------------------------------------------------
// Loading helpers
// ---------------------------------------------------------------------------

export const waitForLoadingToFinish = async (): Promise<void> => {
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
};

// ---------------------------------------------------------------------------
// Form helpers
// ---------------------------------------------------------------------------

export const fillForm = async (
  formData: Record<string, string>
): Promise<void> => {
  for (const [field, value] of Object.entries(formData)) {
    const input = screen.getByLabelText(new RegExp(field, 'i'));
    fireEvent.change(input, { target: { value } });
  }
};

// ---------------------------------------------------------------------------
// Auth mocks
// ---------------------------------------------------------------------------

export const mockAuthUser = (
  user: MockUser = { id: 1, name: 'Test User', email: 'test@example.com' }
): MockUser => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('authToken', 'mock-token');
    localStorage.setItem('user', JSON.stringify(user));
  }
  return user;
};

export const mockAuthLogout = (): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
};

// ---------------------------------------------------------------------------
// Component testing patterns
// ---------------------------------------------------------------------------

export const testComponentAccessibility = async (
  component: React.ReactElement
): Promise<void> => {
  const { container } = renderWithProviders(component);
  expect(container).toBeInTheDocument();
};

export const testComponentResponsiveness = (
  component: React.ReactElement
): void => {
  (globalThis as Record<string, unknown>)['innerWidth'] = 320;
  renderWithProviders(component);

  (globalThis as Record<string, unknown>)['innerWidth'] = 768;
  renderWithProviders(component);

  (globalThis as Record<string, unknown>)['innerWidth'] = 1024;
  renderWithProviders(component);
};

export { screen, fireEvent, waitFor };
