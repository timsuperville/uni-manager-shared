/**
 * RBAC Utils Tests
 * Comprehensive test suite for role-based access control utilities
 */

import { describe, it, expect, beforeEach } from "vitest";
import { RBACUtils, PermissionUtils, RouteUtils } from "../rbac/utils";
import { PERMISSIONS, ROLES } from "../rbac/roles";

describe("RBACUtils", () => {
  let rbac;
  let mockUser;

  beforeEach(() => {
    mockUser = {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      roles: ["church_user", "business_user"],
    };

    rbac = new RBACUtils(mockUser);
  });

  describe("Role Permission Resolution", () => {
    it("should resolve direct role permissions", () => {
      const permissions = rbac.getRolePermissions("church_user");
      expect(permissions).toContain(PERMISSIONS.CHURCH_VIEW);
      expect(permissions).toContain(PERMISSIONS.MEMBER_VIEW);
    });

    it("should resolve inherited permissions", () => {
      const permissions = rbac.getRolePermissions("church_admin");

      // Should have direct permissions
      expect(permissions).toContain(PERMISSIONS.CHURCH_ADMIN);
      expect(permissions).toContain(PERMISSIONS.SERVICE_DELETE);

      // Should have inherited permissions from church_manager
      expect(permissions).toContain(PERMISSIONS.SERVICE_CREATE);
      expect(permissions).toContain(PERMISSIONS.SERVICE_EDIT);

      // Should have inherited permissions from church_user
      expect(permissions).toContain(PERMISSIONS.CHURCH_VIEW);
      expect(permissions).toContain(PERMISSIONS.MEMBER_VIEW);
    });

    it("should remove duplicate permissions", () => {
      const permissions = rbac.getRolePermissions("church_admin");
      const uniquePermissions = [...new Set(permissions)];
      expect(permissions.length).toBe(uniquePermissions.length);
    });

    it("should return empty array for non-existent role", () => {
      const permissions = rbac.getRolePermissions("non_existent_role");
      expect(permissions).toEqual([]);
    });
  });

  describe("User Permission Resolution", () => {
    it("should resolve all user permissions from multiple roles", () => {
      const permissions = rbac.resolveUserPermissions();

      // Should have church_user permissions
      expect(permissions).toContain(PERMISSIONS.CHURCH_VIEW);
      expect(permissions).toContain(PERMISSIONS.MEMBER_VIEW);

      // Should have business_user permissions
      expect(permissions).toContain(PERMISSIONS.BUSINESS_VIEW);
      expect(permissions).toContain(PERMISSIONS.INVENTORY_VIEW);
    });

    it("should handle user with no roles", () => {
      const noRoleUser = { id: 1, roles: [] };
      const noRoleRBAC = new RBACUtils(noRoleUser);

      expect(noRoleRBAC.resolveUserPermissions()).toEqual([]);
    });

    it("should handle null user", () => {
      const nullRBAC = new RBACUtils(null);
      expect(nullRBAC.resolveUserPermissions()).toEqual([]);
    });
  });

  describe("Permission Checking", () => {
    it("should correctly check single permission", () => {
      expect(rbac.hasPermission(PERMISSIONS.CHURCH_VIEW)).toBe(true);
      expect(rbac.hasPermission(PERMISSIONS.CHURCH_ADMIN)).toBe(false);
    });

    it("should check any permission from array", () => {
      const permissions = [PERMISSIONS.CHURCH_ADMIN, PERMISSIONS.CHURCH_VIEW];
      expect(rbac.hasAnyPermission(permissions)).toBe(true);

      const adminPermissions = [
        PERMISSIONS.CHURCH_ADMIN,
        PERMISSIONS.SYSTEM_CONFIG,
      ];
      expect(rbac.hasAnyPermission(adminPermissions)).toBe(false);
    });

    it("should check all permissions from array", () => {
      const viewPermissions = [
        PERMISSIONS.CHURCH_VIEW,
        PERMISSIONS.BUSINESS_VIEW,
      ];
      expect(rbac.hasAllPermissions(viewPermissions)).toBe(true);

      const mixedPermissions = [
        PERMISSIONS.CHURCH_VIEW,
        PERMISSIONS.CHURCH_ADMIN,
      ];
      expect(rbac.hasAllPermissions(mixedPermissions)).toBe(false);
    });

    it("should handle single permission passed to array functions", () => {
      expect(rbac.hasAnyPermission(PERMISSIONS.CHURCH_VIEW)).toBe(true);
      expect(rbac.hasAllPermissions(PERMISSIONS.CHURCH_VIEW)).toBe(true);
    });
  });

  describe("Role Checking", () => {
    it("should correctly check single role", () => {
      expect(rbac.hasRole("church_user")).toBe(true);
      expect(rbac.hasRole("church_admin")).toBe(false);
    });

    it("should check any role from array", () => {
      const roles = ["church_admin", "church_user"];
      expect(rbac.hasAnyRole(roles)).toBe(true);

      const adminRoles = ["church_admin", "system_admin"];
      expect(rbac.hasAnyRole(adminRoles)).toBe(false);
    });

    it("should check minimum role level", () => {
      expect(rbac.hasMinimumRoleLevel(50)).toBe(true); // church_user level
      expect(rbac.hasMinimumRoleLevel(70)).toBe(false); // church_manager level
    });

    it("should handle single role passed to array function", () => {
      expect(rbac.hasAnyRole("church_user")).toBe(true);
    });
  });

  describe("Route Access Control", () => {
    it("should allow access to unprotected routes", () => {
      expect(rbac.canAccessRoute("church", "/dashboard")).toBe(true);
    });

    it("should check protected routes correctly", () => {
      expect(rbac.canAccessRoute("church", "/members")).toBe(true);
      expect(rbac.canAccessRoute("church", "/admin")).toBe(false);
    });

    it("should handle route parameters", () => {
      expect(rbac.canAccessRoute("church", "/services/edit/123")).toBe(false);
    });

    it("should handle non-existent application", () => {
      expect(rbac.canAccessRoute("non_existent", "/any-route")).toBe(true);
    });
  });

  describe("Application Access Control", () => {
    it("should allow access to applications with valid roles", () => {
      expect(rbac.canAccessApplication("church")).toBe(true);
      expect(rbac.canAccessApplication("business")).toBe(true);
    });

    it("should deny access to applications without valid roles", () => {
      expect(rbac.canAccessApplication("admin")).toBe(false);
    });

    it("should get accessible applications", () => {
      const accessibleApps = rbac.getAccessibleApplications();
      expect(accessibleApps).toContain("church");
      expect(accessibleApps).toContain("business");
      expect(accessibleApps).not.toContain("admin");
    });

    it("should get application-specific roles", () => {
      const churchRoles = rbac.getApplicationRoles("church");
      expect(churchRoles).toContain("church_user");
      expect(churchRoles).not.toContain("business_user");
    });
  });

  describe("Admin Checking", () => {
    it("should correctly identify admin status", () => {
      expect(rbac.isAnyAdmin()).toBe(false);
      expect(rbac.isApplicationAdmin("church")).toBe(false);
    });

    it("should identify super admin correctly", () => {
      const superAdminUser = { id: 1, roles: ["super_admin"] };
      const superAdminRBAC = new RBACUtils(superAdminUser);

      expect(superAdminRBAC.isAnyAdmin()).toBe(true);
      expect(superAdminRBAC.isApplicationAdmin("church")).toBe(true);
    });

    it("should identify application admin correctly", () => {
      const churchAdminUser = { id: 1, roles: ["church_admin"] };
      const churchAdminRBAC = new RBACUtils(churchAdminUser);

      expect(churchAdminRBAC.isAnyAdmin()).toBe(true);
      expect(churchAdminRBAC.isApplicationAdmin("church")).toBe(true);
      expect(churchAdminRBAC.isApplicationAdmin("business")).toBe(false);
    });
  });

  describe("Menu Filtering", () => {
    const mockMenuItems = [
      {
        id: "dashboard",
        label: "Dashboard",
        route: "/dashboard",
      },
      {
        id: "members",
        label: "Members",
        route: "/members",
        requiredPermissions: [PERMISSIONS.MEMBER_VIEW],
      },
      {
        id: "admin",
        label: "Admin",
        route: "/admin",
        requiredPermissions: [PERMISSIONS.CHURCH_ADMIN],
        children: [
          {
            id: "users",
            label: "Users",
            route: "/admin/users",
            requiredPermissions: [PERMISSIONS.USER_LIST],
          },
        ],
      },
      {
        id: "manager",
        label: "Manager",
        requiredRoles: ["church_manager"],
        minimumRoleLevel: 70,
      },
    ];

    it("should filter menu items based on permissions", () => {
      const filteredItems = rbac.filterMenuItems(mockMenuItems, "church");

      expect(filteredItems).toHaveLength(2); // dashboard and members
      expect(
        filteredItems.find((item) => item.id === "dashboard"),
      ).toBeDefined();
      expect(filteredItems.find((item) => item.id === "members")).toBeDefined();
      expect(filteredItems.find((item) => item.id === "admin")).toBeUndefined();
      expect(
        filteredItems.find((item) => item.id === "manager"),
      ).toBeUndefined();
    });

    it("should filter nested menu items", () => {
      const churchAdminUser = { id: 1, roles: ["church_admin"] };
      const churchAdminRBAC = new RBACUtils(churchAdminUser);

      const filteredItems = churchAdminRBAC.filterMenuItems(
        mockMenuItems,
        "church",
      );
      const adminItem = filteredItems.find((item) => item.id === "admin");

      expect(adminItem).toBeDefined();
      expect(adminItem.children).toHaveLength(0); // users item filtered out
    });
  });

  describe("Permission Summary", () => {
    it("should generate comprehensive permission summary", () => {
      const summary = rbac.getPermissionSummary();

      expect(summary).toHaveProperty("user", mockUser.id);
      expect(summary).toHaveProperty("roles", mockUser.roles);
      expect(summary).toHaveProperty("permissions");
      expect(summary).toHaveProperty("highestLevel", 50);
      expect(summary).toHaveProperty("accessibleApps");
      expect(summary).toHaveProperty("isAnyAdmin", false);

      expect(summary.accessibleApps).toContain("church");
      expect(summary.accessibleApps).toContain("business");
    });
  });

  describe("User Context Updates", () => {
    it("should update user context correctly", () => {
      const newUser = {
        id: 2,
        roles: ["church_admin", "business_admin"],
      };

      rbac.setUser(newUser);

      expect(rbac.user).toBe(newUser);
      expect(rbac.userRoles).toEqual(newUser.roles);
      expect(rbac.hasRole("church_admin")).toBe(true);
      expect(rbac.hasPermission(PERMISSIONS.CHURCH_ADMIN)).toBe(true);
    });
  });
});

