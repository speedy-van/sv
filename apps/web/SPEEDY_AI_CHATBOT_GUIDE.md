# 🤖 Speedy AI Chatbot - Admin Guide

## 🎉 New Enhanced Features

The Speedy AI chatbot has been significantly upgraded to provide **real-time, intelligent assistance** with full access to your system data.

---

## ✨ What's New?

### 1. **Real-Time Order Intelligence**
Just mention an order number, and Speedy AI will:
- Instantly fetch complete order details from database
- Analyze status, timeline, and potential issues
- Suggest optimal actions based on current state
- Provide driver recommendations

**Example:**
```
You: "What's the status of SV-12345?"

Speedy AI: "📦 Order SV-12345:
- Status: CONFIRMED (ready for assignment)
- Customer: John Smith
- Route: London → Manchester
- Price: £240.25
- Scheduled: Tomorrow, 10:00 AM
- Driver: Unassigned

💡 Recommendation: This order should be assigned soon. I found 3 available drivers in the London area. Would you like me to recommend the best match?"
```

---

### 2. **Multi-Drop Route Expertise**
Mention a route number for instant analysis:

**Example:**
```
You: "How efficient is R-789?"

Speedy AI: "🚚 Route R-789:
- Status: in_progress
- Driver: Mike Johnson
- Stops: 5 (3 completed, 2 remaining)
- Distance: 45.3 km
- Efficiency: 87% (Good)

📊 Analysis:
- On schedule (ETA: 14:30)
- Optimal sequence used
- 15% fuel savings vs manual routing

⚠️ Note: Last stop has narrow time window (16:00-16:30). Driver should prioritize."
```

---

### 3. **Live System Statistics**
Ask about system health at any time:

**Examples:**
```
You: "How many active orders do we have?"
You: "Show me today's stats"
You: "What's our revenue today?"

Speedy AI: "📊 Live System Stats (14:25):
- Orders: 347 total, 23 active
- Drivers: 15 total, 12 online
- Active Routes: 4
- Today's Revenue: £3,247.50

🔥 Peak hours approaching (17:00-19:00). Recommend activating standby drivers."
```

---

### 4. **Smart Driver Recommendations**
Need to assign a job? Ask the AI:

**Example:**
```
You: "Who should I assign for an urgent job in Manchester?"

Speedy AI: "🚗 Available Drivers Near Manchester:

1. **Sarah Williams** (Recommended ⭐)
   - Current Location: 8 km from pickup
   - Active Jobs: 1 (finishing at 15:00)
   - Rating: 4.9/5
   - Acceptance Rate: 98%
   - ETA to pickup: 12 minutes

2. **Tom Brown**
   - Distance: 15 km
   - Active Jobs: 2
   - Rating: 4.7/5
   
3. **Emma Davis**
   - Distance: 22 km
   - Active Jobs: 0 (immediately available)

💡 Best Choice: Sarah Williams - perfect balance of proximity, performance, and availability."
```

---

### 5. **Workflow Guidance**
Not sure how to do something? Just ask:

**Examples:**
```
You: "How do I create a multi-drop route?"
You: "What's the workflow for handling a customer complaint?"
You: "Explain the driver onboarding process"
```

Speedy AI will provide **step-by-step guides** with specific API endpoints and dashboard sections.

---

## 🎯 Supported Query Types

### **Order Queries:**
- `"What's the status of SV-12345?"`
- `"Why is order SV-67890 delayed?"`
- `"Show me details for booking SV-11111"`
- `"Is SV-22222 assigned?"`

### **Route Queries:**
- `"How efficient is route R-456?"`
- `"Show me R-789 details"`
- `"Which driver is on route R-123?"`
- `"How many stops in R-999?"`

### **Driver Queries:**
- `"Who can take this job?"`
- `"Show me available drivers"`
- `"Who's the best driver for Manchester?"`
- `"How many jobs does Sarah have?"`

### **System Queries:**
- `"How many orders today?"`
- `"What's our revenue?"`
- `"Show me active routes"`
- `"System status overview"`

### **Help Queries:**
- `"How do I create a route?"`
- `"Explain multi-drop optimization"`
- `"What's the job queue system?"`
- `"Guide me through driver assignment"`

---

## 🚀 Advanced Features

### **Multi-Reference Support**
You can mention multiple orders/routes at once:

```
You: "Compare SV-100 and SV-101 - which one should I prioritize?"

Speedy AI: *Fetches both orders*
"📦 Comparison:

SV-100:
- Scheduled: Today, 14:00
- Distance: 45 km
- Value: £180
- Urgency: Medium

SV-101:
- Scheduled: Today, 15:00  
- Distance: 25 km
- Value: £240
- Urgency: High

💡 Priority: SV-101 (higher value, shorter distance, high urgency)"
```

