# Flamingo Nails App - Comprehensive Codebase Analysis

## Executive Summary

**App Type:** React Native (Expo) mobile application for a beauty salon booking system  
**Architecture:** Frontend (React Native) + Backend (Node.js/Express) + Firebase (Auth & Firestore)  
**Main Purpose:** Allow customers to book beauty services, chat with AI assistant, and manage appointments

---

## 1. App Flow & Architecture

### 1.1 Entry Point
- **File:** `frontend/index.js` → Registers `App.js` as root component
- **Main App:** `frontend/App.js` - Contains all screen components and navigation setup

### 1.2 Navigation Structure
- **Navigation Library:** `@react-navigation/native` with `createNativeStackNavigator`
- **Navigation Container:** Wraps all screens in `App.js` (lines 1045-1060)

### 1.3 Data Flow
1. **Authentication:** Firebase Auth (`firebaseConfig.ts`)
2. **Database:** Firestore for users, bookings, archived bookings
3. **Backend API:** `https://flamingo-ctga.onrender.com` for:
   - User creation (`/create-user`)
   - Booking creation (`/book`)
   - AI chat (`/ai-chat`)

---

## 2. All Screens Identified

### 2.1 Active Screens (Registered in Navigation)

| Screen Name | Component | Location | Purpose |
|------------|-----------|----------|---------|
| **Home** | `HomeScreen` | `App.js:286-397` | Main landing page with navigation options |
| **SignIn** | `SignInScreen` | `App.js:34-141` | Email/password login |
| **SignUp** | `SignUpScreen` | `App.js:144-284` | User registration |
| **Services** | `ServicesScreen` | `App.js:490-589` | Display all available services |
| **Book** | `BookScreen` | `App.js:593-708` | Book appointment for selected service |
| **MyBookings** | `MyBookingsScreen` | `App.js:785-891` | View user's booking history |
| **Chat** | `ChatScreen` | `App.js:976-1039` | AI assistant chat interface |
| **ReceptionistDashboard** | `ReceptionistDashboard` | `screens/ReceptionistDashboard.js` | Admin dashboard for managing bookings |

### 2.2 Unused Screen Files (Not Imported)

| File | Location | Status |
|------|----------|--------|
| `LoginScreen.js` | `frontend/screens/LoginScreen.js` | ❌ **UNUSED** - Duplicate of `SignInScreen` in App.js |
| `SignupScreen.js` | `frontend/screens/SignupScreen.js` | ❌ **UNUSED** - Duplicate of `SignUpScreen` in App.js |

**Issue:** These files exist but are never imported. The app uses inline screen components defined in `App.js` instead.

---

## 3. Navigation Flow Diagram

```
┌─────────────────┐
│   Home Screen   │ (Initial Screen)
└────────┬────────┘
         │
         ├───→ SignIn ───→ Home (after login)
         │
         ├───→ SignUp ───→ (stays on SignUp, no auto-navigation)
         │
         ├───→ Services ───→ Book ───→ Home (after booking)
         │
         ├───→ MyBookings
         │
         ├───→ Chat
         │
         └───→ ReceptionistDashboard (role-based, only if role === 'receptionist')
```

### 3.1 Navigation Details

**Home → Services:**
- Navigates to `ServicesScreen` showing all available services
- Each service card navigates to `Book` screen with service data as route params

**Home → Book:**
- Only accessible via Services screen (receives `service` param)
- After booking confirmation, uses `navigation.popToTop()` to return to Home

**Home → MyBookings:**
- Direct navigation, no params
- Fetches bookings from Firestore using current user's email

**Home → Chat:**
- Direct navigation to AI chat interface
- No params required

**Home → ReceptionistDashboard:**
- Conditional navigation (only visible if `user && role === 'receptionist'`)
- Fetches user role from Firestore on Home screen mount

**SignIn → Home:**
- Uses `navigation.reset()` to clear navigation stack after successful login

---

## 4. UI Layout Analysis by Screen

### 4.1 HomeScreen (`App.js:286-397`)
**Layout Structure:**
```
┌─────────────────────────────┐
│      Logo (150x150)         │
│   Welcome to Flamingo Nails │
│  Where beauty meets...      │
│                             │
│  [💖 Book Appointment]      │
│  [💬 Chat with AI]          │
│  [📅 My Bookings]           │
│  [🪶 Receptionist Dashboard]│ (conditional)
│                             │
│  Signed in as: email        │
│  [Sign out]                 │
│  📍 Mangalore • 📍 Manipal  │
└─────────────────────────────┘
```

**Styling:**
- Background: `#FFF5F8` (light pink)
- Buttons: `#FFC0CB` (pink) with rounded corners
- Logo: Centered, 150x150px
- Footer: Absolute positioned at bottom