describe("PermissionUtils", () => {
  const mockUser = {
    id: 1,
    roles: ["church_manager", "business_user"],
  };

  describe("Permission Checker Creation", () => {
    it("should create permission checker with correct methods", () => {
      const checker = PermissionUtils.createChecker(mockUser);

      expect(checker.hasPermission(PERMISSIONS.CHURCH_MANAGE)).toBe(true);
      expect(checker.hasPermission(PERMISSIONS.CHURCH_ADMIN)).toBe(false);
      expect(checker.hasRole("church_manager")).toBe(true);
      expect(checker.canAccess("church", "/services/create")).toBe(true);
      expect(checker.isAdmin("church")).toBe(false);
    });
  });

  describe("Role Assignment Validation", () => {
    it("should validate role assignment correctly", () => {
      const adminRoles = ["church_admin"];
      const managerRoles = ["church_manager"];

      // Admin can assign manager role
      expect(
        PermissionUtils.validateRoleAssignment(adminRoles, "church_manager"),
      ).toBe(true);
      expect(
        PermissionUtils.validateRoleAssignment(adminRoles, "church_user"),
      ).toBe(true);

      // Manager cannot assign admin role
      expect(
        PermissionUtils.validateRoleAssignment(managerRoles, "church_admin"),
      ).toBe(false);

      // Manager can assign user role
      expect(
        PermissionUtils.validateRoleAssignment(managerRoles, "church_user"),
      ).toBe(true);
    });
  });

  describe("Assignable Roles", () => {
    it("should return assignable roles for given assigner", () => {
      const adminRoles = ["church_admin"];
      const assignableRoles = PermissionUtils.getAssignableRoles(
        adminRoles,
        "church",
      );

      expect(Array.isArray(assignableRoles)).toBe(true);
      expect(
        assignableRoles.find((role) => role.id === "church_user"),
      ).toBeDefined();
      expect(
        assignableRoles.find((role) => role.id === "church_manager"),
      ).toBeDefined();
      expect(
        assignableRoles.find((role) => role.id === "church_admin"),
      ).toBeDefined();
      expect(
        assignableRoles.find((role) => role.id === "super_admin"),
      ).toBeUndefined();
    });

    it("should filter roles by application", () => {
      const superAdminRoles = ["super_admin"];
      const churchRoles = PermissionUtils.getAssignableRoles(
        superAdminRoles,
        "church",
      );
      const businessRoles = PermissionUtils.getAssignableRoles(
        superAdminRoles,
        "business",
      );

      expect(
        churchRoles.find((role) => role.id === "church_user"),
      ).toBeDefined();
      expect(
        churchRoles.find((role) => role.id === "business_user"),
      ).toBeUndefined();

      expect(
        businessRoles.find((role) => role.id === "business_user"),
      ).toBeDefined();
      expect(
        businessRoles.find((role) => role.id === "church_user"),
      ).toBeUndefined();
    });
  });
});

