import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface CityData {
  name: string;
  slug: string;
  postcode: string;
  region: string;
}

// Hardcoded cities array for static generation
const allCities: CityData[] = [
  // England
  {"name": "London", "slug": "london", "postcode": "SW1A", "region": "Greater London"},
  {"name": "Birmingham", "slug": "birmingham", "postcode": "B1", "region": "West Midlands"},
  {"name": "Manchester", "slug": "manchester", "postcode": "M1", "region": "Greater Manchester"},
  {"name": "Liverpool", "slug": "liverpool", "postcode": "L1", "region": "Merseyside"},
  {"name": "Leeds", "slug": "leeds", "postcode": "LS1", "region": "West Yorkshire"},
  {"name": "Sheffield", "slug": "sheffield", "postcode": "S1", "region": "South Yorkshire"},
  {"name": "Bristol", "slug": "bristol", "postcode": "BS1", "region": "South West"},
  {"name": "Newcastle", "slug": "newcastle", "postcode": "NE1", "region": "Tyne and Wear"},
  {"name": "Nottingham", "slug": "nottingham", "postcode": "NG1", "region": "Nottinghamshire"},
  {"name": "Leicester", "slug": "leicester", "postcode": "LE1", "region": "Leicestershire"},
  {"name": "Coventry", "slug": "coventry", "postcode": "CV1", "region": "West Midlands"},
  {"name": "Bradford", "slug": "bradford", "postcode": "BD1", "region": "West Yorkshire"},
  {"name": "Southampton", "slug": "southampton", "postcode": "SO14", "region": "Hampshire"},
  {"name": "Portsmouth", "slug": "portsmouth", "postcode": "PO1", "region": "Hampshire"},
  {"name": "Reading", "slug": "reading", "postcode": "RG1", "region": "Berkshire"},
  {"name": "Derby", "slug": "derby", "postcode": "DE1", "region": "Derbyshire"},
  {"name": "Plymouth", "slug": "plymouth", "postcode": "PL1", "region": "Devon"},
  {"name": "Luton", "slug": "luton", "postcode": "LU1", "region": "Bedfordshire"},
  {"name": "Wolverhampton", "slug": "wolverhampton", "postcode": "WV1", "region": "West Midlands"},
  {"name": "Stoke-on-Trent", "slug": "stoke-on-trent", "postcode": "ST1", "region": "Staffordshire"},
  {"name": "Brighton", "slug": "brighton", "postcode": "BN1", "region": "East Sussex"},
  {"name": "Hull", "slug": "hull", "postcode": "HU1", "region": "East Yorkshire"},
  {"name": "York", "slug": "york", "postcode": "YO1", "region": "North Yorkshire"},
  {"name": "Peterborough", "slug": "peterborough", "postcode": "PE1", "region": "Cambridgeshire"},
  {"name": "Cambridge", "slug": "cambridge", "postcode": "CB1", "region": "Cambridgeshire"},
  {"name": "Oxford", "slug": "oxford", "postcode": "OX1", "region": "Oxfordshire"},
  {"name": "Bournemouth", "slug": "bournemouth", "postcode": "BH1", "region": "Dorset"},
  {"name": "Swindon", "slug": "swindon", "postcode": "SN1", "region": "Wiltshire"},
  {"name": "Ipswich", "slug": "ipswich", "postcode": "IP1", "region": "Suffolk"},
  {"name": "Norwich", "slug": "norwich", "postcode": "NR1", "region": "Norfolk"},
  {"name": "Exeter", "slug": "exeter", "postcode": "EX1", "region": "Devon"},
  {"name": "Cheltenham", "slug": "cheltenham", "postcode": "GL50", "region": "Gloucestershire"},
  {"name": "Gloucester", "slug": "gloucester", "postcode": "GL1", "region": "Gloucestershire"},
  {"name": "Bath", "slug": "bath", "postcode": "BA1", "region": "Somerset"},
  {"name": "Chester", "slug": "chester", "postcode": "CH1", "region": "Cheshire"},
  {"name": "Lancaster", "slug": "lancaster", "postcode": "LA1", "region": "Lancashire"},
  {"name": "Durham", "slug": "durham", "postcode": "DH1", "region": "County Durham"},
  {"name": "Sunderland", "slug": "sunderland", "postcode": "SR1", "region": "Tyne and Wear"},
  {"name": "Middlesbrough", "slug": "middlesbrough", "postcode": "TS1", "region": "North Yorkshire"},
  {"name": "Blackpool", "slug": "blackpool", "postcode": "FY1", "region": "Lancashire"},
  // Scotland
  {"name": "Glasgow", "slug": "glasgow", "postcode": "G1", "region": "Glasgow City"},
  {"name": "Edinburgh", "slug": "edinburgh", "postcode": "EH1", "region": "City of Edinburgh"},
  {"name": "Aberdeen", "slug": "aberdeen", "postcode": "AB10", "region": "Aberdeenshire"},
  {"name": "Dundee", "slug": "dundee", "postcode": "DD1", "region": "Dundee City"},
  {"name": "Inverness", "slug": "inverness", "postcode": "IV1", "region": "Highland"},
  {"name": "Stirling", "slug": "stirling", "postcode": "FK8", "region": "Stirling"},
  {"name": "Perth", "slug": "perth", "postcode": "PH1", "region": "Perth and Kinross"},
  {"name": "Paisley", "slug": "paisley", "postcode": "PA1", "region": "Renfrewshire"},
  {"name": "Hamilton", "slug": "hamilton", "postcode": "ML3", "region": "South Lanarkshire"},
  {"name": "Livingston", "slug": "livingston", "postcode": "EH54", "region": "West Lothian"},
  // Wales
  {"name": "Cardiff", "slug": "cardiff", "postcode": "CF10", "region": "Cardiff"},
  {"name": "Swansea", "slug": "swansea", "postcode": "SA1", "region": "Swansea"},
  {"name": "Newport", "slug": "newport", "postcode": "NP20", "region": "Newport"},
  {"name": "Wrexham", "slug": "wrexham", "postcode": "LL11", "region": "Wrexham"},
  {"name": "Barry", "slug": "barry", "postcode": "CF62", "region": "Vale of Glamorgan"}
];

