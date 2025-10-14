# Apple App Review - Test Driver Account

## ✅ Test Account Successfully Created!

This document contains the test driver account credentials for Apple App Review.

---

## 🔑 Test Driver Credentials

**Email:** `zadfad41@gmail.com`  
**Password:** `112233`

---

## 📱 How to Test on iOS

1. **Open the Speedy Van Driver App**
2. **Tap "Login"**
3. **Enter Credentials:**
   - Email: `zadfad41@gmail.com`
   - Password: `112233`
4. **Tap "Sign In"**
5. **You should be logged in successfully!**

---

## ✅ Test Results

### Login Test (Completed: October 14, 2025)

```
✅ Login Successful!
   Token: RECEIVED (68 chars)
   User ID: XYgJzjVjfn1hOH4z
   Email: zadfad41@gmail.com
   Name: Apple Test Driver
   Role: driver
   Driver ID: xRLLVY7d0zwTCC9A
   Status: active
   Onboarding: approved
   Rating: 5.0
```

---

## 📋 Account Details

| Field | Value |
|-------|-------|
| **Email** | zadfad41@gmail.com |
| **Password** | 112233 |
| **Name** | Apple Test Driver |
| **Role** | driver |
| **Status** | active |
| **Onboarding Status** | approved ✅ |
| **Rating** | 5.0 ⭐ |
| **Vehicle Type** | van |
| **Base Postcode** | G1 1AA |

---

## 🚗 Driver Features to Test

The test driver account has full access to:

1. **Dashboard**
   - View active orders
   - See earnings summary
   - Check ratings

2. **Jobs Management**
   - View available jobs
   - Accept/decline jobs
   - Track job progress
   - Complete deliveries

3. **Multi-Drop Routes**
   - View assigned routes
   - Navigate between drops
   - Complete each drop
   - Update delivery status

4. **Real-time Tracking**
   - Location sharing
   - Live tracking updates
   - GPS navigation

5. **Earnings**
   - View daily/weekly earnings
   - See breakdown of payments
   - Track tips and bonuses

6. **Profile & Settings**
   - Update personal info
   - Manage vehicle details
   - Configure notifications
   - View driver stats

---

## 🔧 Technical Details

### API Endpoint
```
POST https://speedy-van.co.uk/api/driver/auth/login
Content-Type: application/json

{
  "email": "zadfad41@gmail.com",
  "password": "112233"
}
```

### Response (Success)
```json
{
  "success": true,
  "token": "[JWT_TOKEN]",
  "user": {
    "id": "XYgJzjVjfn1hOH4z",
    "email": "zadfad41@gmail.com",
    "name": "Apple Test Driver",
    "role": "driver"
  },
  "driver": {
    "id": "xRLLVY7d0zwTCC9A",
    "userId": "XYgJzjVjfn1hOH4z",
    "status": "active",
    "onboardingStatus": "approved",
    "basePostcode": "G1 1AA",
    "vehicleType": "van",
    "rating": 5,
    "strikes": 0
  }
}
```

---

## 📝 Notes for Apple Reviewers

1. **Account is Pre-Approved**
   - No need to go through driver onboarding
   - Fully activated and ready to use
   - All features immediately accessible

2. **Test Data**
   - This is a dedicated test account
   - Separate from production drivers
   - Safe for testing all features

3. **Real Backend**
   - Connected to production API
   - Real-time data synchronization
   - Full feature availability

4. **Support Contact**
   - Email: support@speedy-van.co.uk
   - Phone: 07901846297

---

## 🔒 Security & Privacy

- Password is hashed with bcrypt (12 rounds)
- JWT tokens for secure authentication
- HTTPS-only communication
- Secure data transmission

---

## ✅ Ready for Apple Review!

This test account is **fully functional** and ready for Apple App Review testing.

**Created:** October 14, 2025  
**Status:** Active ✅  
**Tested:** Login Successful ✅

---

## 🎯 Quick Start for Reviewers

1. Install "Speedy Van Driver" app from TestFlight
2. Open the app
3. Login with:
   - **Email:** zadfad41@gmail.com
   - **Password:** 112233
4. Explore all driver features
5. Test job acceptance and delivery flow

**That's it! Happy testing! 🚀**

