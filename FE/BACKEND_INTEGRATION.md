# Frontend-Backend Integration Summary

## Overview
The frontend has been integrated with the backend API. All authentication, inventory, and group management features now communicate with the backend services running on ports 3000, 8080, and 8081.

## Changes Made

### 1. API Service Layer (`/src/lib/api.ts`)
**NEW FILE** - Comprehensive API service layer with:

#### Base URLs
- **AUTH (Common Service)**: `http://localhost:3000` - Authentication
- **USER Backend**: `http://localhost:8080` - User-specific features
- **OFFICIAL Backend**: `http://localhost:8081` - Inventory, Groups, Map Tracking

#### Type Definitions
- Complete TypeScript interfaces for all API requests/responses
- `UserSignupData`, `NGOSignupData`, `GovtSignupData`, `VolunteerSignupData`
- `InventoryItem`, `GroupData`, `ResourceAllocation`
- `AuthResponse`, `GroupAuthResponse`

#### API Functions

**Authentication API** (`authAPI`):
- `signupUser(data)` - Citizen signup
- `signupNGO(data)` - NGO signup
- `signupGovt(data)` - Government agency signup
- `signupVolunteer(data)` - Volunteer group signup
- `signin(data)` - Universal sign in (auto-detects user type)

**Inventory API** (`inventoryAPI`) - NGO & Volunteer only:
- `create(data, token)` - Create inventory item
- `getAll(token)` - Get all inventory (yours only)
- `getById(id, token)` - Get single item
- `update(id, data, token)` - Update item
- `delete(id, token)` - Delete item

**Groups API** (`groupsAPI`) - NGO, Govt & Volunteer:
- `create(data, token)` - Create group with resource allocations
- `getAll(token)` - Get all groups (yours only)
- `getById(id, token)` - Get single group with details
- `update(id, data, token)` - Update group
- `delete(id, token)` - Delete group (restores inventory)
- `signin(data)` - Group sign in (no token required)

#### Utility Functions
- `isTokenExpired(token)` - Check if JWT token is expired
- `decodeToken(token)` - Decode JWT payload
- `getUserTypeFromToken(token)` - Extract user type
- `canManageInventory(userType)` - Check inventory permissions
- `canManageGroups(userType)` - Check group permissions
- `calculateExpiryDate(ttlType)` - Calculate group expiry date
- `getGroupStatus(group)` - Get group status badge info
- `calculateInventoryUsage(item)` - Calculate usage percentage
- `formatErrorMessage(error)` - Format API errors for display

#### Error Handling
- Custom `APIError` class with status codes and details
- Centralized error handling in `handleResponse()`
- User-friendly error messages

---

### 2. Authentication Context (`/src/contexts/AuthContext.tsx`)
**UPDATED** - Integrated with backend authentication:

#### New Features
- JWT token management (stored in localStorage)
- Token expiry checking on mount
- User type detection from backend response
- Proper token-based authentication flow

#### Changes
- `login()` now calls `authAPI.signin()` and stores JWT token
- User object includes `userId`, `userType` from backend
- Token stored as `ricos_token`, user type as `ricos_user_type`
- Automatic token validation on app load
- `logout()` clears all auth data including token

#### User Object Structure
```typescript
{
  email: string;
  userId: string;          // From JWT payload
  userType: UserType;      // 'user' | 'ngo' | 'govt' | 'volunteer' | 'group'
  accountType: string;
  role: string;
  isProfileComplete: boolean;
  needsProfileCompletion: boolean;
}
```

---

### 3. Signup Forms
All signup forms updated to use backend API:

#### User Signup (`/src/pages/UserSignupForm.tsx`)
- Maps form data to `UserSignupData` interface
- Parses home location coordinates
- Calls `authAPI.signupUser()`
- Handles backend response and stores token
- Removes localStorage-only registration

#### NGO Signup (`/src/pages/NGOSignupForm.tsx`)
- Maps form data to `NGOSignupData` interface
- Parses comma-separated arrays (operational areas, resource types)
- Parses location coordinates
- Calls `authAPI.signupNGO()`
- Converts year and team strength to numbers

#### Government Signup (`/src/pages/GovernmentSignupForm.tsx`)
- Maps form data to `GovtSignupData` interface
- Parses comma-separated arrays (jurisdiction, resource types)
- Calls `authAPI.signupGovt()`
- Converts resource capacity to number

#### Volunteer Signup (`/src/pages/VolunteerSignupForm.tsx`)
- Maps form data to `VolunteerSignupData` interface
- Parses comma-separated arrays (operational areas, languages)
- Calls `authAPI.signupVolunteer()`
- Converts group size to number
- Maps boolean fields correctly

---

## Usage Guide

### Authentication Flow

#### 1. Sign Up
```typescript
import { authAPI } from '@/lib/api';

// User signup
const response = await authAPI.signupUser({
  full_name: "John Doe",
  email: "john@example.com",
  password: "SecurePass@123",
  // ... other required fields
});

// Store token
localStorage.setItem('ricos_token', response.access_token);
localStorage.setItem('ricos_user_type', response.user_type);
```

#### 2. Sign In
```typescript
const response = await authAPI.signin({
  email: "john@example.com",
  password: "SecurePass@123"
});

// Returns: { access_token: "...", user_type: "user" }
```

#### 3. Using the Token
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { token, user } = useAuth();

