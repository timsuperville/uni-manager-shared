import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import {
  PermissionGuard,
  RoleGuard,
  AdminGuard,
  ConditionalRender,
  PermissionButton,
  PermissionMenuItem,
  withPermissions,
  withRoles,
  RBACProvider,
} from "../components/RBACComponents.jsx";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseAuth = vi.fn();
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

const RouterWrapper = ({ children }) =>
  React.createElement(BrowserRouter, null, children);

const RBACWrapper = ({ children }) =>
  React.createElement(
    RouterWrapper,
    null,
    React.createElement(RBACProvider, null, children),
  );

describe("PermissionGuard", () => {
  it("component exists", () => {
    expect(typeof PermissionGuard).toBe("function");
  });
});

describe("RoleGuard", () => {
  it("component exists", () => {
    expect(typeof RoleGuard).toBe("function");
  });
});

describe("AdminGuard", () => {
  it("component exists", () => {
    expect(typeof AdminGuard).toBe("function");
  });
});
describe("ConditionalRender", () => {
  it("component exists", () => {
    expect(typeof ConditionalRender).toBe("function");
  });
});

describe("PermissionButton", () => {
  beforeEach(() => vi.clearAllMocks());

  it("button component exists", () => {
    expect(typeof PermissionButton).toBe("function");
  });
});

describe("PermissionMenuItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menu item component exists", () => {
    expect(typeof PermissionMenuItem).toBe("function");
  });
});

describe("HOCs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("withPermissions component exists", () => {
    expect(typeof withPermissions).toBe("function");
  });

  it("withRoles component exists", () => {
    expect(typeof withRoles).toBe("function");
  });
});