### 4.2 SignInScreen (`App.js:34-141`)
**Layout Structure:**
```
┌─────────────────────────────┐
│        Flamingo              │ (title)
│                             │
│  [Email Input Field]        │
│  [Password Input Field]     │
│                             │
│  [Sign In Button]           │ (pink #ff6fa3)
│  [Create Account Button]    │ (outlined)
└─────────────────────────────┘
```

**Styling:**
- Background: `#fdf6f0` (cream)
- Inputs: White background, pink border (`#ffb6c1`)
- Primary button: `#ff6fa3` (pink)

### 4.3 SignUpScreen (`App.js:144-284`)
**Layout Structure:**
```
┌─────────────────────────────┐
│        Sign Up               │
│                             │
│  [Full Name]                │
│  [Phone Number]              │
│  [Email]                     │
│  [Password]                  │
│                             │
│  [Create Account Button]    │
└─────────────────────────────┘
```

**Styling:**
- Same as SignIn (cream background, pink accents)
- No navigation button to SignIn (unlike LoginScreen.js which has it)

### 4.4 ServicesScreen (`App.js:490-589`)
**Layout Structure:**
```
┌─────────────────────────────┐
│      Logo (90x90)           │
│  💅 Flamingo Nails Services │
│                             │
│  ┌─────────────────────┐     │
│  │  Service Image     │     │
│  │  Service Name      │     │
│  │  Duration: X mins  │     │
│  │  ₹Price            │     │
│  └─────────────────────┘     │
│  (Scrollable FlatList)      │
└─────────────────────────────┘
```

**Styling:**
- Background: `#fff5f8`
- Service cards: `#ffe6ef` with rounded corners, shadow
- Images: Full width, 160px height
- Each card is tappable → navigates to Book screen

### 4.5 BookScreen (`App.js:593-708`)
**Layout Structure:**
```
┌─────────────────────────────┐
│      Logo (110x110)         │
│  Book [Service Name]        │
│  💅 Choose your perfect...  │
│                             │
│  [📅 Choose Date]           │ (gradient button)
│  [⏰ Choose Time]           │ (gradient button)
│                             │
│  [💖 Confirm Booking]       │ (gradient button)
│                             │
│  (DateTimePickerModals)     │
└─────────────────────────────┘
```

**Styling:**
- Background: `#FFE6F0`
- Buttons: LinearGradient (`#FF80B5` to `#FF1493`)
- Uses `react-native-modal-datetime-picker` for date/time selection

### 4.6 MyBookingsScreen (`App.js:785-891`)
**Layout Structure:**
```
┌─────────────────────────────┐
│  My Bookings 💅             │ (gradient header)
│                             │
│  ┌─────────────────────┐     │
│  │ 🧴 Service Name     │     │
│  │ 📅 Date            │     │
│  │ ⏰ Time            │     │
│  │ [STATUS BADGE]     │     │
│  └─────────────────────┘     │
│  (Scrollable FlatList)      │
└─────────────────────────────┘
```

**Styling:**
- Header: LinearGradient (`#FF80B5` to `#FF1493`)
- Cards: White to pink gradient (`#fff` to `#ffe4ec`)
- Status badges: Color-coded (green=confirmed, yellow=rebook-suggested, red=other)
- Empty state: Shows "No bookings yet" with icon

### 4.7 ChatScreen (`App.js:976-1039`)
**Layout Structure:**
```
┌─────────────────────────────┐
│                             │
│  [User Message Bubble]      │ (right-aligned, pink)
│  [Bot Message Bubble]       │ (left-aligned, gray)
│  (Scrollable FlatList)      │
│                             │
│  ┌─────────────────────┐     │
│  │ [Input Field] [Send]│    │
│  └─────────────────────┘     │
└─────────────────────────────┘
```

**Styling:**
- User messages: `#ffb6c1` background, right-aligned
- Bot messages: `#e0e0e0` background, left-aligned
- Max width: 80% for messages
- Basic input + button layout

### 4.8 ReceptionistDashboard (`screens/ReceptionistDashboard.js`)
**Layout Structure:**
```
┌─────────────────────────────┐
│  Pending Bookings           │
│                             │
│  ┌─────────────────────┐     │
│  │ Customer Email     │     │
│  │ [STATUS BADGE]     │     │
│  │ Service Type       │     │
│  │ Date – Time        │     │
│  │ [Confirm] [Reject] │     │
│  │ [Rebook] [Complete]│     │
│  │ [Delete]           │     │
│  └─────────────────────┘     │
│  (Scrollable FlatList)      │
│                             │
│  (Rebook Modal)             │
└─────────────────────────────┘
```

**Styling:**
- Background: White
- Cards: White with border, rounded corners
- Status badges: Color-coded (yellow=pending, green=confirmed, red=cancelled)
- Modal: Semi-transparent overlay for rebooking

