# Complete API Documentation - RICOS Backend

## Base URLs
- **Common Service (Auth)**: `http://localhost:3000`
- **User Backend**: `http://localhost:8080`
- **Official Backend**: `http://localhost:8081`

---

## Table of Contents
1. [Authentication API](#authentication-api)
2. [Inventory Management API](#inventory-management-api)
3. [Health Check API](#health-check-api)
4. [Common Patterns](#common-patterns)

---

## Authentication API
**Base URL**: `http://localhost:3000/auth`

### User Roles
- `user` - Citizens/Public users
- `ngo` - NGO organizations
- `govt` - Government agencies
- `volunteer` - Volunteer groups

### JWT Token Structure
```json
{
  "sub": "user-id-uuid",
  "email": "user@example.com",
  "userType": "ngo",
  "role": "ngo",
  "iat": 1700000000,
  "exp": 1700086400
}
```

### 1. User Signup
**POST** `/auth/signup/user`

**Request Body:**
```json
{
  "full_name": "John Doe",
  "dob": "1990-05-15",
  "gender": "male",
  "phone_number": "9876543210",
  "alternate_phone": "9123456789",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "current_address": "123 Main St, Apt 4B",
  "pincode": "110001",
  "city": "New Delhi",
  "state": "Delhi",
  "country": "India",
  "aadhar_id": "123456789012",
  "blood_group": "O+",
  "medical_conditions": "None",
  "allergies": "Peanuts",
  "disabilities": "",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_relation": "Spouse",
  "emergency_contact_phone": "9988776655",
  "primary_language": "Hindi",
  "secondary_language": "English",
  "communication_assistance": false,
  "live_location_permission": true,
  "home_location_lat": 28.6139,
  "home_location_lng": 77.2090
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_type": "user"
}
```

---

### 2. NGO Signup
**POST** `/auth/signup/ngo`

**Request Body:**
```json
{
  "ngo_name": "Helping Hands Foundation",
  "registration_number": "NGO2023001234",
  "ngo_type": "Health",
  "year_established": 2010,
  "mission_statement": "Providing healthcare to underserved communities",
  "email": "contact@helpinghands.org",
  "password": "SecurePass@123",
  "official_contact": "9876543210",
  "alternate_contact": "9123456789",
  "website": "https://helpinghands.org",
  "registered_address": "456 NGO Street, Sector 5",
  "operational_areas": ["Delhi", "Noida", "Gurgaon"],
  "location_lat": 28.5355,
  "location_lng": 77.3910,
  "admin_name": "Priya Sharma",
  "admin_designation": "Director",
  "admin_mobile": "9988776655",
  "admin_email": "priya@helpinghands.org",
  "aadhar_card": "987654321012",
  "resource_types": ["Medical Kits", "Ambulances", "Volunteers"],
  "team_strength": 50,
  "bank_account_number": "1234567890123456"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_type": "ngo"
}
```

---

### 3. Government Agency Signup
**POST** `/auth/signup/govt`

**Request Body:**
```json
{
  "agency_name": "Delhi Disaster Management Authority",
  "department": "Relief & Rehabilitation",
  "govt_level": "state",
  "official_id": "DDMA-REL-2023-001",
  "department_code": "REL-001",
  "email": "relief@ddma.gov.in",
  "password": "SecurePass@123",
  "hq_address": "Civil Lines, Delhi - 110054",
  "incharge_name": "Rajesh Kumar",
  "incharge_mobile": "9876543210",
  "incharge_email": "rajesh.kumar@ddma.gov.in",
  "control_room_number": "1077",
  "jurisdiction_area": ["Delhi NCR", "North Delhi", "South Delhi"],
  "resource_types": ["Rescue Vehicles", "Medical Units", "Food Supplies"],
  "resource_capacity": 500,
  "bank_account_number": "9876543210987654"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_type": "govt"
}
```

---

### 4. Volunteer Group Signup
**POST** `/auth/signup/volunteer`

**Request Body:**
```json
{
  "group_name": "Rapid Response Team Delhi",
  "volunteer_type": "group",
  "group_size": 25,
  "operational_areas": ["Delhi", "Faridabad"],
  "email": "contact@rrtdelhi.org",
  "password": "SecurePass@123",
  "social_media_link": "https://instagram.com/rrtdelhi",
  "leader_name": "Amit Singh",
  "leader_phone": "9876543210",
  "leader_email": "amit@rrtdelhi.org",
  "id_proof": "Aadhar-123456789012",
  "has_medical_training": true,
  "has_first_aid_cert": true,
  "has_vehicle": false,
  "languages_spoken": ["Hindi", "English", "Punjabi"]
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_type": "volunteer"
}
```

---

### 5. Sign In (All User Types)
**POST** `/auth/signin`

**Request Body:**
```json
{
  "email": "contact@helpinghands.org",
  "password": "SecurePass@123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_type": "ngo"
}
```

**Notes:**
- System automatically detects user type from email
- No need to specify user type in request
- Works for all user types (user, ngo, govt, volunteer)

---

## Inventory Management API
**Base URL**: `http://localhost:8081/inventory`

**Authentication**: JWT token required (NGO or Volunteer roles only)

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Data Model
```typescript
{
  id: string (UUID)
  item: string
  total_quantity: number
  remaining_quantity: number
  ngo_id: string | null
  volunteer_id: string | null
  createdAt: string (ISO 8601)
  updatedAt: string (ISO 8601)
}
```

---

### 1. Create Inventory Item
**POST** `/inventory`

**Allowed Roles**: `ngo`, `volunteer`

**Request Body:**
```json
{
  "item": "Medical Kits",
  "total_quantity": 100,
  "remaining_quantity": 100
}
```

**Field Validation:**
- `item` (string, required): Item name/description
- `total_quantity` (integer, required, min: 0): Total stock available
- `remaining_quantity` (integer, optional, min: 0): Unallocated quantity (defaults to `total_quantity`)

**Response (201 Created):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "item": "Medical Kits",
  "total_quantity": 100,
  "remaining_quantity": 100,
  "ngo_id": "ngo-uuid-here",
  "volunteer_id": null,
  "createdAt": "2025-11-15T14:30:00.000Z",
  "updatedAt": "2025-11-15T14:30:00.000Z"
}
```

---

### 2. Get All Inventory Items
**GET** `/inventory`

**Allowed Roles**: `ngo`, `volunteer`

**Response (200 OK):**
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "item": "Medical Kits",
    "total_quantity": 100,
    "remaining_quantity": 85,
    "ngo_id": "ngo-uuid-here",
    "volunteer_id": null,
    "createdAt": "2025-11-15T14:30:00.000Z",
    "updatedAt": "2025-11-15T15:00:00.000Z"
  },
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "item": "Water Bottles (500ml)",
    "total_quantity": 500,
    "remaining_quantity": 450,
    "ngo_id": "ngo-uuid-here",
    "volunteer_id": null,
    "createdAt": "2025-11-15T14:00:00.000Z",
    "updatedAt": "2025-11-15T14:00:00.000Z"
  }
]
```

**Notes:**
- Only returns inventory items owned by the authenticated user
- Results sorted by creation date (newest first)

---

### 3. Get Single Inventory Item
**GET** `/inventory/:id`

**Allowed Roles**: `ngo`, `volunteer`

**Response (200 OK):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "item": "Medical Kits",
  "total_quantity": 100,
  "remaining_quantity": 85,
  "ngo_id": "ngo-uuid-here",
  "volunteer_id": null,
  "createdAt": "2025-11-15T14:30:00.000Z",
  "updatedAt": "2025-11-15T15:00:00.000Z"
}
```

**Error (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Inventory item with ID a1b2c3d4-e5f6-7890-abcd-ef1234567890 not found"
}
```

**Error (403 Forbidden):**
```json
{
  "statusCode": 403,
  "message": "You do not have access to this inventory item"
}
```

---

### 4. Update Inventory Item
**PATCH** `/inventory/:id`

**Allowed Roles**: `ngo`, `volunteer`

**Request Body (all fields optional):**
```json
{
  "item": "Advanced Medical Kits",
  "total_quantity": 120,
  "remaining_quantity": 90
}
```

**Response (200 OK):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "item": "Advanced Medical Kits",
  "total_quantity": 120,
  "remaining_quantity": 90,
  "ngo_id": "ngo-uuid-here",
  "volunteer_id": null,
  "createdAt": "2025-11-15T14:30:00.000Z",
  "updatedAt": "2025-11-15T16:00:00.000Z"
}
```

---

### 5. Delete Inventory Item
**DELETE** `/inventory/:id`

**Allowed Roles**: `ngo`, `volunteer`

**Response (200 OK):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "item": "Advanced Medical Kits",
  "total_quantity": 120,
  "remaining_quantity": 90,
  "ngo_id": "ngo-uuid-here",
  "volunteer_id": null,
  "createdAt": "2025-11-15T14:30:00.000Z",
  "updatedAt": "2025-11-15T16:00:00.000Z"
}
```

---

## Health Check API

### User Backend Health Check
**GET** `http://localhost:8080/health`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T16:30:00.000Z",
  "service": "user_backend",
  "user": {
    "userId": "user-uuid-here",
    "email": "john@example.com",
    "role": "user",
    "userType": "user"
  }
}
```

---

### Official Backend Health Check
**GET** `http://localhost:8081/health`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T16:30:00.000Z",
  "service": "official_backend",
  "user": {
    "userId": "ngo-uuid-here",
    "email": "contact@helpinghands.org",
    "role": "ngo",
    "userType": "ngo"
  }
}
```

---

## Common Patterns

### Error Responses

#### 400 Bad Request (Validation Error)
```json
{
  "statusCode": 400,
  "message": [
    "total_quantity must be a positive number",
    "item should not be empty"
  ],
  "error": "Bad Request"
}
```

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Causes:**
- Missing Authorization header
- Invalid JWT token
- Expired JWT token

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Only NGOs and volunteers can manage inventory"
}
```