// Force static generation for all cities
export const dynamicParams = false;

// Generate static params for all cities
export async function generateStaticParams() {
  return allCities.map((city) => ({
    city: city.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = allCities.find((c) => c.slug === citySlug);
  
  if (!city) {
    return {
      title: 'City Not Found',
    };
  }

  return {
    title: `Man and Van ${city.name} | From £25/hour | Same Day Service`,
    description: `Professional man and van service in ${city.name}, ${city.region}. Affordable house removals, furniture delivery & moving services. Fully insured drivers. Book online 24/7 or call 01202 129746.`,
    keywords: `man and van ${city.name.toLowerCase()}, man with van ${city.name.toLowerCase()}, ${city.name.toLowerCase()} removals, furniture delivery ${city.name.toLowerCase()}, house moving ${city.name.toLowerCase()}, cheap man and van ${city.name.toLowerCase()}`,
    openGraph: {
      title: `Man and Van ${city.name} | Professional Moving Services`,
      description: `Affordable man and van service in ${city.name}. Same day service from £25/hour. Fully insured & 5-star rated.`,
      type: 'website',
    },
  };
}

export default async function CityLandingPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: citySlug } = await params;
  const city = allCities.find((c) => c.slug === citySlug);

  if (!city) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Man and Van {city.name}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-cyan-50">
              Professional Moving Services in {city.name}, {city.region}
            </p>
            <p className="text-lg mb-8">
              Same day service from £25/hour • Fully insured • 5-star rated • Available 24/7
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/booking-luxury"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Book Online Now
              </Link>
              <a
                href="tel:01202129746"
                className="bg-cyan-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-cyan-700 transition-colors border-2 border-white"
              >
                Call 01202 129746
              </a>
            </div>
            <p className="mt-4 text-sm text-cyan-100">
              📞 Phone Support: 9AM-6PM, 7 Days • 💻 Online Booking: 24/7
            </p>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span className="font-semibold">Fully Insured</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="font-semibold">5-Star Rated</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚚</span>
              <span className="font-semibold">Same Day Service</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💷</span>
              <span className="font-semibold">From £25/hour</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Our Services in {city.name}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-xl font-semibold mb-2">House Removals</h3>
              <p className="text-gray-600">
                Full house moving service in {city.name}. Professional packing and careful handling of all your belongings.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🪑</div>
              <h3 className="text-xl font-semibold mb-2">Furniture Delivery</h3>
              <p className="text-gray-600">
                Safe furniture transport across {city.name} and {city.region}. Sofas, beds, tables delivered with care.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-semibold mb-2">Student Moves</h3>
              <p className="text-gray-600">
                Affordable student moving in {city.name}. Special student discounts available.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold mb-2">Office Relocation</h3>
              <p className="text-gray-600">
                Business moving services in {city.name}. Minimal downtime, professional handling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Area */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            Coverage Area
          </h2>
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-lg mb-4">
              We serve all areas in and around {city.name}, including:
            </p>
            <p className="text-gray-600">
              {city.postcode} postcode area, {city.region}, and surrounding neighborhoods
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Speedy Van in {city.name}?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Fast Response</h3>
              <p className="text-gray-600">
                Same day service available in {city.name}. Book online 24/7 or call us during business hours.
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Affordable Prices</h3>
              <p className="text-gray-600">
                Competitive rates from £25/hour. No hidden fees. Transparent pricing for {city.name} residents.
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">👨‍💼</div>
              <h3 className="text-xl font-semibold mb-2">Professional Team</h3>
              <p className="text-gray-600">
                Experienced, fully insured drivers. Trusted by thousands of customers in {city.name}.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Move in {city.name}?
          </h2>
          <p className="text-xl mb-8">
            Get your instant quote now and book your man and van service
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/booking-luxury"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Book Online 24/7
            </Link>
            <a
              href="tel:01202129746"
              className="bg-cyan-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-cyan-700 transition-colors border-2 border-white"
            >
              Call 01202 129746
            </a>
          </div>
          <p className="mt-4 text-cyan-100">
            Phone Support: 9AM-6PM, 7 Days a Week
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions - {city.name}
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">
                How much does a man and van cost in {city.name}?
              </h3>
              <p className="text-gray-600">
                Our man and van service in {city.name} starts from £25/hour. The final cost depends on the distance, amount of items, and any additional services required.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">
                Do you offer same day service in {city.name}?
              </h3>
              <p className="text-gray-600">
                Yes! We offer same day man and van service in {city.name} subject to availability. Book online 24/7 or call us at 01202 129746 (9AM-6PM, 7 days).
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">
                Are you fully insured?
              </h3>
              <p className="text-gray-600">
                Yes, all our drivers and vehicles are fully insured. Your belongings are protected throughout the move in {city.name}.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">
                What areas do you cover in {city.name}?
              </h3>
              <p className="text-gray-600">
                We cover all areas in {city.name}, {city.region}, including the {city.postcode} postcode area and surrounding neighborhoods.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
