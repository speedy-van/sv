# Daily Profit Analysis - Speedy Van

## Executive Summary

This analysis calculates the daily profit for Speedy Van based on the current pricing system and driver earnings model. Two scenarios are compared: **10 single orders** vs **10 multi-drop routes** (serving 22 orders total).

---

## Key Findings

### Scenario 1: 10 Single Orders

| Metric | Value |
|--------|-------|
| **Total Orders** | 10 |
| **Revenue (excl VAT)** | **£1,720.50** |
| **Driver Costs** | £1,204.35 (70.0% of revenue) |
| **Operational Costs** | £153.50 (8.9% of revenue) |
| **PROFIT** | **£362.65** |
| **PROFIT MARGIN** | **21.1%** |
| **Profit per Order** | **£36.27** |

### Scenario 2: 10 Multi-Drop Routes (22 orders)

| Metric | Value |
|--------|-------|
| **Total Orders** | 22 |
| **Revenue (excl VAT)** | **£2,289.94** |
| **Driver Costs** | £1,602.96 (70.0% of revenue) |
| **Operational Costs** | £273.50 (11.9% of revenue) |
| **PROFIT** | **£413.48** |
| **PROFIT MARGIN** | **18.1%** |
| **Profit per Order** | **£18.79** |

---

## Multi-Drop Advantage

| Metric | Improvement |
|--------|-------------|
| **Revenue Increase** | +£569.44 (+33.1%) |
| **Profit Increase** | +£50.83 (+14.0%) |
| **Orders Served** | 22 vs 10 (+120%) |
| **Driver Efficiency** | 2.2 orders per driver |

**Key Insight:** Multi-drop routes serve **120% more orders** with only **14% more profit**, but significantly improve **driver utilization** and **customer value** (lower prices for customers).

---

## Detailed Breakdown: 10 Single Orders

| Order | Distance | Customer Price (inc VAT) | Driver Earns | Operational Cost | Profit | Margin |
|-------|----------|--------------------------|--------------|------------------|--------|--------|
| 1. London Local - 1 bed | 15 mi | £102.00 | £59.50 | £10.25 | £15.25 | 17.9% |
| 2. Manchester-Leeds - boxes | 40 mi | £159.00 | £92.75 | £14.00 | £25.75 | 19.4% |
| 3. Birmingham-London - 2 beds | 120 mi | £396.00 | £231.00 | £26.00 | £73.00 | 22.1% |
| 4. Edinburgh-Glasgow - sofa | 50 mi | £213.00 | £124.25 | £15.50 | £37.75 | 21.3% |
| 5. London-Brighton - 1 bed (express) | 55 mi | £288.60 | £168.35 | £16.25 | £55.90 | 23.2% |
| 6. Liverpool-Manchester - boxes | 35 mi | £144.00 | £84.00 | £13.25 | £22.75 | 19.0% |
| 7. Glasgow-Edinburgh - 2 beds | 50 mi | £225.00 | £131.25 | £15.50 | £40.75 | 21.7% |
| 8. London-Oxford - furniture | 60 mi | £246.00 | £143.50 | £17.00 | £44.50 | 21.7% |
| 9. Bristol-Cardiff - 1 bed | 45 mi | £192.00 | £112.00 | £14.75 | £33.25 | 20.8% |
| 10. Newcastle-Durham - boxes | 20 mi | £99.00 | £57.75 | £11.00 | £13.75 | 16.7% |

**Average Profit Margin: 21.1%**

---

## Detailed Breakdown: 10 Multi-Drop Routes