**Causes:**
- User role doesn't have permission for the endpoint
- Attempting to access another user's resources

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Inventory item with ID xyz not found"
}
```

#### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Email already exists"
}
```

---

### Testing with cURL

#### Sign up as NGO
```bash
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
```

#### Create Inventory Item
```bash
curl -X POST http://localhost:8081/inventory \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "item": "Medical Kits",
    "total_quantity": 100
  }'
```

#### Get All Inventory
```bash
curl -X GET http://localhost:8081/inventory \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Update Inventory Item
```bash
curl -X PATCH http://localhost:8081/inventory/ITEM_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "remaining_quantity": 85
  }'
```

#### Delete Inventory Item
```bash
curl -X DELETE http://localhost:8081/inventory/ITEM_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Environment Configuration

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

---

## Role-Based Access Control Summary

| Endpoint | User | NGO | Govt | Volunteer |
|----------|------|-----|------|-----------|
| POST /auth/signup/* | ✅ | ✅ | ✅ | ✅ |
| POST /auth/signin | ✅ | ✅ | ✅ | ✅ |
| GET /inventory | ❌ | ✅ | ❌ | ✅ |
| POST /inventory | ❌ | ✅ | ❌ | ✅ |
| PATCH /inventory/:id | ❌ | ✅ | ❌ | ✅ |
| DELETE /inventory/:id | ❌ | ✅ | ❌ | ✅ |
| GET /health (user_backend) | ✅ | ✅ | ✅ | ✅ |
| GET /health (official_backend) | ✅ | ✅ | ✅ | ✅ |

---

## Database Schema Overview

### AllUsers Table
Unified authentication table
```typescript
{
  id: string
  email: string (unique)
  password: string (hashed)
  user_type: 'user' | 'ngo' | 'govt' | 'volunteer'
  full_name: string
  user_id?: string (FK to User)
  ngo_id?: string (FK to NGO)
  govt_id?: string (FK to Government)
  volunteer_id?: string (FK to Volunteer)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### InventoryItem Table
```typescript
{
  id: string
  item: string
  total_quantity: number
  remaining_quantity: number
  ngo_id?: string (FK to NGO)
  volunteer_id?: string (FK to Volunteer)
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

## Notes for Frontend Integration

1. **Token Management**: Store the `access_token` securely (e.g., httpOnly cookies or secure localStorage)
2. **Token Expiry**: Tokens expire after 24 hours - implement refresh logic or prompt re-login
3. **Role Detection**: Use the `user_type` from signin response to determine UI/navigation
4. **Error Handling**: Check `statusCode` in responses for proper error handling
5. **Validation**: Frontend should validate inputs before sending to reduce unnecessary API calls
6. **Date Formats**: All dates in ISO 8601 format (e.g., "2025-11-15T14:30:00.000Z")
7. **Arrays**: Send arrays as JSON arrays, not stringified (backend handles serialization)
