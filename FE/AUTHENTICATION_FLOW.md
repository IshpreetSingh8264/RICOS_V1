# RICOS Authentication Flow Documentation

## Overview
The RICOS application now features a complete authentication system with login/signup functionality and mandatory profile completion.

## Features Implemented

### 1. **Combined Login/Signup Page**
- **Location**: `src/pages/LoginPage.tsx`
- **Features**:
  - Tabbed interface with "Login" and "Sign Up" tabs
  - Login form for existing users (email + password)
  - Signup form for new users (email + password + confirm password)
  - Password validation (minimum 6 characters)
  - Password confirmation matching
  - Real-time error handling and validation
  - Dark theme styling consistent with the app
  - Helpful demo mode messages

### 2. **Automatic User Registration**
- **Location**: `src/contexts/AuthContext.tsx`
- **How it works**:
  - New users are automatically registered when they enter credentials that don't exist
  - Credentials are stored in `localStorage` under `ricos_users`
  - Each user's profile is stored separately under `ricos_user_{email}`

### 3. **Profile Completion Form**
- **Location**: `src/components/auth/ProfileCompletionForm.tsx`
- **Required Questions**:
  1. **Name**: User's full name
  2. **Organization**: Which organization they represent
  3. **Phone**: Contact phone number
  4. **Role**: Their role (Coordinator, First Responder, etc.)

- **Features**:
  - Step-by-step wizard interface (4 steps)
  - Progress bar showing completion percentage
  - Field validation (all fields required)
  - Option to "complete later" (saves partial progress)
  - Auto-focus on input fields
  - Enter key navigation

### 4. **Smart Profile Checking Logic**
The app automatically determines when to show the profile completion form:

```typescript
// Logic in App.tsx:

// 1. Show LoginPage if user is not authenticated
if (!isAuthenticated) {
  return <LoginPage />;
}

// 2. Show ProfileCompletionForm if user is authenticated but profile is incomplete
if (isAuthenticated && user && !user.isProfileComplete) {
  return <ProfileCompletionForm />;
}

// 3. Show main app if user is authenticated and profile is complete
return <MainApplication />;
```

### 5. **Profile Completion Criteria**
A profile is considered complete when ALL of these fields are filled:
- ✅ Name
- ✅ Organization
- ✅ Phone
- ✅ Role

The system automatically checks this on every login and after profile updates.

## User Flow Scenarios

### Scenario 1: New User Signs Up
1. User clicks "Request a Demo" or "Login" button on landing page
2. User switches to "Sign Up" tab
3. User enters email, password, and confirms password
4. System automatically creates account
5. **Profile completion form is shown immediately**
6. User fills out 4 required questions
7. User is taken to main dashboard

### Scenario 2: Existing User with Complete Profile
1. User clicks "Login" button
2. User enters email and password
3. System verifies credentials
4. **Profile completion is skipped** (profile already complete)
5. User is taken directly to main dashboard

### Scenario 3: Existing User with Incomplete Profile
1. User logs in with email and password
2. System detects profile is incomplete (missing fields)
3. **Profile completion form is shown again**
4. User sees their previously saved information
5. User fills in missing fields
6. User is taken to main dashboard

### Scenario 4: User Skips Profile Completion
1. During profile completion, user clicks "I'll complete this later"
2. Partial progress is saved
3. User can access the app temporarily
4. **Next time user logs in**, profile completion form will be shown again
5. User will see their previously saved partial data

## Technical Implementation

### Data Storage Structure

```javascript
// localStorage structure:

// All registered users (email -> password mapping)
localStorage['ricos_users'] = {
  "user1@email.com": "password123",
  "user2@email.com": "password456"
}

// Individual user profiles
localStorage['ricos_user_user1@email.com'] = {
  email: "user1@email.com",
  name: "John Doe",
  organization: "Red Cross",
  phone: "+1 555-0000",
  role: "Coordinator",
  isProfileComplete: true
}

// Current logged-in user
localStorage['ricos_user'] = {
  email: "user1@email.com",
  name: "John Doe",
  // ... full profile
}
```

