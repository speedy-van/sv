# Enterprise-Grade Naming Convention
## Speedy Van - Google Ads Account Structure

**Version:** 1.0  
**Date:** November 13, 2025  
**Status:** Recommended Standard  
**Scope:** All Google Ads campaigns, ad groups, keywords, and assets

---

## OVERVIEW

This document establishes a unified, enterprise-grade naming convention for the Speedy Van Google Ads account. The current naming structure is inconsistent and lacks scalability. This standard ensures clarity, consistency, and professional-grade organization across all campaigns.

---

## NAMING PRINCIPLES

### 1. Consistency
All naming follows a predictable, repeatable pattern that anyone can understand and replicate.

### 2. Scalability
The structure supports growth from 1 campaign to 100+ campaigns without confusion.

### 3. Clarity
Names immediately communicate the purpose, geography, service, and match type.

### 4. Searchability
Prefixes enable quick filtering and bulk operations in Google Ads Editor.

### 5. Professional Standards
Naming reflects enterprise-level organization comparable to Fortune 500 companies.

---

## CURRENT NAMING STRUCTURE (PROBLEMS)

### Campaign Level
**Current:** "Man With A Van - Exact Match"

**Problems:**
- No geographic indicator
- No service code
- Inconsistent capitalization
- Not scalable to multiple campaigns
- Difficult to filter or search

### Ad Group Level
**Current:** "Aberavon - Man With Van"

**Problems:**
- Inconsistent with campaign name ("With A" vs "With")
- No service code prefix
- No geographic hierarchy
- Difficult to bulk edit

### Keyword Level
**Current:** "[man with a van near me] aberavon"

**Problems:**
- Exceeds 35-character limit for many cities
- Inconsistent with ad group naming
- Not optimized for search intent

---

## RECOMMENDED NAMING STRUCTURE (ENTERPRISE-GRADE)

### Campaign Level Format
```
{BRAND}_{GEO}_{SERVICE}_{MATCHTYPE}_{VARIANT}
```

**Components:**
- `BRAND`: Company identifier (SV = Speedy Van)
- `GEO`: Geographic scope (UK, GB, LON, etc.)
- `SERVICE`: Service type code (ManVan, Furniture, House, etc.)
- `MATCHTYPE`: Keyword match type (Exact, Phrase, Broad, PMAX)
- `VARIANT`: Optional variant identifier (V1, V2, Test, etc.)

**Examples:**
```
SV_UK_ManVan_Exact_V1
SV_UK_ManVan_Phrase_V1
SV_UK_ManVan_Broad_V1
SV_UK_ManVan_PMAX_V1
SV_UK_Furniture_Exact_V1
SV_UK_HouseMove_Exact_V1
SV_LON_ManVan_Exact_Premium
```

### Ad Group Level Format
```
{SERVICE}_{GEO}_{CITY}_{VARIANT}
```

**Components:**
- `SERVICE`: Service type code (ManVan, Furniture, etc.)
- `GEO`: Country/region code (UK, SCT, ENG, WAL, NIR)
- `CITY`: City name (standardized)
- `VARIANT`: Optional variant (A, B, Premium, Budget, etc.)

**Examples:**
```
ManVan_UK_Aberavon
ManVan_UK_London
ManVan_SCT_Glasgow
ManVan_ENG_Manchester
Furniture_UK_Birmingham
HouseMove_UK_Edinburgh_Premium
```

### Keyword Level Format
```
[{service} {city}]
```

**Components:**
- `service`: Short service phrase (man and van, man van, furniture delivery)
- `city`: City name (lowercase)

**Examples:**
```
[man and van aberavon]
[man and van london]
[man van glasgow]
[furniture delivery birmingham]
[house removal edinburgh]
```

---

## SERVICE CODES

Standardized service type codes for consistency:

| Code | Full Name | Description |
|------|-----------|-------------|
| ManVan | Man and Van | General man and van services |
| Furniture | Furniture Delivery | Furniture-specific delivery |
| HouseMove | House Moving | Full house relocation services |
| OfficeMove | Office Relocation | Commercial office moves |
| StudentMove | Student Moving | University/college moves |
| SameDay | Same Day Service | Urgent same-day delivery |
| Clearance | House Clearance | Property clearance services |
| Removal | Removal Service | General removal services |
| Courier | Courier Service | Small parcel delivery |
| LongDist | Long Distance | Inter-city/national moves |

