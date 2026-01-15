# 🛡️ Protection Against Accidental Deletions

## What We've Added

To prevent accidental deletion of critical booking components, we've implemented multiple layers of protection:

### 1. **Code Comments** ⚠️
- Large warning comments in the code
- Clear documentation of critical sections
- Line numbers referenced in warnings

**Location:** `WhoAndPaymentStep_Simple.tsx` (lines 1-35)

### 2. **HTML Attributes** 🏷️
```typescript
data-testid="booking-reference-alert"
data-critical="true"
```

These attributes:
- Make components easy to find in DOM
- Enable automated testing
- Can be checked by scripts

### 3. **Runtime Warnings** 🚨
Added useEffect that checks if booking reference exists but alert is missing:

```typescript
useEffect(() => {
  if (formData.step2.bookingReference) {
    const alertElement = document.querySelector('[data-testid="booking-reference-alert"]');
    if (!alertElement) {
      console.error('🚨 CRITICAL BUG: Booking reference card was deleted!');
    }
  }
}, [formData.step2.bookingReference]);
```

**Check browser console for warnings**

### 4. **Documentation** 📚
- `CRITICAL_COMPONENTS.md` - Full list of critical components
- `PROTECTION_GUIDE.md` - This file
- Inline code comments

### 5. **Git Hooks** 🪝
Pre-commit hook that checks for deleted critical patterns.

**Installation:**
```bash
# On Windows (PowerShell)
cp .githooks/pre-commit .git/hooks/pre-commit

# On Mac/Linux
cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**What it does:**
- Scans git diff before commit
- Detects if critical components were deleted
- Asks for confirmation before allowing commit
- Can be bypassed with `git commit --no-verify` (NOT RECOMMENDED)

### 6. **Tests** 🧪
Test file that verifies critical components exist.

**Location:** `__tests__/critical-components.test.tsx`

**Run tests:**
```bash
pnpm test critical-components
```

**Manual verification in browser console:**
```javascript
window.verifyCriticalComponents()
// Outputs: ✅ All critical components verified
```

---

## How to Use

### Before Making Changes

1. **Read the warnings** at top of file (lines 1-35)
2. **Check CRITICAL_COMPONENTS.md** for component list
3. **Search for `data-critical`** attribute:
   ```bash
   grep -r "data-critical" apps/web/src/app/booking-luxury/
   ```

### While Editing

1. **Don't delete lines with:**
   - `data-testid="booking-reference-alert"`
   - `data-critical="true"`
   - Large `⚠️ CRITICAL` comment blocks

2. **If you need to move a component:**
   - Keep all attributes intact
   - Update line numbers in comments
   - Update CRITICAL_COMPONENTS.md
   - Test that it still renders

### After Editing

1. **Check browser console** for critical warnings
2. **Run manual test:**
   ```javascript
   window.verifyCriticalComponents()
   ```
3. **Git commit will auto-check** (if hooks installed)

---

## If You Accidentally Delete Something

### Step 1: Check Git History
```bash
# Find when it was deleted
git log -p -S "booking-reference-alert" -- "apps/web/src/app/booking-luxury/components/WhoAndPaymentStep_Simple.tsx"

# View specific commit
git show <commit-hash>
```

### Step 2: Restore the Component
```bash
# Option A: Revert the entire commit
git revert <commit-hash>

# Option B: Restore specific lines
git show <commit-hash>:path/to/file.tsx > temp.txt
# Copy the deleted code from temp.txt
```

### Step 3: Verify It Works
1. Check browser console (no errors)
2. Test booking flow
3. Run: `window.verifyCriticalComponents()`

---

## FAQ

### Q: Can I bypass the pre-commit hook?
**A:** Yes, but **DON'T DO IT** unless you're 100% sure:
```bash
git commit --no-verify
```

### Q: What if I need to refactor the component?
**A:** Fine! Just:
1. Keep the `data-testid` attribute
2. Keep the `data-critical` attribute
3. Update line numbers in comments
4. Test thoroughly

### Q: How do I add a new critical component?
**A:**
1. Add `data-critical="true"` attribute
2. Add `data-testid="component-name"` attribute
3. Add large warning comment above it
4. Document in `CRITICAL_COMPONENTS.md`
5. Add useEffect warning check
6. Add to git pre-commit hook patterns

### Q: The runtime warning is showing, what do I do?
**A:** This means the component exists in state but not in DOM:
1. Open browser DevTools
2. Check console for exact error
3. Search for `data-testid="booking-reference-alert"`
4. Verify the component is rendered (check React DevTools)

---

## Checklist for Developers

Before pushing code:

- [ ] No `🚨 CRITICAL` errors in browser console
- [ ] All `data-testid` attributes intact
- [ ] CRITICAL_COMPONENTS.md is up to date
- [ ] Pre-commit hook is installed
- [ ] Manually tested booking flow
- [ ] Ran `window.verifyCriticalComponents()` - all green ✅

---

## Contact

If you have questions or need to modify critical components:

**Email:** support@speedy-van.co.uk  
**See also:** `CRITICAL_COMPONENTS.md`
