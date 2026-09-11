# Donation System Backend Implementation

## Overview
Complete donation system backend implementation using NestJS + PostgreSQL with Prisma ORM. The system supports donations from users to responder organizations (NGO/Govt/Volunteer) or directly to RICOS platform.

---

## 🏗️ Architecture

### Backend Structure

**User Backend (Port 8080):**
- `/donations/create` - Create new donation with payment processing
- `/donations/my-donations` - Get user's donation history
- `/donations/recipients` - Get list of organizations accepting donations
- `/donations/received` - Get donations received by organization

**Official Backend (Port 8081):**
- `/donations/received` - Get donations received by NGO/Govt/Volunteer
- `/donations/stats` - Get detailed donation statistics

---

## 📊 Database Schema

### Donation Model
```prisma
model Donation {
  id             String   @id @default(uuid())
  donor_user_id  String?  // User who donated (nullable for anonymous)
  donor_name     String?  // Name if not anonymous
  donor_email    String?  // Email for receipt
  recipient_type String   // 'ngo', 'govt', 'volunteer', 'ricos'
  recipient_id   String?  // ID of organization (null if RICOS)
  recipient_name String   // Name of recipient organization
  amount         Float
  currency       String   @default("INR")
  payment_method String   // 'card', 'upi', 'netbanking', 'wallet'
  transaction_id String   @unique
  payment_status String   @default("pending") // pending, success, failed
  is_anonymous   Boolean  @default(false)
  message        String?  // Optional message from donor
  receipt_url    String?  // URL to receipt PDF
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  transaction Transaction?

  @@index([donor_user_id])
  @@index([recipient_id])
  @@index([payment_status])
  @@index([createdAt])
  @@map("donations")
}
```

### Transaction Model
```prisma
model Transaction {
  id              String    @id @default(uuid())
  donation_id     String    @unique
  gateway         String    // 'dummy', 'stripe', 'razorpay'
  gateway_tx_id   String?   // Payment gateway transaction ID
  amount          Float
  currency        String    @default("INR")
  status          String    // 'pending', 'processing', 'success', 'failed'
  payment_details Json?     // Store payment gateway response
  initiated_at    DateTime  @default(now())
  completed_at    DateTime?

  donation Donation @relation(fields: [donation_id], references: [id])

  @@index([gateway_tx_id])
  @@index([status])
  @@map("transactions")
}
```

---

## 🔧 Backend Implementation

### 1. Donations Service (User Backend)

**File:** `BE/apps/user_backend/src/donations/donations.service.ts`

**Key Methods:**

#### `processFakePayment(amount, currency)`
Mock payment processor that always succeeds.

**Features:**
- Generates random transaction ID: `TXN_{timestamp}_{random_hex}`
- Simulates 500ms processing delay
- Always returns SUCCESS status
- Returns gateway response with timestamp

**Example Transaction ID:**
```
TXN_1700123456789_A1B2C3D4E5F6G7H8
```

#### `createDonation(userId, dto)`
Creates donation record with payment processing.

**Workflow:**
1. Fetch donor information from AllUsers table
2. Determine donor name/email based on user type
3. Validate recipient (if not RICOS)
4. Fetch recipient details (NGO/Govt/Volunteer)
5. Process fake payment
6. Create Donation record
7. Create Transaction record
8. Return success response with transaction details

**Request Body:**
```typescript
{
  amount: number;              // Required, minimum 1
  recipient_type: string;      // 'ngo' | 'govt' | 'volunteer' | 'ricos'
  recipient_id?: string;       // Required if not RICOS
  message?: string;            // Optional donor message
  payment_method?: string;     // Default: 'card'
  is_anonymous?: boolean;      // Default: false
}
```

**Response:**
```json
{
  "success": true,
  "donation_id": "uuid",
  "transaction_id": "TXN_1700123456789_A1B2C3D4",
  "amount": 1000,
  "currency": "INR",
  "payment_status": "success",
  "message": "Thank you for your donation of ₹1000 to Red Cross NGO!"
}
```

#### `getMyDonations(userId)`
Get user's donation history.

**Returns:**
```json
{
  "success": true,
  "donations": [
    {
      "id": "uuid",
      "recipient_type": "ngo",
      "recipient_name": "Red Cross",
      "amount": 1000,
      "currency": "INR",
      "payment_status": "success",
      "transaction_id": "TXN_...",
      "message": "Keep up the great work!",
      "created_at": "2025-11-16T10:30:00Z"
    }
  ],
  "total": 5,
  "totalAmount": 5000
}
```

#### `getRecipientOrgs()`
Get list of organizations accepting donations.