---

## 5. User Journey Summary

### 5.1 New User Journey
1. **App Launch** → `HomeScreen` (not authenticated)
2. **Sign Up** → `SignUpScreen` → Enter name, phone, email, password
3. **Account Created** → Backend creates user in Firestore with role="customer"
4. **Return to Home** → Now authenticated, can access all features
5. **Browse Services** → `ServicesScreen` → View all 12 services with images
6. **Select Service** → `BookScreen` → Choose date & time
7. **Confirm Booking** → Backend creates booking → Returns to Home
8. **View Bookings** → `MyBookingsScreen` → See booking status
9. **Chat with AI** → `ChatScreen` → Ask questions about services

### 5.2 Returning User Journey
1. **App Launch** → `HomeScreen`
2. **Sign In** → `SignInScreen` → Enter email/password
3. **Authenticated** → `HomeScreen` (stack reset)
4. **Quick Actions:**
   - Book new appointment
   - Check existing bookings
   - Chat with AI
   - (If receptionist) Access dashboard

### 5.3 Receptionist Journey
1. **Sign In** → User with role="receptionist" in Firestore
2. **Home** → "Receptionist Dashboard" button appears
3. **Dashboard** → View all bookings, update status, rebook, complete, delete
4. **Actions:**
   - Confirm/Reject bookings
   - Rebook with new time
   - Mark as complete (moves to archived)
   - Delete (moves to WrongBooking collection)

### 5.4 Booking Status Flow
```
pending → confirmed → (completed → archived)
         ↓
    cancelled
         ↓
  rebook-suggested → (new booking created)
```

---

## 6. Missing or Unused UI Code

### 6.1 Unused Screen Files
- ❌ **`frontend/screens/LoginScreen.js`** - Not imported anywhere
  - Has slightly different UI than `SignInScreen` in App.js
  - Includes "Don't have an account? Sign up" link
  - **Recommendation:** Delete or use this instead of inline SignInScreen

- ❌ **`frontend/screens/SignupScreen.js`** - Not imported anywhere
  - Has "Preferred Service" field (not in App.js version)
  - Includes "Already have an account? Log in" link
  - **Recommendation:** Delete or use this instead of inline SignUpScreen

### 6.2 Unused Imports in App.js
- ❌ **`Tab, Tabs, TabScreen`** from `react-native-paper-tabs` (line 19)
  - Not used anywhere in the code
  - **Recommendation:** Remove

- ❌ **`TabView, SceneMap, TabBar`** from `react-native-tab-view` (line 20)
  - Not used anywhere in the code
  - **Recommendation:** Remove

- ❌ **`GoogleAuthProvider, signInWithCredential`** from `firebase/auth` (line 25)
  - Not used anywhere in the code
  - **Recommendation:** Remove

- ❌ **`* as Google`** from `expo-auth-session/providers/google` (line 26)
  - Not used anywhere in the code
  - **Recommendation:** Remove

### 6.3 Unused Variables/Constants
- ❌ **`AI_BACKEND_URL`** (line 31) - Defined but never used
  - The ChatScreen uses hardcoded URL: `https://flamingo-ctga.onrender.com/ai-chat`
  - **Recommendation:** Use this constant or remove it

### 6.4 StyleSheet Naming Mismatch (CRITICAL BUG)
- ❌ **`styles1`** (line 710) - Defined for BookScreen but component uses `styles` instead
- ❌ **`styles3`** (line 893) - Defined for MyBookingsScreen but component uses `styles` instead
- **Impact:** BookScreen and MyBookingsScreen are accidentally using HomeScreen's `styles` object (defined at line 399), which will cause incorrect styling and potentially missing styles
- **Fix Required:** Either rename `styles1` → `styles` and `styles3` → `styles`, OR update BookScreen/MyBookingsScreen to use `styles1` and `styles3` respectively

### 6.5 Missing Features (Based on Code Comments)
- ❌ **Google Sign-In** - Imports present but no implementation
- ❌ **Tab Navigation** - Imports present but no tab-based navigation implemented
- ❌ **Service Images** - All images are local, no dynamic loading from Firestore/Instagram

---

## 7. Services Catalog

**Location:** `frontend/services.js`

**Total Services:** 12

