# Auth System E2E Manual Test Guide

## Prerequisites

- Dev server running (`npm run dev`)
- Clean browser session (use incognito/private window)
- Test user account with known credentials

---

## Test Scenarios

### 1. Login Flow ✅

**Steps:**

1. Navigate to `/login` page
2. Enter valid credentials
3. Click "Login" button
4. Observe loading state

**Verify:**

- ✅ Device fingerprint cached in sessionStorage (check DevTools > Application > Session Storage)
- ✅ Successful redirect to dashboard/home page
- ✅ User data displays correctly (name, avatar, etc.)
- ✅ No console errors
- ✅ Auth token stored (check sessionStorage or cookies)

---

### 2. Device Fingerprint Caching ✅

**Steps:**

1. Login successfully
2. Open DevTools > Application > Session Storage
3. Find `device_fingerprint` key
4. Copy the value
5. Logout
6. Login again with same credentials
7. Check `device_fingerprint` again

**Verify:**

- ✅ Same fingerprint value on second login
- ✅ `device_fingerprint_time` timestamp updated
- ✅ No recalculation delay (instant)

---

### 3. Token Refresh (Auto) ✅

**Steps:**

1. Login successfully
2. Open DevTools > Network tab
3. Filter for API calls
4. Wait 15+ minutes (or adjust `tokenRefreshInterval` in code for faster testing)
5. Observe network activity

**Verify:**

- ✅ Token refresh API call made automatically
- ✅ New token received
- ✅ User remains logged in
- ✅ No logout or error

**Fast Test** (optional):

- Temporarily set `tokenRefreshInterval: 60000` (1 min) in AuthProvider config
- Wait 1 minute and verify refresh

---

### 4. Cross-Tab Synchronization ✅

**Steps:**

1. Login in Tab 1
2. Open Tab 2 (same app, different tab)
3. Verify logged in state in Tab 2
4. Logout in Tab 1
5. Observe Tab 2

**Verify:**

- ✅ Tab 2 detects logout automatically
- ✅ Tab 2 redirects to login
- ✅ Both tabs show logged out state
- ✅ sessionStorage cleared in both tabs

---

### 5. MFA Flow (if enabled) ✅

**Prerequisites:** User account with MFA enabled

**Steps:**

1. Navigate to `/login`
2. Enter valid credentials
3. Click "Login"
4. Observe MFA prompt
5. Enter valid MFA code
6. Submit

**Verify:**

- ✅ MFA prompt displays correctly
- ✅ Invalid code shows error
- ✅ Valid code proceeds to dashboard
- ✅ MFA state persists (mfaVerified: true)

---

### 6. Session Expiry ✅

**Steps:**

1. Login successfully
2. Note the time
3. Close all browser tabs
4. Wait 31+ minutes (default session expiry)
5. Reopen app

**Verify:**

- ✅ Redirects to login page
- ✅ "Session expired" message shown (if implemented)
- ✅ Auth token cleared
- ✅ Must login again

**Fast Test** (optional):

- Use browser DevTools to manually expire token
- Or set short session expiry in backend/config

---

### 7. Logout Flow ✅

**Steps:**

1. Login successfully
2. Click "Logout" button
3. Observe behavior

**Verify:**

- ✅ Immediate redirect to login page
- ✅ Device fingerprint cache cleared
- ✅ Auth token removed from storage
- ✅ User data cleared from memory
- ✅ Cannot access protected routes

---

### 8. Activity Tracking ✅

**Steps:**

1. Login successfully
2. Open DevTools > Application > Session Storage
3. Note `lastActivity` timestamp
4. Move mouse, type, or scroll
5. Check `lastActivity` again

**Verify:**

- ✅ `lastActivity` timestamp updates on user interaction
- ✅ No unnecessary updates (throttled)

---

### 9. Protected Routes ✅

**Steps:**

1. Without logging in, try to access protected route (e.g., `/dashboard`)
2. Observe behavior
3. Login
4. Try accessing protected route again

**Verify:**

- ✅ Unauthenticated: Redirects to login
- ✅ Authenticated: Access granted
- ✅ Proper route guarding

---

### 10. Error Handling ✅

**Steps:**

1. Enter invalid credentials
2. Try to login
3. Observe error handling

**Verify:**

- ✅ Clear error message displayed
- ✅ Form validation works
- ✅ No app crash
- ✅ Can retry login

---

## Pass Criteria

**All checkmarks (✅) must be completed without errors or unexpected behavior.**

If any test fails:

1. Note the specific step that failed
2. Check browser console for errors
3. Check network tab for failed requests
4. Document the issue with screenshots if possible

---

## Test Report Template

```
Date: __________
Tester: __________
Browser: __________
Environment: __________

Test Results:
1. Login Flow: [ PASS / FAIL ]
2. Device Fingerprint Caching: [ PASS / FAIL ]
3. Token Refresh: [ PASS / FAIL ]
4. Cross-Tab Sync: [ PASS / FAIL ]
5. MFA Flow: [ PASS / FAIL / N/A ]
6. Session Expiry: [ PASS / FAIL ]
7. Logout Flow: [ PASS / FAIL ]
8. Activity Tracking: [ PASS / FAIL ]
9. Protected Routes: [ PASS / FAIL ]
10. Error Handling: [ PASS / FAIL ]

Overall: [ PASS / FAIL ]

Notes:
_______________________________
_______________________________
```
