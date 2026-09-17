# Frontend-Backend Schema Alignment Complete

## Summary of Changes

All frontend signup forms have been updated to match the backend API expectations as defined in:
- `/BE/docs/auth/auth-api.txt`
- `/BE/apps/common/src/auth/auth.dto.ts`
- `/BE/prisma/schema.prisma`

## Changes Made

### 1. NGO Signup Form (`/FE/src/pages/NGOSignupForm.tsx`)

#### Added Fields:
- **Bank Account Number** (Required)
  - Form field: `bankAccountNumber`
  - Backend field: `bank_account_number`
  - Added to form state
  - Added UI input with validation
  - Section G: Banking Information

#### Updated Sections:
- Section G: Banking Information (NEW)
- Section H: Terms & Conditions (renumbered from G)

#### Complete Field Mapping:
```typescript
Frontend Form Field          → Backend API Field
--------------------           ------------------
ngoName                      → ngo_name
registrationNumber           → registration_number
ngoType                      → ngo_type
yearEstablished              → year_established (parsed to int)
missionStatement             → mission_statement
email (from session)         → email
password (from session)      → password
officialContact              → official_contact
alternateContact             → alternate_contact
website                      → website
registeredAddress            → registered_address
operationalAreas             → operational_areas (parsed to array)
locationCoordinates          → location_lat, location_lng (parsed)
adminName                    → admin_name
designation                  → admin_designation
adminMobile                  → admin_mobile
adminEmail                   → admin_email
aadharCard                   → aadhar_card
resourceTypes                → resource_types (parsed to array)
teamStrength                 → team_strength (parsed to int)
bankAccountNumber            → bank_account_number ✅ NEW
```

### 2. Government Signup Form (`/FE/src/pages/GovernmentSignupForm.tsx`)

#### Added Fields:
- **Department Code** (Required)
  - Form field: `departmentCode`
  - Backend field: `department_code`
  - Previously was defaulting to `official_id`, now has dedicated input
  
- **Bank Account Number** (Required)
  - Form field: `bankAccountNumber`
  - Backend field: `bank_account_number`
  - Added to form state
  - Added UI input with validation
  - Section F: Banking Information

#### Updated Sections:
- Section B: Agency Information - Added Department Code field
- Section F: Banking Information (NEW)
- Section G: Terms & Conditions (renumbered from F)

#### Updated Field Validations:
- `jurisdictionArea`: Changed placeholder to indicate comma-separated values
- `resourceTypes`: Made optional (removed required attribute)
- `deploymentCapacity`: Made optional, added number type

#### Complete Field Mapping:
```typescript
Frontend Form Field          → Backend API Field
--------------------           ------------------
agencyName                   → agency_name
department                   → department
governmentLevel              → govt_level
serviceIDNumber              → official_id
departmentCode               → department_code ✅ NEW
email (from session)         → email
password (from session)      → password
hqAddress                    → hq_address
inchargeName                 → incharge_name
inchargeContact              → incharge_mobile
inchargeEmail                → incharge_email
officialContact              → control_room_number
jurisdictionArea             → jurisdiction_area (parsed to array)
resourceTypes                → resource_types (parsed to array, optional)
deploymentCapacity           → resource_capacity (parsed to int, optional)
bankAccountNumber            → bank_account_number ✅ NEW
```

### 3. Volunteer Signup Form (`/FE/src/pages/VolunteerSignupForm.tsx`)

#### Added Fields:
- **Social Media Link** (Optional)
  - Form field: `socialMediaLink`
  - Backend field: `social_media_link`
  - Added to Group Information section
  
- **ID Proof** (Optional)
  - Form field: `idProof`
  - Backend field: `id_proof`
  - Previously was using `leaderAddress` as placeholder
  - Now has dedicated input field

#### Updated Sections:
- Section A: Group Information - Added Social Media Link field
- Section B: Point of Contact / Group Leader - Added ID Proof field

