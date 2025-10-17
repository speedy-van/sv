# 📸 App Store Screenshots

Place your screenshots in the corresponding device folders.

## 📂 Folder Structure

```
screenshots/
├── iPhone-6.7/     (1290 x 2796 px)
│   ├── 01-login.png
│   ├── 02-dashboard.png
│   ├── 03-routes.png
│   ├── 04-active-delivery.png
│   └── 05-earnings.png
│
├── iPhone-6.5/     (1242 x 2688 px)
│   ├── 01-login.png
│   ├── 02-dashboard.png
│   ├── 03-routes.png
│   ├── 04-active-delivery.png
│   └── 05-earnings.png
│
└── iPhone-5.5/     (1242 x 2208 px)
    ├── 01-login.png
    ├── 02-dashboard.png
    ├── 03-routes.png
    ├── 04-active-delivery.png
    └── 05-earnings.png
```

## 📱 Device Reference

| Folder | Device Examples | Resolution |
|--------|----------------|------------|
| iPhone-6.7 | iPhone 14 Pro Max, 15 Pro Max | 1290 x 2796 |
| iPhone-6.5 | iPhone 11 Pro Max, XS Max | 1242 x 2688 |
| iPhone-5.5 | iPhone 8 Plus, 7 Plus | 1242 x 2208 |

## 📋 Screenshot Checklist

For each device size, you need 5 screenshots in this exact order:

- [ ] **01-login.png** - Clean login screen
- [ ] **02-dashboard.png** - Earnings dashboard with data
- [ ] **03-routes.png** - Available routes or jobs
- [ ] **04-active-delivery.png** - Map with active delivery
- [ ] **05-earnings.png** - Detailed earnings breakdown

## ✅ Quality Checklist

Before uploading to App Store Connect, verify:

- [ ] Correct resolution for each device
- [ ] All 15 screenshots present (5 × 3 devices)
- [ ] PNG format (not JPG)
- [ ] No compression artifacts
- [ ] Realistic demo data (no "test" or "dummy" text)
- [ ] Status bar visible
- [ ] Professional appearance

## 🎯 Quick Verification

Run this PowerShell command to verify all screenshots are present:

```powershell
Get-ChildItem -Path . -Recurse -Filter "*.png" | Group-Object Directory | Select-Object Name, Count
```

Expected output:
```
Name                                    Count
----                                    -----
screenshots\iPhone-6.7                      5
screenshots\iPhone-6.5                      5
screenshots\iPhone-5.5                      5
```

## 📖 Need Help?

See `../SCREENSHOT_GUIDE.md` for detailed instructions on:
- How to take screenshots
- What to show in each screen
- Best practices
- Realistic test data examples

---

**Total required: 15 screenshots (5 per device size)**

