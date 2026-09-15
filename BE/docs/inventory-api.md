# Inventory Management API

Base URL: `http://localhost:8081/inventory`

**Authentication**: All endpoints require a valid JWT token in the `Authorization: Bearer <token>` header.

**Roles**: Only `ngo` and `volunteer` roles can access these endpoints.

---

## Endpoints

### 1. Create Inventory Item

**POST** `/inventory`

Create a new inventory item for the authenticated NGO or volunteer.

**Request Body:**
```json
{
  "item": "Medical Kit",
  "total_quantity": 100
}
```

**Fields:**
- `item` (string, required): Name/description of the inventory item
- `total_quantity` (integer, required, min: 0): Total quantity available

**Note:** `remaining_quantity` is now calculated automatically as `total_quantity - sum(allocated_quantity)` from group allocations. You no longer need to provide it in the request.

**Response (201 Created):**
```json
{
  "id": "uuid-string",
  "item": "Medical Kit",
  "total_quantity": 100,
  "remaining_quantity": 100,
  "ngo_id": "uuid-string",
  "volunteer_id": null,
  "createdAt": "2025-11-15T10:30:00.000Z",
  "updatedAt": "2025-11-15T10:30:00.000Z"
}
```

---

### 2. Get All Inventory Items

**GET** `/inventory`

Retrieve all inventory items belonging to the authenticated NGO or volunteer.

**Response (200 OK):**
```json
[
  {
    "id": "uuid-string",
    "item": "Medical Kit",
    "total_quantity": 100,
    "remaining_quantity": 85,
    "ngo_id": "uuid-string",
    "volunteer_id": null,
    "createdAt": "2025-11-15T10:30:00.000Z",
    "updatedAt": "2025-11-15T11:00:00.000Z"
  },
  {
    "id": "uuid-string-2",
    "item": "Water Bottles",
    "total_quantity": 500,
    "remaining_quantity": 450,
    "ngo_id": "uuid-string",
    "volunteer_id": null,
    "createdAt": "2025-11-15T09:00:00.000Z",
    "updatedAt": "2025-11-15T09:00:00.000Z"
  }
]
```

---

### 3. Get Single Inventory Item

**GET** `/inventory/:id`

Retrieve a specific inventory item by ID. Only the owner (NGO or volunteer) can access their own items.

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "item": "Medical Kit",
  "total_quantity": 100,
  "remaining_quantity": 85,
  "ngo_id": "uuid-string",
  "volunteer_id": null,
  "createdAt": "2025-11-15T10:30:00.000Z",
  "updatedAt": "2025-11-15T11:00:00.000Z"
}
```

**Error (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Inventory item with ID uuid-string not found"
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

Update an existing inventory item. Only the owner can update their items.

**Request Body (all fields optional):**
```json
{
  "item": "Advanced Medical Kit",
  "total_quantity": 120
}
```

**Note:** You can only update `item` and `total_quantity`. The `remaining_quantity` is calculated automatically.

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "item": "Advanced Medical Kit",
  "total_quantity": 120,
  "remaining_quantity": 90,
  "ngo_id": "uuid-string",
  "volunteer_id": null,
  "createdAt": "2025-11-15T10:30:00.000Z",
  "updatedAt": "2025-11-15T12:00:00.000Z"
}
```

---

### 5. Delete Inventory Item

**DELETE** `/inventory/:id`

Delete an inventory item. Only the owner can delete their items.

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "item": "Medical Kit",
  "total_quantity": 120,
  "remaining_quantity": 90,
  "ngo_id": "uuid-string",
  "volunteer_id": null,
  "createdAt": "2025-11-15T10:30:00.000Z",
  "updatedAt": "2025-11-15T12:00:00.000Z"
}
```

---

## Error Responses

### 401 Unauthorized
No valid JWT token provided or token expired.
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
User role is not `ngo` or `volunteer`, or attempting to access another user's inventory.
```json
{
  "statusCode": 403,
  "message": "Only NGOs and volunteers can manage inventory"
}
```

### 400 Bad Request
Validation error on request body.
```json
{
  "statusCode": 400,
  "message": ["total_quantity must be a positive number"],
  "error": "Bad Request"
}
```

---

## Example Usage

### Create Inventory (NGO)
```bash
curl -X POST http://localhost:8081/inventory \
  -H "Authorization: Bearer <ngo_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "item": "Emergency Blankets",
    "total_quantity": 200,
    "remaining_quantity": 200
  }'
```

### Get All Inventory (Volunteer)
```bash
curl -X GET http://localhost:8081/inventory \
  -H "Authorization: Bearer <volunteer_token>"
```

### Update Inventory Item
```bash
curl -X PATCH http://localhost:8081/inventory/<item-id> \
  -H "Authorization: Bearer <ngo_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "remaining_quantity": 150
  }'
```

### Delete Inventory Item
```bash
curl -X DELETE http://localhost:8081/inventory/<item-id> \
  -H "Authorization: Bearer <ngo_token>"
```
