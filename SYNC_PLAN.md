# Dev Tools Backend-Frontend Sync Plan

## Current Status
- ✅ Backend dev endpoints ready (`/dev/login-admin`, `/dev/login-student`, `/dev/login-user`, `/dev/users`)
- ✅ Component extraction completed (DevToolsAuth, DevToolsAPI, DevToolsSystem, DevToolsSettings)
- ⚠️ Some linter errors in DevToolsAuth.tsx (role type issues)
- ⚠️ DevToolsPanel.tsx needs cleanup

## Immediate Actions Needed

### 1. Fix DevToolsAuth Component
```typescript
// Fix the role type issue in DevToolsAuth.tsx
interface MockUser {
  id: string
  full_name: string
  email: string
  role: string // Make sure this matches backend response
  password: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

// Ensure proper type handling when spreading user objects
const createMockUser = (user: any, overrides: any): MockUser => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  role: user.role || 'user',
  ...overrides
})
```

### 2. Complete DevToolsPanel Cleanup
- Remove all duplicate state management
- Remove old unused imports
- Keep only tab structure and component routing

### 3. Backend Enhancement for Real User Data
```go
// In dev-controller.go, implement real database lookup
func (dc *DevController) LoginAdmin(c *gin.Context) {
    // Try to find first admin in database
    adminUser, err := dc.userRepository.FindByRole("admin")
    if err != nil || adminUser == nil {
        // Fallback to seeded user
        dc.loginHelper(c, "william.zonata@admin.com", "admin123")
        return
    }
    dc.loginHelper(c, adminUser.Email, "admin123") // Use real user
}
```

### 4. Frontend AuthStore Cleanup
- Remove duplicate function declarations
- Consolidate login functions
- Ensure consistent user data structures

## Verified Working Flow

1. **Backend serves real user data** via `/dev/users`
2. **Frontend fetches user list** on DevToolsAuth mount
3. **Quick login buttons call** `/dev/login-{role}` endpoints
4. **Real JWT tokens returned** for API testing
5. **Components stay in sync** with backend user data

## Testing Plan

1. Start backend server
2. Open DevTools panel
3. Verify user list loads from `/dev/users`
4. Test each quick login button
5. Verify JWT tokens work with protected endpoints
6. Confirm user data consistency across components

## Files to Update

- ✅ `backend/controllers/dev-controller.go` (DONE)
- ✅ `backend/routes/dev.go` (DONE)
- ⚠️ `frontend/src/components/dev/DevToolsAuth.tsx` (FIX TYPES)
- ⚠️ `frontend/src/components/dev/DevToolsPanel.tsx` (CLEANUP)
- ⚠️ `frontend/src/store/authStore.ts` (REMOVE DUPLICATES) 