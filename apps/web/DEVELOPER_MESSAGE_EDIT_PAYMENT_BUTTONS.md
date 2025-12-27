# 🚨 CRITICAL BUG REPORT: Edit & Payment Buttons Issue

## Problem Description

**Location:** `src/components/admin/orders/OrdersTable.tsx`

**Issue:** When clicking the "Edit" or "Payment" buttons on order cards/table rows, the user is redirected to the Order table page without any action being performed. The buttons do not open the OrderDetailDrawer as expected.

## Affected Buttons

1. **Edit Button** (`handleEditOrder`)
   - Expected: Open OrderDetailDrawer in edit mode
   - Actual: Redirects to Order table, no action

2. **Payment Button** (`handleViewPaymentDetails`)
   - Expected: Open OrderDetailDrawer in Payment tab
   - Actual: Redirects to Order table, no action

## Code Locations

### Handlers (Lines 1680-1772)
```typescript
const handleEditOrder = (order: Order) => {
  setDrawerInitialMode('edit');
  setDrawerInitialTab('overview');
  handleViewOrder(order.reference);
};

const handleViewPaymentDetails = (order: Order) => {
  setDrawerInitialMode('view');
  setDrawerInitialTab('payment');
  handleViewOrder(order.reference);
};
```

### Button Implementations
- **Card View:** Lines 3335-3350 (Edit button)
- **Card View:** Lines 3391-3399 (Payment button)
- **Table View:** Lines 2324-2343 (Edit icon button)
- **Table View:** Lines 2365-2376 (Payment icon button)

## Root Cause Analysis

**Suspected Issues:**

1. **State Management Problem:**
   - `drawerInitialTab` and `drawerInitialMode` state may not be set before `handleViewOrder` is called
   - React state updates are asynchronous, so `handleViewOrder` may execute before state is updated

2. **Event Propagation:**
   - `e.stopPropagation()` is used, but there may be parent click handlers interfering
   - Card/row click handlers may be overriding button clicks

3. **Drawer Opening Logic:**
   - `OrderDetailDrawer` may not be receiving or processing `initialTab` and `initialMode` props correctly
   - The `useEffect` in `OrderDetailDrawer` may have dependency issues

4. **Navigation Issue:**
   - Something may be triggering a page navigation instead of opening the drawer
   - Router navigation might be interfering

## Required Fixes

### Fix 1: Ensure State is Set Before Opening Drawer
```typescript
const handleEditOrder = (order: Order) => {
  // Set state first, then open drawer after state is set
  setDrawerInitialMode('edit');
  setDrawerInitialTab('overview');
  
  // Use setTimeout or ensure state is set before opening
  setTimeout(() => {
    setSelectedOrderCode(order.reference);
    onDetailOpen();
  }, 0);
};
```

### Fix 2: Check Event Propagation
Ensure all button clicks properly stop propagation:
```typescript
onClick={(e) => {
  e.stopPropagation();
  e.preventDefault(); // Add this
  handleEditOrder(order);
}}
```

### Fix 3: Verify Drawer Props
Check that `OrderDetailDrawer` is receiving props correctly:
```typescript
<OrderDetailDrawer
  isOpen={isDetailOpen}
  onClose={onDetailClose}
  orderCode={selectedOrderCode}
  initialTab={drawerInitialTab}  // Verify this is set
  initialMode={drawerInitialMode} // Verify this is set
/>
```

### Fix 4: Debug Navigation
Check if there's any router.push or navigation happening:
- Search for `router.push` or `useRouter` in OrdersTable
- Check if card/row click handlers are navigating away

## Testing Steps

1. Click "Edit" button on an order card
   - Expected: Drawer opens in edit mode
   - Actual: Redirects to table

2. Click "Payment" button on an order card
   - Expected: Drawer opens in Payment tab
   - Actual: Redirects to table

3. Check browser console for errors
4. Check Network tab for unexpected navigation requests

## Priority

**HIGH PRIORITY** - This breaks core admin functionality for editing orders and viewing payment details.

## Additional Notes

- The "View Details" button works correctly (opens drawer in overview)
- Other buttons (Cancel, Assign, etc.) work correctly
- Only Edit and Payment buttons have this issue

---

**Reported by:** User via chat
**Date:** 2025-01-26
**Status:** Needs Investigation

