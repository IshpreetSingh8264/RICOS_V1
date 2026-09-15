# Groups Management API Documentation

## Overview
Groups are created by NGOs, Government agencies, or Volunteer organizations to manage field teams or response units. Each group has:
- Unique username (format: `organizationname_groupname`)
- Password set by creator
- Time-to-live (TTL) expiration
- Resource allocations from creator's inventory
- Independent authentication system

**Base URL**: `http://localhost:8081/groups`

---

## Authentication

### Two Types of Auth:
1. **Creator Auth** (NGO/Govt/Volunteer JWT) - For managing groups
2. **Group Auth** (Username/Password) - For groups to sign in

---

## Endpoints

### 1. Create Group
**POST** `/groups`

**Authentication**: JWT token (NGO, Government, or Volunteer only)

**Headers:**
```
Authorization: Bearer <ngo_govt_or_volunteer_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "group_name": "Emergency Response Unit 1",
  "password": "SecurePass@123",
  "ttl_type": "20_days",
  "resource_allocations": [
    {
      "inventory_item_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "allocated_quantity": 50
    },
    {
      "inventory_item_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "allocated_quantity": 100
    }
  ]
}
```

**Field Descriptions:**
- `group_name` (string, required): Name of the group
- `password` (string, required, min 6 chars): Password for group signin
- `ttl_type` (enum, required): 
  - `"5_days"` - Expires after 5 days
  - `"20_days"` - Expires after 20 days
  - `"30_days"` - Expires after 30 days
  - `"no_expiry"` - Never expires
- `resource_allocations` (array, optional): Resources to assign to the group
  - `inventory_item_id`: ID of inventory item to allocate
  - `allocated_quantity`: Quantity to allocate (must be ≤ available quantity)

**Response (201 Created):**
```json
{
  "id": "group-uuid-here",
  "group_name": "Emergency Response Unit 1",
  "username": "helping_hands_foundation_emergency_response_unit_1",
  "creator_type": "ngo",
  "creator_id": "ngo-uuid-here",
  "ngo_id": "ngo-uuid-here",
  "govt_id": null,
  "volunteer_id": null,
  "ttl_type": "20_days",
  "expires_at": "2025-12-05T15:30:00.000Z",
  "is_active": true,
  "createdAt": "2025-11-15T15:30:00.000Z",
  "updatedAt": "2025-11-15T15:30:00.000Z",
  "resourceAllocations": [
    {
      "id": "allocation-uuid-1",
      "group_id": "group-uuid-here",
      "inventory_item_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "allocated_quantity": 50,
      "createdAt": "2025-11-15T15:30:00.000Z",
      "updatedAt": "2025-11-15T15:30:00.000Z",
      "inventoryItem": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "item": "Medical Kits",
        "total_quantity": 100,
        "remaining_quantity": 50,
        "ngo_id": "ngo-uuid-here",
        "volunteer_id": null,
        "createdAt": "2025-11-15T14:00:00.000Z",
        "updatedAt": "2025-11-15T15:30:00.000Z"
      }
    }
  ]
}
```

**Username Generation:**
- Format: `{org_name}_{group_name}`
- Spaces replaced with underscores
- Converted to lowercase
- Example: "Helping Hands Foundation" + "Emergency Response Unit 1" → `helping_hands_foundation_emergency_response_unit_1`

**Notes:**
- Username is automatically generated and returned
- Password is hashed and stored securely (NOT returned in response)
- Resource allocations reduce inventory `remaining_quantity`
- Can only allocate resources from your own inventory

---

### 2. Get All Groups
**GET** `/groups`

**Authentication**: JWT token (NGO, Government, or Volunteer only)

**Headers:**
```
Authorization: Bearer <ngo_govt_or_volunteer_token>
```

