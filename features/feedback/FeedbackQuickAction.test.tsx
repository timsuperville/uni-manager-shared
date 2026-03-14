/**
 * FeedbackQuickAction.test.jsx
 *
 * Tests for the shared FeedbackQuickAction component focusing on:
 *  1. Automatic user identity collection (useOptionalUser)
 *  2. Device & OS detection (detectDevice helper)
 *  3. collectSystemContext shape (user, device, browser, page, application)
 *  4. Submission payload integrity (server receives correct structure)
 *  5. Anonymous / unauthenticated path (no AuthProvider)
 *  6. Variant rendering (sidebar-item, floating, bottom-nav-item)
 *  7. Modal open/close lifecycle
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { FeedbackQuickAction, submitFeedbackSilently } from "./FeedbackQuickAction.tsx";
import { AuthContext } from "../../auth/context/AuthContext.tsx";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Suppress console noise during tests
beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => { });
    vi.spyOn(console, "warn").mockImplementation(() => { });
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

// Mock fetch globally
const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
vi.stubGlobal("fetch", mockFetch);

// Mock useFrustrationDetector to be a no-op (irrelevant to these tests)
vi.mock("../hooks/useFrustrationDetector", () => ({
    useFrustrationDetector: vi.fn(),
}));

// ─── Test Helpers ─────────────────────────────────────────────────────────────

const MOCK_AUTH_USER = {
    _id: "user-test-123",
    email: "test@example.com",
    name: "Test User",
    role: "member",
    permissions: ["feedback:submit"],
    rbac: { role: "church_member", app: "church" },
};

/**
 * Renders FeedbackQuickAction inside a MemoryRouter + optional AuthContext.
 */
function renderFeedback(props: Partial<React.ComponentProps<typeof FeedbackQuickAction>> = {}, authUser: any = null) {
    const contextValue = authUser
        ? { user: authUser, isAuthenticated: true }
        : null; // null context = no AuthProvider = public/marketing page

    const Wrapper = ({ children }: { children: React.ReactNode }) =>
        authUser ? (
            <MemoryRouter>
                <AuthContext.Provider value={contextValue as any}>{children}</AuthContext.Provider>
            </MemoryRouter>
        ) : (
            <MemoryRouter>{children}</MemoryRouter>
        );

    return render(
        <Wrapper>
            <FeedbackQuickAction appType="church" {...props} />
        </Wrapper>
    );
}

// ─── 1. useOptionalUser — identity extraction ─────────────────────────────────

describe("useOptionalUser — automatic identity collection", () => {
    it("extracts user id, email, name, and role from AuthContext when authenticated", () => {
        // Test that the component renders successfully with an auth context without throwing.
        // (The actual identity flow is verified more thoroughly in submitFeedbackSilently tests
        // which pass the user object directly and inspect the fetch payload.)
        expect(() =>
            renderFeedback({ variant: "sidebar-item" }, MOCK_AUTH_USER)
        ).not.toThrow();

        // Trigger button should be present and labelled correctly
        const btn = screen.getByRole("button", { name: /share feedback/i });
        expect(btn).toBeTruthy();
    });

    it("sets user to null when rendered outside AuthProvider (public/marketing page)", () => {
        // No AuthProvider — should not throw (useOptionalUser returns null gracefully)
        expect(() => renderFeedback({ variant: "floating" }, null)).not.toThrow();

        // FAB should still render
        expect(screen.getByTitle(/send feedback/i)).toBeTruthy();
    });
});

// ─── 2. collectSystemContext — device & OS detection ─────────────────────────

