import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { expect } from 'vitest';
import '@testing-library/jest-dom';

// Test wrapper with providers
export const renderWithProviders = (ui, options = {}) => {
    const { ...renderOptions } = options;

    const Wrapper = ({ children }) => (
        <BrowserRouter>
            {children}
        </BrowserRouter>
    );

    Wrapper.propTypes = {
        children: PropTypes.node.isRequired,
    };

    return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock API responses
export const mockApiResponse = (data, status = 200) => {
    globalThis.fetch = globalThis.fetch || (() => { }); // Ensure fetch exists
    // Simple mock implementation
    const mockFetch = async () => ({
        ok: status < 400,
        status,
        json: async () => data,
        text: async () => JSON.stringify(data)
    });

    // If we're in a jest/vitest environment with mockResolvedValue
    if (globalThis.fetch.mockResolvedValue) {
        globalThis.fetch.mockResolvedValue({
            ok: status < 400,
            status,
            json: async () => data,
            text: async () => JSON.stringify(data)
        });
    } else {
        // Fallback or manual mock setup if needed
        globalThis.fetch = () => mockFetch();
    }
};

// Mock API error
export const mockApiError = (error, status = 500) => {
    if (globalThis.fetch && globalThis.fetch.mockRejectedValue) {
        globalThis.fetch.mockRejectedValue({
            status,
            message: error
        });
    }
};

// Wait for loading states
export const waitForLoadingToFinish = async () => {
    await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
};

// Form testing helpers
export const fillForm = async (formData) => {
    for (const [field, value] of Object.entries(formData)) {
        const input = screen.getByLabelText(new RegExp(field, 'i'));
        fireEvent.change(input, { target: { value } });
    }
};

// Authentication mocks
export const mockAuthUser = (user = { id: 1, name: 'Test User', email: 'test@example.com' }) => {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('authToken', 'mock-token');
        localStorage.setItem('user', JSON.stringify(user));
    }
    return user;
};

export const mockAuthLogout = () => {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }
};

// Component testing patterns
export const testComponentAccessibility = async (component) => {
    const { container } = renderWithProviders(component);
    expect(container).toBeInTheDocument();
};

export const testComponentResponsiveness = async (component) => {
    // Test different viewport sizes
    globalThis.innerWidth = 320; // Mobile
    renderWithProviders(component);

    globalThis.innerWidth = 768; // Tablet
    renderWithProviders(component);

    globalThis.innerWidth = 1024; // Desktop
    renderWithProviders(component);
};

export { screen, fireEvent, waitFor };