**Response (200 OK):**
```json
[
  {
    "id": "group-uuid-1",
    "group_name": "Emergency Response Unit 1",
    "username": "helping_hands_foundation_emergency_response_unit_1",
    "creator_type": "ngo",
    "creator_id": "ngo-uuid-here",
    "ngo_id": "ngo-uuid-here",
    "govt_id": null,
    "volunteer_id": null,
    "ttl_type": "20_days",
    "expires_at": "2025-12-05T15:30:00.000Z",
    "is_active": true,
    "createdAt": "2025-11-15T15:30:00.000Z",
    "updatedAt": "2025-11-15T15:30:00.000Z",
    "resourceAllocations": [...]
  },
  {
    "id": "group-uuid-2",
    "group_name": "Medical Support Team",
    "username": "helping_hands_foundation_medical_support_team",
    "creator_type": "ngo",
    "creator_id": "ngo-uuid-here",
    "ngo_id": "ngo-uuid-here",
    "govt_id": null,
    "volunteer_id": null,
    "ttl_type": "no_expiry",
    "expires_at": null,
    "is_active": true,
    "createdAt": "2025-11-15T14:00:00.000Z",
    "updatedAt": "2025-11-15T14:00:00.000Z",
    "resourceAllocations": [...]
  }
]
```

**Notes:**
- Returns only groups created by the authenticated user
- Sorted by creation date (newest first)

---

### 3. Get Single Group
**GET** `/groups/:id`

**Authentication**: JWT token (NGO, Government, or Volunteer only)

**Headers:**
```
Authorization: Bearer <ngo_govt_or_volunteer_token>
```

**Response (200 OK):**
```json
{
  "id": "group-uuid-here",
  "group_name": "Emergency Response Unit 1",
  "username": "helping_hands_foundation_emergency_response_unit_1",
  "creator_type": "ngo",
  "creator_id": "ngo-uuid-here",
  "ngo_id": "ngo-uuid-here",
  "govt_id": null,
  "volunteer_id": null,
  "ttl_type": "20_days",
  "expires_at": "2025-12-05T15:30:00.000Z",
  "is_active": true,
  "createdAt": "2025-11-15T15:30:00.000Z",
  "updatedAt": "2025-11-15T15:30:00.000Z",
  "resourceAllocations": [
    {
      "id": "allocation-uuid-1",
      "group_id": "group-uuid-here",
      "inventory_item_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "allocated_quantity": 50,
      "inventoryItem": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "item": "Medical Kits",
        "total_quantity": 100,
        "remaining_quantity": 50
      }
    }
  ]
}
```

**Error (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Group with ID xyz not found"
}
```

**Error (403 Forbidden):**
```json
{
  "statusCode": 403,
  "message": "You do not have access to this group"
}
```

---

### 4. Update Group
**PATCH** `/groups/:id`

**Authentication**: JWT token (NGO, Government, or Volunteer only)

**Headers:**
```
Authorization: Bearer <ngo_govt_or_volunteer_token>
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "group_name": "Emergency Response Unit 1 - Updated",
  "password": "NewSecurePass@456",
  "ttl_type": "30_days",
  "is_active": false,
  "resource_allocations": [
    {
      "inventory_item_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "allocated_quantity": 75
    }
  ]
}
```

**Field Descriptions:**
- `group_name` (optional): Update group name
- `password` (optional, min 6 chars): Change group password
- `ttl_type` (optional): Update expiry period
- `is_active` (optional): Activate/deactivate group
- `resource_allocations` (optional): Replace all resource allocations
  - Previous allocations are removed and inventory is restored
  - New allocations are created

**Response (200 OK):**
```json
{
  "id": "group-uuid-here",
  "group_name": "Emergency Response Unit 1 - Updated",
  "username": "helping_hands_foundation_emergency_response_unit_1",
  "ttl_type": "30_days",
  "expires_at": "2025-12-15T15:30:00.000Z",
  "is_active": false,
  "...": "..."
}
```

**Notes:**
- Username CANNOT be changed (it's generated from original group name)
- Updating `resource_allocations` replaces ALL existing allocations
- Previous inventory quantities are restored before applying new allocations

---

### 5. Delete Group
**DELETE** `/groups/:id`

**Authentication**: JWT token (NGO, Government, or Volunteer only)

**Headers:**
```
Authorization: Bearer <ngo_govt_or_volunteer_token>
```

**Response (200 OK):**
```json
{
  "id": "group-uuid-here",
  "group_name": "Emergency Response Unit 1",
  "username": "helping_hands_foundation_emergency_response_unit_1",
  "...": "..."
}
```

**Notes:**
- Deleting a group restores all allocated inventory quantities
- All resource allocations are automatically deleted (cascade)

---

### 6. Group Sign In
**POST** `/groups/signin`

**Authentication**: None (public endpoint for groups)

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "helping_hands_foundation_emergency_response_unit_1",
  "password": "SecurePass@123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_type": "group",
  "group_name": "Emergency Response Unit 1",
  "username": "helping_hands_foundation_emergency_response_unit_1",
  "expires_at": "2025-12-05T15:30:00.000Z"
}
```

