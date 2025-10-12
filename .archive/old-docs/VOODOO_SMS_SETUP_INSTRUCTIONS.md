# 🚀 Voodoo SMS - Quick Setup Instructions

## ⚠️ IMPORTANT

UK SMS WORK has been **completely removed** from the system.
All SMS functionality now uses **Voodoo SMS**.

---

## 📋 Step 1: Add API Key to Environment

Add this to your `.env.local` file:

```bash
VOODOO_SMS_API_KEY=VRiNCyOy5LGTfBJOFQBVFZt6UyPUQy1nGZ0INE7JQEcwFn
```

**Location:** Root directory (`C:\sv\.env.local`)

---

## 🔄 Step 2: Restart Development Server

```bash
# Stop current server (Ctrl+C in terminal)
pnpm run dev
```

---

## 🧪 Step 3: Test SMS Sending

### Option A: Manual Test (Admin Panel)

1. Open: `http://localhost:3000/admin/settings/sms`
2. Select: "Enter Phone Manually"
3. Phone: `00447901846297`
4. Message: `Test SMS from Voodoo`
5. Click: "Send SMS"

**Expected:**
- ✅ Success message appears
- ✅ Terminal shows: `✅ SMS sent successfully via Voodoo SMS`
- ✅ SMS delivered to phone

### Option B: Automatic Test (Booking)

1. Create a test booking
2. Complete payment
3. Check terminal for:
   ```
   === NOTIFICATION SMS REQUEST ===
   ✅ SMS sent successfully via Voodoo SMS
   ```

---

## 📊 What Changed?

### Removed:
- ❌ `THESMSWORKS_KEY`
- ❌ `THESMSWORKS_SECRET`
- ❌ `THESMSWORKS_JWT`
- ❌ All UK SMS WORK code

### Added:
- ✅ `VOODOO_SMS_API_KEY`
- ✅ New Voodoo SMS service
- ✅ Simpler authentication
- ✅ Auto retry mechanism

---

## 🔍 Troubleshooting

### Error: "VOODOO_SMS_API_KEY is not configured"

**Solution:**
1. Check `.env.local` file exists
2. Verify the API key is present:
   ```
   VOODOO_SMS_API_KEY=VRiNCyOy5LGTfBJOFQBVFZt6UyPUQy1nGZ0INE7JQEcwFn
   ```
3. Restart the server

### SMS Not Sending

**Check:**
1. API key is correct
2. Phone number format (must start with 0044)
3. Terminal logs for errors
4. Voodoo SMS dashboard for API status

---

## 📞 API Details

**Endpoint:** `https://www.voodooSMS.com/vapi/server/sendSMS`

**Authentication:** Simple API key (uid parameter)

**No JWT required ✅**
**No API Secret required ✅**

---

## ✅ Verification

After setup, verify:

1. ✅ `.env.local` contains `VOODOO_SMS_API_KEY`
2. ✅ Server restarts without errors
3. ✅ Can send test SMS from admin panel
4. ✅ Terminal shows Voodoo SMS logs
5. ✅ No UK SMS WORK references in logs

---

**Setup Complete! 🎉**

All SMS functionality now runs on Voodoo SMS.

