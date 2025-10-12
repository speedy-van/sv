# Chat System Testing Guide

## Quick Start Testing

### Prerequisites
1. Admin dashboard running: `http://localhost:3000/admin/chat`
2. iOS driver app running on device/simulator
3. Database connection active
4. Pusher credentials configured

---

## Test Scenarios

### Scenario 1: First Message from Driver
**Goal**: Verify message doesn't disappear and reaches admin

**Steps**:
1. Open iOS driver app
2. Navigate to Chat screen
3. Send message: "Hello, I need help with my order"
4. **Expected Results**:
   - ✅ Message appears in driver's chat immediately
   - ✅ Message shows ✓ (sent) icon
   - ✅ Message persists after closing and reopening app
   - ✅ Admin dashboard shows notification
   - ✅ Admin dashboard displays the message

**If Failed**:
- Check Pusher connection in browser console
- Check API response in Network tab
- Check Pusher channel name: should be `driver-${driverId}`

---

### Scenario 2: Admin Reply to Driver
**Goal**: Verify admin message reaches driver in real-time

**Steps**:
1. Admin opens chat dashboard
2. Admin selects driver conversation
3. Admin types and sends: "Hi, I'm here to help!"
4. **Expected Results**:
   - ✅ Driver receives message instantly (< 1 second)
   - ✅ Message appears with "Support" as sender
   - ✅ Message bubble shows on left side (admin messages)
   - ✅ Message is auto-marked as read
   - ✅ Admin sees ✓✓ (blue) after driver views it

**If Failed**:
- Check driver Pusher connection
- Check `admin_message` event in Pusher debug
- Verify Driver.id is being used (not User.id)

---

### Scenario 3: Read Receipts
**Goal**: Verify read status updates in real-time

**Steps**:
1. Admin sends message to driver
2. Admin sees ✓ (sent) on their message
3. Driver opens chat and views message
4. **Expected Results**:
   - ✅ Driver message auto-marked as read
   - ✅ Admin sees ✓✓ (blue) within 1 second
   - ✅ Database shows readAt timestamp

**Check Database**:
```sql
SELECT id, content, "readAt", "deliveredAt" 
FROM "Message" 
WHERE "sessionId" = 'YOUR_SESSION_ID' 
ORDER BY "createdAt" DESC;
```

---

### Scenario 4: Typing Indicators
**Goal**: Verify typing indicators work both ways

**Test A: Admin → Driver**:
1. Admin starts typing in chat input
2. **Expected**: Driver sees "typing 💬" within 500ms
3. Admin stops typing for 2 seconds
4. **Expected**: Typing indicator disappears

**Test B: Driver → Admin**:
1. Driver starts typing in iOS app
2. **Expected**: Admin sees "Driver is typing..." within 500ms
3. Driver stops typing for 2 seconds
4. **Expected**: Typing indicator disappears

**Debug**:
- Check Pusher event `typing_indicator`
- Check `/api/admin/chat/typing` response
- Verify timeout is working (2 seconds)

---

### Scenario 5: Online Status
**Goal**: Verify admin online status shows correctly

**Steps**:
1. Driver opens chat screen
2. **Expected**: Shows "Offline" or "Last active Xm ago"
3. Admin opens chat dashboard
4. **Expected**: Driver sees "Online" with green dot
5. Admin closes dashboard/browser
6. **Expected**: Driver sees "Last active just now" → "Last active 1m ago"

**Verify**:
- Check `/api/admin/chat/status` endpoint
- Check Pusher event `admin_status`
- Check status dot color: green = online, red = offline

---

## Common Issues & Solutions

### Issue: Messages disappear after sending
**Cause**: Pusher channel mismatch or history API bug
**Solution**: 
- Verify using Driver.id (not User.id) for channel
- Check `/api/driver/chat/history/[driverId]` returns messages
- Check browser console for Pusher errors

### Issue: Admin message doesn't reach driver
**Cause**: Wrong Pusher channel name
**Solution**:
- Check admin is sending to `driver-${driverId}` (Driver.id)
- Check driver is listening on correct channel
- Check Pusher app credentials

### Issue: Read receipts not working
**Cause**: Missing database fields or API not called
**Solution**:
- Verify migration applied: `readAt` and `deliveredAt` columns exist
- Check `/api/driver/chat/mark-read` is being called
- Check Pusher event `message_read` is triggered

### Issue: Typing indicator stuck
**Cause**: Timeout not clearing
**Solution**:
- Check timeout is 2000ms (2 seconds)
- Verify cleanup on unmount
- Check Pusher event `typing_indicator` with `isTyping: false`

---

## Monitoring Tools

### Pusher Debug Console
1. Go to: https://dashboard.pusher.com/
2. Select your app
3. Go to "Debug Console"
4. Watch events in real-time

### Database Queries

**Check recent messages**:
```sql
SELECT 
  m.id, 
  m.content, 
  u.name as sender_name,
  m."createdAt",
  m."readAt",
  m."deliveredAt"
FROM "Message" m
JOIN "User" u ON m."senderId" = u.id
WHERE m."sessionId" IN (
  SELECT id FROM "ChatSession" 
  WHERE type = 'driver_admin' 
  AND "isActive" = true
)
ORDER BY m."createdAt" DESC
LIMIT 20;
```

**Check chat sessions**:
```sql
SELECT 
  cs.id,
  cs.type,
  cs."isActive",
  cs."createdAt",
  cs."updatedAt",
  COUNT(m.id) as message_count
FROM "ChatSession" cs
LEFT JOIN "Message" m ON cs.id = m."sessionId"
WHERE cs.type = 'driver_admin'
GROUP BY cs.id
ORDER BY cs."updatedAt" DESC;
```

---

## Performance Checks

### Expected Response Times
- Send message: < 500ms
- Receive message via Pusher: < 1s
- Load chat history: < 2s
- Typing indicator: < 500ms
- Online status update: < 1s

### Browser Console Checks
Look for these logs:
- ✅ `Pusher connected successfully`
- ✅ `Sent admin message to driver channel: driver-XXX`
- ✅ `Admin message received`
- ✅ `Message sent successfully`

---

## Rollback Plan

If issues occur in production:

1. **Emergency disable** (temporary):
```typescript
// In ChatScreen.tsx
const CHAT_ENABLED = false; // Disable chat temporarily
```

2. **Rollback database**:
```sql
-- Remove new columns if needed
ALTER TABLE "Message" DROP COLUMN IF EXISTS "readAt";
ALTER TABLE "Message" DROP COLUMN IF EXISTS "deliveredAt";
```

3. **Disable new features**:
- Remove typing indicator calls
- Remove read receipt calls
- Remove online status broadcasts

---

## Success Criteria ✅

Chat system is considered working if:
- [ ] Driver can send message and it persists
- [ ] Admin receives driver message in < 2 seconds
- [ ] Admin reply reaches driver in < 2 seconds
- [ ] Read receipts update in < 2 seconds after viewing
- [ ] Typing indicators appear in < 1 second
- [ ] Online status updates in < 2 seconds
- [ ] No console errors
- [ ] No Pusher connection errors
- [ ] Database shows correct timestamps

---

## Contact for Issues

If you encounter issues during testing:
1. Check browser console for errors
2. Check Pusher debug console
3. Check database logs
4. Review `CHAT_SYSTEM_FIXES.md` for implementation details
5. Check backend API logs for errors