**JWT Payload:**
```json
{
  "sub": "group-uuid-here",
  "username": "helping_hands_foundation_emergency_response_unit_1",
  "role": "group",
  "creator_type": "ngo",
  "creator_id": "ngo-uuid-here",
  "iat": 1700000000,
  "exp": 1700086400
}
```

**Error (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

**Error Cases:**
- Invalid username or password
- Group is inactive (`is_active: false`)
- Group has expired (current time > `expires_at`)

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Insufficient quantity for item Medical Kits. Available: 30, Requested: 50"
}
```

**Causes:**
- Requested allocation exceeds available inventory
- Duplicate group name for same organization

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Only NGOs, Government agencies, and Volunteers can create groups"
}
```

**Causes:**
- Regular users trying to create/manage groups
- Attempting to allocate another organization's inventory
- Accessing another creator's group

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Inventory item xyz not found"
}
```

---

## Example Workflows

### Workflow 1: NGO Creates Emergency Response Team

```bash
# 1. NGO signs in
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "contact@helpinghands.org", "password": "Test@123"}'
# Save the access_token

# 2. Check available inventory
curl -X GET http://localhost:8081/inventory \
  -H "Authorization: Bearer <ngo_token>"

# 3. Create group with resource allocation
curl -X POST http://localhost:8081/groups \
  -H "Authorization: Bearer <ngo_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "group_name": "Emergency Response Unit 1",
    "password": "TeamPass@123",
    "ttl_type": "20_days",
    "resource_allocations": [
      {
        "inventory_item_id": "inventory-item-uuid",
        "allocated_quantity": 50
      }
    ]
  }'
# Note the generated username in response

# 4. Group signs in with generated username
curl -X POST http://localhost:8081/groups/signin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "helping_hands_foundation_emergency_response_unit_1",
    "password": "TeamPass@123"
  }'
```

### Workflow 2: Government Agency Creates Temporary Relief Team

```bash
# 1. Create group with 5-day expiry
curl -X POST http://localhost:8081/groups \
  -H "Authorization: Bearer <govt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "group_name": "Flood Relief Team",
    "password": "Relief@123",
    "ttl_type": "5_days"
  }'

# 2. Update to allocate resources later
curl -X PATCH http://localhost:8081/groups/<group-id> \
  -H "Authorization: Bearer <govt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "resource_allocations": [
      {
        "inventory_item_id": "rescue-kit-uuid",
        "allocated_quantity": 100
      }
    ]
  }'

# 3. Deactivate group when mission complete
curl -X PATCH http://localhost:8081/groups/<group-id> \
  -H "Authorization: Bearer <govt_token>" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

---

## Key Features

### 1. Automatic Username Generation
- Format: `{organization}_{group_name}`
- Unique per organization
- Cannot be changed after creation

