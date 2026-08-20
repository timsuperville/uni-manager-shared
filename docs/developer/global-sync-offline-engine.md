# Global Sync & Offline Engine Draft

> **Status**: 🟢 Active Specification  
> **Audience**: Frontend Engineers, Backend Architects, Native Tauri Developers  
> **Last Updated**: March 12, 2026

To achieve sub-second execution speeds and support true offline capability (grocery stores, concrete basements, church sanctuaries without Wi-Fi), the Uni-Manager ecosystem employs a **Local-First, Cloud-Sync** architecture.

This document defines the standard for how data is cached, mutated offline, and reconciled with the MongoDB cloud.

## 1. The Local-First Philosophy

The application UI ALWAYS reads from and writes to a local database first. Validations occur locally. If the write is successful locally, the UI updates instantly (Optimistic UI).

- **Web Browsers / PWAs (Home, Admin, Work)**: Utilize **IndexedDB** (via Dexie.js or similar wrapper) for structured local storage.
- **Native Applications (Presentation Pro, Playback Pro)**: Utilize a local **SQLite** database managed by the Tauri Rust backend.

## 2. The 3-Tier Sync Architecture

### Tier 1: The Local Data Store (Read/Write)

When a user opens an app, it reads its initial state from IndexedDB/SQLite. The application never waits for a cloud `GET` request to render the primary view.

### Tier 2: The Background Sync Pull (Delta Fetch)

Upon connection (and periodically via WebSockets), the client issues a delta fetch:
`GET /api/v1/sync?tenantId=123&lastSync=2026-03-12T08:00:00.000Z`
The backend returns only documents where `updatedAt > lastSync`. The client upserts these into its local store.

**Soft Deletes Required**: To sync deletions, MongoDB must use soft deletes (`deletedAt: Date`). If the server returns a document with `deletedAt`, the client physically deletes it from IndexedDB.

### Tier 3: The Offline Mutation Queue (Write Push)

If the user modifies data (e.g., checks off a Chore) while offline:

1. The local IndexedDB is updated immediately.
2. A mutation record is pushed to a local `SyncQueue` table.
   ```json
   {
     "id": "uuid-1234",
     "action": "UPDATE",
     "collection": "Chores",
     "documentId": "chore-567",
     "payload": { "status": "completed" },
     "timestamp": "2026-03-12T08:15:00.000Z"
   }
   ```
3. When network connectivity is restored (Service Worker `sync` event or manual retry), the client pushes the `SyncQueue` to the backend.

## 3. Collision Resolution (Last-Write-Wins)

Because users can share Tenants (e.g., two spouses in the Home app), sync collisions will occur.

We employ a **Timestamp-based Last-Write-Wins (LWW)** strategy:

- Every field mutation must include the client's high-precision timestamp.
- When the backend receives an update, it compares the incoming timestamp against the stored `updatedAt`.
- If `incomingTimestamp > db.updatedAt`, the backend accepts the write.
- If `incomingTimestamp < db.updatedAt` (a stale offline write), the backend REJECTS the write, and returns the current authoritative cloud state to the client to heal the local IndexedDB.

## 4. Big Media / Blob Syncing (Native Apps Only)

For Presentation Pro and Playback Pro, syncing 4K videos or multitrack audio via IndexedDB is impossible.

- **The Tauri Local-First NAS Handshake**: The sync engine downloads only JSON shells from the cloud. The Rust backend then scans a pre-configured local network directory (`~/PresentationMedia`) for the heavy assets. Missing assets are queued for a background Delta Download.

## 5. Real-Time Resonance (WebSockets)

When the app is _online_, we bypass the polling Delta Fetch.

- The backend emits Socket.io events to specific tenant rooms (e.g., `room:household_789`).
- Event Payload: `{ event: 'MUTATION', collection: 'Chores', data: { ... }, originDeviceId: 'device_abc' }`
- If a client receives a WebSocket mutation, and the client's ID matches `originDeviceId`, it ignores the socket (it already applied the optimistic update). If they don't match, it upserts the data into IndexedDB and re-renders React.
