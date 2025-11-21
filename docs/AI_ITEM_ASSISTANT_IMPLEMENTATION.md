# AI Item Extraction Assistant

## Overview
The AI Item Assistant lives inside Step 2 of `booking-luxury` directly below the “What are you moving?” hero text. Customers can now describe their shipment in free-form English (including slang or incomplete phrases) and receive:

- Automatic mapping to the real removal catalog (`ALL_REMOVAL_ITEMS`).
- Automatic injection of recognised items into the “Selected Items” list.
- Follow-up questions whenever size, type, or quantity is missing.
- A confirmation message: *“I've added the items you requested. Tell me if you want to add more, or you can move to the next step.”*

The assistant greets users with “I can organise everything for you in seconds. Just tell me what you need to move.” before any input is provided.

## API Route
- **Path:** `POST /api/booking/ai-items`
- **Auth:** Implicit – relies on existing booking session cookies.
- **Request body:**

```json
{
  "message": "Moving a king bed, large sofa and 6 boxes",
  "propertyType": "house",
  "conversation": [
    { "role": "assistant", "content": "Previous AI reply" },
    { "role": "user", "content": "Customer follow-up" }
  ],
  "selectedItems": [
    { "id": "itm_sofa_3", "name": "Sofa 3 Seater", "quantity": 1 }
  ]
}
```

- **Response body (success):**

```json
{
  "success": true,
  "data": {
    "addedItems": [
      {
        "item": { "id": "itm_sofa_3", "name": "Sofa 3 Seater", "category": "Living Room", "weight": 75 },
        "quantity": 2,
        "room": "living",
        "size": "3-seater"
      }
    ],
    "pendingQuestions": [
      {
        "id": "uuid",
        "question": "How many boxes do you have?",
        "field": "quantity",
        "itemName": "Boxes Medium Pack"
      }
    ],
    "assistantSummary": "…I've added the items you requested…",
    "followUpQuestions": []
  }
}
```

- **Response body (error):** `{ "success": false, "error": "message" }`.

### Processing pipeline
1. Validate payload using Zod.
2. Rate-limit per IP (6 requests/minute).
3. Call GROQ (`llama-3.3-70b-versatile`) with a strict JSON schema describing every Step 2 category, size hints, and follow-up rules.
4. Parse AI output and attempt to match each item to the canonical removal dataset using token scoring + room hints.
5. If mandatory fields are missing, queue follow-up questions instead of adding the item.
6. Return structured payload to the client.

## Frontend Integration
- Component: `AIItemExtractionAssistant`.
- Embedded via the optional `aiAssistantSlot` prop on `PropertyTypeSelector`, so it renders directly beneath “What are you moving?”.
- Maintains its own chat transcript (assistant vs. user), greeting, and loading states.
- Displays outstanding follow-up questions and keeps the textarea focused on answers.
- Emits `onAddItems(AiAddedItemPayload[])` when the API returns confirmed matches.

### Selected Items Synchronisation
`WhereAndWhatStepHierarchical` now centralises state updates:
- `updateItemsState` ensures React state and form state remain in sync.
- AI imports merge quantities atomically, preventing race conditions when multiple items arrive in one response.
- A toast summarizes what was injected.

## Environment Variables
The assistant uses the existing customer namespace key.

```
// Please add the following line to your existing '.env.local' file:
GROQ_API_KEY_CUSTOMER=gsk_your_customer_scoped_key

# Ensure your '.gitignore' file includes:
.env.local
.env*.local
```

> **Never** commit keys to the repository. The assistant will fall back to `GROQ_API_KEY` only if the customer key is missing, but production should always supply the namespaced secret.

## Testing
- Unit coverage lives in `apps/web/src/app/api/booking/ai-items/__tests__/route.test.ts`.
- Scenarios covered:
  - Successful extraction + catalog mapping.
  - Follow-up questions when details are missing.
  - Missing API key handling.
  - Payload validation errors.

Run the targeted suite:

```bash
pnpm test:unit -- --runTestsByPath apps/web/src/app/api/booking/ai-items/__tests__/route.test.ts
```

## Device Considerations
- The assistant container inherits the same iPhone 14–17 viewport fixes already applied to Step 2.
- Chat window adapts between 180–250px height and scrolls independently, protecting the rest of the form from layout shifts.

## Next Steps
- Persist AI conversations per session to allow multi-tab continuity.
- Feed clarified answers back into the prompt for higher-accuracy second passes.
- Extend schema to support room-specific placement hints (e.g., “Master Bedroom”) for downstream route planning.

