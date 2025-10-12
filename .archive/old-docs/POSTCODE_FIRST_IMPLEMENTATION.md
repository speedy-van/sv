# Postcode-First Address Input Pattern

## Overview

This implementation follows the **confused.com pattern** for address collection, ensuring compatibility with the pricing engine and improving user experience through a structured, step-by-step approach.

## Why Postcode-First?

### 🎯 **Pricing Engine Compatibility**
- The pricing engine requires valid postcodes for accurate calculations
- Postcodes are essential for zone-based pricing, congestion charges, and regional multipliers
- Without postcodes, pricing calculations fail or become inaccurate

### 📍 **Address Accuracy**
- UK postal system is postcode-centric
- Reduces address ambiguity and errors
- Ensures complete address collection including flat numbers, floors, and building details

### 🚀 **User Experience**
- Familiar pattern used by major UK sites (confused.com, rightmove.co.uk)
- Progressive disclosure reduces cognitive load
- Clear validation at each step

## Implementation

### 🏗️ **Component Architecture**

```typescript
// New postcode-first component
<PostcodeFirstAddressInput
  id="pickup-address"
  label="Pickup Address - Enter Postcode First"
  onChange={(completeAddress) => handleAddressChange(completeAddress)}
  required={true}
/>
```

### 📊 **Data Flow**

```
1. Postcode Entry & Validation
   ↓
2. Address Search (filtered by postcode)
   ↓
3. Property Details Collection
   ↓
4. Complete Address with Pricing Compatibility
```

### 🔧 **Address Structure**

```typescript
interface CompleteAddress extends AddressSuggestion {
  propertyDetails: {
    houseNumber?: string;    // "123"
    flatNumber?: string;     // "Flat 2A"
    buildingName?: string;   // "Thames House" 
    floor?: string;          // "Ground Floor"
    businessName?: string;   // "Company Ltd"
  };
  isPostcodeValidated: boolean;
  stepCompletedAt: string;
}
```

## Features

### ✅ **Step-by-Step Validation**
- **Step 1**: UK postcode validation and formatting
- **Step 2**: Address selection from postcode area
- **Step 3**: Property-specific details collection
- **Step 4**: Complete address confirmation

### ✅ **Pricing Engine Integration**
- All addresses guaranteed to have valid postcodes
- Property details support floor-based pricing surcharges
- Flat/house number details for delivery specificity

### ✅ **API Enhancements**
- Autocomplete API now filters suggestions without postcodes
- Response includes `filteredCount` for monitoring
- Ensures 100% pricing engine compatibility

### ✅ **User Experience**
- Progress bar showing completion status
- Clear step navigation with back/forward controls
- Validation feedback at each stage
- Mobile-responsive design

## API Changes

### 📡 **Enhanced Autocomplete Response**

```json
{
  "success": true,
  "data": {
    "suggestions": [...], // All include valid postcodes
    "provider": "google",
    "filteredCount": 2,   // Number of addresses filtered out
    "responseTime": 150
  }
}
```

### 🔒 **Postcode Validation**
```typescript
// Only suggestions with valid postcodes are returned
suggestions = suggestions.filter(suggestion => {
  const hasPostcode = suggestion.components && 
                     suggestion.components.postcode && 
                     suggestion.components.postcode.length >= 4;
  return hasPostcode;
});
```

## Integration Guide

### 🎯 **For Existing Components**

Replace `DualProviderAddressInput` with `PostcodeFirstAddressInput`:

```typescript
// Old approach
<DualProviderAddressInput
  onChange={(suggestion) => handleChange(suggestion)}
/>

// New postcode-first approach  
<PostcodeFirstAddressInput
  onChange={(completeAddress) => {
    // completeAddress includes propertyDetails
    handleCompleteAddressChange(completeAddress);
  }}
/>
```

### 💾 **Data Migration**
```typescript
// Convert existing addresses to new format
const migrateAddress = (oldAddress: Address): CompleteAddress => ({
  ...addressSuggestion,
  propertyDetails: {
    houseNumber: oldAddress.houseNumber,
    flatNumber: oldAddress.flatNumber,
    // ... other details
  },
  isPostcodeValidated: true,
  stepCompletedAt: new Date().toISOString()
});
```

## Benefits

### 🎯 **For Pricing Engine**
- ✅ 100% postcode coverage
- ✅ Property-specific surcharge calculation
- ✅ Floor-based pricing support
- ✅ Zone-based pricing accuracy

### 👤 **For Users**
- ✅ Familiar UK address collection pattern
- ✅ Reduced errors and ambiguity
- ✅ Progressive disclosure approach
- ✅ Mobile-optimized experience

### 🛠️ **For Developers**
- ✅ Type-safe address handling
- ✅ Consistent data structure
- ✅ Built-in validation
- ✅ Easy integration

## Testing

### 🧪 **Test Scenarios**

1. **Valid UK Postcodes**
   - SW1A 1AA → Should progress to address selection
   - M1 1AA → Should show Manchester addresses

2. **Invalid Postcodes**
   - "12345" → Should show validation error
   - "INVALID" → Should prevent progression

3. **Property Details**
   - Flat numbers, floor selection
   - Building names, business names
   - House numbers

4. **Pricing Integration**
   - Verify all addresses include postcodes
   - Test floor-based surcharge calculation
   - Confirm zone-based pricing accuracy

## Configuration

### 🔧 **Environment Variables**
No additional environment variables required. Uses existing:
- `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

### ⚙️ **Component Props**
```typescript
interface PostcodeFirstAddressInputProps {
  id: string;
  label: string;
  value?: CompleteAddress | null;
  onChange: (address: CompleteAddress | null) => void;
  onValidation?: (isValid: boolean) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}
```

## Migration Checklist

- [ ] Update `WhereAndWhatStep.tsx` to use `PostcodeFirstAddressInput`
- [ ] Test postcode validation flow
- [ ] Verify pricing engine integration
- [ ] Test property details collection
- [ ] Validate complete address structure
- [ ] Test mobile responsiveness
- [ ] Update form validation logic
- [ ] Test with existing bookings data

## Support

For issues or questions about the postcode-first implementation:
1. Check the console for validation errors
2. Verify postcode format (UK standard)
3. Ensure API keys are properly configured
4. Test with known valid postcodes (SW1A 1AA, M1 1AA)

## Future Enhancements

- [ ] International postcode support
- [ ] Address book integration
- [ ] Recently used addresses
- [ ] Bulk address import
- [ ] Advanced property type selection