### 2. Time-to-Live (TTL)
- Groups can expire automatically
- Four options: 5 days, 20 days, 30 days, or no expiry
- Expired groups cannot sign in
- TTL can be updated by creator

### 3. Resource Allocation
- Allocate inventory items to groups
- Reduces inventory `remaining_quantity`
- Automatic restoration on group deletion or reallocation
- Only creator's inventory can be allocated

### 4. Access Control
- **Creators (NGO/Govt/Volunteer)**: Full CRUD on their groups
- **Groups**: Can sign in with username/password
- **Users**: Cannot manage or access groups

### 5. Group Deactivation
- Set `is_active: false` to temporarily disable group
- Prevents group signin
- Resources remain allocated
- Can be reactivated later

---

## Integration Notes for Frontend

1. **Group Creation Flow**:
   - Display creator's inventory with available quantities
   - Allow multi-select for resource allocation
   - Show generated username after creation
   - Provide download/copy option for username + password

2. **Group Management Dashboard**:
   - List all groups with status indicators (active/inactive/expired)
   - Show resource allocation summary per group
   - Quick actions: deactivate, reset password, delete

3. **Group Sign In**:
   - Separate login page for groups
   - Username input (not email)
   - Show expiry date after successful login
   - Warn if group expires soon (< 2 days)

4. **Inventory Integration**:
   - Show "Allocated" column in inventory list
   - Calculate: Allocated = Total - Remaining
   - Prevent deleting inventory items with active allocations

5. **TTL Management**:
   - Display countdown timer for expiring groups
   - Send notifications before expiry
   - Allow TTL extension before expiration

---

## Database Schema

### Groups Table
```typescript
{
  id: string (UUID)
  group_name: string
  username: string (unique)
  password: string (hashed)
  creator_type: 'ngo' | 'govt' | 'volunteer'
  creator_id: string
  ngo_id?: string
  govt_id?: string
  volunteer_id?: string
  ttl_type: '5_days' | '20_days' | '30_days' | 'no_expiry'
  expires_at?: DateTime
  is_active: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### GroupResourceAllocation Table
```typescript
{
  id: string (UUID)
  group_id: string (FK → Group)
  inventory_item_id: string (FK → InventoryItem)
  allocated_quantity: number
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Unique Constraint**: `(group_id, inventory_item_id)` - One allocation per item per group

---

## Testing Commands

```bash
# Sign up as NGO
curl -X POST http://localhost:3000/auth/signup/ngo \
  -H "Content-Type: application/json" \
  -d '{
    "ngo_name": "Test NGO",
    "registration_number": "NGO2023TEST",
    "ngo_type": "Relief",
    "year_established": 2020,
    "email": "test@ngo.org",
    "password": "Test@123",
    "official_contact": "9876543210",
    "registered_address": "Test Address",
    "operational_areas": ["Delhi"],
    "admin_name": "Admin",
    "admin_designation": "Director",
    "admin_mobile": "9876543210",
    "admin_email": "admin@ngo.org",
    "aadhar_card": "123456789012",
    "bank_account_number": "1234567890"
  }'

# Create inventory
curl -X POST http://localhost:8081/inventory \
  -H "Authorization: Bearer <ngo_token>" \
  -H "Content-Type: application/json" \
  -d '{"item": "Medical Kits", "total_quantity": 200}'

# Create group
curl -X POST http://localhost:8081/groups \
  -H "Authorization: Bearer <ngo_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "group_name": "Response Team 1",
    "password": "Team@123",
    "ttl_type": "20_days",
    "resource_allocations": [{
      "inventory_item_id": "ITEM_ID_HERE",
      "allocated_quantity": 50
    }]
  }'

# Group signin
curl -X POST http://localhost:8081/groups/signin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_ngo_response_team_1",
    "password": "Team@123"
  }'
```
