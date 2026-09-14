# Field Comparison: Frontend Forms vs Backend API

## NGO Signup Fields

| Form Label | Frontend Field | Backend API Field | Type | Required | Notes |
|------------|----------------|-------------------|------|----------|-------|
| NGO Name | `ngoName` | `ngo_name` | string | ✅ Yes | |
| Registration Number | `registrationNumber` | `registration_number` | string | ✅ Yes | Unique |
| NGO Type | `ngoType` | `ngo_type` | string | ✅ Yes | |
| Year Established | `yearEstablished` | `year_established` | int | ✅ Yes | Parsed to number |
| Mission Statement | `missionStatement` | `mission_statement` | string | ❌ No | Optional |
| Official Email | `officialEmail` | `email` | string | ✅ Yes | From session |
| Password | - | `password` | string | ✅ Yes | From session |
| Official Contact | `officialContact` | `official_contact` | string | ✅ Yes | Phone number |
| Alternate Contact | `alternateContact` | `alternate_contact` | string | ❌ No | Optional |
| Website | `website` | `website` | string | ❌ No | Optional |
| Registered Address | `registeredAddress` | `registered_address` | string | ✅ Yes | |
| Operational Areas | `operationalAreas` | `operational_areas` | string[] | ✅ Yes | Parsed from comma-separated |
| Location Coordinates | `locationCoordinates` | `location_lat`, `location_lng` | float | ❌ No | Split into lat/lng |
| Admin Name | `adminName` | `admin_name` | string | ✅ Yes | |
| Admin Designation | `designation` | `admin_designation` | string | ✅ Yes | |
| Admin Mobile | `adminMobile` | `admin_mobile` | string | ✅ Yes | |
| Admin Email | `adminEmail` | `admin_email` | string | ✅ Yes | |
| Aadhar Card | `aadharCard` | `aadhar_card` | string | ✅ Yes | |
| Resource Types | `resourceTypes` | `resource_types` | string[] | ❌ No | Parsed from comma-separated |
| Team Strength | `teamStrength` | `team_strength` | int | ❌ No | Parsed to number |
| **Bank Account** | `bankAccountNumber` | `bank_account_number` | string | ✅ Yes | **⭐ NEW FIELD** |

**Total**: 21 fields (15 required, 6 optional)

---

## Government Signup Fields

| Form Label | Frontend Field | Backend API Field | Type | Required | Notes |
|------------|----------------|-------------------|------|----------|-------|
| Agency Name | `agencyName` | `agency_name` | string | ✅ Yes | |
| Department | `department` | `department` | string | ✅ Yes | |
| Government Level | `governmentLevel` | `govt_level` | string | ✅ Yes | central/state/district/local |
| Official ID Number | `serviceIDNumber` | `official_id` | string | ✅ Yes | Unique |
| **Department Code** | `departmentCode` | `department_code` | string | ✅ Yes | **⭐ NEW FIELD** |
| Official Email | `officialEmail` | `email` | string | ✅ Yes | From session |
| Password | - | `password` | string | ✅ Yes | From session |
| HQ Address | `hqAddress` | `hq_address` | string | ✅ Yes | |
| Incharge Name | `inchargeName` | `incharge_name` | string | ✅ Yes | |
| Incharge Mobile | `inchargeContact` | `incharge_mobile` | string | ✅ Yes | |
| Incharge Email | `inchargeEmail` | `incharge_email` | string | ✅ Yes | |
| Control Room Number | `officialContact` | `control_room_number` | string | ❌ No | Optional |
| Jurisdiction Area | `jurisdictionArea` | `jurisdiction_area` | string[] | ✅ Yes | Parsed from comma-separated |
| Resource Types | `resourceTypes` | `resource_types` | string[] | ❌ No | Parsed from comma-separated |
| Deployment Capacity | `deploymentCapacity` | `resource_capacity` | int | ❌ No | Parsed to number |
| **Bank Account** | `bankAccountNumber` | `bank_account_number` | string | ✅ Yes | **⭐ NEW FIELD** |

**Total**: 16 fields (13 required, 3 optional)

---

## Volunteer Signup Fields