**Returns:**
```json
{
  "success": true,
  "organizations": [
    {
      "id": "uuid",
      "name": "Red Cross NGO",
      "type": "ngo",
      "description": "Healthcare NGO - Established 2010",
      "activeGroups": 3
    },
    {
      "id": "uuid",
      "name": "NDRF",
      "type": "govt",
      "description": "Disaster Management - National",
      "activeGroups": 5
    }
  ],
  "total": 25
}
```

**Filters:**
- NGOs: Only verified (`isVerified = true`)
- Governments: Only verified
- Volunteers: All active groups
- Includes active group count for each organization

#### `getReceivedDonations(userId)`
Get donations received by organization.

**Authorization:**
- Only NGO, Government, Volunteer users can access
- Returns donations for their organization only

**Returns:**
```json
{
  "success": true,
  "donations": [
    {
      "id": "uuid",
      "donor_name": "John Doe",
      "amount": 5000,
      "currency": "INR",
      "payment_status": "success",
      "message": "Great work during recent floods",
      "is_anonymous": false,
      "created_at": "2025-11-16T10:30:00Z"
    }
  ],
  "stats": {
    "total": 50,
    "totalAmount": 250000,
    "uniqueDonors": 35
  }
}
```

---

### 2. Donations Controller (User Backend)

**File:** `BE/apps/user_backend/src/donations/donations.controller.ts`

**Endpoints:**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/donations/create` | Create donation | Yes |
| GET | `/donations/my-donations` | User's donations | Yes |
| GET | `/donations/recipients` | List organizations | Yes |
| GET | `/donations/received` | Org's donations | Yes |

**Authentication:**
- Uses `JwtAuthGuard`
- Extracts user ID from JWT token
- All endpoints require valid authentication

---

### 3. Donation Service (Official Backend)

**File:** `BE/apps/official_backend/src/donation/donation.service.ts`

**Key Methods:**

#### `getReceivedDonations(userId)`
Same as user backend - get donations received by organization.

#### `getDonationStats(userId)`
Get detailed donation statistics with monthly breakdown.

**Returns:**
```json
{
  "success": true,
  "stats": {
    "total": 50,
    "totalAmount": 250000,
    "uniqueDonors": 35,
    "thisMonthTotal": 50000,
    "thisMonthCount": 12,
    "averageDonation": 5000
  }
}
```

**Calculations:**
- `total` - Total number of donations
- `totalAmount` - Sum of all donation amounts
- `uniqueDonors` - Count of unique donor IDs
- `thisMonthTotal` - Sum of current month donations
- `thisMonthCount` - Count of current month donations
- `averageDonation` - Average donation amount (rounded)

---

### 4. Donation Controller (Official Backend)

**File:** `BE/apps/official_backend/src/donation/donation.controller.ts`

**Endpoints:**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/donations/received` | Org's donations | Yes |
| GET | `/donations/stats` | Donation statistics | Yes |

---

## 🔐 Security & Validation

### Input Validation (DTO)
```typescript
class CreateDonationDto {
  @IsNumber()
  @Min(1)
  amount: number;  // Must be positive number

  @IsString()
  recipient_type: 'ngo' | 'govt' | 'volunteer' | 'ricos';

  @IsString()
  @IsOptional()
  recipient_id?: string;  // Required if not RICOS

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  payment_method?: string;

  @IsBoolean()
  @IsOptional()
  is_anonymous?: boolean;
}
```

### Authorization Checks
1. **User Authentication:** All endpoints require valid JWT token
2. **Organization Validation:** Recipient must exist in database
3. **Permission Checks:** Only NGO/Govt/Volunteer can view received donations
4. **Anonymous Support:** Users can donate anonymously (donor_user_id = null)

### Error Handling
- `400 BAD_REQUEST` - Invalid input (missing fields, invalid amount)
- `401 UNAUTHORIZED` - Missing or invalid JWT token
- `403 FORBIDDEN` - User not authorized (e.g., regular user trying to view received donations)
- `404 NOT_FOUND` - User or organization not found
- `402 PAYMENT_REQUIRED` - Payment processing failed
- `500 INTERNAL_SERVER_ERROR` - Database or system error

---

## 💳 Payment Processing

### Fake Payment Handler

**Purpose:** Mock payment processor for development/demo

**Implementation:**
```typescript
private async processFakePayment(amount: number, currency: string = 'INR') {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Generate random transaction ID
  const transactionId = `TXN_${Date.now()}_${randomBytes(8).toString('hex').toUpperCase()}`;

  return {
    success: true,
    transactionId,
    status: 'success',
    gatewayResponse: {
      gateway: 'dummy',
      message: 'Payment processed successfully',
      timestamp: new Date().toISOString(),
    },
  };
}
```

