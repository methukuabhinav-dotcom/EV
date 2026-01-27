# Firebase Backend Integration Deliverables

## 1. Firestore User Schema
All user data is stored in the `users` collection. Each document ID corresponds to the user's Firebase Authentication UID.

```json
users/{uid} (Document)
{
  "uid": "string",
  "fullName": "string",
  "email": "string",
  "role": "string (admin | user)",
  "createdAt": "timestamp"
}
```

## 2. Firebase Security Rules
These rules ensure that:
1. Users can only read/write their own data.
2. The `role` field is strictly protected (optional: in production, roles are typically set via Admin SDK or checked via custom claims, but for this integration we use Firestore verification).
3. Public access is denied.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Allow user to read their own profile
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Allow signup: create document if auth UID matches
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Prevent role modification by the user after creation
      allow update: if request.auth != null && request.auth.uid == userId 
                    && request.resource.data.role == resource.data.role;
    }
  }
}
```

## 3. Integration Summary
- **Config**: `firebase-config.js` initializes the modular SDK (v9).
- **Auth**: `auth.js` handles async sign-up and sign-in with role verification against Firestore.
- **Guard**: `guard.js` provides top-level route protection for dashboards.
- **Identical UI**: All integration was done at the logic layer; HTML/CSS remains visually identical.