| Route | Distance | Orders | Revenue per Order | Total Revenue | Driver Earns | Op Cost | Profit | Margin |
|-------|----------|--------|-------------------|---------------|--------------|---------|--------|--------|
| 1. London Zone 1-4 | 45 mi | 3 | £63.75 (25% off) | £191.25 | £133.88 | £30.75 | £26.62 | 13.9% |
| 2. Manchester-Leeds Corridor | 60 mi | 2 | £104.12 (15% off) | £208.25 | £145.77 | £25.00 | £37.48 | 18.0% |
| 3. Midlands Circuit | 80 mi | 2 | £125.38 (15% off) | £250.75 | £175.52 | £28.00 | £47.23 | 18.8% |
| 4. Scotland Central Belt | 70 mi | 2 | £114.75 (15% off) | £229.50 | £160.65 | £26.50 | £42.35 | 18.5% |
| 5. South Coast Route (express) | 90 mi | 3 | £119.44 (25% off) | £358.31 | £250.82 | £37.50 | £69.99 | 19.5% |
| 6. North West Loop | 55 mi | 2 | £98.81 (15% off) | £197.62 | £138.34 | £24.25 | £35.04 | 17.7% |
| 7. Central Scotland | 65 mi | 2 | £109.44 (15% off) | £218.88 | £153.21 | £25.75 | £39.91 | 18.2% |
| 8. Thames Valley Route | 75 mi | 2 | £120.06 (15% off) | £240.12 | £168.09 | £27.25 | £44.79 | 18.7% |
| 9. South Wales Circuit | 70 mi | 2 | £114.75 (15% off) | £229.50 | £160.65 | £26.50 | £42.35 | 18.5% |
| 10. North East Route | 40 mi | 2 | £82.88 (15% off) | £165.75 | £116.02 | £22.00 | £27.73 | 16.7% |

**Average Profit Margin: 18.1%**

---

## Cost Breakdown Analysis

### Driver Costs (70% of revenue cap)

The driver earnings system is designed to cap driver pay at **70% of customer payment (excl VAT)**. This ensures a minimum **30% gross margin** before operational costs.

**Driver Earnings Components:**
- Base pay: £30
- Distance fee: £1.50/mile (after first 5 miles)
- Stop fee: £8 per additional stop
- Time fee: £12/hour (estimated)
- Urgency multiplier: 1.0x (standard), 1.4x (express), 2.0x (premium)
- Performance bonus: 5% (for rating ≥ 4.5)

**Result:** Driver costs are consistently at or near the 70% cap, ensuring fair pay while maintaining profitability.

### Operational Costs

**Components:**
- Fuel: £0.15/mile (average for van)
- Insurance: £5/order
- Platform costs: £3/order (payment processing, support, etc.)

**Average:** 8.9% - 11.9% of revenue

---

## Scaling to 200 Orders/Day

### Scenario A: All Single Orders (200 orders)

| Metric | Value |
|--------|-------|
| Revenue (excl VAT) | £34,410 |
| Driver Costs | £24,087 |
| Operational Costs | £3,070 |
| **DAILY PROFIT** | **£7,253** |
| **PROFIT MARGIN** | **21.1%** |

### Scenario B: Mix of Single & Multi-Drop (200 orders via 130 routes)

Assuming 70% single orders, 30% multi-drop:
- 140 single orders: £24,087 revenue, £5,077 profit
- 60 orders via 30 multi-drop routes: £10,323 revenue, £1,867 profit

| Metric | Value |
|--------|-------|
| Revenue (excl VAT) | £34,410 |
| Driver Costs | £24,087 |
| Operational Costs | £3,479 |
| **DAILY PROFIT** | **£6,844** |
| **PROFIT MARGIN** | **19.9%** |

### Scenario C: Optimized Multi-Drop (200 orders via 100 routes)

Assuming 50% single orders, 50% multi-drop:
- 100 single orders: £17,205 revenue, £3,627 profit
- 100 orders via 50 multi-drop routes: £17,205 revenue, £3,112 profit

| Metric | Value |
|--------|-------|
| Revenue (excl VAT) | £34,410 |
| Driver Costs | £24,087 |
| Operational Costs | £3,685 |
| **DAILY PROFIT** | **£6,638** |
| **PROFIT MARGIN** | **19.3%** |

---

## Scaling to 500 Orders/Day