describe("RouteUtils", () => {
  describe("Route Authentication Requirements", () => {
    it("should identify protected routes", () => {
      expect(RouteUtils.requiresAuth("church", "/members")).toBe(true);
      expect(RouteUtils.requiresAuth("church", "/admin")).toBe(true);
      expect(RouteUtils.requiresAuth("church", "/dashboard")).toBe(false);
    });

    it("should handle non-existent applications", () => {
      expect(RouteUtils.requiresAuth("non_existent", "/any-route")).toBe(false);
    });
  });

  describe("Route Permission Requirements", () => {
    it("should return required permissions for protected routes", () => {
      const memberPermissions = RouteUtils.getRoutePermissions(
        "church",
        "/members",
      );
      expect(memberPermissions).toContain(PERMISSIONS.MEMBER_VIEW);

      const adminPermissions = RouteUtils.getRoutePermissions(
        "church",
        "/admin",
      );
      expect(adminPermissions).toContain(PERMISSIONS.CHURCH_ADMIN);
    });

    it("should return empty array for unprotected routes", () => {
      const permissions = RouteUtils.getRoutePermissions(
        "church",
        "/dashboard",
      );
      expect(permissions).toEqual([]);
    });

    it("should handle route parameters", () => {
      const permissions = RouteUtils.getRoutePermissions(
        "church",
        "/services/edit/123",
      );
      expect(permissions).toContain(PERMISSIONS.SERVICE_EDIT);
    });
  });
});

