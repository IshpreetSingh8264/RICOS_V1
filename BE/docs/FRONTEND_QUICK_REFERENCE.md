# Quick Reference - Frontend Integration

## Base URLs
```
AUTH:      http://localhost:3000
USER:      http://localhost:8080  
OFFICIAL:  http://localhost:8081
```

## User Roles
- `user` - Citizens
- `ngo` - NGO organizations  
- `govt` - Government agencies
- `volunteer` - Volunteer groups
- `group` - Field teams (created by ngo/govt/volunteer)

## Quick Start Endpoints

### Authentication (Port 3000)
```javascript
// Signup
POST /auth/signup/user
POST /auth/signup/ngo
POST /auth/signup/govt
POST /auth/signup/volunteer

// Signin (all types)
POST /auth/signin
Body: { email, password }
Response: { access_token, user_type }
```

### Inventory (Port 8081) - NGO & Volunteer Only
```javascript
// Headers for all inventory requests
headers = {
  'Authorization': 'Bearer <token>',
  'Content-Type': 'application/json'
}

POST   /inventory              // Create
GET    /inventory              // List all (yours only)
GET    /inventory/:id          // Get one
PATCH  /inventory/:id          // Update
DELETE /inventory/:id          // Delete
```

### Groups (Port 8081)
```javascript
// Creator endpoints (NGO/Govt/Volunteer token)
POST   /groups                 // Create with allocations
GET    /groups                 // List all (yours only)
GET    /groups/:id             // Get one with details
PATCH  /groups/:id             // Update
DELETE /groups/:id             // Delete (restores inventory)

// Group signin (public, no token needed)
POST   /groups/signin
Body: { username, password }
Response: { access_token, user_type: 'group', expires_at }
```

## Request/Response Examples

### Create Inventory
```javascript
const createInventory = async (token, item, quantity) => {
  const response = await fetch('http://localhost:8081/inventory', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      item,
      total_quantity: quantity
    })
  });
  return response.json();
};

// Usage
const result = await createInventory(ngoToken, 'Medical Kits', 200);
// Returns: { id, item, total_quantity: 200, remaining_quantity: 200, ... }
```

### Create Group with Resources
```javascript
const createGroup = async (token, groupData) => {
  const response = await fetch('http://localhost:8081/groups', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      group_name: groupData.name,
      password: groupData.password,
      ttl_type: groupData.ttl, // '5_days' | '20_days' | '30_days' | 'no_expiry'
      resource_allocations: groupData.resources // [{ inventory_item_id, allocated_quantity }]
    })
  });
  return response.json();
};

// Usage
const group = await createGroup(ngoToken, {
  name: 'Emergency Team 1',
  password: 'Team@123',
  ttl: '20_days',
  resources: [
    { inventory_item_id: 'item-uuid-1', allocated_quantity: 50 },
    { inventory_item_id: 'item-uuid-2', allocated_quantity: 100 }
  ]
});
// Returns: { id, username: 'org_emergency_team_1', expires_at, resourceAllocations: [...] }
```

### Group Signin
```javascript
const groupSignin = async (username, password) => {
  const response = await fetch('http://localhost:8081/groups/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return response.json();
};

// Usage
const groupAuth = await groupSignin('helping_hands_foundation_emergency_team_1', 'Team@123');
// Returns: { access_token, user_type: 'group', group_name, username, expires_at }
```

## Common Patterns

### Check User Role
```javascript
const userType = localStorage.getItem('userType');

// Show inventory menu for NGOs and Volunteers
if (userType === 'ngo' || userType === 'volunteer') {
  showInventoryMenu();
}

// Show groups menu for NGOs, Govt, and Volunteers
if (['ngo', 'govt', 'volunteer'].includes(userType)) {
  showGroupsMenu();
}

// Group dashboard for groups
if (userType === 'group') {
  showGroupDashboard();
}
```

### Error Handling
```javascript
const handleApiCall = async (apiFunction) => {
  try {
    const response = await apiFunction();
    const data = await response.json();
    
    if (!response.ok) {
      // API returned error
      alert(data.message || 'Something went wrong');
      return null;
    }
    
    return data;
  } catch (error) {
    // Network or parsing error
    console.error('API Error:', error);
    alert('Network error. Please try again.');
    return null;
  }
};
```

