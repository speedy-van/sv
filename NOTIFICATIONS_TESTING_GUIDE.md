# Notifications System - Testing Guide

## Quick Start

### Test Environment
- iOS Simulator or device with Speedy Van Driver app
- Backend running on `http://localhost:3000` or production
- Driver account logged in
- Pusher credentials configured

---

## Test Scenarios

### Scenario 1: Load Notifications
**Goal**: Verify notifications fetch from API

**Steps**:
1. Open iOS driver app
2. Navigate to Notifications screen
3. Wait for loading spinner

**Expected Results**:
- ✅ Loading spinner appears
- ✅ Notifications load from backend
- ✅ Screen animates in (fade + slide)
- ✅ Counters show correct numbers (All, Unread, High Priority)
- ✅ No errors in console

**If Failed**:
- Check API endpoint: `/api/driver/notifications`
- Check authentication token
- Check network logs

---

### Scenario 2: Mark Single Notification as Read
**Goal**: Verify single notification can be marked as read

**Steps**:
1. Open Notifications screen
2. Find an unread notification (blue left border)
3. Tap the notification card

**Expected Results**:
- ✅ Card border changes instantly (blue → white)
- ✅ Background changes (light blue → white)
- ✅ Unread dot disappears
- ✅ Unread counter decrements by 1
- ✅ Backend API called: `PUT /api/driver/notifications/read`
- ✅ Haptic feedback (light)
- ✅ Navigates to relevant screen (if applicable)

**Check Backend**:
```sql
SELECT id, title, read, "readAt" 
FROM "DriverNotification" 
WHERE id = 'NOTIFICATION_ID';
```

Should show `read: true` and `readAt: <timestamp>`

---

### Scenario 3: Mark All Read ✅ CRITICAL
**Goal**: Verify "Mark All Read" button works

**Steps**:
1. Ensure there are unread notifications (counter > 0)
2. Tap "Mark All Read" button in header
3. Observe changes

**Expected Results**:
- ✅ ALL unread cards change state instantly
- ✅ All blue borders disappear
- ✅ All unread dots disappear
- ✅ Backgrounds change to white
- ✅ Unread counter resets to 0
- ✅ Backend API called: `PUT /api/driver/notifications/read` with `markAllAsRead: true`
- ✅ Success haptic feedback
- ✅ Changes persist after app refresh

**Check Backend**:
```sql
SELECT COUNT(*) as total_unread 
FROM "DriverNotification" 
WHERE "driverId" = 'DRIVER_ID' AND read = false;
```

Should return `total_unread: 0`

---

### Scenario 4: Tab Filtering
**Goal**: Verify filters work correctly

**Steps**:
1. Tap "All" tab → Should show all notifications
2. Tap "Unread" tab → Should show only unread
3. Tap "High Priority" tab → Should show only high-priority
4. Tap "All" tab again → Should show all

**Expected Results**:
- ✅ Tab background changes (gray → blue)
- ✅ Text color changes (gray → white)
- ✅ Notifications filter instantly
- ✅ Counter in tab label is correct
- ✅ Light haptic feedback on each tap
- ✅ Empty state shows if no notifications match filter

---

### Scenario 5: Pull-to-Refresh
**Goal**: Verify pull-to-refresh updates notifications

**Steps**:
1. Scroll notifications list to top
2. Pull down to trigger refresh
3. Release

**Expected Results**:
- ✅ Spinner appears at top
- ✅ API called: `GET /api/driver/notifications`
- ✅ New notifications appear
- ✅ Counters update
- ✅ Light haptic feedback
- ✅ Spinner disappears after fetch

---

### Scenario 6: Real-time Notification
**Goal**: Verify Pusher real-time notifications work

**Steps**:
1. Open Notifications screen
2. From backend/admin, send a notification to the driver:
   ```typescript
   await pusher.trigger(`driver-${driverId}`, 'notification', {
     id: 'notif_test_' + Date.now(),
     type: 'route_assigned',
     title: 'Test Notification',
     message: 'This is a test notification',
     data: { priority: 'high' },
     priority: 'high',
   });
   ```
3. Observe app

**Expected Results**:
- ✅ New notification appears at top of list instantly
- ✅ Unread counter increments by 1
- ✅ Warning haptic feedback
- ✅ Vibration pattern: [0, 200, 100, 200]
- ✅ Notification has blue left border (unread)
- ✅ Notification animates in (spring)

**Check Console**:
Should log: `📨 New notification received: { ... }`

---

### Scenario 7: Navigation by Type
**Goal**: Verify tapping notifications navigates correctly

**Test Cases**:

#### A) Route Notification
1. Tap notification with type `route_assigned`
2. Should navigate to Route Details screen
3. Should pass `routeId` parameter

#### B) Payment Notification
1. Tap notification with type `payment_received`
2. Should navigate to Earnings screen