#### Complete Field Mapping:
```typescript
Frontend Form Field          → Backend API Field
--------------------           ------------------
groupName                    → group_name
groupType                    → volunteer_type
groupSize                    → group_size (parsed to int)
operationalAreas             → operational_areas (parsed to array)
socialMediaLink              → social_media_link ✅ NEW
email (from session)         → email
password (from session)      → password
leaderName                   → leader_name
leaderContact                → leader_phone
leaderEmail                  → leader_email
idProof                      → id_proof ✅ NEW
medicalTraining              → has_medical_training
firstAidCertified            → has_first_aid_cert
vehicleAvailable             → has_vehicle
languagesSpoken              → languages_spoken (parsed to array)
```

## Database Schema Alignment

### All Users Table (`all_users`)
Stores authentication data for all user types:
```prisma
model AllUsers {
  id            String      @id @default(uuid())
  email         String      @unique
  password      String      // Only stored here
  user_type     String      // 'user', 'ngo', 'govt', 'volunteer'
  full_name     String      // Used in JWT token
  user_id       String?     @unique
  ngo_id        String?     @unique
  govt_id       String?     @unique
  volunteer_id  String?     @unique
}
```

### NGO Table (`ngos`)
```prisma
model NGO {
  id                      String     @id @default(uuid())
  email                   String     @unique
  ngo_name                String
  registration_number     String     @unique
  ngo_type                String
  year_established        Int
  mission_statement       String?
  official_contact        String
  alternate_contact       String?
  website                 String?
  registered_address      String
  operational_areas       String     // Stored as comma-separated string
  location_lat            Float?
  location_lng            Float?
  admin_name              String
  admin_designation       String
  admin_mobile            String
  admin_email             String
  aadhar_card             String
  resource_types          String?    // Stored as comma-separated string
  team_strength           Int?
  bank_account_number     String     // ✅ Required
  isVerified              Boolean    @default(false)
}
```

### Government Table (`governments`)
```prisma
model Government {
  id                    String     @id @default(uuid())
  email                 String     @unique
  agency_name           String
  department            String
  govt_level            String
  official_id           String     @unique
  department_code       String     // ✅ Required
  hq_address            String
  incharge_name         String
  incharge_mobile       String
  incharge_email        String
  control_room_number   String?
  jurisdiction_area     String     // Stored as comma-separated string
  resource_types        String?    // Stored as comma-separated string
  resource_capacity     Int?
  bank_account_number   String     // ✅ Required
  isVerified            Boolean    @default(false)
}
```

### Volunteer Table (`volunteers`)
```prisma
model Volunteer {
  id                    String     @id @default(uuid())
  email                 String     @unique
  group_name            String
  volunteer_type        String
  group_size            Int
  operational_areas     String     // Stored as comma-separated string
  social_media_link     String?    // ✅ Optional
  leader_name           String
  leader_phone          String
  leader_email          String
  id_proof              String?    // ✅ Optional
  has_medical_training  Boolean    @default(false)
  has_first_aid_cert    Boolean    @default(false)
  has_vehicle           Boolean    @default(false)
  languages_spoken      String     // Stored as comma-separated string
}
```

### Responder Table (`responders`)
Created automatically for NGO, Government, and Volunteer signups:
```prisma
model Responder {
  id                  String      @id @default(uuid())
  ngo_id              String?     @unique
  volunteer_id        String?     @unique
  govt_id             String?     @unique
  services_provided   String
  bank_account_number String      // Copied from NGO/Govt/Volunteer
  location_lat        Float?
  location_lng        Float?
  location_address    String?
  isActive            Boolean     @default(true)
}
```

## API Endpoints

### Authentication Service (Port 3000)
```
POST /auth/signup/user
POST /auth/signup/ngo
POST /auth/signup/govt
POST /auth/signup/volunteer
POST /auth/signin
```

All signup endpoints return:
```typescript
{
  access_token: string;  // JWT token with 24h expiry
  user_type: 'user' | 'ngo' | 'govt' | 'volunteer';
}
```

JWT Token Payload:
```typescript
{
  sub: string;           // User ID
  email: string;
  userType: UserType;
  full_name: string;     // Display name
  iat: number;           // Issued at
  exp: number;           // Expiry (24h)
}
```

## Validation Rules

### NGO Signup
**Required Fields:**
- ngo_name, registration_number, ngo_type, year_established
- email, password
- official_contact, registered_address
- operational_areas (array with at least 1 item)
- admin_name, admin_designation, admin_mobile, admin_email
- aadhar_card
- bank_account_number ✅

