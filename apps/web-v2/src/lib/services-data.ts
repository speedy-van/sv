// Premium UNIQUE service copy for speedy-van.co.uk.
// Do NOT mirror copy from apps/web (speedyvan.uk) — Google duplicate-content risk.

export interface ServiceItem {
  slug: string;
  title: string;
  short: string; // index card subtitle
  hero: string; // hero subtitle on detail page
  fromPrice: string;
  duration: string;
  bestFor: string;
  highlights: string[]; // 4-6 bullet points
  paragraphs: string[]; // 2-3 paragraphs of unique narrative copy
}

export const SERVICES: ServiceItem[] = [
  {
    slug: "house-removals",
    title: "House Removals",
    short: "Whole-home moves done with hotel-level care.",
    hero: "From a one-bed flat in Partick to a five-bed in Murrayfield — packed properly, moved properly, finished on time.",
    fromPrice: "£120",
    duration: "Half-day to full-day",
    bestFor: "Families and homeowners moving across town or across Scotland.",
    highlights: [
      "Trained two- or three-person crews",
      "Blanket-wrap & strap on every item",
      "Disassembly and reassembly included",
      "Goods in Transit cover up to van limit",
      "Fixed price, written confirmation",
      "Same crew, start to finish",
    ],
    paragraphs: [
      "Most house moves go wrong because the quote is vague. Ours isn't. We ask the right questions up front, walk the floor (virtually or in person), and write down what's leaving with us. The number you see at booking is the number on your invoice.",
      "On move day, the same two-person team that loaded your old place unloads your new one. Furniture is wrapped, mattresses are bagged, white goods are strapped. Boxes are placed in the room you label, not dumped in the hallway.",
      "We carry full Goods in Transit and Public Liability cover. We're slow when it matters, fast when it doesn't, and we always tidy up after ourselves.",
    ],
  },
  {
    slug: "office-relocation",
    title: "Office Relocation",
    short: "Move the business without losing the week.",
    hero: "After-hours and weekend office moves across the Central Belt — IT down on Friday, online by Monday.",
    fromPrice: "£180",
    duration: "Evenings, weekends, or phased",
    bestFor: "SMEs, agencies, clinics, and serviced-office tenants.",
    highlights: [
      "Out-of-hours scheduling",
      "Itemised inventory with photos",
      "Anti-static crates for IT kit",
      "Floor protection on entry routes",
      "Decommissioning of old space",
      "Single point of contact",
    ],
    paragraphs: [
      "An office move shouldn't cost you a billing cycle. We work to your downtime window — late Friday, all-weekend, or phased over multiple evenings — and report progress in real time so directors can stop watching their inbox.",
      "Every workstation, monitor, and server is barcoded and tracked. Cables are bagged with the screen they belong to. Nothing arrives at the new building unaccounted for.",
      "We handle the boring bits too: protecting the lift, returning the keys, cleaning the old space so deposits come back in full.",
    ],
  },
  {
    slug: "furniture-delivery",
    title: "Furniture Delivery",
    short: "One sofa, one armchair, one upstairs bedroom — done.",
    hero: "Marketplace, showroom, or family hand-me-down — collected, transported, and placed in the room of your choice.",
    fromPrice: "£45",
    duration: "1–2 hours typical",
    bestFor: "Single-item collections from Facebook Marketplace, Gumtree, IKEA, John Lewis, AO.com.",
    highlights: [
      "Two-person lift as standard",
      "Stairs and tight turns no problem",
      "Old item removal available",
      "Photo-confirmed pickup",
      "Live ETA to your phone",
      "Cash or card accepted by seller",
    ],
    paragraphs: [
      "Bought a sofa on Marketplace and the seller wants it gone by Sunday? We've moved more couches up Glasgow tenement stairs than we'd care to count. Two crew, the right straps, and the patience to do it without scuffing your skirting.",
      "Every collection is photo-confirmed at pickup so you can see what we've got before we leave the seller's drive. Live ETA to your phone, cash to the seller if needed, and your old sofa hauled away if you've booked the swap-out.",
      "Fixed price by van class, not by minute. The number you see is the number you pay.",
    ],
  },
  {
    slug: "student-moves",
    title: "Student Moves",
    short: "Halls to flat. Flat to home. Done before bedtime.",
    hero: "End-of-term moves around Glasgow Uni, Edinburgh Uni, Strathclyde, Heriot-Watt, Dundee, St Andrews and beyond.",
    fromPrice: "£60",
    duration: "1–3 hours",
    bestFor: "Undergrads, postgrads, international students, parents collecting at term-end.",
    highlights: [
      "Term-end & semester-start slots",
      "Quick load & quick unload",
      "Suitcases, boxes, IKEA, the lot",
      "Group bookings for flatmates",
      "Tail-lift on request",
      "Card-only — no cash hassle",
    ],
    paragraphs: [
      "Halls of residence have rules: arrive late, lose your slot. We know the loading bays at Murano Street, Pollock Halls, Cairncross House, and most central student blocks. We arrive on time, in the right van, and we leave on time too.",
      "Going home for summer? We do storage transfers across all our coverage cities. Coming back in September? Book the same slot now and we'll hold it.",
      "Group bookings welcome — split the price across the flat and we'll do the maths for you.",
    ],
  },
  {
    slug: "man-and-van",
    title: "Man & Van",
    short: "A van, a pair of hands, a fixed price.",
    hero: "Flexible point-to-point moves with experienced crew. Quoted upfront — never by the meter.",
    fromPrice: "£45",
    duration: "Hourly or fixed",
    bestFor: "Studio flats, single-room moves, partial moves, IKEA runs, charity drop-offs.",
    highlights: [
      "Choose 1, 2, or 3 crew",
      "Small, medium, large or Luton van",
      "All blankets, straps, trolleys included",
      "Add-on: packing materials",
      "Add-on: dismantling service",
      "Apple Pay & Google Pay at checkout",
    ],
    paragraphs: [
      "Some moves don't need the full removal-company circus — they just need a clean van, two strong people, and someone who turns up when they said they would. That's the brief.",
      "Pick van size, pick crew size, pick a slot. We hold the price, no matter how the traffic on the M77 behaves.",
      "Available across the Central Belt with limited slots in Aberdeen, Inverness, Dundee and the Borders.",
    ],
  },
  {
    slug: "piano-moves",
    title: "Piano Moves",
    short: "Uprights, baby grands, digital — handled with the right gear.",
    hero: "Specialist piano transport across Scotland with proper boards, straps, and stair-climbing kit.",
    fromPrice: "£195",
    duration: "1–4 hours",
    bestFor: "Family heirlooms, music school relocations, recital hire returns.",
    highlights: [
      "Piano boards & climbing skids",
      "4-strap upright lifts",
      "Stair specialists",
      "Tuning recommended post-move",
      "Insured to instrument value (declared)",
      "Long-distance routes welcome",
    ],
    paragraphs: [
      "A piano isn't furniture — it's an instrument. We move them with proper boards, transit straps, and crews who've done it more than twice. We don't drag them on castors and we don't tilt grands beyond spec.",
      "For instruments above £2,000 declared value we recommend tuning a fortnight after delivery, once the soundboard has acclimatised to its new home.",
      "Get a written quote with your serial number on it. We'll handle the rest.",
    ],
  },
  {
    slug: "packing-services",
    title: "Packing Services",
    short: "Wrap, box, label — leave it to us.",
    hero: "Full or fragile-only packing the day before your move. Turn up the next morning to a house that's ready to go.",
    fromPrice: "£90",
    duration: "Half-day to full-day",
    bestFor: "Anyone who'd rather not spend the weekend in bubble wrap.",
    highlights: [
      "Double-walled cartons",
      "Acid-free tissue for fragile items",
      "Wardrobe boxes for hanging clothes",
      "Bubble wrap & layered foam",
      "Itemised box list",
      "Optional unpacking at destination",
    ],
    paragraphs: [
      "A two-bedroom flat takes the average person 12–15 hours to pack. Our packers do it in 4. Glassware doesn't crack. Frames don't snap. Books arrive in the order you shelved them.",
      "Optional add-on: full unpacking at the new address. Plates back in cupboards, bedding back on beds, boxes flattened and removed.",
      "Eco materials available on request — recycled cardboard, plant-based tape, no bubble wrap.",
    ],
  },
  {
    slug: "storage",
    title: "Short-Term Storage",
    short: "Between properties? Park it with us.",
    hero: "Clean, dry, alarmed storage from one week to twelve weeks — collected, stored, and re-delivered.",
    fromPrice: "£35/week",
    duration: "1–12 weeks",
    bestFor: "Chain breakdowns, renovation projects, downsizers in transition.",
    highlights: [
      "Clean, dry, monitored facility",
      "Door-to-door collection & re-delivery",
      "Charged by cubic metre",
      "Inventoried on entry",
      "Insurance available",
      "Card-only billing, weekly",
    ],
    paragraphs: [
      "Sometimes the new keys aren't ready when the old ones leave. Rather than juggling two moves and a friend's spare room, let us collect everything in one trip and store it until the chain settles.",
      "We charge by the cubic metre, weekly, with no minimum term. When you're ready, we deliver the same items back — to the same standard.",
      "Available across our Central Belt coverage. Highlands and South West on request.",
    ],
  },
  {
    slug: "ikea-collection",
    title: "IKEA Collection & Delivery",
    short: "Big box, small car, problem solved.",
    hero: "We collect from IKEA Glasgow or Edinburgh and deliver to your door — flat-pack assembled if you ask.",
    fromPrice: "£55",
    duration: "2–3 hours",
    bestFor: "New flat fit-outs, kitchen refits, kids' bedrooms, home office builds.",
    highlights: [
      "Same-day & next-day slots",
      "Card to retailer at pickup",
      "Optional flat-pack assembly",
      "Photo proof of pickup",
      "Tail-lift for big units",
      "Recycle the packaging on request",
    ],
    paragraphs: [
      "IKEA's delivery prices are fair until you check out — then they aren't. We'll collect your KALLAX, MALM, and PAX, fit them in a properly-sized van, and deliver to the room of your choice.",
      "Add the assembly service and your wardrobe will be standing, doors aligned, when we leave. We'll even take the cardboard for recycling.",
      "Same-day available if you're at the store before 11am.",
    ],
  },
  {
    slug: "same-day-delivery",
    title: "Same-Day Delivery",
    short: "Booked by lunch. Delivered by dinner.",
    hero: "Urgent point-to-point delivery across the Central Belt with live tracking and photo proof.",
    fromPrice: "£65",
    duration: "Within 4 hours",
    bestFor: "Forgotten essentials, last-minute gifts, marketplace pickups, urgent business kit.",
    highlights: [
      "4-hour SLA in Glasgow & Edinburgh",
      "Live driver tracking",
      "Photo proof at both ends",
      "Signature on request",
      "Insured up to £5,000",
      "Card payment online",
    ],
    paragraphs: [
      "Some deliveries can't wait three days. Book by midday inside the Central Belt and we'll have it across town before tea.",
      "Live tracking from collection to drop-off. Photo proof at both ends. Signature capture if it's needed.",
      "Outside the M8 corridor? Available with a longer SLA — message us and we'll call back inside ten minutes.",
    ],
  },
];

export function getService(slug: string): ServiceItem | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
