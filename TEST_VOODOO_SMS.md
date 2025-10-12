# Voodoo SMS - Testing Guide

## Prerequisites

1. Add API key to `.env.local`:
```bash
VOODOO_SMS_API_KEY=VRiNCyOy5LGTfBJOFQBVFZt6UyPUQy1nGZ0INE7JQEcwFn
```

2. Restart dev server:
```bash
pnpm run dev
```

---

## Test 1: Manual SMS Send (Admin Panel)

### Steps:
1. Navigate to: `http://localhost:3000/admin/settings/sms`
2. Select: "Enter Phone Manually"
3. Phone Number: `00447901846297`
4. Message: `Test SMS from Voodoo SMS`
5. Click: "Send SMS"

### Expected Result:
- ✅ Success toast appears
- ✅ Terminal shows: `✅ SMS sent successfully via Voodoo SMS`
- ✅ SMS delivered to phone

### Terminal Logs:
```
=== ADMIN SMS SEND REQUEST ===
To: 00447901846297
Message: Test SMS from Voodoo SMS
=== VOODOO SMS REQUEST ===
URL: https://www.voodooSMS.com/vapi/server/sendSMS
To (normalized): 00447901846297
✅ SMS sent successfully via Voodoo SMS
Message ID: voodoo_1234567890
```

---

## Test 2: Automatic Booking Confirmation

### Steps:
1. Create a test booking
2. Complete Stripe payment
3. Check terminal logs

### Expected Result:
- ✅ Booking confirmed
- ✅ SMS sent automatically
- ✅ Terminal shows Voodoo SMS logs

### Terminal Logs:
```
=== NOTIFICATION SMS REQUEST ===
To: 00447901846297
Message: Hi [Name], your Speedy Van booking...
=== VOODOO SMS REQUEST ===
✅ SMS sent successfully via Voodoo SMS
```

---

## Test 3: Phone Number Normalization

### Test Cases:

| Input | Expected Output |
|-------|----------------|
| `07901846297` | `00447901846297` |
| `+447901846297` | `00447901846297` |
| `447901846297` | `00447901846297` |
| `0044790184629`7 | `00447901846297` |

### How to Test:
Send SMS from admin panel with different formats and verify logs show normalized number.

---

## Verification Checklist

- [ ] API key configured in `.env.local`
- [ ] Dev server restarted
- [ ] Manual SMS sends successfully
- [ ] Automatic booking SMS works
- [ ] Phone numbers normalized correctly
- [ ] Terminal shows Voodoo SMS logs
- [ ] No UK SMS WORK references in logs
- [ ] SMS delivered to real phone

---

## Troubleshooting

### Issue: "VOODOO_SMS_API_KEY is not configured"
**Solution:** Check `.env.local` file has the API key

### Issue: "Invalid UK phone number format"
**Solution:** Ensure number starts with 0044, 07, +44, or 44

### Issue: SMS not sending
**Solution:** 
1. Check API key is correct
2. Verify Voodoo SMS dashboard
3. Check terminal logs for errors

---

## Success Criteria

✅ Manual SMS send works
✅ Automatic booking SMS works
✅ Phone normalization works
✅ Error handling works
✅ Logs show Voodoo SMS (not UK SMS WORK)
✅ SMS delivered to phone

---

**Ready for Production** ✅