#### C) Document Notification
1. Tap notification with type `document_expiry`
2. Should navigate to Documents screen

**Expected for All**:
- ✅ Notification marked as read
- ✅ Navigation happens immediately
- ✅ Medium haptic feedback
- ✅ Correct screen opens with correct data

---

### Scenario 8: Animations
**Goal**: Verify all animations work smoothly

**What to Check**:
1. **Screen Load**: Fade-in (300ms) + Slide-up (300ms)
2. **Card Load**: Staggered animation (50ms delay per card)
3. **Card Press**: Scale down to 0.95 on press, spring back on release
4. **New Notification**: Spring animation when added

**Expected**:
- ✅ All animations smooth (60 FPS)
- ✅ No jank or lag
- ✅ Animations complete fully

---

### Scenario 9: High-Priority Alert
**Goal**: Verify high-priority notifications have special feedback

**Steps**:
1. Send a high-priority notification:
   ```typescript
   await pusher.trigger(`driver-${driverId}`, 'notification', {
     type: 'document_expiry',
     title: 'Document Expiring Soon',
     message: 'Your insurance expires in 7 days',
     priority: 'high',
   });
   ```

**Expected Results**:
- ✅ Warning haptic (stronger than success haptic)
- ✅ Vibration pattern: [0, 200, 100, 200]
- ✅ Red border on card
- ✅ Light red background
- ✅ Alert badge icon in top-right

---

### Scenario 10: Empty States
**Goal**: Verify empty states display correctly

**Test Cases**:

#### A) All Empty
1. Mark all notifications as read
2. Switch to "All" tab
3. Should show: "No notifications available"

#### B) Unread Empty
1. Mark all as read
2. Switch to "Unread" tab
3. Should show: "You have no unread notifications"

#### C) High Priority Empty
1. Ensure no high-priority notifications
2. Switch to "High Priority" tab
3. Should show: "No high priority notifications"

**Expected**:
- ✅ Icon: notifications-off (gray)
- ✅ Title: Correct message
- ✅ Centered layout
- ✅ No loading spinner

---

## Performance Testing

### Load Time ⏱️
- First load: < 2 seconds
- Refresh: < 1 second
- Mark all read: < 500ms

### Memory Usage 💾
- Screen should use < 50MB
- No memory leaks after multiple open/close

### Animations 🎬
- All animations at 60 FPS
- No dropped frames

---

## Edge Cases

### Edge Case 1: No Internet
**Steps**:
1. Disable internet
2. Open Notifications screen

**Expected**:
- Show error message
- Allow retry

### Edge Case 2: Large Number (1000+ notifications)
**Expected**:
- Pagination works
- Smooth scrolling
- No performance issues

### Edge Case 3: Very Long Messages
**Expected**:
- Text truncates with "..."
- Card doesn't expand indefinitely
- No layout breaking

---

## Debug Tools

### Check Pusher Connection
```typescript
console.log(pusherService.pusher?.connection.state);
// Should be: 'connected'
```

### Check Notifications in State
```typescript
console.log('Notifications:', notifications);
console.log('Unread count:', unreadCount);
console.log('Filter:', filter);
```

### Backend Check
```sql
-- Get driver's notifications
SELECT * FROM "DriverNotification" 
WHERE "driverId" = 'DRIVER_ID' 
ORDER BY "createdAt" DESC 
LIMIT 20;

-- Check unread count
SELECT COUNT(*) FROM "DriverNotification" 
WHERE "driverId" = 'DRIVER_ID' AND read = false;
```

---

## Common Issues & Solutions

### Issue: Notifications not loading
**Solution**:
- Check API endpoint is running
- Check authentication token is valid
- Check driver ID is correct

### Issue: Mark All Read not working
**Solution**:
- Check backend API: `PUT /api/driver/notifications/read`
- Check request body includes `markAllAsRead: true`
- Check backend returns `{ success: true }`

### Issue: Pusher not receiving notifications
**Solution**:
- Check Pusher credentials
- Check channel name: `driver-${driverId}` (use Driver.id, not User.id)
- Check event name: `notification`
- Check Pusher connection state

### Issue: No haptic feedback
**Solution**:
- Check device supports haptics
- Check app has haptic permissions
- Check Haptics library is installed

---

## Success Criteria ✅

Notifications system is working if:
- [ ] Notifications load from API
- [ ] Mark single notification as read works
- [ ] Mark all read works instantly with backend sync
- [ ] Filters work (All, Unread, High Priority)
- [ ] Counters update dynamically
- [ ] Pull-to-refresh works
- [ ] Real-time Pusher notifications arrive instantly
- [ ] Navigation by type works
- [ ] Haptic feedback on all interactions
- [ ] High-priority vibration works
- [ ] Animations smooth at 60 FPS
- [ ] No errors in console

---

**Last Updated**: 2025-01-11  
**Status**: Ready for Testing









