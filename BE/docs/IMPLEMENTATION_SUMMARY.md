# RICOS Backend - Implementation Summary

## ✅ Completed Features

### 1. Authentication System
- **Multi-role signup/signin** for User, NGO, Government, Volunteer
- **Unified authentication** via `AllUsers` table
- **JWT-based security** with role information in payload
- **Seamless signin** - automatic user type detection
- **24-hour token expiry**

**Documentation**: `/BE/docs/auth/auth-api.txt`, `/BE/docs/COMPLETE_API_DOCUMENTATION.md`

---

### 2. Inventory Management
- **Role-based access** - Only NGOs and Volunteers
- **Full CRUD operations** on inventory items
- **Ownership verification** - Users can only manage their own inventory
- **Resource tracking** with `total_quantity` and `remaining_quantity`
- **Automatic quantity updates** when allocating to groups

**Documentation**: `/BE/docs/inventory-api.md`, `/BE/docs/COMPLETE_API_DOCUMENTATION.md`

**Endpoints**:
- `POST /inventory` - Create inventory item
- `GET /inventory` - List all items (filtered by owner)
- `GET /inventory/:id` - Get single item
- `PATCH /inventory/:id` - Update item
- `DELETE /inventory/:id` - Delete item

---

### 3. Groups Management (NEW)
- **Created by** NGOs, Government, or Volunteers
- **Automatic username generation** - `{org_name}_{group_name}`
- **Independent authentication** - Groups sign in with username/password
- **Time-to-live (TTL)** - 5 days, 20 days, 30 days, or no expiry
- **Resource allocation** from creator's inventory
- **Automatic inventory restoration** on group deletion/reallocation
- **Group activation/deactivation** for temporary disabling

**Documentation**: `/BE/docs/groups-api.md`

**Endpoints**:
- `POST /groups` - Create group with resource allocation
- `GET /groups` - List all groups (filtered by creator)
- `GET /groups/:id` - Get single group with allocations
- `PATCH /groups/:id` - Update group (name, password, TTL, resources, status)
- `DELETE /groups/:id` - Delete group (restores inventory)
- `POST /groups/signin` - Group authentication (public endpoint)

---

## Database Schema

### Core Tables

#### AllUsers (Authentication)
- Unified login table for all user types
- Stores hashed passwords
- Links to specific user type tables via foreign keys

#### User, NGO, Government, Volunteer
- Separate tables for each user type
- NO password fields (stored in AllUsers)
- Linked to AllUsers and Responder tables

#### InventoryItem
- Tracks resources owned by NGOs and Volunteers
- `total_quantity`: Total stock
- `remaining_quantity`: Unallocated/available quantity
- Linked to Groups via resource allocations

#### Group
- Represents field teams/response units
- Unique username format: `{org_name}_{group_name}`
- Hashed password for group authentication
- TTL and expiry tracking
- Active/inactive status

#### GroupResourceAllocation
- Junction table linking Groups to InventoryItems
- Tracks allocated quantities
- Unique constraint: one allocation per item per group

---

## Role-Based Access Control

| Role | Inventory CRUD | Groups CRUD | Group Signin |
|------|----------------|-------------|--------------|
| user | ❌ | ❌ | ❌ |
| ngo | ✅ | ✅ | ❌ |
| govt | ❌ | ✅ | ❌ |
| volunteer | ✅ | ✅ | ❌ |
| group | ❌ | ❌ | ✅ |

---

## API Architecture

### Microservices Structure

```
RICOS_PROTO_1/BE/
├── apps/
│   ├── common/          # Port 3000 - Authentication
│   │   └── auth/
│   ├── user_backend/    # Port 8080 - User services
│   └── official_backend/ # Port 8081 - NGO/Govt/Volunteer/Groups
│       ├── inventory/
│       └── groups/
└── libs/
    ├── auth/           # JWT strategy, guards, decorators
    └── prisma/         # Database client
```

### Port Allocation
- **3000**: Common Service (Authentication)
- **8080**: User Backend (Citizen features)
- **8081**: Official Backend (Inventory + Groups)

---

## Key Workflows

### Workflow 1: NGO Creates Inventory & Group

```
1. NGO signs up → POST /auth/signup/ngo
2. NGO adds inventory → POST /inventory
   - Total: 200 Medical Kits
   - Remaining: 200
3. NGO creates group → POST /groups
   - Allocates 50 Medical Kits
   - Sets 20-day expiry
   - Sets password
4. System generates username → ngo_name_group_name
5. Inventory updated → Remaining: 150
6. Group can sign in → POST /groups/signin
```

### Workflow 2: Group Operations

```
1. Group signs in with username/password
2. Receives JWT with role: 'group'
3. Can access group-specific endpoints
4. Token expires after 24 hours
5. If group TTL expires, signin rejected
```

### Workflow 3: Resource Management

```
1. NGO updates group resources → PATCH /groups/:id
2. System restores previous allocations
3. Inventory quantities updated
4. New allocations applied
5. Inventory quantities reduced again
```

---

## Security Features

### 1. Password Security
- bcrypt hashing (10 salt rounds)
- Minimum 6 characters
- Never returned in API responses

### 2. JWT Security
- Secret key from environment
- 24-hour expiration
- Role-based payload
- Validated on every protected endpoint

