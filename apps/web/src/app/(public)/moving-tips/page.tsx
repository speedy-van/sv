/**
 * Moving Tips Page
 * 
 * SEO-optimized page with expert moving tips and advice
 * Target keywords: "moving tips", "moving advice", "how to move house"
 */

export const metadata = {
  title: 'Expert Moving Tips & Advice | Speedy Van',
  description: 'Get expert moving tips and advice from professional movers. Learn how to pack, organize, and move efficiently. Free moving checklist included.',
  keywords: 'moving tips, moving advice, packing tips, moving house tips, relocation tips',
  openGraph: {
    title: 'Expert Moving Tips & Advice | Speedy Van',
    description: 'Professional moving tips to make your move stress-free',
    type: 'article',
  },
};

export default function MovingTipsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Expert Moving Tips & Advice
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl">
            Professional tips from experienced movers to make your relocation smooth and stress-free
          </p>
        </div>
      </section>

      {/* Quick Tips Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Quick Moving Tips</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {quickTips.map((tip, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="text-4xl mb-4">{tip.icon}</div>
                <h3 className="text-xl font-bold mb-3">{tip.title}</h3>
                <p className="text-gray-600">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Tips Sections */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-12">Complete Moving Guide</h2>

          {/* Before Moving */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center mr-4">1</span>
              Before Moving Day
            </h3>
            
            <div className="space-y-4 ml-14">
              <div className="border-l-4 border-blue-600 pl-4">
                <h4 className="font-bold mb-2">Start Early (8 Weeks Before)</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Create a moving timeline and checklist</li>
                  <li>Research and book your moving company</li>
                  <li>Start decluttering - donate or sell unwanted items</li>
                  <li>Notify your landlord if renting</li>
                  <li>Begin collecting packing materials</li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-600 pl-4">
                <h4 className="font-bold mb-2">6 Weeks Before</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Update your address with banks, utilities, and subscriptions</li>
                  <li>Arrange school transfers for children</li>
                  <li>Book time off work for moving day</li>
                  <li>Order packing supplies</li>
                  <li>Start packing non-essential items</li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-600 pl-4">
                <h4 className="font-bold mb-2">2 Weeks Before</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Confirm moving company booking</li>
                  <li>Arrange utilities connection at new home</li>
                  <li>Pack most rooms except essentials</li>
                  <li>Use up frozen food</li>
                  <li>Arrange pet care for moving day</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Packing Tips */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <span className="bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center mr-4">2</span>
              Packing Like a Pro
            </h3>
            
            <div className="space-y-4 ml-14">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Essential Packing Supplies</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Sturdy cardboard boxes (various sizes)</li>
                  <li>Bubble wrap and packing paper</li>
                  <li>Strong packing tape</li>
                  <li>Permanent markers for labeling</li>
                  <li>Furniture blankets and covers</li>
                  <li>Plastic bags for small items</li>
                </ul>
              </div>

              <div className="border-l-4 border-green-600 pl-4">
                <h4 className="font-bold mb-2">Room-by-Room Packing Strategy</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Kitchen:</strong> Pack dishes vertically, wrap fragile items individually</li>
                  <li><strong>Bedroom:</strong> Use wardrobe boxes for hanging clothes</li>
                  <li><strong>Bathroom:</strong> Seal liquids with plastic wrap under caps</li>
                  <li><strong>Living Room:</strong> Disassemble furniture, keep screws in labeled bags</li>
                  <li><strong>Office:</strong> Back up computer data, pack electronics separately</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <h4 className="font-bold mb-2">⚠️ Pro Tip: The "First Night" Box</h4>
                <p className="text-gray-700">
                  Pack a separate box with essentials you'll need immediately: toiletries, change of clothes, 
                  phone chargers, basic kitchen items, important documents, and medications. Label it clearly 
                  and load it last so it's first off the van.
                </p>
              </div>
            </div>
          </div>

          {/* Moving Day */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <span className="bg-orange-600 text-white rounded-full w-10 h-10 flex items-center justify-center mr-4">3</span>
              Moving Day
            </h3>
            
            <div className="space-y-4 ml-14">
              <div className="border-l-4 border-orange-600 pl-4">
                <h4 className="font-bold mb-2">Morning Checklist</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Do a final walkthrough of your old home</li>
                  <li>Check all cupboards, drawers, and storage spaces</li>
                  <li>Take meter readings (gas, electric, water)</li>
                  <li>Have cash ready for tipping movers</li>
                  <li>Keep important documents with you</li>
                </ul>
              </div>

              <div className="border-l-4 border-orange-600 pl-4">
                <h4 className="font-bold mb-2">During the Move</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Stay available to answer questions</li>
                  <li>Direct movers on furniture placement</li>
                  <li>Check items as they're loaded/unloaded</li>
                  <li>Keep pets and children in a safe area</li>
                  <li>Take photos of valuable items before moving</li>
                </ul>
              </div>
            </div>
          </div>

          {/* After Moving */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <span className="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center mr-4">4</span>
              Settling Into Your New Home
            </h3>
            
            <div className="space-y-4 ml-14">
              <div className="border-l-4 border-purple-600 pl-4">
                <h4 className="font-bold mb-2">First Day Priorities</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Check all utilities are working</li>
                  <li>Test smoke alarms and carbon monoxide detectors</li>
                  <li>Locate the stopcock and fuse box</li>
                  <li>Unpack essential items first</li>
                  <li>Make beds and set up bathroom</li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-600 pl-4">
                <h4 className="font-bold mb-2">First Week Tasks</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Register with local GP and dentist</li>
                  <li>Update your driving license address</li>
                  <li>Register to vote at new address</li>
                  <li>Introduce yourself to neighbors</li>
                  <li>Explore your new neighborhood</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Money-Saving Tips */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Money-Saving Moving Tips</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {moneySavingTips.map((tip, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-start">
                  <span className="text-2xl mr-4">💰</span>
                  <div>
                    <h3 className="font-bold mb-2">{tip.title}</h3>
                    <p className="text-gray-600 text-sm">{tip.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Move?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Get an instant quote and book your move in minutes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/book" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-blue-50 transition"
            >
              Get Instant Quote
            </a>
            <a 
              href="/checklist" 
              className="bg-blue-700 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-800 transition border-2 border-white"
            >
              Download Free Checklist
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

const quickTips = [
  {
    icon: '📦',
    title: 'Label Everything',
    description: 'Mark boxes with room names and contents. Use color coding for easy identification.',
  },
  {
    icon: '📸',
    title: 'Take Photos',
    description: 'Photograph electronics setup and valuable items before disconnecting.',
  },
  {
    icon: '🧹',
    title: 'Declutter First',
    description: 'Donate, sell, or discard items you no longer need before packing.',
  },
  {
    icon: '📅',
    title: 'Book Early',
    description: 'Reserve your moving date 4-8 weeks in advance for best rates.',
  },
  {
    icon: '🔌',
    title: 'Protect Electronics',
    description: 'Use original boxes if possible, or wrap well with bubble wrap.',
  },
  {
    icon: '🏠',
    title: 'Measure Doorways',
    description: 'Check that large furniture will fit through doors at new home.',
  },
];

const moneySavingTips = [
  {
    title: 'Move Mid-Week',
    description: 'Weekday moves are typically 20-30% cheaper than weekends.',
  },
  {
    title: 'Move Off-Season',
    description: 'Avoid summer months (June-August) when demand is highest.',
  },
  {
    title: 'Get Multiple Quotes',
    description: 'Compare at least 3 quotes to ensure competitive pricing.',
  },
  {
    title: 'Pack Yourself',
    description: 'Self-packing can save £200-500 on professional packing services.',
  },
  {
    title: 'Use Free Boxes',
    description: 'Ask local shops for used boxes or check online marketplaces.',
  },
  {
    title: 'Declutter Beforehand',
    description: 'Less to move means lower costs. Sell items to offset moving expenses.',
  },
];

