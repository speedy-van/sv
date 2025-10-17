# App Store Screenshots Guide

**Professional Screenshot Preparation for iOS App Submission**

---

## 📱 Required Screenshot Sizes

Apple requires screenshots for 3 device sizes:

### 1. iPhone 6.7" (iPhone 14 Pro Max, 15 Pro Max)
```
Resolution: 1290 x 2796 pixels
Device: iPhone 14 Pro Max simulator
Required: 5 screenshots minimum (10 maximum)
```

### 2. iPhone 6.5" (iPhone 11 Pro Max, XS Max)
```
Resolution: 1242 x 2688 pixels
Device: iPhone 11 Pro Max simulator
Required: 5 screenshots minimum (10 maximum)
```

### 3. iPhone 5.5" (iPhone 8 Plus)
```
Resolution: 1242 x 2208 pixels
Device: iPhone 8 Plus simulator
Required: 5 screenshots minimum (10 maximum)
```

**Total screenshots needed: 15 (5 per size)**

---

## 📸 Screenshot Sequence (Order Matters!)

### Screenshot 1: Login Screen
**What to capture:**
- Clean login interface
- Logo visible at top
- Email and password fields
- "Sign In" button
- No error messages
- Professional appearance

**Device state:**
- Not logged in
- Fresh app install state
- Light mode (or dark mode if brand preference)

**Caption for App Store:**
```
Simple & Secure Login
Quick authentication to get you on the road fast
```

---

### Screenshot 2: Dashboard (Main View)
**What to capture:**
- Driver name/photo at top
- Today's earnings prominently displayed
- Completed jobs count
- Driver rating (if available)
- Online/Offline toggle switch
- Quick stats cards
- Navigation tabs visible at bottom

**Device state:**
- Logged in as test account
- Show realistic earnings ($50-150 range)
- Show 3-5 completed jobs
- Rating 4.5-5.0 stars
- Status: "Online" (green indicator)

**Caption for App Store:**
```
Your Earnings Hub
Track daily performance, earnings, and job statistics in real-time
```

---

### Screenshot 3: Routes/Jobs Screen
**What to capture:**
- List of available or assigned routes
- Route card showing:
  - Route number (e.g., RT001)
  - Number of drops (e.g., 3 deliveries)
  - Total earnings for route
  - Pickup and delivery locations visible
  - "Accept Route" or "View Details" button
- At least 2-3 route cards visible

**Device state:**
- Show routes in "available" or "assigned" status
- Realistic data (avoid test/dummy obvious text)
- Clear, readable addresses
- Reasonable distances (5-20 miles)

**Caption for App Store:**
```
Smart Route Management
Accept jobs, view multi-drop deliveries, and manage your schedule
```

---

### Screenshot 4: Active Delivery (Map View)
**What to capture:**
- Live map with route plotted
- Current location marker (driver position)
- Destination marker(s)
- Route line between points
- Delivery details card overlaying map:
  - Customer name
  - Delivery address
  - Estimated time
  - "Navigate" or "Complete Delivery" button
- GPS indicator showing active tracking

**Device state:**
- Mid-delivery scenario
- Realistic UK address
- Map zoomed to show route clearly
- Progress indicator (e.g., "Drop 2 of 3")

**Caption for App Store:**
```
Live Tracking & Navigation
Real-time GPS tracking keeps customers informed throughout delivery
```

---

### Screenshot 5: Earnings Breakdown
**What to capture:**
- Earnings summary for selected period
- Date range selector (Daily/Weekly/Monthly tabs)
- Breakdown by:
  - Number of deliveries
  - Total earnings
  - Average per delivery
- List of recent completed jobs with individual earnings
- Payment status (Paid/Pending)
- Chart or graph if available (optional but nice)

**Device state:**
- Show "Weekly" view with realistic data
- 5-10 completed jobs listed
- Total earnings: £200-500 (realistic weekly range)
- Mix of "Paid" and "Pending" statuses
- Professional, clean presentation

**Caption for App Store:**
```
Transparent Payment Tracking
See detailed earnings breakdowns with weekly payment schedule
```

---

## 🎨 Screenshot Best Practices

### ✅ DO:
- Use real-looking data (realistic names, addresses, amounts)
- Ensure UI is clean and uncluttered
- Use portrait orientation ONLY
- Capture full screen (including status bar)
- Use consistent device for all screenshots
- Show actual app functionality
- Ensure text is readable
- Use daylight hours for map screenshots (bright, clear)
- Show successful states (not errors)
- Include branding/colors consistently

### ❌ DON'T:
- Use obviously fake data ("Test User", "123 Test St")
- Edit screenshots in Photoshop (must be actual app)
- Add marketing text overlays on screenshots
- Show error messages or bugs
- Include personal/sensitive real data
- Show incomplete or broken UI
- Use landscape orientation
- Crop or resize beyond Apple's specs
- Show debug info or developer tools
- Include competitor branding

---

## 🛠️ How to Take Screenshots

### Method 1: iOS Simulator (Recommended)

```bash
# 1. Start the required simulator
xcrun simctl list devices

# Example for iPhone 14 Pro Max:
open -a Simulator --args -CurrentDeviceUDID <DEVICE_UDID>

# 2. Run your app
cd mobile/expo-driver-app
npx expo start
# Press 'i' for iOS

# 3. Take screenshot
# Press: Cmd + S
# Or: File > Save Screen

# Screenshots saved to: ~/Desktop/
```

### Method 2: EAS Build + TestFlight

