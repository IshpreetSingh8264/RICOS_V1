# 🔐 RICOS Authentication & Profile System

## Overview

A complete authentication and profile management system using local storage for the RICOS landing page. This system handles user login, profile completion, and persistent sessions.

## 🎯 Features Implemented

### 1. **Login System**
- ✅ Beautiful login page with email/password
- ✅ Auto-registration for new users (demo mode)
- ✅ Agency/NGO portal link (placeholder for future)
- ✅ Error handling and validation
- ✅ Loading states

### 2. **Profile Completion Flow**
- ✅ Step-by-step multi-page form
- ✅ Progress indicator
- ✅ Required fields: Name, Organization, Phone, Role
- ✅ Email is read-only (cannot be changed)
- ✅ Phone number is editable anytime
- ✅ Skip option to complete later
- ✅ Auto-saves partial progress

### 3. **Profile Management**
- ✅ Check if profile is complete
- ✅ Force profile completion on login if incomplete
- ✅ Profile settings dialog for updates
- ✅ Persistent storage in localStorage

### 4. **Navigation Integration**
- ✅ Shows Login button when not authenticated
- ✅ Shows user name and Logout when authenticated
- ✅ Seamless navigation between states

## 📁 File Structure

```
src/
├── contexts/
│   └── AuthContext.tsx          # Authentication context and logic
├── pages/
│   └── LoginPage.tsx            # Login page component
├── components/
│   ├── auth/
│   │   ├── ProfileCompletionForm.tsx   # Multi-step profile form
│   │   └── ProfileSettings.tsx         # Profile edit dialog
│   └── landing/
│       └── Navigation.tsx       # Updated with auth integration
└── App.tsx                      # Main app with routing logic
```

## 🔑 How It Works

### Authentication Flow

```
1. User clicks "Login" in navigation
   ↓
2. Shows LoginPage
   ↓
3. User enters email + password
   ↓
4. System checks localStorage:
   - If user exists: Validate password
   - If new user: Auto-register
   ↓
5. Check if profile is complete
   ↓
6a. Profile Incomplete → Show ProfileCompletionForm
6b. Profile Complete → Return to landing page (logged in)
```

### Profile Completion Flow

```
1. User logs in with incomplete profile
   ↓
2. ProfileCompletionForm appears (4 steps)
   ↓
3. Step 1: Name
   Step 2: Organization
   Step 3: Phone Number
   Step 4: Role
   ↓
4. Each step validates input
   ↓
5. User can skip to complete later
   ↓
6. On completion → Returns to landing page
```

### Data Storage Structure

**localStorage keys:**

```javascript
// All users (email → password mapping)
ricos_users: {
  "user@example.com": "password123",
  "another@example.com": "pass456"
}

// Individual user profiles
ricos_user_user@example.com: {
  email: "user@example.com",
  name: "John Doe",
  organization: "Red Cross",
  phone: "+1 (555) 123-4567",
  role: "Coordinator",
  isProfileComplete: true
}

// Current logged-in user
ricos_user: {
  email: "user@example.com",
  name: "John Doe",
  ...
}
```

## 🚀 Usage Examples

### 1. Check Authentication Status

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { isAuthenticated, user } = useAuth();
  
  if (isAuthenticated) {
    return <p>Welcome, {user?.name}!</p>;
  }
  
  return <p>Please log in</p>;
}
```

### 2. Login a User

```tsx
import { useAuth } from '@/contexts/AuthContext';

function LoginForm() {
  const { login } = useAuth();
  
  const handleSubmit = async (email: string, password: string) => {
    const success = await login(email, password);
    if (success) {
      console.log('Logged in!');
    }
  };
}
```

### 3. Update Profile

```tsx
import { useAuth } from '@/contexts/AuthContext';

function ProfileEditor() {
  const { updateProfile } = useAuth();
  
  const handleUpdate = () => {
    updateProfile({
      name: 'New Name',
      phone: '+1 (555) 999-9999'
    });
  };
}
```

### 4. Logout

```tsx
import { useAuth } from '@/contexts/AuthContext';