describe("Edge Cases and Error Handling", () => {
  it("should handle undefined roles gracefully", () => {
    const userWithoutRoles = { id: 1 };
    const rbac = new RBACUtils(userWithoutRoles);

    expect(rbac.hasPermission(PERMISSIONS.CHURCH_VIEW)).toBe(false);
    expect(rbac.hasRole("church_user")).toBe(false);
    expect(rbac.canAccessApplication("church")).toBe(false);
  });

  it("should handle invalid role references", () => {
    const userWithInvalidRole = { id: 1, roles: ["non_existent_role"] };
    const rbac = new RBACUtils(userWithInvalidRole);

    expect(rbac.resolveUserPermissions()).toEqual([]);
    expect(rbac.getHighestRoleLevel()).toBe(0);
  });

  it("should handle empty permission arrays", () => {
    const rbac = new RBACUtils(null);

    expect(rbac.hasAnyPermission([])).toBe(false);
    expect(rbac.hasAllPermissions([])).toBe(false);
  });

  it("should handle null values in menu filtering", () => {
    const rbac = new RBACUtils({ id: 1, roles: ["church_user"] });
    const menuWithNulls = [
      null,
      undefined,
      {
        id: "valid",
        label: "Valid Item",
      },
    ];

    // Should filter out null/undefined items gracefully
    expect(() => rbac.filterMenuItems(menuWithNulls)).not.toThrow();
  });
});