---

## GEOGRAPHIC CODES

Standardized geographic identifiers:

| Code | Region | Description |
|------|--------|-------------|
| UK | United Kingdom | All UK locations |
| GB | Great Britain | England, Scotland, Wales |
| ENG | England | England only |
| SCT | Scotland | Scotland only |
| WAL | Wales | Wales only |
| NIR | Northern Ireland | Northern Ireland only |
| LON | London | Greater London |
| MAN | Manchester | Greater Manchester |
| BIR | Birmingham | West Midlands |
| GLA | Glasgow | Greater Glasgow |
| EDI | Edinburgh | Edinburgh & Lothians |

---

## MATCH TYPE CODES

Standardized match type identifiers:

| Code | Match Type | Description |
|------|------------|-------------|
| Exact | Exact Match | [keyword] |
| Phrase | Phrase Match | "keyword" |
| Broad | Broad Match | keyword |
| PMAX | Performance Max | Automated campaign |
| DSA | Dynamic Search Ads | Dynamic ad targeting |

---

## IMPLEMENTATION PLAN

### Phase 1: Rename Existing Campaign (Optional)

**Current:** "Man With A Van - Exact Match"  
**New:** "SV_UK_ManVan_Exact_V1"

**Steps:**
1. Go to Google Ads → Campaigns
2. Click on campaign name
3. Edit name to new format
4. Save changes

**Note:** This is optional. You can keep the current campaign name and apply the new convention to future campaigns.

### Phase 2: Rename Ad Groups (Optional)

**Current Pattern:** "{City} - Man With Van"  
**New Pattern:** "ManVan_UK_{City}"

**Steps:**
1. Export ad groups to CSV
2. Use find/replace to update names
3. Re-import via Google Ads Editor

**Examples:**
- "Aberavon - Man With Van" → "ManVan_UK_Aberavon"
- "London - Man With Van" → "ManVan_UK_London"
- "Glasgow - Man With Van" → "ManVan_SCT_Glasgow"

**Note:** This is optional but recommended for consistency.

### Phase 3: Apply to New Campaigns (Mandatory)

All new campaigns MUST follow the naming convention:

**Example New Campaign Structure:**
```
Campaign: SV_UK_Furniture_Exact_V1
├── Ad Group: Furniture_UK_London
│   └── Keyword: [furniture delivery london]
├── Ad Group: Furniture_UK_Manchester
│   └── Keyword: [furniture delivery manchester]
└── Ad Group: Furniture_UK_Birmingham
    └── Keyword: [furniture delivery birmingham]
```

---

## NAMING CONVENTION EXAMPLES

### Example 1: Man and Van Service (Current Campaign)

**Campaign Level:**
```
Name: SV_UK_ManVan_Exact_V1
Budget: £150/day
Type: Search
Match Type: Exact Match
```

**Ad Group Level:**
```
ManVan_UK_Aberavon
ManVan_UK_London
ManVan_UK_Glasgow
ManVan_UK_Manchester
ManVan_UK_Birmingham
```

**Keyword Level:**
```
[man and van aberavon]
[man and van london]
[man and van glasgow]
[man and van manchester]
[man and van birmingham]
```

### Example 2: Furniture Delivery Service (New Campaign)

**Campaign Level:**
```
Name: SV_UK_Furniture_Exact_V1
Budget: £100/day
Type: Search
Match Type: Exact Match
```

**Ad Group Level:**
```
Furniture_UK_London
Furniture_UK_Manchester
Furniture_UK_Birmingham
Furniture_UK_Leeds
Furniture_UK_Liverpool
```

**Keyword Level:**
```
[furniture delivery london]
[furniture delivery manchester]
[furniture delivery birmingham]
[furniture delivery leeds]
[furniture delivery liverpool]
```

### Example 3: Performance Max Campaign (New Campaign)

**Campaign Level:**
```
Name: SV_UK_ManVan_PMAX_V1
Budget: £200/day
Type: Performance Max
Goal: Conversions
```

**Asset Group Level:**
```
PMAX_ManVan_UK_National
PMAX_ManVan_LON_Premium
PMAX_ManVan_SCT_Regional
```

---

## BENEFITS OF NEW NAMING CONVENTION