**Characteristics:**
- ✅ Always returns SUCCESS
- ⏱️ 500ms simulated delay
- 🔢 Unique transaction IDs
- 📝 Gateway response with metadata
- 💰 Supports any amount (validated by DTO)

**Transaction ID Format:**
```
TXN_{unix_timestamp}_{16_char_hex}
Example: TXN_1700123456789_A1B2C3D4E5F6G7H8
```

### Real Payment Integration (Future)

To integrate real payment gateway (Razorpay/Stripe):

1. Replace `processFakePayment()` with real gateway SDK
2. Add webhook handler for payment confirmation
3. Update transaction status based on gateway callback
4. Generate receipt PDFs
5. Send confirmation emails

---

## 🔄 Data Flow

### Donation Creation Flow

```
User → Frontend
  ↓
  POST /donations/create
  ↓
DonationsController
  ↓
DonationsService.createDonation()
  ↓
  1. Fetch donor info (AllUsers → User/NGO/Govt/Volunteer)
  2. Validate recipient (if not RICOS)
  3. Fetch recipient details
  ↓
processFakePayment()
  ↓
  4. Generate transaction ID
  5. Return SUCCESS
  ↓
  6. Create Donation record
  7. Create Transaction record
  ↓
Return response to frontend
  ↓
Frontend shows success message
```

### Received Donations Flow

```
NGO User → Frontend
  ↓
  GET /donations/received
  ↓
DonationController (Official Backend)
  ↓
DonationService.getReceivedDonations()
  ↓
  1. Fetch user's organization (AllUsers → NGO/Govt/Volunteer)
  2. Query donations where recipient_id = org_id
  3. Filter by payment_status = 'success'
  4. Calculate stats (total, amount, unique donors)
  ↓
Return donations with stats
  ↓
Frontend displays in dashboard
```

---

## 🧪 Testing

### Manual Testing Steps

#### 1. Create Donation (RICOS)
```bash
curl -X POST http://localhost:8080/donations/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "recipient_type": "ricos",
    "message": "Keep up the great work!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "donation_id": "uuid",
  "transaction_id": "TXN_...",
  "amount": 1000,
  "currency": "INR",
  "payment_status": "success",
  "message": "Thank you for your donation of ₹1000 to RICOS!"
}
```

#### 2. Create Donation (NGO)
```bash
curl -X POST http://localhost:8080/donations/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "recipient_type": "ngo",
    "recipient_id": "ngo_uuid_here",
    "message": "Great work during floods",
    "is_anonymous": false
  }'
```

#### 3. Get My Donations
```bash
curl -X GET http://localhost:8080/donations/my-donations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Get Recipients List
```bash
curl -X GET http://localhost:8080/donations/recipients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 5. Get Received Donations (NGO)
```bash
# User Backend
curl -X GET http://localhost:8080/donations/received \
  -H "Authorization: Bearer NGO_JWT_TOKEN"

# Official Backend
curl -X GET http://localhost:8081/donations/received \
  -H "Authorization: Bearer NGO_JWT_TOKEN"
```

#### 6. Get Donation Stats (NGO)
```bash
curl -X GET http://localhost:8081/donations/stats \
  -H "Authorization: Bearer NGO_JWT_TOKEN"
```

---

## 📁 File Structure

```
BE/
├── apps/
│   ├── user_backend/
│   │   └── src/
│   │       ├── donations/
│   │       │   ├── dto/
│   │       │   │   └── donation.dto.ts       # DTOs and interfaces
│   │       │   ├── donations.controller.ts   # API endpoints
│   │       │   ├── donations.service.ts      # Business logic
│   │       │   └── donations.module.ts       # Module definition
│   │       └── user_backend.module.ts        # Import DonationsModule
│   │
│   └── official_backend/
│       └── src/
│           ├── donation/
│           │   ├── donation.controller.ts    # API endpoints
│           │   ├── donation.service.ts       # Business logic
│           │   └── donation.module.ts        # Module definition
│           └── official_backend.module.ts    # Import DonationModule
│
└── prisma/
    └── schema.prisma                         # Donation & Transaction models
```

---

## 🚀 Features Implemented

### ✅ Core Features
- [x] Create donation with payment processing
- [x] Fake payment handler (always SUCCESS)
- [x] Random transaction ID generation
- [x] Save donation details in database
- [x] Support for RICOS direct donations
- [x] Support for organization donations (NGO/Govt/Volunteer)
- [x] Anonymous donation support
- [x] Optional donor message
- [x] Transaction record creation

### ✅ User Features
- [x] View personal donation history
- [x] View list of recipient organizations
- [x] Filter organizations by type
- [x] See active group counts
- [x] Total donation amount tracking