// All API calls requiring authentication need the token
await inventoryAPI.getAll(token);
```

### Inventory Management (NGO & Volunteer Only)

```typescript
import { inventoryAPI } from '@/lib/api';

// Create inventory
const item = await inventoryAPI.create({
  item: "Medical Kits",
  total_quantity: 100
}, token);

// Get all inventory
const items = await inventoryAPI.getAll(token);

// Update inventory
await inventoryAPI.update(itemId, {
  remaining_quantity: 85
}, token);

// Delete inventory
await inventoryAPI.delete(itemId, token);
```

### Group Management (NGO, Govt & Volunteer)

```typescript
import { groupsAPI } from '@/lib/api';

// Create group with resource allocations
const group = await groupsAPI.create({
  group_name: "Emergency Team 1",
  password: "Team@123",
  ttl_type: "20_days",
  resource_allocations: [
    { inventory_item_id: "item-uuid", allocated_quantity: 50 }
  ]
}, token);

// Get all groups
const groups = await groupsAPI.getAll(token);

// Group signin (no parent token needed)
const groupAuth = await groupsAPI.signin({
  username: "org_name_emergency_team_1",
  password: "Team@123"
});
```

---

## API Endpoints Reference

### Authentication (Port 3000)
```
POST /auth/signup/user       - Citizen signup
POST /auth/signup/ngo        - NGO signup
POST /auth/signup/govt       - Government signup
POST /auth/signup/volunteer  - Volunteer signup
POST /auth/signin            - Universal sign in
```

### Inventory (Port 8081) - Requires NGO/Volunteer token
```
POST   /inventory           - Create item
GET    /inventory           - List all (yours)
GET    /inventory/:id       - Get one
PATCH  /inventory/:id       - Update
DELETE /inventory/:id       - Delete
```

### Groups (Port 8081)
```
POST   /groups              - Create (requires NGO/Govt/Volunteer token)
GET    /groups              - List all (requires token)
GET    /groups/:id          - Get one (requires token)
PATCH  /groups/:id          - Update (requires token)
DELETE /groups/:id          - Delete (requires token)
POST   /groups/signin       - Group signin (no token needed)
```

---

## Required Headers

### Authenticated Requests
```typescript
{
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Public Requests (signin, signup, group signin)
```typescript
{
  'Content-Type': 'application/json'
}
```

---

## User Roles & Permissions

| Feature | User | NGO | Govt | Volunteer | Group |
|---------|------|-----|------|-----------|-------|
| Signup | ✅ | ✅ | ✅ | ✅ | via parent |
| Signin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Inventory | ❌ | ✅ | ❌ | ✅ | view only |
| Groups | ❌ | ✅ | ✅ | ✅ | own dashboard |

---

## Next Steps for Dashboard Integration

### 1. Inventory Page
- Use `inventoryAPI.getAll(token)` to fetch items
- Display `remaining_quantity` vs `total_quantity`
- Calculate usage percentage
- CRUD operations with proper token

### 2. Groups Page
- Use `groupsAPI.getAll(token)` to fetch groups
- Display group status badges (active/expired/expiring)
- Show resource allocations per group
- Handle group creation with inventory allocation

### 3. Map Tracking
- API endpoints documented in `/BE/docs/MAP_TRACKING_SYSTEM.md`
- Real-time location updates
- Nearby pincode fallback

### 4. News API
- API endpoints documented in `/BE/docs/NEWS_API.md`
- Fetch disaster news and alerts

---

## Testing

### Start Backend Services
```bash
# Terminal 1 - Common Service (Auth)
cd BE
npm run start:common

# Terminal 2 - Official Backend (Inventory, Groups)
cd BE
npm run start:official

# Terminal 3 - User Backend
cd BE
npm run start:user
```

### Test Frontend
```bash
cd FE
npm run dev
```

### Manual Testing Steps
1. **Signup**: Test all 4 signup types
2. **Signin**: Verify JWT token storage
3. **Token Expiry**: Check auto-logout on expired token
4. **Inventory**: Create/Read/Update/Delete (NGO/Volunteer only)
5. **Groups**: Create groups with allocations
6. **Group Signin**: Test field team login

---

## Error Handling Examples

```typescript
import { formatErrorMessage } from '@/lib/api';

try {
  await authAPI.signin({ email, password });
} catch (error) {
  // User-friendly error message
  alert(formatErrorMessage(error));
  
  // Or handle specific status codes
  if (error instanceof APIError) {
    if (error.statusCode === 401) {
      alert('Invalid credentials');
    } else if (error.statusCode === 409) {
      alert('Email already exists');
    }
  }
}
```

---

## Environment Configuration

Make sure backend is running with correct ports:

**Backend** (`BE/common.env`):
- `COMMON_PORT=3000`
- `USER_PORT=8080`
- `OFFICIAL_PORT=8081`
- `DATABASE_URL=<your-database-url>`
- `JWT_SECRET=<your-secret>`

**Frontend** - Update if needed in `src/lib/api.ts`:
```typescript
export const API_BASE_URLS = {
  AUTH: 'http://localhost:3000',
  USER: 'http://localhost:8080',
  OFFICIAL: 'http://localhost:8081',
};
```

---

## Status: ✅ Integration Complete

All authentication flows are now integrated with the backend. The frontend properly:
- Sends signup data in the correct format
- Receives and stores JWT tokens
- Includes tokens in authenticated requests
- Handles token expiry
- Provides complete type safety

**Ready for inventory and group dashboard implementation!**