### Token Expiry Handling
```javascript
const checkTokenExpiry = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() > expiryTime;
  } catch {
    return true;
  }
};

// Use in route guards
if (checkTokenExpiry(localStorage.getItem('token'))) {
  // Redirect to login
  window.location.href = '/login';
}
```

## UI Component Suggestions

### Inventory List Component
```javascript
// Display inventory with allocated quantities
inventory.map(item => ({
  name: item.item,
  total: item.total_quantity,
  remaining: item.remaining_quantity,
  allocated: item.total_quantity - item.remaining_quantity,
  percentUsed: ((item.total_quantity - item.remaining_quantity) / item.total_quantity * 100).toFixed(1)
}))
```

### Group Status Badge
```javascript
const getGroupStatus = (group) => {
  if (!group.is_active) return { label: 'Inactive', color: 'gray' };
  
  if (group.expires_at) {
    const expiryDate = new Date(group.expires_at);
    const now = new Date();
    
    if (now > expiryDate) {
      return { label: 'Expired', color: 'red' };
    }
    
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 2) {
      return { label: `Expires in ${daysLeft}d`, color: 'yellow' };
    }
  }
  
  return { label: 'Active', color: 'green' };
};
```

### TTL Selector Component
```javascript
const ttlOptions = [
  { value: '5_days', label: '5 Days' },
  { value: '20_days', label: '20 Days' },
  { value: '30_days', label: '30 Days' },
  { value: 'no_expiry', label: 'No Expiry' }
];

// Calculate expiry date for display
const calculateExpiryDate = (ttlType) => {
  const now = new Date();
  switch (ttlType) {
    case '5_days': return new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    case '20_days': return new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
    case '30_days': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case 'no_expiry': return null;
  }
};
```

## Validation Rules

### Password
- Minimum 6 characters
- At least one uppercase, lowercase, number, special character (for user passwords)

### Email
- Valid email format
- Unique in system

### Group Name
- Will be converted to username format: `org_name_group_name`
- Spaces → underscores
- Lowercase
- Example: "Emergency Team 1" → "helping_hands_foundation_emergency_team_1"

### Resource Allocation
- Quantity must be ≤ inventory remaining_quantity
- Must own the inventory item
- Cannot allocate from another organization

## Error Messages

### Common Errors
```javascript
const errorMessages = {
  401: 'Please login again (session expired)',
  403: 'You don\'t have permission for this action',
  404: 'Resource not found',
  409: 'This resource already exists',
  400: 'Invalid input. Check your data.'
};

const showError = (statusCode, message) => {
  const defaultMsg = errorMessages[statusCode] || 'Something went wrong';
  alert(message || defaultMsg);
};
```

## State Management (Example)

### Redux/Context Store Structure
```javascript
{
  auth: {
    token: string,
    userType: 'user' | 'ngo' | 'govt' | 'volunteer' | 'group',
    userId: string,
    email: string
  },
  inventory: {
    items: InventoryItem[],
    loading: boolean,
    error: string | null
  },
  groups: {
    items: Group[],
    loading: boolean,
    error: string | null
  }
}
```

### Sample Actions
```javascript
// Inventory actions
fetchInventory()
createInventory(item, quantity)
updateInventory(id, updates)
deleteInventory(id)

// Groups actions
fetchGroups()
createGroup(groupData)
updateGroup(id, updates)
deleteGroup(id)
allocateResources(groupId, allocations)
```

## Testing Tips

### Use Browser DevTools
```javascript
// Test in browser console
const token = 'your_token_here';

fetch('http://localhost:8081/inventory', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log);
```

### Postman Collection
Import these as environment variables:
- `base_url`: http://localhost:3000
- `official_url`: http://localhost:8081
- `token`: (set after signin)

## Deployment Checklist

- [ ] Update `JWT_SECRET` in production
- [ ] Set correct `DATABASE_URL`
- [ ] Enable CORS for frontend domain
- [ ] Set up HTTPS
- [ ] Configure rate limiting
- [ ] Set up logging/monitoring
- [ ] Test all endpoints in production
- [ ] Update frontend API URLs
- [ ] Test token expiry handling
- [ ] Verify role-based access control

---

**Last Updated**: November 15, 2025  
**Backend Version**: 1.0.0  
**Status**: ✅ Production Ready