```bash
# 1. Build and submit to TestFlight
eas build --platform ios --profile production

# 2. Install on real device via TestFlight
# 3. Take screenshots on device
# Press: Volume Up + Side Button

# 4. Transfer to Mac via AirDrop or iCloud Photos
```

---

## 📂 File Organization

Save screenshots with this naming convention:

```
appstore-assets/screenshots/

iPhone-6.7/
  01-login.png (1290x2796)
  02-dashboard.png
  03-routes.png
  04-active-delivery.png
  05-earnings.png

iPhone-6.5/
  01-login.png (1242x2688)
  02-dashboard.png
  03-routes.png
  04-active-delivery.png
  05-earnings.png

iPhone-5.5/
  01-login.png (1242x2208)
  02-dashboard.png
  03-routes.png
  04-active-delivery.png
  05-earnings.png
```

---

## ✅ Screenshot Verification Checklist

Before uploading to App Store Connect:

### Technical Quality
- [ ] Correct resolution for each device size
- [ ] PNG format (not JPG)
- [ ] No compression artifacts
- [ ] Status bar visible
- [ ] Full screen captured (no cropping)

### Content Quality
- [ ] All text is readable
- [ ] No personal/sensitive data visible
- [ ] Realistic demo data used
- [ ] No obvious test placeholders
- [ ] UI looks professional
- [ ] Branding consistent

### Functionality Shown
- [ ] Login screen clean
- [ ] Dashboard shows earnings
- [ ] Routes/jobs visible
- [ ] Map/tracking demonstrated
- [ ] Earnings breakdown clear

### App Store Requirements
- [ ] No pricing information in screenshots
- [ ] No "New" or "Beta" labels
- [ ] No references to other platforms (Android)
- [ ] No Apple trademark misuse
- [ ] No offensive content

---

## 🎬 Optional: Preview Video

**While not required, a preview video can increase conversions by 20-30%**

### Video Specs (if you choose to create one):
```
Resolution: 1080 x 1920 (vertical)
Duration: 15-30 seconds
Format: .mp4 or .mov
Max file size: 500 MB
```

### Video Content Suggestions:
1. Quick login (2 seconds)
2. Dashboard overview (3 seconds)
3. Accept route (2 seconds)
4. Navigate to delivery (3 seconds)
5. Complete delivery (2 seconds)
6. Earnings update (3 seconds)

**App Store supports video as first media item (plays before screenshots)**

---

## 🚀 Upload to App Store Connect

### Steps:
1. Login to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app
3. Click "Prepare for Submission"
4. Scroll to "App Previews and Screenshots"
5. Select device size (6.7", 6.5", 5.5")
6. Drag & drop screenshots in order
7. Add captions (optional but recommended)
8. Repeat for all device sizes
9. Save changes

### Upload Order Matters:
Screenshots appear in App Store in the order you upload them.
First screenshot is the "hero" image shown in search results.

**Pro tip:** Your Dashboard screenshot should be first (most impressive).

---

## 📊 Screenshot Optimization Tips

### For Maximum Conversions:
1. **First screenshot = Hero shot**
   - Most visually appealing
   - Shows core value proposition
   - Dashboard with earnings works well

2. **Show progression**
   - Tell a story across 5 screenshots
   - Login → Dashboard → Work → Earnings flow

3. **Highlight benefits**
   - Show money/earnings prominently
   - Demonstrate ease of use
   - Professional appearance

4. **Avoid clutter**
   - Clean, uncluttered UI screenshots
   - One main feature per screenshot
   - Easy to understand at a glance

---

## 🎯 Example Data for Screenshots

### Realistic Test Data to Display:

**Driver Profile:**
```
Name: James Anderson
Rating: 4.8 ⭐
Status: Online
Deliveries: 127 completed
```

**Today's Earnings (Dashboard):**
```
Today: £85.50
This Week: £340.25
This Month: £1,456.80
Deliveries Today: 4
```

**Sample Route:**
```
Route: RT7824
Drops: 3 deliveries
Earnings: £45.00
Status: Available
Distance: 12.4 miles
Est. Time: 1h 30m

Pickup: 45 High Street, Glasgow G1 1AA
Drop 1: 12 Park Avenue, Glasgow G2 3BB (£15)
Drop 2: 88 Queen Street, Glasgow G3 5CC (£15)
Drop 3: 34 King Road, Glasgow G4 7DD (£15)
```

**Earnings History:**
```
Mon 14 Oct | 3 deliveries | £67.50 | Paid ✓
Tue 15 Oct | 4 deliveries | £92.00 | Paid ✓
Wed 16 Oct | 5 deliveries | £105.25 | Pending
Thu 17 Oct | 2 deliveries | £45.50 | Pending
```

---

## ⏱️ Time Estimate

**Taking screenshots: 30-60 minutes**
- Setup simulators: 10 min
- Navigate to each screen: 10 min
- Capture 5 screens × 3 sizes: 20 min
- Verification & organization: 20 min

**Total time investment: ~1 hour**

---

## 🆘 Need Help?

If you encounter issues:

### Simulator not working:
```bash
# Reset simulator
xcrun simctl erase all

# Reinstall app
expo start --clear
```

### Wrong resolution:
Use Apple's screenshot specs exactly. Don't resize manually.

### Screenshots look pixelated:
Must use native device simulator (not scaled).

---

**STATUS: READY TO EXECUTE** ✅

Follow this guide step-by-step for professional, Apple-approved screenshots.