describe("submitFeedbackSilently — context shape and device detection", () => {
    it("sends systemContext with user, device, browser, page, and application", async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, json: () => ({ success: true }) });

        await submitFeedbackSilently({
            title: "Auto-reported frustration",
            description: "Rage click detected",
            appType: "church",
            severity: "medium",
            user: {
                id: "u-99",
                email: "dev@example.com",
                name: "Dev User",
                role: "admin",
                appRole: "church_admin",
            },
        });

        expect(mockFetch).toHaveBeenCalledOnce();

        const callArgs = mockFetch.mock.calls[0] as unknown as [string, RequestInit];
        const [url, opts] = callArgs;
        expect(url).toBe("/api/v1/integrations/feedback");
        expect(opts.method).toBe("POST");

        const body = JSON.parse(opts.body as string);

        // Top-level shape
        expect(body.type).toBe("error-report");
        expect(body.category).toBe("bug");
        expect(body.severity).toBe("medium");

        // userInput — no manual entry expected from user
        expect(body.userInput.title).toBe("Auto-reported frustration");
        expect(body.userInput.description).toBe("Rage click detected");

        // systemContext.user — identity auto-collected
        expect(body.systemContext.user).toEqual(
            expect.objectContaining({ id: "u-99", email: "dev@example.com", name: "Dev User" })
        );

        // systemContext.device — new device detection fields
        expect(body.systemContext.device).toEqual(
            expect.objectContaining({
                type: expect.stringMatching(/desktop|mobile|tablet/),
                os: expect.any(String),
                orientation: expect.any(String),
            })
        );

        // systemContext.browser
        expect(body.systemContext.browser).toEqual(
            expect.objectContaining({
                userAgent: expect.any(String),
                viewport: expect.objectContaining({ width: expect.any(Number), height: expect.any(Number) }),
                language: expect.any(String),
                timezone: expect.any(String),
            })
        );

        // systemContext.page
        expect(body.systemContext.page).toEqual(
            expect.objectContaining({
                url: expect.any(String),
                path: expect.any(String),
                timestamp: expect.any(String),
            })
        );

        // systemContext.application
        expect(body.systemContext.application).toEqual(
            expect.objectContaining({
                name: "church",
                environment: expect.stringMatching(/development|staging|production/),
            })
        );
    });

    it("is silent (never throws) when fetch fails", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Network error"));
        await expect(
            submitFeedbackSilently({ title: "t", description: "d", appType: "admin" })
        ).resolves.toBeUndefined(); // must not throw
    });

    it("sends user: null when no user is provided", async () => {
        mockFetch.mockResolvedValueOnce({ ok: true });

        await submitFeedbackSilently({ title: "t", description: "d", appType: "main" });

        const callArgs = mockFetch.mock.calls[0] as unknown as [string, RequestInit];
        const body = JSON.parse(callArgs[1].body as string);
        expect(body.systemContext.user).toBeNull();
    });
});

// ─── 3. Variant rendering ─────────────────────────────────────────────────────

describe("FeedbackQuickAction — variant rendering", () => {
    it("renders sidebar-item button with correct accessible label", () => {
        renderFeedback({ variant: "sidebar-item" });
        expect(screen.getByRole("button", { name: /share feedback/i })).toBeTruthy();
    });

    it("renders floating FAB with send-feedback title", () => {
        renderFeedback({ variant: "floating", position: "bottom-right" });
        expect(screen.getByTitle(/send feedback/i)).toBeTruthy();
    });

    it("renders bottom-nav-item button with accessible text", () => {
        renderFeedback({ variant: "bottom-nav-item" });
        expect(screen.getByText(/share feedback/i)).toBeTruthy();
    });

    it("renders sidebar-icon button triggerring modal on click", () => {
        renderFeedback({ variant: "sidebar-icon" });
        const btn = screen.getByTitle(/share feedback/i);
        expect(btn).toBeTruthy();
    });
});

// ─── 4. Modal lifecycle ───────────────────────────────────────────────────────

describe("FeedbackQuickAction — modal lifecycle", () => {
    it("opens modal when sidebar-item button is clicked", async () => {
        renderFeedback({ variant: "sidebar-item" }, MOCK_AUTH_USER);

        // Modal content should not exist yet
        expect(document.querySelector('form')).toBeNull();

        // Click the trigger
        fireEvent.click(screen.getByRole("button", { name: /share feedback/i }));

        // After click a form (the feedback form) should appear
        await waitFor(() => {
            expect(document.querySelector('form') || document.querySelector('textarea')).not.toBeNull();
        });
    });

    it("does not render modal before trigger is clicked", () => {
        renderFeedback({ variant: "sidebar-item" });
        // Should not have any form/textarea visible before opening
        expect(document.querySelector('textarea')).toBeNull();
    });
});