### Profile Validation Logic

```typescript
const checkProfileCompletion = (): boolean => {
  if (!user) return false;
  return !!(user.name && user.organization && user.phone && user.role);
};
```

### Key Functions in AuthContext

1. **`login(email, password)`**
   - Checks credentials against localStorage
   - Auto-registers new users
   - Loads existing user profiles
   - Returns `true` if successful, `false` otherwise

2. **`updateProfile(data)`**
   - Updates user profile with new data
   - Automatically recalculates `isProfileComplete`
   - Saves to both current user and user-specific storage

3. **`checkProfileCompletion()`**
   - Returns `true` if all required fields are filled
   - Used by App.tsx to determine routing

4. **`logout()`**
   - Clears current user session
   - Redirects to landing page

## Adding More Questions (Future Enhancement)

To add more profile questions, simply update the `steps` array in `ProfileCompletionForm.tsx`:

```typescript
const steps = [
  // Existing questions...
  {
    title: 'Your new question here?',
    field: 'newFieldName',
    placeholder: 'Placeholder text',
    type: 'text', // or 'email', 'tel', 'number', etc.
  },
];
```

Then update the User interface in `AuthContext.tsx`:

```typescript
interface User {
  email: string;
  name?: string;
  organization?: string;
  phone?: string;
  role?: string;
  newFieldName?: string; // Add new field
  isProfileComplete: boolean;
}
```

And update the validation logic:

```typescript
const checkProfileCompletion = (): boolean => {
  return !!(
    user.name && 
    user.organization && 
    user.phone && 
    user.role &&
    user.newFieldName // Add new field to check
  );
};
```

## Security Notes (Demo Mode)

⚠️ **Important**: The current implementation is for DEMO purposes only and stores data in browser localStorage.

For production, you should:
- Implement proper backend authentication (JWT, OAuth, etc.)
- Hash and salt passwords (never store plain text)
- Use HTTPS for all communications
- Implement session management
- Add rate limiting and security headers
- Use a proper database instead of localStorage
- Implement email verification
- Add forgot password functionality
- Add two-factor authentication (optional)

## Testing the Flow

### Test Case 1: New User
```
1. Go to app
2. Click "Login" or "Request Demo"
3. Switch to "Sign Up" tab
4. Enter: test@example.com / password123 / password123
5. Click "Create Account"
6. ✅ Should see profile completion form
7. Fill all 4 questions
8. ✅ Should access main app
```

### Test Case 2: Existing User
```
1. Logout if logged in
2. Click "Login"
3. Enter existing credentials
4. ✅ Should access main app directly (if profile was complete)
5. ✅ OR see profile completion form (if profile was incomplete)
```

### Test Case 3: Skip Profile
```
1. Login or signup
2. On profile completion form, click "I'll complete this later"
3. ✅ Can access app temporarily
4. Logout and login again
5. ✅ Profile completion form shows again with saved data
```

## Component Hierarchy

```
App.tsx
├── ThemeProvider
│   └── AuthProvider
│       └── AppContent
│           ├── LoginPage (if not authenticated)
│           ├── ProfileCompletionForm (if authenticated but incomplete)
│           └── MainApplication (if authenticated and complete)
│               ├── Navigation
│               ├── HeroSection
│               ├── ... (other landing sections)
│               └── Footer
```

## Summary

✅ **Implemented Features**:
- Combined login/signup page with tabs
- Automatic user registration for demo
- 4-step profile completion wizard
- Smart routing based on authentication and profile status
- Profile completion checking on every login
- Partial profile saving with "complete later" option
- Persistent storage in localStorage
- Dark theme consistent styling
- Real-time validation and error handling
- Helpful user guidance messages

🎯 **User Experience**:
- New users: Sign up → Complete profile → Access app
- Returning users with complete profile: Login → Access app directly
- Returning users with incomplete profile: Login → Complete profile → Access app
- All users can skip profile completion temporarily

📝 **Required Questions** (asked to all users):
1. Name
2. Organization
3. Phone
4. Role

The system will always check if these are filled and prompt users to complete them if missing.
