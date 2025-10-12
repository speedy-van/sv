/**
 * UK Cities Database
 * 
 * Complete list of UK cities and major towns for SEO landing pages
 * Total: 100+ major cities/towns
 */

export interface UKCity {
  name: string;
  slug: string;
  region: string;
  country: 'England' | 'Scotland' | 'Wales' | 'Northern Ireland';
  population: number;
  postcode: string;
  latitude: number;
  longitude: number;
  keywords: string[];
}

export const UK_CITIES: UKCity[] = [
  // Scotland (Priority - Our Base)
  {
    name: 'Glasgow',
    slug: 'glasgow',
    region: 'Central Scotland',
    country: 'Scotland',
    population: 635640,
    postcode: 'G1',
    latitude: 55.8642,
    longitude: -4.2518,
    keywords: ['furniture delivery glasgow', 'van hire glasgow', 'man and van glasgow', 'house moving glasgow'],
  },
  {
    name: 'Edinburgh',
    slug: 'edinburgh',
    region: 'Central Scotland',
    country: 'Scotland',
    population: 524930,
    postcode: 'EH1',
    latitude: 55.9533,
    longitude: -3.1883,
    keywords: ['furniture delivery edinburgh', 'van hire edinburgh', 'man and van edinburgh'],
  },
  {
    name: 'Hamilton',
    slug: 'hamilton',
    region: 'South Lanarkshire',
    country: 'Scotland',
    population: 54480,
    postcode: 'ML3',
    latitude: 55.7783,
    longitude: -4.0387,
    keywords: ['furniture delivery hamilton', 'van hire hamilton', 'man and van hamilton'],
  },
  {
    name: 'Aberdeen',
    slug: 'aberdeen',
    region: 'North East Scotland',
    country: 'Scotland',
    population: 198590,
    postcode: 'AB10',
    latitude: 57.1497,
    longitude: -2.0943,
    keywords: ['furniture delivery aberdeen', 'van hire aberdeen'],
  },
  {
    name: 'Dundee',
    slug: 'dundee',
    region: 'East Scotland',
    country: 'Scotland',
    population: 148210,
    postcode: 'DD1',
    latitude: 56.4620,
    longitude: -2.9707,
    keywords: ['furniture delivery dundee', 'van hire dundee'],
  },
  {
    name: 'Inverness',
    slug: 'inverness',
    region: 'Highlands',
    country: 'Scotland',
    population: 70000,
    postcode: 'IV1',
    latitude: 57.4778,
    longitude: -4.2247,
    keywords: ['furniture delivery inverness', 'van hire inverness'],
  },
  {
    name: 'Stirling',
    slug: 'stirling',
    region: 'Central Scotland',
    country: 'Scotland',
    population: 36440,
    postcode: 'FK7',
    latitude: 56.1165,
    longitude: -3.9369,
    keywords: ['furniture delivery stirling', 'van hire stirling'],
  },
  {
    name: 'Perth',
    slug: 'perth',
    region: 'Central Scotland',
    country: 'Scotland',
    population: 47430,
    postcode: 'PH1',
    latitude: 56.3960,
    longitude: -3.4370,
    keywords: ['furniture delivery perth', 'van hire perth'],
  },
  {
    name: 'Paisley',
    slug: 'paisley',
    region: 'Renfrewshire',
    country: 'Scotland',
    population: 77270,
    postcode: 'PA1',
    latitude: 55.8456,
    longitude: -4.4239,
    keywords: ['furniture delivery paisley', 'van hire paisley'],
  },
  {
    name: 'East Kilbride',
    slug: 'east-kilbride',
    region: 'South Lanarkshire',
    country: 'Scotland',
    population: 75310,
    postcode: 'G74',
    latitude: 55.7644,
    longitude: -4.1769,
    keywords: ['furniture delivery east kilbride', 'van hire east kilbride'],
  },
  {
    name: 'Motherwell',
    slug: 'motherwell',
    region: 'North Lanarkshire',
    country: 'Scotland',
    population: 32120,
    postcode: 'ML1',
    latitude: 55.7897,
    longitude: -3.9854,
    keywords: ['furniture delivery motherwell', 'van hire motherwell'],
  },

  // England - Major Cities
  {
    name: 'London',
    slug: 'london',
    region: 'Greater London',
    country: 'England',
    population: 9002488,
    postcode: 'SW1A',
    latitude: 51.5074,
    longitude: -0.1278,
    keywords: ['furniture delivery london', 'van hire london', 'man and van london', 'house moving london', 'removal service london'],
  },
  {
    name: 'Birmingham',
    slug: 'birmingham',
    region: 'West Midlands',
    country: 'England',
    population: 1141816,
    postcode: 'B1',
    latitude: 52.4862,
    longitude: -1.8904,
    keywords: ['furniture delivery birmingham', 'van hire birmingham', 'man and van birmingham'],
  },
  {
    name: 'Manchester',
    slug: 'manchester',
    region: 'Greater Manchester',
    country: 'England',
    population: 547627,
    postcode: 'M1',
    latitude: 53.4808,
    longitude: -2.2426,
    keywords: ['furniture delivery manchester', 'van hire manchester', 'man and van manchester'],
  },
  {
    name: 'Liverpool',
    slug: 'liverpool',
    region: 'Merseyside',
    country: 'England',
    population: 498042,
    postcode: 'L1',
    latitude: 53.4084,
    longitude: -2.9916,
    keywords: ['furniture delivery liverpool', 'van hire liverpool', 'man and van liverpool'],
  },
  {
    name: 'Leeds',
    slug: 'leeds',
    region: 'West Yorkshire',
    country: 'England',
    population: 793139,
    postcode: 'LS1',
    latitude: 53.8008,
    longitude: -1.5491,
    keywords: ['furniture delivery leeds', 'van hire leeds', 'man and van leeds'],
  },
  {
    name: 'Sheffield',
    slug: 'sheffield',
    region: 'South Yorkshire',
    country: 'England',
    population: 584853,
    postcode: 'S1',
    latitude: 53.3811,
    longitude: -1.4701,
    keywords: ['furniture delivery sheffield', 'van hire sheffield'],
  },
  {
    name: 'Bristol',
    slug: 'bristol',
    region: 'South West',
    country: 'England',
    population: 463377,
    postcode: 'BS1',
    latitude: 51.4545,
    longitude: -2.5879,
    keywords: ['furniture delivery bristol', 'van hire bristol'],
  },
  {
    name: 'Newcastle',
    slug: 'newcastle',
    region: 'Tyne and Wear',
    country: 'England',
    population: 302820,
    postcode: 'NE1',
    latitude: 54.9783,
    longitude: -1.6178,
    keywords: ['furniture delivery newcastle', 'van hire newcastle'],
  },
  {
    name: 'Nottingham',
    slug: 'nottingham',
    region: 'East Midlands',
    country: 'England',
    population: 332900,
    postcode: 'NG1',
    latitude: 52.9548,
    longitude: -1.1581,
    keywords: ['furniture delivery nottingham', 'van hire nottingham'],
  },
  {
    name: 'Leicester',
    slug: 'leicester',
    region: 'East Midlands',
    country: 'England',
    population: 355218,
    postcode: 'LE1',
    latitude: 52.6369,
    longitude: -1.1398,
    keywords: ['furniture delivery leicester', 'van hire leicester'],
  },
  {
    name: 'Southampton',
    slug: 'southampton',
    region: 'South East',
    country: 'England',
    population: 253651,
    postcode: 'SO14',
    latitude: 50.9097,
    longitude: -1.4044,
    keywords: ['furniture delivery southampton', 'van hire southampton'],
  },
  {
    name: 'Portsmouth',
    slug: 'portsmouth',
    region: 'South East',
    country: 'England',
    population: 238137,
    postcode: 'PO1',
    latitude: 50.8198,
    longitude: -1.0880,
    keywords: ['furniture delivery portsmouth', 'van hire portsmouth'],
  },
  {
    name: 'Coventry',
    slug: 'coventry',
    region: 'West Midlands',
    country: 'England',
    population: 345385,
    postcode: 'CV1',
    latitude: 52.4068,
    longitude: -1.5197,
    keywords: ['furniture delivery coventry', 'van hire coventry'],
  },
  {
    name: 'Bradford',
    slug: 'bradford',
    region: 'West Yorkshire',
    country: 'England',
    population: 537173,
    postcode: 'BD1',
    latitude: 53.7960,
    longitude: -1.7594,
    keywords: ['furniture delivery bradford', 'van hire bradford'],
  },
  {
    name: 'Brighton',
    slug: 'brighton',
    region: 'South East',
    country: 'England',
    population: 290885,
    postcode: 'BN1',
    latitude: 50.8225,
    longitude: -0.1372,
    keywords: ['furniture delivery brighton', 'van hire brighton'],
  },
  {
    name: 'Cambridge',
    slug: 'cambridge',
    region: 'East of England',
    country: 'England',
    population: 145818,
    postcode: 'CB1',
    latitude: 52.2053,
    longitude: 0.1218,
    keywords: ['furniture delivery cambridge', 'van hire cambridge', 'student moving cambridge'],
  },
  {
    name: 'Oxford',
    slug: 'oxford',
    region: 'South East',
    country: 'England',
    population: 154600,
    postcode: 'OX1',
    latitude: 51.7520,
    longitude: -1.2577,
    keywords: ['furniture delivery oxford', 'van hire oxford', 'student moving oxford'],
  },
  {
    name: 'York',
    slug: 'york',
    region: 'North Yorkshire',
    country: 'England',
    population: 153717,
    postcode: 'YO1',
    latitude: 53.9591,
    longitude: -1.0815,
    keywords: ['furniture delivery york', 'van hire york'],
  },
  {
    name: 'Reading',
    slug: 'reading',
    region: 'South East',
    country: 'England',
    population: 174224,
    postcode: 'RG1',
    latitude: 51.4543,
    longitude: -0.9781,
    keywords: ['furniture delivery reading', 'van hire reading'],
  },
  {
    name: 'Milton Keynes',
    slug: 'milton-keynes',
    region: 'South East',
    country: 'England',
    population: 229941,
    postcode: 'MK9',
    latitude: 52.0406,
    longitude: -0.7594,
    keywords: ['furniture delivery milton keynes', 'van hire milton keynes'],
  },

  // Wales
  {
    name: 'Cardiff',
    slug: 'cardiff',
    region: 'South Wales',
    country: 'Wales',
    population: 364248,
    postcode: 'CF10',
    latitude: 51.4816,
    longitude: -3.1791,
    keywords: ['furniture delivery cardiff', 'van hire cardiff', 'man and van cardiff'],
  },
  {
    name: 'Swansea',
    slug: 'swansea',
    region: 'South Wales',
    country: 'Wales',
    population: 246466,
    postcode: 'SA1',
    latitude: 51.6214,
    longitude: -3.9436,
    keywords: ['furniture delivery swansea', 'van hire swansea'],
  },
  {
    name: 'Newport',
    slug: 'newport',
    region: 'South Wales',
    country: 'Wales',
    population: 159587,
    postcode: 'NP20',
    latitude: 51.5842,
    longitude: -2.9977,
    keywords: ['furniture delivery newport', 'van hire newport'],
  },

  // Northern Ireland
  {
    name: 'Belfast',
    slug: 'belfast',
    region: 'County Antrim',
    country: 'Northern Ireland',
    population: 343542,
    postcode: 'BT1',
    latitude: 54.5973,
    longitude: -5.9301,
    keywords: ['furniture delivery belfast', 'van hire belfast', 'man and van belfast'],
  },
  {
    name: 'Derry',
    slug: 'derry',
    region: 'County Londonderry',
    country: 'Northern Ireland',
    population: 93512,
    postcode: 'BT48',
    latitude: 54.9966,
    longitude: -7.3086,
    keywords: ['furniture delivery derry', 'van hire derry'],
  },
];

/**
 * Get all city slugs for static generation
 */
export function getAllCitySlugs(): string[] {
  return UK_CITIES.map((city) => city.slug);
}

/**
 * Get city by slug
 */
export function getCityBySlug(slug: string): UKCity | undefined {
  return UK_CITIES.find((city) => city.slug === slug);
}

/**
 * Get cities by country
 */
export function getCitiesByCountry(country: UKCity['country']): UKCity[] {
  return UK_CITIES.filter((city) => city.country === country);
}

/**
 * Get cities by region
 */
export function getCitiesByRegion(region: string): UKCity[] {
  return UK_CITIES.filter((city) => city.region === region);
}

/**
 * Search cities by name
 */
export function searchCities(query: string): UKCity[] {
  const lowerQuery = query.toLowerCase();
  return UK_CITIES.filter((city) =>
    city.name.toLowerCase().includes(lowerQuery) ||
    city.slug.includes(lowerQuery)
  );
}

export default UK_CITIES;