| ID | Name | Duration | Price (₹) |
|----|------|----------|-----------|
| `nail_ext` | Hand Gel Nail Extension | 90 mins | 1200 |
| `nail_ext_feet` | Feet Gel Nail Extension | 90 mins | 999 |
| `overlay` | Overlay and Refill | 90 mins | 2000 |
| `gel_removal` | Gel Removal | 90 mins | 999 |
| `nail_art_simple` | Matte/Chrome/Glitter/Simple Nail Art | 60 mins | 50 |
| `nail_art_complex` | Complex Nail Art | 60 mins | 100 |
| `lash_ext` | Lash Extension | 60 mins | 1200 |
| `manicure` | Classic Manicure | 45 mins | 499 |
| `pedicure` | Pedicure | 60 mins | 799 |
| `hair` | Hair Styling | 60 mins | 999 |
| `eyebrows` | EyeBrow Shaping | 60 mins | 299 |
| `Bridal` | Bridal Package | 60 mins | 4999 |

**Images:** All services have corresponding images in `frontend/assets/services/`

---

## 8. Backend Integration

### 8.1 API Endpoints Used
1. **POST `/create-user`** - Creates user in Firestore
2. **POST `/book`** - Creates booking, triggers n8n webhook for WhatsApp
3. **POST `/ai-chat`** - OpenAI GPT-4o-mini integration for chat assistant

### 8.2 Firebase Collections
- `users` - User profiles (uid, name, phone, email, role)
- `bookings` - Active bookings (customerEmail, serviceType, appointmentDate, appointmentTime, status)
- `archived` - Completed bookings
- `WrongBooking` - Deleted/incorrect bookings

### 8.3 External Integrations
- **n8n Webhook:** `https://flamingo1.app.n8n.cloud/webhook/appointment-booking` - Sends WhatsApp notifications
- **OpenAI API:** GPT-4o-mini for AI chat assistant
- **Google Maps:** Deep links for salon locations (Mangalore, Manipal)

---

## 9. Key Issues & Recommendations

### 9.1 Critical Issues
1. **StyleSheet Naming Mismatch (CRITICAL):**
   - `BookScreen` (line 647+) uses `styles` but StyleSheet is named `styles1` (line 710)
   - `MyBookingsScreen` (line 861+) uses `styles` but StyleSheet is named `styles3` (line 893)
   - **Impact:** These screens are using HomeScreen's `styles` object instead of their own, causing incorrect/missing styles
   - **Current Behavior:** May work partially due to shared property names (container, logo, title) but will have wrong colors, sizes, and missing specific styles
   - **Fix:** Rename `styles1` → `styles` and `styles3` → `styles`, OR create separate style objects with unique names

2. **Duplicate Screen Components:**
   - Separate files exist but inline versions are used
   - **Impact:** Code duplication, maintenance issues
   - **Fix:** Either use separate files or delete them

### 9.2 Code Quality Issues
1. **Unused Imports:** 5 unused import statements cluttering code
2. **Hardcoded URLs:** Backend URL hardcoded in multiple places
3. **No Error Boundaries:** No error handling for navigation failures
4. **Missing Loading States:** Some screens lack loading indicators

### 9.3 UX Improvements Needed
1. **SignUp Screen:** No navigation back to SignIn
2. **Chat Screen:** Basic UI, could be enhanced
3. **Booking Confirmation:** No visual feedback beyond alert
4. **Service Images:** All local, no dynamic loading

---

## 10. File Structure Summary

```
Flamingo/
├── frontend/
│   ├── App.js                    # Main app with all screens (1062 lines)
│   ├── index.js                  # Entry point
│   ├── firebaseConfig.ts         # Firebase initialization
│   ├── services.js               # Services catalog
│   ├── package.json              # Dependencies
│   ├── screens/
│   │   ├── LoginScreen.js        # ❌ UNUSED
│   │   ├── SignupScreen.js       # ❌ UNUSED
│   │   └── ReceptionistDashboard.js # ✅ USED
│   └── assets/
│       ├── logo.png
│       └── services/             # 12 service images
└── backend/
    └── server.js                 # Express API server
```

---

## 11. Dependencies Summary

### Frontend Key Dependencies
- `expo` - React Native framework
- `@react-navigation/native` - Navigation
- `firebase` - Authentication & Firestore
- `react-native-modal-datetime-picker` - Date/time pickers
- `expo-linear-gradient` - Gradient backgrounds
- `react-native-paper` - UI components (partially used)

### Backend Key Dependencies
- `express` - Web server
- `firebase-admin` - Server-side Firebase
- `node-fetch` - HTTP requests
- OpenAI API integration

---

## Conclusion

The Flamingo Nails app is a functional React Native booking application with a clear structure. The main issues are:
1. Unused duplicate screen files
2. Unused imports
3. StyleSheet naming mismatches (will cause errors)
4. Some incomplete features (Google Sign-In, Tabs)

The app successfully implements:
- ✅ User authentication
- ✅ Service browsing and booking
- ✅ Booking management
- ✅ AI chat assistant
- ✅ Receptionist dashboard
- ✅ Real-time booking updates via Firestore

**Recommendation:** Clean up unused code, fix StyleSheet names, and consolidate screen components before production deployment.