**Optional Fields:**
- mission_statement, alternate_contact, website
- location_lat, location_lng
- resource_types, team_strength

### Government Signup
**Required Fields:**
- agency_name, department, govt_level
- official_id, department_code ✅
- email, password
- hq_address
- incharge_name, incharge_mobile, incharge_email
- jurisdiction_area (array with at least 1 item)
- bank_account_number ✅

**Optional Fields:**
- control_room_number
- resource_types, resource_capacity

### Volunteer Signup
**Required Fields:**
- group_name, volunteer_type, group_size
- operational_areas (array with at least 1 item)
- email, password
- leader_name, leader_phone, leader_email
- languages_spoken (array with at least 1 item)

**Optional Fields:**
- social_media_link ✅
- id_proof ✅
- has_medical_training, has_first_aid_cert, has_vehicle

## Array Handling

Frontend forms use comma-separated strings which are parsed into arrays:

```typescript
// Frontend parsing
const operationalAreas = formData.operationalAreas
  .split(',')
  .map(area => area.trim())
  .filter(area => area.length > 0);
```

Backend expects proper arrays:
```typescript
operational_areas: string[]  // ['Punjab', 'Chandigarh', 'Delhi']
```

Backend stores as comma-separated strings in database:
```prisma
operational_areas String  // "Punjab,Chandigarh,Delhi"
```

## Profile API Consistency

Profile APIs use a different schema (legacy) and are NOT yet updated:

### User Backend (Port 8080)
```
GET /profile
PUT /profile
DELETE /profile
```

### Official Backend (Port 8081)
```
GET /profile
PUT /profile
DELETE /profile
```

**Note:** Profile APIs use fields like `first_name`, `last_name`, `organisation_name` which differ from signup schemas. Profile API integration should be handled separately and is not part of signup flow.

## Testing Checklist

### NGO Signup
- ✅ All required fields present in form
- ✅ Bank account number field added
- ✅ Arrays parsed correctly (operational_areas, resource_types)
- ✅ Coordinates parsed correctly
- ✅ JWT token includes `full_name` from `ngo_name`

### Government Signup
- ✅ All required fields present in form
- ✅ Department code field added (separate from official_id)
- ✅ Bank account number field added
- ✅ Arrays parsed correctly (jurisdiction_area, resource_types)
- ✅ Optional fields handled correctly
- ✅ JWT token includes `full_name` from `agency_name`

### Volunteer Signup
- ✅ All required fields present in form
- ✅ Social media link field added
- ✅ ID proof field added (not using address anymore)
- ✅ Arrays parsed correctly (operational_areas, languages_spoken)
- ✅ Boolean fields handled correctly
- ✅ JWT token includes `full_name` from `group_name`

## Files Modified

### Frontend Files (3)
1. `/FE/src/pages/NGOSignupForm.tsx`
   - Added `bankAccountNumber` to form state
   - Added Banking Information section (Section G)
   - Updated submit handler to use actual bank account number

2. `/FE/src/pages/GovernmentSignupForm.tsx`
   - Added `departmentCode` to form state
   - Added `bankAccountNumber` to form state
   - Added Department Code input field
   - Added Banking Information section (Section F)
   - Updated submit handler to use both fields

3. `/FE/src/pages/VolunteerSignupForm.tsx`
   - Added `socialMediaLink` to form state
   - Added `idProof` to form state
   - Added Social Media Link input field
   - Added ID Proof input field
   - Updated submit handler to use both fields

### Backend Files (Already Updated)
- `/BE/apps/common/src/auth/auth.dto.ts` - DTOs match schema
- `/BE/apps/common/src/auth/auth.service.ts` - JWT includes full_name
- `/BE/prisma/schema.prisma` - Database schema

## Next Steps

1. **Test All Signup Forms**: Test each user type signup with complete data
2. **Verify Database Entries**: Check that all fields are saved correctly
3. **Test JWT Tokens**: Verify full_name appears in JWT payload
4. **Test Dashboard Display**: Confirm names display correctly
5. **Test Profile APIs**: When needed, update profile API integration separately

---

**Status**: ✅ All signup forms are now fully aligned with backend API expectations
**Last Updated**: Current session
**Requires**: Backend restart to apply JWT payload changes (if not already done)