### 3. Authorization
- Route-level guards with `@Roles()` decorator
- Ownership verification for resource access
- Creator validation for group management

### 4. Data Isolation
- Users can only access their own resources
- Groups isolated by creator
- No cross-organization access

---

## Data Validation

### Input Validation (class-validator)
- Email format validation
- String length requirements
- Number range constraints
- Enum value validation
- Array type validation

### Business Logic Validation
- Inventory quantity checks
- Username uniqueness
- Resource ownership verification
- TTL expiry validation
- Active status checks

---

## Error Handling

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate resource)

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Insufficient quantity for item Medical Kits. Available: 30, Requested: 50",
  "error": "Bad Request"
}
```

---

## Testing

### Test Scripts
- `test.py`: Comprehensive auth flow testing
- `test_inventory.py`: Inventory CRUD testing
- Manual cURL commands in documentation

### Test Coverage
- ✅ Signup/Signin for all roles
- ✅ Inventory CRUD operations
- ✅ Groups creation with allocations
- ✅ Group signin
- ✅ Resource allocation updates
- ✅ TTL expiry handling
- ✅ Access control validation

---

## Frontend Integration Guide

### 1. Authentication Flow
```typescript
// Sign up
const signupResponse = await fetch('http://localhost:3000/auth/signup/ngo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(ngoData)
});
const { access_token, user_type } = await signupResponse.json();

// Store token
localStorage.setItem('token', access_token);
localStorage.setItem('userType', user_type);

// Use token in requests
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
};
```

### 2. Inventory Management
```typescript
// Create inventory
await fetch('http://localhost:8081/inventory', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    item: 'Medical Kits',
    total_quantity: 200
  })
});

// List inventory
const inventory = await fetch('http://localhost:8081/inventory', { headers });
```

### 3. Groups Management
```typescript
// Create group with allocations
await fetch('http://localhost:8081/groups', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    group_name: 'Emergency Team',
    password: 'Team@123',
    ttl_type: '20_days',
    resource_allocations: [
      { inventory_item_id: 'item-id', allocated_quantity: 50 }
    ]
  })
});

// Group signin (separate login page)
const groupLogin = await fetch('http://localhost:8081/groups/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'org_name_group_name',
    password: 'Team@123'
  })
});
```

### 4. UI Components Needed

#### Dashboard (NGO/Govt/Volunteer)
- Inventory list with allocated/remaining quantities
- Groups list with status indicators
- Quick actions: Create group, Allocate resources

#### Group Creation Form
- Group name input
- Password input
- TTL selector (5/20/30 days, no expiry)
- Inventory allocation multi-select
- Quantity input per item

#### Group Management
- List of created groups
- Status badges (Active, Expired, Inactive)
- Edit/Delete actions
- Username display (copy button)
- Resource allocation summary

#### Group Login Page
- Username input (not email!)
- Password input
- Expiry warning if < 2 days
- Redirect to group dashboard after login

---

## Environment Setup

### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ricos"

# JWT
JWT_SECRET="your_super_secret_jwt_key_change_in_production"

# Ports
COMMON_PORT=3000
USER_BACKEND_PORT=8080
OFFICIAL_BACKEND_PORT=8081
```

### Database Migrations
```bash
cd BE
npx prisma migrate dev
npx prisma generate
```

### Start Services
```bash
# Terminal 1 - Common Service (Auth)
npm run start:dev common

# Terminal 2 - Official Backend (Inventory + Groups)
npm run start:dev official_backend

# Terminal 3 - User Backend
npm run start:dev user_backend
```

---

## Next Steps for Frontend

### Priority 1 (Core Features)
1. ✅ Authentication pages (signup/signin)
2. ✅ Inventory management dashboard
3. ✅ Groups creation and management
4. ✅ Group signin page

### Priority 2 (Enhancements)
1. Resource allocation visual selector
2. Inventory quantity charts
3. Group expiry countdown timers
4. Notification system for expiring groups

### Priority 3 (Advanced)
1. Real-time updates (WebSocket)
2. Bulk operations
3. Export reports (CSV/PDF)
4. Analytics dashboard

---

## Known Limitations & Future Enhancements

### Current Limitations
- Government cannot manage inventory (by design - NGOs & volunteers only)
- Groups cannot update their own passwords (must be done by creator)
- No resource transfer between organizations
- No group-to-group communication

### Planned Enhancements
1. Resource transfer requests
2. Group activity logs
3. Bulk group creation
4. Template-based group creation
5. Resource usage analytics
6. Email notifications for expiring groups

---

## Documentation Files

1. **COMPLETE_API_DOCUMENTATION.md** - Full API reference
2. **inventory-api.md** - Detailed inventory endpoints
3. **groups-api.md** - Detailed groups endpoints  
4. **auth/auth-api.txt** - Authentication reference
5. **health-api.txt** - Health check endpoints
6. **IMPLEMENTATION_SUMMARY.md** - This file

---

## Support & Contact

For questions or issues:
1. Check the relevant documentation file
2. Review error messages (they're descriptive!)
3. Test with cURL commands from docs
4. Verify JWT token is valid and not expired
5. Check user role has permission for the endpoint

**Backend Status**: ✅ Production Ready
**Last Updated**: November 15, 2025