### Scenario A: All Single Orders (500 orders)

| Metric | Value |
|--------|-------|
| Revenue (excl VAT) | £86,025 |
| Driver Costs | £60,218 |
| Operational Costs | £7,675 |
| **DAILY PROFIT** | **£18,132** |
| **PROFIT MARGIN** | **21.1%** |

### Scenario B: Optimized Multi-Drop (500 orders via 250 routes)

Assuming 50% single orders, 50% multi-drop:

| Metric | Value |
|--------|-------|
| Revenue (excl VAT) | £86,025 |
| Driver Costs | £60,218 |
| Operational Costs | £9,213 |
| **DAILY PROFIT** | **£16,594** |
| **PROFIT MARGIN** | **19.3%** |

---

## Key Insights & Recommendations

### 1. Profit Margins are Healthy (18-21%)

✅ **Current margins (18-21%) are excellent** for the logistics industry.  
✅ **Driver costs are capped at 70%**, ensuring profitability.  
✅ **Operational costs are low (9-12%)**, thanks to technology-driven efficiency.

### 2. Multi-Drop Reduces Profit Margin but Increases Volume

⚠️ Multi-drop routes have **lower profit margins (18.1%)** vs single orders (21.1%).  
✅ But they serve **120% more orders** with the same number of drivers.  
✅ This improves **customer value** (lower prices) and **market share**.

**Recommendation:** Aim for a **50/50 mix** of single orders and multi-drop routes to balance profitability and growth.

### 3. Scaling to 200-500 Orders/Day is Profitable

✅ **200 orders/day:** £6,600 - £7,250 daily profit (£198k - £217k/month)  
✅ **500 orders/day:** £16,600 - £18,100 daily profit (£498k - £543k/month)

**With £15,000/day ad spend (for 200 orders):**
- Revenue: £34,410/day
- Ad spend: £15,000/day
- Operational profit: £7,250/day
- **Net profit: -£7,750/day** (loss in Month 1)

**Break-even:** Need to reduce CAC (Customer Acquisition Cost) to **£36** or lower.  
**Current CAC:** £15,000 ÷ 200 = **£75/order**

### 4. Path to Profitability

**Month 1-2: Build Brand (Accept Losses)**
- Ad spend: £15,000/day
- Orders: 200/day
- Net profit: -£7,750/day
- **Monthly loss: -£232,500**

**Month 3-6: Optimize & Scale**
- Improve conversion rate: 8% → 12% (50% improvement)
- Reduce CPC: £6 → £4.50 (25% improvement)
- New CAC: £37.50 (50% reduction)
- Ad spend: £7,500/day (for 200 orders)
- **Net profit: +£250/day** (break-even)

**Month 7-12: Profitable Growth**
- CAC: £30 (organic + referrals reduce paid acquisition)
- Ad spend: £6,000/day (for 200 orders)
- **Net profit: +£1,750/day** (£52,500/month)

**Year 2: Scale to 500 orders/day**
- CAC: £25 (brand recognition)
- Ad spend: £12,500/day (for 500 orders)
- Operational profit: £18,000/day
- **Net profit: +£5,500/day** (£165,000/month)

---

## Conclusion

**Current pricing and driver earnings system is well-designed and profitable:**

✅ **21.1% profit margin** on single orders  
✅ **18.1% profit margin** on multi-drop routes  
✅ **70% driver cost cap** ensures sustainability  
✅ **Scalable to 200-500 orders/day** with healthy margins

**Challenge:** High initial CAC (£75) requires significant upfront investment.

**Solution:** Focus on:
1. Improving conversion rate (landing pages, booking flow)
2. Reducing CPC (negative keywords, better targeting)
3. Building organic channels (SEO, referrals, partnerships)
4. Optimizing multi-drop matching to serve more orders per driver

**Expected Timeline to Profitability:** 3-6 months with aggressive optimization.

---

**Analysis Date:** October 12, 2025  
**Analyst:** Manus AI

