# The Omniversal CAHA Permission Matrix

> **Status**: 🟢 Active Specification  
> **Audience**: Backend Engineers, Security Architects, Frontend Middleware  
> **Last Updated**: March 12, 2026

The **Context-Aware Hierarchical Access (CAHA)** matrix is the definitive security rulebook for the Uni-Manager ecosystem. Rather than writing one-off `isAdmin === true` checks inside controllers, all backend routes and frontend component renders MUST be governed by this centralized, declarative matrix.

## 1. Core Architectural Constraints

1.  **Strict Demarcation**: A role is absolutely local to its specific Tenant `ObjectId`. If User A is `tier_6_apostolic` in `ChurchTenantId: 123`, they are inherently treated as a `Guest` (Tier 1) in `ChurchTenantId: 456` unless explicitly invited.
2.  **Platform Supremacy Rule**: The roles `platform_sovereign` and `platform_architect` exist _only_ on the global `User.platformRoles` array. They grant access to the **Admin Command Hub**. They absolutely **DO NOT** grant implicit access to tenant data (Churches, Homes, Businesses) to ensure Fiduciary Privacy boundaries.
3.  **The Fiduciary Override (Duress Mode)**: In the **Personal Sanctuary**, there are no tiers. The User is the absolute Sovereign. If the Duress Protocol is engaged, _all_ read/write access is revoked, even from authenticated active sessions, until multi-factor recovery is satisfied.

---

## 2. The Global Matrix Definition (The Reference Contract)

When building the TypeScript `caha.middleware.ts`, these string enums must be used.

### 2.1 The Church Suite (6-Tier Ministry Model)

| Role ID  | Title              | Route Capabilities `(CRUD)`                         | Restrictions & Safeguards                                       |
| :------- | :----------------- | :-------------------------------------------------- | :-------------------------------------------------------------- |
| `tier_6` | Apostolic / Lead   | **ALL** Read/Write/Delete on all Church modules.    | Can grant/revoke any tier to an Identity Node.                  |
| `tier_5` | Pastoral / Staff   | Read/Write/Delete on Liturgy, Roster, Congregation. | Cannot edit Church billing or modify Tier 6 nodes.              |
| `tier_4` | Ministry Architect | R/W on assigned Ministry (e.g., Worship Dept).      | Cannot view giving/tithing records or cross-department rosters. |
| `tier_3` | Key Volunteer      | R/W on assigned Service Segments (e.g., Setlist).   | Cannot alter the core liturgical flow (Service Plan metadata).  |
| `tier_2` | Serving Member     | Read-only on Roster and assigned Service Plan.      | Can only Write to their own `AvailabilityLog`.                  |
| `tier_1` | Guest / Attender   | Read-only on Public Events / Content (Sermons).     | Excluded from the active Ministry Directory.                    |

### 2.2 The Professional Suite (4-Tier Business Model)

| Role ID       | Title               | Route Capabilities `(CRUD)`                     | Restrictions & Safeguards                                                                      |
| :------------ | :------------------ | :---------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| `org_owner`   | Sovereign / Founder | **ALL** R/W/D on Projects, Finance, CRM, Fleet. | Controls the "Toxic Revenue Radar" parameters.                                                 |
| `org_manager` | Project Lead        | R/W on assigned Projects, Roster, Invoices.     | Cannot view global aggregate P&L or alter worker base hourly rates.                            |
| `org_field`   | Field Operative     | R/W on their own TimeLogs and Safety Checks.    | Cannot view client invoicing or other workers' time entries. Subject to "Bio-Sync Cease Work". |
| `org_client`  | Client Portal Guest | Read-only on the specific linked `Project` Hub. | Shielded via the "Translucent Proxy". Cannot view internal chatter.                            |

### 2.3 The Home Suite (3-Tier Domestic Model)

| Role ID        | Title               | Route Capabilities `(CRUD)`                          | Restrictions & Safeguards                                                          |
| :------------- | :------------------ | :--------------------------------------------------- | :--------------------------------------------------------------------------------- |
| `home_head`    | Institutional Head  | **ALL** R/W/D on Finances, Medical, Sentinel, Meals. | Controls the "Caregiver Portal" ephemeral token generation.                        |
| `home_partner` | Operational Partner | R/W on Tasks, Shopping, Pantry, Calendar.            | Cannot alter the Medical Vault or Fiduciary Ledger without `home_head` co-signing. |
| `home_child`   | Focused Dependent   | Read-Only on schedule. R/W on assigned chores.       | UI is restricted to the "Dependent HUD." Can flag grocery requests.                |

### 2.4 The Platform Architecture (Admin Mode)

| Role ID     | Title            | Route Capabilities `(CRUD)`                           | Restrictions & Safeguards                                                              |
| :---------- | :--------------- | :---------------------------------------------------- | :------------------------------------------------------------------------------------- |
| `sovereign` | Original Creator | **ALL** R/W/D on Infrastructure, Ghost Mode, Billing. | The only node capable of executing a `Tenant Purge`.                                   |
| `architect` | Core Developer   | R/W on Feature Flags, ErrorLogs, Telemetry.           | Cannot view raw database dumps of Tenant data. Subject to the "Forensic Audit Ledger." |

---

## 3. Implementation Checklists (Express / React)

### 3.1 Backend: The `requireCaha` Middleware

Every backend route mapped to a specific application domain MUST utilize the `requireCaha` middleware to evaluate the user's role against the target `TenantId`.

```typescript
// Example: Editing a service plan segment requires Tier 3 or higher.
// Express Route Definition:

churchRouter.put(
  '/service-plans/:planId/segments/:segmentId',
  validateTenantParams,
  requireCaha('church', 'tier_3'), // Automatically checks tier_3, tier_4, tier_5, tier_6
  ServicePlanController.updateSegment
);
```

### 3.2 Frontend: The `<CahaGate>` Component

On the React frontend, UI elements (buttons, pages, sidebars) MUST be wrapped in the `<CahaGate>` specific to the current context. This prevents rendering an "Edit Roster" button for a Tier 2 volunteer.

```tsx
// Example: Only a Tier 5 Pastoral or Tier 6 Lead can view the Giving Ledger.

<CahaGate domain="church" minTier="tier_5">
  <GivingLedgerDashboard />
</CahaGate>
```

### 3.3 The Ephemeral "Caregiver" Override (Special Logic)

The Home app includes a special `home_caregiver` state (e.g., A babysitter or house-sitter). This is NOT a persistent DB role.

- **Mechanism**: The `home_head` generates a 8-hour JWT token from the Home app.
- **Result**: The user scanning the QR Code is granted an _ephemeral session_ on their device.
- **Middleware Guard**: The `requireCaha` middleware must parse the `req.user.ephemeralTokens` array. If an active Caregiver token is present for the target `HouseholdId`, the backend dynamically executes the request with `home_partner` capabilities, explicitly locked to the `Kids Schedule` and `Emergency Contacts` domains.

---

**END OF SPECIFICATION**