### **Context-Aware Responses**
The AI remembers conversation history:

```
You: "SV-12345 is delayed"
AI: "Let me check... [analyzes order]"

You: "Can you reassign it?"
AI: *Knows you're talking about SV-12345* "I found 3 drivers..."

You: "Assign to the closest one"
AI: *Automatically assigns* "Done! Sarah Williams assigned to SV-12345."
```

---

## 🌍 Multi-Language Support

Speedy AI supports both English and Arabic:

```
English: "Show me active routes"
Arabic: "أرني المسارات النشطة"
```

**Auto-Detection**: The AI automatically detects which language you're using!

---

## 💡 Pro Tips

### **1. Be Specific**
❌ "Check orders"  
✅ "Show me unassigned orders for tomorrow"

### **2. Use Reference Numbers**
❌ "That order from London"  
✅ "Order SV-12345"

### **3. Ask for Recommendations**
❌ "I need to assign this"  
✅ "Recommend best driver for SV-12345"

### **4. Request Workflows**
❌ "I don't know how to..."  
✅ "Explain the workflow for creating multi-drop routes"

---

## 🔥 Real-World Examples

### **Scenario 1: Urgent Order Assignment**
```
You: "SV-55555 needs urgent assignment - it's scheduled in 2 hours!"

Speedy AI: "🚨 URGENT: Order SV-55555
- Pickup: London, Soho (W1D 3QU)
- Customer: Premium client
- Time: 16:00 (in 2 hours!)

🚗 IMMEDIATELY AVAILABLE DRIVERS:
1. ⭐ Mike Chen - 5 min away, 0 active jobs
2. Emma Davis - 12 min away, 1 active job (ending soon)

🎯 ACTION: Auto-assigning to Mike Chen (closest + available)
Would you like me to proceed?"
```

### **Scenario 2: Route Optimization**
```
You: "I have 8 bookings in North London for tomorrow - should I create one route or two?"

Speedy AI: "📊 Analyzing 8 bookings...

🚚 RECOMMENDATION: Create 2 routes

Route A (4 bookings):
- Morning deliveries (9:00-12:00)
- Total distance: 28 km
- Driver: Sarah W.

Route B (4 bookings):
- Afternoon deliveries (14:00-17:00)
- Total distance: 32 km
- Driver: Tom B.

💡 Benefits:
- Better time window compliance
- Reduced driver fatigue
- 20% faster completion vs single route

Use: POST /api/admin/routes/create"
```

### **Scenario 3: Performance Analysis**
```
You: "How is route R-123 performing?"

Speedy AI: "🚚 Route R-123 Performance:

✅ Excellent (94% efficiency)

- Completed: 4 of 6 stops (67%)
- On-time: 100% so far
- Distance vs planned: -2 km (saved fuel!)
- Driver: Sarah Williams

⏰ ETA:
- Stop 5: 15:45 (on time)
- Stop 6: 16:20 (5 min early)

📈 Trending to finish ahead of schedule with perfect record."
```

---

## 🎯 What Makes Speedy AI "Smart"?

### ✅ **Real Database Access**
- Queries live data for every order/route mentioned
- Never gives outdated information
- Always shows current system state

### ✅ **Context Understanding**
- Recognizes order patterns: SV-12345, booking-xxx
- Recognizes route patterns: R-123, ROUTE-456
- Understands "it", "that order", "the route" from conversation

### ✅ **Intelligent Recommendations**
- Ranks drivers by proximity + performance + availability
- Suggests route optimizations based on real distances
- Flags risks (time windows, capacity issues)

### ✅ **Workflow Knowledge**
- Knows all 50+ APIs in the system
- Understands multi-drop route types (Auto/Semi/Manual)
- Explains job queue system for drivers
- Guides through complex workflows

---

## 🔧 Technical Details

### **AI Model:**
- **Groq Llama 3.3 70B** (Ultra-fast, highly capable)
- Response time: 500ms - 2s
- Max tokens: 2500 (detailed responses)

### **Data Sources:**
- **Live Database**: Orders, Routes, Drivers, Stats
- **Knowledge Base**: Workflows, APIs, Best Practices
- **Context History**: Remembers conversation

### **Security:**
- **Admin-only access** (requires admin session)
- **Audit logging** (all interactions logged)
- **No data leakage** (isolated per admin session)

---

## 📞 Support Contact

If Speedy AI can't help with something:
- Phone: **01202129764**
- Email: **support@speedy-van.co.uk**

---

## 🎉 Start Using It Now!

Look for the **floating blue chat icon** in the bottom-right corner of your admin panel.

Click it and try:
```
"Show me today's stats"
"What's the status of SV-12345?"
"How do I create a multi-drop route?"
"Recommend a driver for urgent Manchester job"
```

**Speedy AI is always ready to help!** 🚀