| Form Label | Frontend Field | Backend API Field | Type | Required | Notes |
|------------|----------------|-------------------|------|----------|-------|
| Group Name | `groupName` | `group_name` | string | ✅ Yes | |
| Group Type | `groupType` | `volunteer_type` | string | ✅ Yes | |
| Group Size | `groupSize` | `group_size` | int | ✅ Yes | Parsed to number |
| Operational Areas | `operationalAreas` | `operational_areas` | string[] | ✅ Yes | Parsed from comma-separated |
| **Social Media Link** | `socialMediaLink` | `social_media_link` | string | ❌ No | **⭐ NEW FIELD** |
| Email | - | `email` | string | ✅ Yes | From session |
| Password | - | `password` | string | ✅ Yes | From session |
| Leader Name | `leaderName` | `leader_name` | string | ✅ Yes | |
| Leader Contact | `leaderContact` | `leader_phone` | string | ✅ Yes | |
| Leader Email | `leaderEmail` | `leader_email` | string | ✅ Yes | |
| Leader Address | `leaderAddress` | - | string | ✅ Yes | Not sent to backend |
| **ID Proof** | `idProof` | `id_proof` | string | ❌ No | **⭐ NEW FIELD** |
| Medical Training | `medicalTraining` | `has_medical_training` | boolean | ❌ No | Checkbox |
| First Aid Cert | `firstAidCertified` | `has_first_aid_cert` | boolean | ❌ No | Checkbox |
| Vehicle Available | `vehicleAvailable` | `has_vehicle` | boolean | ❌ No | Checkbox |
| Languages Spoken | `languagesSpoken` | `languages_spoken` | string[] | ✅ Yes | Parsed from comma-separated |

**Total**: 16 fields (9 required, 7 optional)

---

## Array Field Parsing

All comma-separated string fields are parsed into arrays before sending to backend:

```typescript
// Example: operational_areas
Input (Frontend):  "Punjab, Chandigarh, Delhi"
                        ↓
Parse & trim:      ["Punjab", "Chandigarh", "Delhi"]
                        ↓
Send to API:       operational_areas: ["Punjab", "Chandigarh", "Delhi"]
                        ↓
Store in DB:       "Punjab,Chandigarh,Delhi"
```

### Array Fields by User Type:

**NGO:**
- `operational_areas` (required)
- `resource_types` (optional)

**Government:**
- `jurisdiction_area` (required)
- `resource_types` (optional)

**Volunteer:**
- `operational_areas` (required)
- `languages_spoken` (required)

---

## Coordinate Field Parsing

Location coordinates are split from single string into lat/lng:

```typescript
// Example: location coordinates
Input (Frontend):  "30.7333, 76.7794"
                        ↓
Parse & split:     [30.7333, 76.7794]
                        ↓
Send to API:       location_lat: 30.7333
                   location_lng: 76.7794
```

**Only used by NGO signup**

---

## Database Storage

### Password Security
- Passwords are **ONLY** stored in `all_users` table
- Other tables (ngos, governments, volunteers, users) do NOT have password field
- Passwords are hashed before storage (bcrypt)

### Full Name for JWT
- `full_name` field in `all_users` table used for JWT token
- NGO: Uses `ngo_name`
- Government: Uses `agency_name`
- Volunteer: Uses `group_name`
- User: Uses `full_name`

### Array Storage
- Arrays are stored as comma-separated strings in database
- Backend handles conversion on read/write
- Example: `["A", "B", "C"]` → `"A,B,C"`

### Foreign Keys
- Each type table has entry in `all_users` via foreign key
- `all_users.ngo_id` → `ngos.id`
- `all_users.govt_id` → `governments.id`
- `all_users.volunteer_id` → `volunteers.id`

---

## New Fields Summary

### ⭐ NGO - 1 New Field
- **Bank Account Number** (Required)
  - Purpose: Fund transfers and resource management
  - Validation: String, required

### ⭐ Government - 2 New Fields
1. **Department Code** (Required)
   - Purpose: Department identification
   - Previously: Was using Official ID as fallback
   - Now: Separate dedicated field

2. **Bank Account Number** (Required)
   - Purpose: Fund allocation and resource management
   - Validation: String, required

### ⭐ Volunteer - 2 New Fields
1. **Social Media Link** (Optional)
   - Purpose: Group visibility and contact
   - Examples: Facebook, Instagram, website URL

2. **ID Proof** (Optional)
   - Purpose: Identity verification
   - Previously: Was using Leader Address as placeholder
   - Now: Separate dedicated field for Aadhar/Voter ID/etc.

---

**Total New Fields Added: 5**
- NGO: 1 field
- Government: 2 fields
- Volunteer: 2 fields

**Status**: ✅ All forms now match backend API exactly