function LogoutButton() {
  const { logout } = useAuth();
  
  return <button onClick={logout}>Logout</button>;
}
```

## 🎨 Components API

### AuthContext

**Exports:**
- `useAuth()` - Hook to access auth state and methods
- `AuthProvider` - Context provider component

**Methods:**
```typescript
interface AuthContextType {
  user: User | null;                    // Current user
  isAuthenticated: boolean;              // Login status
  login: (email, password) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data) => void;
  checkProfileCompletion: () => boolean;
}
```

### LoginPage

Simple login page with email/password fields.

**Props:** None

**Features:**
- Email validation
- Password field
- Error messages
- Loading state
- Agency/NGO link

### ProfileCompletionForm

Multi-step form for completing user profile.

**Props:**
```typescript
interface ProfileFormProps {
  onComplete?: () => void;  // Callback when profile is completed
}
```

**Features:**
- 4-step wizard
- Progress bar
- Field validation
- Skip option
- Auto-save

### ProfileSettings

Dialog for editing profile after completion.

**Props:** None

**Features:**
- Edit all fields except email
- Real-time updates
- Save/Cancel actions

## 🔒 Security Notes

### Current Implementation (Demo Mode)
- ⚠️ Uses localStorage (not secure for production)
- ⚠️ Passwords stored in plain text
- ⚠️ No encryption
- ⚠️ Client-side only validation

### For Production
You should implement:
1. ✅ Backend API with proper authentication
2. ✅ JWT tokens or session management
3. ✅ Password hashing (bcrypt, argon2)
4. ✅ HTTPS only
5. ✅ CSRF protection
6. ✅ Rate limiting
7. ✅ Server-side validation

## 📝 Profile Completion Rules

### Required Fields
- ✅ Name
- ✅ Organization
- ✅ Phone Number
- ✅ Role

### Field Rules
- **Email**: Cannot be changed (set at registration)
- **Phone**: Can be updated anytime
- **Others**: Can be updated anytime

### Completion Check
Profile is considered complete when ALL required fields have values.

## 🎯 User Experience Flow

### First-Time User
1. Clicks "Login"
2. Enters new email + password
3. Auto-registered
4. Sees profile completion form
5. Fills 4-step form
6. Returns to landing page as logged-in user

### Returning User (Complete Profile)
1. Clicks "Login"
2. Enters email + password
3. Logs in
4. Returns to landing page immediately

### Returning User (Incomplete Profile)
1. Clicks "Login"
2. Enters email + password
3. Logs in
4. Forced to complete profile form
5. Can skip but will be prompted again on next login
6. Returns to landing page after completion

## 🔄 State Management

The authentication state is managed through React Context and persists across page refreshes using localStorage.

**State Flow:**
```
AuthContext
    ↓
localStorage ←→ User State
    ↓
All Components
```

## 🧪 Testing the System

### Test Scenario 1: New User Registration
```
1. Click "Login" in navigation
2. Enter: email@test.com / password123
3. Should auto-register and show profile form
4. Fill all 4 steps
5. Should return to landing page logged in
```

### Test Scenario 2: Incomplete Profile
```
1. Login as new user
2. Fill only 2 out of 4 steps
3. Click "I'll complete this later"
4. Logout
5. Login again
6. Should show profile form from where you left off
```

### Test Scenario 3: Edit Profile
```
1. Login with complete profile
2. User should see their name in navigation
3. Click on profile settings (if implemented)
4. Change phone number
5. Save
6. Phone number should update
```

## 🎨 Customization

### Change Required Fields
Edit `checkProfileCompletion()` in `AuthContext.tsx`:

```typescript
const checkProfileCompletion = (): boolean => {
  if (!user) return false;
  return !!(
    user.name && 
    user.organization && 
    user.phone && 
    user.role
    // Add more required fields here
  );
};
```

### Add New Profile Fields
1. Update `User` interface in `AuthContext.tsx`
2. Add field to `ProfileCompletionForm.tsx` steps
3. Update validation logic
4. Update `checkProfileCompletion()` if required

## 🐛 Troubleshooting

### Issue: User stays logged in after clearing cache
**Solution:** Clear localStorage manually or implement a logout button

### Issue: Profile form shows even after completion
**Solution:** Check if `isProfileComplete` flag is being set correctly

### Issue: Can't login
**Solution:** Check browser console for errors, verify localStorage is enabled

## 📦 Dependencies Used

- React Context API (built-in)
- Framer Motion (animations)
- shadcn/ui components (UI)
- localStorage API (storage)

## 🚀 Next Steps for Production

1. **Backend Integration**
   - Create authentication API
   - Implement JWT tokens
   - Add password hashing

2. **Enhanced Security**
   - Add HTTPS requirement
   - Implement CSRF tokens
   - Add rate limiting

3. **Additional Features**
   - Password reset flow
   - Email verification
   - Two-factor authentication
   - Social login (Google, GitHub)

4. **Profile Enhancements**
   - Profile photo upload
   - More detailed fields
   - Organization verification
   - Role-based permissions

---

**Created for RICOS** - Rapid Incident Coordination Suite
