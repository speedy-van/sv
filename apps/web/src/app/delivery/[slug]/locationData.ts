// Location data for SEO landing pages
// Scalable template for area-to-postcode and area-specific delivery pages

export interface LocationData {
  slug: string;
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  fromArea?: string;
  toArea?: string;
  postcode?: string;
  region: string;
  serviceType: 'route' | 'area' | 'marketplace';
  popularRoutes?: string[];
  nearbyAreas?: string[];
}

// UK regions and popular delivery routes
const locationDatabase: LocationData[] = [
  // Route-based pages (Area to Area/Postcode)
  {
    slug: 'gloucestershire-to-bristol',
    title: 'Gloucestershire to Bristol Furniture Delivery',
    h1: 'Furniture Delivery: Gloucestershire to Bristol',
    description: 'Professional furniture collection in Gloucestershire and delivery to Bristol (BS postcodes). Facebook Marketplace pickup, sofas, beds, wardrobes. Same-day available.',
    keywords: ['Gloucestershire to Bristol delivery', 'furniture delivery Gloucestershire Bristol', 'Facebook Marketplace Gloucestershire', 'sofa delivery Bristol', 'BS postcode delivery'],
    fromArea: 'Gloucestershire',
    toArea: 'Bristol',
    postcode: 'BS',
    region: 'South West',
    serviceType: 'route',
    popularRoutes: ['Cheltenham to Bristol', 'Gloucester to BS1', 'Stroud to Bristol'],
    nearbyAreas: ['Somerset', 'Wiltshire', 'South Wales'],
  },
  {
    slug: 'london-to-kent',
    title: 'London to Kent Furniture Delivery',
    h1: 'Furniture Delivery: London to Kent',
    description: 'Professional furniture collection in London and delivery to Kent. Facebook Marketplace & Gumtree pickup. Sofas, beds, appliances delivered to your door.',
    keywords: ['London to Kent delivery', 'furniture delivery London Kent', 'Facebook Marketplace London', 'sofa delivery Kent', 'man and van London to Kent'],
    fromArea: 'London',
    toArea: 'Kent',
    region: 'South East',
    serviceType: 'route',
    popularRoutes: ['Central London to Canterbury', 'South London to Maidstone', 'East London to Dartford'],
    nearbyAreas: ['Surrey', 'Sussex', 'Essex'],
  },
  {
    slug: 'manchester-to-liverpool',
    title: 'Manchester to Liverpool Furniture Delivery',
    h1: 'Furniture Delivery: Manchester to Liverpool',
    description: 'Professional furniture delivery from Manchester to Liverpool. Collect from Facebook Marketplace sellers. Sofas, beds, wardrobes - same-day service available.',
    keywords: ['Manchester to Liverpool delivery', 'furniture delivery Manchester Liverpool', 'Facebook Marketplace Manchester', 'sofa delivery Liverpool', 'man and van Manchester'],
    fromArea: 'Manchester',
    toArea: 'Liverpool',
    region: 'North West',
    serviceType: 'route',
    popularRoutes: ['Manchester city to Liverpool', 'Salford to Merseyside', 'Stockport to Liverpool'],
    nearbyAreas: ['Cheshire', 'Lancashire', 'West Yorkshire'],
  },
  {
    slug: 'birmingham-to-coventry',
    title: 'Birmingham to Coventry Furniture Delivery',
    h1: 'Furniture Delivery: Birmingham to Coventry',
    description: 'Professional furniture collection in Birmingham and delivery to Coventry. Private seller collection, marketplace pickups. Fast, insured service.',
    keywords: ['Birmingham to Coventry delivery', 'furniture delivery Birmingham', 'Facebook Marketplace Birmingham', 'sofa delivery Coventry', 'man and van West Midlands'],
    fromArea: 'Birmingham',
    toArea: 'Coventry',
    region: 'West Midlands',
    serviceType: 'route',
    popularRoutes: ['Birmingham to CV postcodes', 'Solihull to Coventry', 'Sutton Coldfield to Warwick'],
    nearbyAreas: ['Wolverhampton', 'Walsall', 'Warwickshire'],
  },
  {
    slug: 'glasgow-to-edinburgh',
    title: 'Glasgow to Edinburgh Furniture Delivery',
    h1: 'Furniture Delivery: Glasgow to Edinburgh',
    description: 'Furniture collection and delivery between Glasgow and Edinburgh. Facebook Marketplace pickup, Gumtree collection. Professional 2-man team.',
    keywords: ['Glasgow to Edinburgh delivery', 'furniture delivery Scotland', 'Facebook Marketplace Glasgow', 'sofa delivery Edinburgh', 'man and van Scotland'],
    fromArea: 'Glasgow',
    toArea: 'Edinburgh',
    region: 'Scotland',
    serviceType: 'route',
    popularRoutes: ['Glasgow city to Edinburgh', 'Paisley to Leith', 'Hamilton to Edinburgh'],
    nearbyAreas: ['Stirling', 'Falkirk', 'West Lothian'],
  },
  {
    slug: 'leeds-to-sheffield',
    title: 'Leeds to Sheffield Furniture Delivery',
    h1: 'Furniture Delivery: Leeds to Sheffield',
    description: 'Professional furniture delivery from Leeds to Sheffield. Collect from private sellers. Sofas, beds, appliances - insured transport, stairs handled.',
    keywords: ['Leeds to Sheffield delivery', 'furniture delivery Yorkshire', 'Facebook Marketplace Leeds', 'sofa delivery Sheffield', 'man and van Yorkshire'],
    fromArea: 'Leeds',
    toArea: 'Sheffield',
    region: 'Yorkshire',
    serviceType: 'route',
    popularRoutes: ['Leeds city to Sheffield', 'Bradford to Sheffield', 'Wakefield to Sheffield'],
    nearbyAreas: ['Bradford', 'Doncaster', 'Barnsley'],
  },
  
  // Area-based pages (Marketplace pickup in specific area)
  {
    slug: 'facebook-marketplace-pickup-london',
    title: 'Facebook Marketplace Pickup London',
    h1: 'Facebook Marketplace Collection & Delivery London',
    description: 'Professional Facebook Marketplace pickup service in London. We collect furniture from sellers across London and deliver to your door. Same-day available.',
    keywords: ['Facebook Marketplace London', 'collect from seller London', 'furniture pickup London', 'marketplace delivery London', 'sofa collection London'],
    region: 'London',
    serviceType: 'marketplace',
    popularRoutes: ['North London collection', 'South London collection', 'East London collection', 'West London collection'],
    nearbyAreas: ['Surrey', 'Kent', 'Essex', 'Hertfordshire'],
  },
  {
    slug: 'facebook-marketplace-pickup-manchester',
    title: 'Facebook Marketplace Pickup Manchester',
    h1: 'Facebook Marketplace Collection & Delivery Manchester',
    description: 'Facebook Marketplace collection service in Greater Manchester. We collect from sellers and deliver to your home. Sofas, beds, furniture - fully insured.',
    keywords: ['Facebook Marketplace Manchester', 'collect from seller Manchester', 'furniture pickup Manchester', 'marketplace delivery Manchester'],
    region: 'Manchester',
    serviceType: 'marketplace',
    popularRoutes: ['Manchester city collection', 'Salford collection', 'Stockport collection', 'Oldham collection'],
    nearbyAreas: ['Liverpool', 'Leeds', 'Sheffield', 'Cheshire'],
  },
  {
    slug: 'facebook-marketplace-pickup-birmingham',
    title: 'Facebook Marketplace Pickup Birmingham',
    h1: 'Facebook Marketplace Collection & Delivery Birmingham',
    description: 'Professional Facebook Marketplace pickup in Birmingham and West Midlands. Collect from private sellers, deliver to your door. Same-day service.',
    keywords: ['Facebook Marketplace Birmingham', 'collect from seller Birmingham', 'furniture pickup Birmingham', 'marketplace delivery West Midlands'],
    region: 'Birmingham',
    serviceType: 'marketplace',
    popularRoutes: ['Birmingham city collection', 'Solihull collection', 'Wolverhampton collection'],
    nearbyAreas: ['Coventry', 'Leicester', 'Nottingham', 'Worcester'],
  },
  {
    slug: 'gumtree-pickup-bristol',
    title: 'Gumtree Collection Bristol',
    h1: 'Gumtree Pickup & Delivery Bristol',
    description: 'Gumtree collection service in Bristol and surrounding areas. We collect from sellers and deliver furniture to your home. Professional 2-man team.',
    keywords: ['Gumtree Bristol', 'collect from seller Bristol', 'furniture pickup Bristol', 'Gumtree delivery Bristol'],
    region: 'Bristol',
    serviceType: 'marketplace',
    popularRoutes: ['Bristol city collection', 'Clifton collection', 'BS postcodes'],
    nearbyAreas: ['Bath', 'Gloucestershire', 'Somerset', 'South Wales'],
  },
  
  // Additional route combinations
  {
    slug: 'london-to-brighton',
    title: 'London to Brighton Furniture Delivery',
    h1: 'Furniture Delivery: London to Brighton',
    description: 'Professional furniture delivery from London to Brighton. Facebook Marketplace collection, sofa delivery, bed transport. Fully insured, same-day available.',
    keywords: ['London to Brighton delivery', 'furniture delivery Brighton', 'Facebook Marketplace Brighton', 'sofa delivery Sussex'],
    fromArea: 'London',
    toArea: 'Brighton',
    region: 'South East',
    serviceType: 'route',
    popularRoutes: ['South London to Brighton', 'Central London to Hove', 'Croydon to Brighton'],
    nearbyAreas: ['Sussex', 'Surrey', 'Hampshire'],
  },
  {
    slug: 'london-to-oxford',
    title: 'London to Oxford Furniture Delivery',
    h1: 'Furniture Delivery: London to Oxford',
    description: 'Furniture collection in London and delivery to Oxford. Private seller pickup, marketplace collection. Professional service, stairs handled.',
    keywords: ['London to Oxford delivery', 'furniture delivery Oxford', 'Facebook Marketplace Oxford', 'man and van Oxford'],
    fromArea: 'London',
    toArea: 'Oxford',
    region: 'South East',
    serviceType: 'route',
    popularRoutes: ['West London to Oxford', 'Central London to OX postcodes'],
    nearbyAreas: ['Buckinghamshire', 'Berkshire', 'Northamptonshire'],
  },
  {
    slug: 'cardiff-to-bristol',
    title: 'Cardiff to Bristol Furniture Delivery',
    h1: 'Furniture Delivery: Cardiff to Bristol',
    description: 'Professional furniture delivery from Cardiff to Bristol. Cross-border service, marketplace collection, sofa and bed delivery. Fully insured.',
    keywords: ['Cardiff to Bristol delivery', 'furniture delivery Wales', 'Facebook Marketplace Cardiff', 'sofa delivery Cardiff Bristol'],
    fromArea: 'Cardiff',
    toArea: 'Bristol',
    region: 'Wales / South West',
    serviceType: 'route',
    popularRoutes: ['Cardiff to BS postcodes', 'Newport to Bristol', 'South Wales to Bristol'],
    nearbyAreas: ['Newport', 'Swansea', 'Gloucester'],
  },
];

export function getLocationData(slug: string): LocationData | undefined {
  return locationDatabase.find((loc) => loc.slug === slug);
}

export function getAllLocationSlugs(): string[] {
  return locationDatabase.map((loc) => loc.slug);
}

export function getLocationsByRegion(region: string): LocationData[] {
  return locationDatabase.filter((loc) => loc.region === region);
}

export function getLocationsByServiceType(serviceType: LocationData['serviceType']): LocationData[] {
  return locationDatabase.filter((loc) => loc.serviceType === serviceType);
}

export function getAllLocations(): LocationData[] {
  return locationDatabase;
}