### ✅ Organization Features
- [x] View received donations
- [x] Donation statistics (total, amount, donors)
- [x] Monthly breakdown
- [x] Average donation calculation
- [x] Donor information (name, message)
- [x] Anonymous donation handling

### ✅ Technical Features
- [x] Clean, modular code structure
- [x] Async/await throughout
- [x] Proper error handling
- [x] Input validation with class-validator
- [x] JWT authentication
- [x] Authorization checks
- [x] Database indexing for performance
- [x] TypeScript type safety

---

## 🔮 Future Enhancements

### Payment Integration
- [ ] Integrate Razorpay/Stripe
- [ ] Webhook handlers for payment confirmation
- [ ] Support for UPI payments
- [ ] Multiple currency support
- [ ] Refund processing

### Features
- [ ] Recurring donations (monthly/yearly)
- [ ] Donation campaigns
- [ ] Goal-based fundraising
- [ ] Tax receipt generation (80G certificate)
- [ ] Email notifications
- [ ] SMS confirmations
- [ ] Donation certificates/badges
- [ ] Leaderboard for top donors

### Analytics
- [ ] Donation trends dashboard
- [ ] Geographic distribution
- [ ] Time-series analysis
- [ ] Donor retention metrics
- [ ] Campaign performance tracking

### Admin Features
- [ ] Donation approval workflow
- [ ] Fraud detection
- [ ] Refund management
- [ ] Financial reports
- [ ] Export to accounting software

---

## 📊 Database Queries

### Get All Donations (Admin)
```sql
SELECT * FROM donations 
ORDER BY createdAt DESC;
```

### Get Donations by Organization
```sql
SELECT * FROM donations 
WHERE recipient_type = 'ngo' 
  AND recipient_id = 'ngo_uuid'
  AND payment_status = 'success'
ORDER BY createdAt DESC;
```

### Get Monthly Donation Summary
```sql
SELECT 
  DATE_TRUNC('month', "createdAt") as month,
  COUNT(*) as donation_count,
  SUM(amount) as total_amount,
  COUNT(DISTINCT donor_user_id) as unique_donors
FROM donations
WHERE payment_status = 'success'
GROUP BY DATE_TRUNC('month', "createdAt")
ORDER BY month DESC;
```

### Get Top Donors
```sql
SELECT 
  donor_user_id,
  donor_name,
  COUNT(*) as donation_count,
  SUM(amount) as total_donated
FROM donations
WHERE payment_status = 'success'
  AND is_anonymous = false
GROUP BY donor_user_id, donor_name
ORDER BY total_donated DESC
LIMIT 10;
```

---

## 🎯 API Summary

### User Backend (Port 8080)

| Endpoint | Method | Purpose | Auth | Response |
|----------|--------|---------|------|----------|
| `/donations/create` | POST | Create donation | ✅ | Donation + Transaction |
| `/donations/my-donations` | GET | User's donations | ✅ | Array of donations |
| `/donations/recipients` | GET | List organizations | ✅ | Array of orgs |
| `/donations/received` | GET | Org's donations | ✅ | Donations + Stats |

### Official Backend (Port 8081)

| Endpoint | Method | Purpose | Auth | Response |
|----------|--------|---------|------|----------|
| `/donations/received` | GET | Org's donations | ✅ | Donations + Stats |
| `/donations/stats` | GET | Donation statistics | ✅ | Detailed stats |

---

## ✅ Requirements Checklist

- [x] **POST /donations** – Creates donation record
- [x] **userId** field – Stored as `donor_user_id`
- [x] **amount** field – Float, validated (min: 1)
- [x] **currency** field – Default: "INR"
- [x] **paymentStatus** field – Stored as `payment_status`
- [x] **transactionId** field – Stored as `transaction_id`
- [x] **Fake payment handler** – `processFakePayment()` method
- [x] **Random txn ID generation** – `TXN_{timestamp}_{hex}`
- [x] **Always returns SUCCESS** – Status hardcoded to 'success'
- [x] **Save to donations table** – Using Prisma ORM
- [x] **Display in NGO dashboard** – GET /donations/received
- [x] **Return JSON with txn ID** – Success response includes all details
- [x] **Clean, modular code** – Separate service/controller/dto
- [x] **Async/await** – Used throughout

---

## 🎉 Implementation Complete!

The donation backend system is fully implemented and ready for integration with the frontend. All endpoints are functional, authenticated, and follow NestJS best practices.

**Total Lines of Code:** ~800 lines
**Files Created:** 7 files
**Endpoints Implemented:** 6 endpoints
**Models Used:** Donation, Transaction, AllUsers, NGO, Government, Volunteer

---

Generated: November 16, 2025
Project: RICOS (Rapid Incident Coordination & Outreach System)
Backend Framework: NestJS + Prisma + PostgreSQL