### 1. Instant Recognition
Anyone looking at the account immediately understands:
- Which brand (SV = Speedy Van)
- Geographic scope (UK, LON, SCT, etc.)
- Service type (ManVan, Furniture, etc.)
- Match type (Exact, Phrase, Broad)
- Version/variant (V1, V2, Premium, etc.)

### 2. Easy Filtering
In Google Ads Editor or web interface:
- Filter all "ManVan" campaigns: Search "ManVan"
- Filter all UK campaigns: Search "UK"
- Filter all Exact Match: Search "Exact"
- Filter all versions: Search "V1" or "V2"

### 3. Bulk Operations
Rename, edit, or modify multiple campaigns at once:
- Select all "SV_UK_*" campaigns
- Apply bulk changes
- Export/import with consistent naming

### 4. Scalability
As the account grows to 50+ campaigns:
- No confusion about campaign purpose
- Easy to organize and manage
- Professional appearance to stakeholders

### 5. Professional Standards
Naming reflects enterprise-level organization:
- Comparable to Fortune 500 companies
- Easy for agencies or consultants to understand
- Facilitates audits and reviews

---

## MIGRATION STRATEGY

### Option A: Immediate Rename (Aggressive)
1. Rename all campaigns, ad groups, and keywords immediately
2. Use Google Ads Editor for bulk operations
3. Complete in 1-2 hours
4. **Risk:** Potential disruption to historical data views

### Option B: Gradual Migration (Conservative)
1. Keep existing campaigns as-is
2. Apply new naming to all new campaigns
3. Rename old campaigns during major updates
4. Complete over 3-6 months
5. **Benefit:** No disruption, smooth transition

### Option C: Hybrid Approach (Recommended)
1. Keep current campaign name (already launched)
2. Rename ad groups to new format (low risk)
3. Apply new naming to all future campaigns
4. Complete over 1-2 months
5. **Benefit:** Balance of consistency and stability

---

## NAMING CONVENTION CHECKLIST

Before creating any new campaign, ad group, or keyword:

- [ ] Campaign name follows format: `{BRAND}_{GEO}_{SERVICE}_{MATCHTYPE}_{VARIANT}`
- [ ] Ad group name follows format: `{SERVICE}_{GEO}_{CITY}_{VARIANT}`
- [ ] Keyword follows format: `[{service} {city}]`
- [ ] All codes are from approved service/geo/match type lists
- [ ] Name is under character limits (campaign: 255, ad group: 255, keyword: 35)
- [ ] Name is consistent with existing structure
- [ ] Name is searchable and filterable
- [ ] Name clearly communicates purpose

---

## EXCEPTIONS AND SPECIAL CASES

### Test Campaigns
Use "_Test" suffix:
```
SV_UK_ManVan_Exact_Test1
SV_UK_ManVan_Exact_Test2
```

### Seasonal Campaigns
Use "_Season" suffix:
```
SV_UK_StudentMove_Exact_Summer2025
SV_UK_HouseMove_Exact_Christmas2025
```

### Geographic Expansion
Use specific region codes:
```
SV_LON_ManVan_Exact_Premium (London only)
SV_SCT_ManVan_Exact_Highland (Scotland Highlands)
SV_WAL_ManVan_Exact_Cardiff (Wales Cardiff)
```

### Brand Campaigns
Use "_Brand" identifier:
```
SV_UK_Brand_Exact_V1
SV_UK_Brand_Phrase_V1
```

---

## MAINTENANCE AND UPDATES

### Quarterly Review
- Review all campaign names for consistency
- Update naming convention document if needed
- Train team members on standards

### New Service Additions
- Add new service code to approved list
- Document in this guide
- Apply to all new campaigns

### Geographic Expansion
- Add new geographic codes as needed
- Maintain consistency with existing structure
- Update documentation

---

## CONCLUSION

This enterprise-grade naming convention provides a professional, scalable, and consistent structure for the Speedy Van Google Ads account. Implementation of this standard will:

✅ Improve account organization  
✅ Enable easier management and bulk operations  
✅ Facilitate team collaboration  
✅ Present a professional image  
✅ Support growth and expansion  

**Recommended Action:** Apply the hybrid approach - keep current campaign names but use the new convention for all future campaigns and consider renaming ad groups for consistency.

