/**
 * UK Service Areas Data
 * 
 * Comprehensive list of UK cities and regions served by Speedy Van
 * Used for generating area-specific landing pages and SEO optimization
 */

export interface ServiceArea {
  name: string;
  slug: string;
  region: string;
  population: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  keywords: string[];
  nearbyAreas: string[];
}

export const UK_REGIONS = {
  england: 'England',
  scotland: 'Scotland',
  wales: 'Wales',
  northernIreland: 'Northern Ireland',
};

export const MAJOR_CITIES: ServiceArea[] = [
  // England
  {
    name: 'London',
    slug: 'london',
    region: 'England',
    population: 9000000,
    coordinates: { lat: 51.5074, lng: -0.1278 },
    description: 'Professional moving and delivery services across all London boroughs including Westminster, Camden, Islington, Hackney, Tower Hamlets, and more.',
    keywords: ['man and van london', 'removals london', 'furniture delivery london', 'house moving london'],
    nearbyAreas: ['Croydon', 'Bromley', 'Barnet', 'Ealing', 'Wandsworth'],
  },
  {
    name: 'Manchester',
    slug: 'manchester',
    region: 'England',
    population: 550000,
    coordinates: { lat: 53.4808, lng: -2.2426 },
    description: 'Fast and reliable moving services throughout Manchester and Greater Manchester including Salford, Trafford, Stockport, and surrounding areas.',
    keywords: ['man and van manchester', 'removals manchester', 'furniture delivery manchester', 'moving service manchester'],
    nearbyAreas: ['Salford', 'Stockport', 'Bolton', 'Oldham', 'Rochdale'],
  },
  {
    name: 'Birmingham',
    slug: 'birmingham',
    region: 'England',
    population: 1100000,
    coordinates: { lat: 52.4862, lng: -1.8904 },
    description: 'Comprehensive moving and delivery services across Birmingham and the West Midlands, covering all areas from city centre to suburbs.',
    keywords: ['man and van birmingham', 'removals birmingham', 'furniture delivery birmingham', 'house moving birmingham'],
    nearbyAreas: ['Solihull', 'Wolverhampton', 'Coventry', 'Dudley', 'Walsall'],
  },
  {
    name: 'Leeds',
    slug: 'leeds',
    region: 'England',
    population: 800000,
    coordinates: { lat: 53.8008, lng: -1.5491 },
    description: 'Professional moving services throughout Leeds and West Yorkshire including Bradford, Wakefield, and surrounding towns.',
    keywords: ['man and van leeds', 'removals leeds', 'furniture delivery leeds', 'moving service leeds'],
    nearbyAreas: ['Bradford', 'Wakefield', 'Huddersfield', 'Halifax', 'Dewsbury'],
  },
  {
    name: 'Liverpool',
    slug: 'liverpool',
    region: 'England',
    population: 500000,
    coordinates: { lat: 53.4084, lng: -2.9916 },
    description: 'Reliable moving and delivery services across Liverpool, Merseyside, and the surrounding areas including Wirral and St Helens.',
    keywords: ['man and van liverpool', 'removals liverpool', 'furniture delivery liverpool', 'house moving liverpool'],
    nearbyAreas: ['Wirral', 'St Helens', 'Bootle', 'Birkenhead', 'Southport'],
  },
  {
    name: 'Bristol',
    slug: 'bristol',
    region: 'England',
    population: 460000,
    coordinates: { lat: 51.4545, lng: -2.5879 },
    description: 'Expert moving services throughout Bristol and the South West including Bath, Gloucester, and surrounding areas.',
    keywords: ['man and van bristol', 'removals bristol', 'furniture delivery bristol', 'moving service bristol'],
    nearbyAreas: ['Bath', 'Gloucester', 'Swindon', 'Cheltenham', 'Weston-super-Mare'],
  },
  {
    name: 'Newcastle upon Tyne',
    slug: 'newcastle',
    region: 'England',
    population: 300000,
    coordinates: { lat: 54.9783, lng: -1.6178 },
    description: 'Professional moving and delivery services across Newcastle, Gateshead, and the North East region.',
    keywords: ['man and van newcastle', 'removals newcastle', 'furniture delivery newcastle', 'house moving newcastle'],
    nearbyAreas: ['Gateshead', 'Sunderland', 'Durham', 'South Shields', 'North Shields'],
  },
  {
    name: 'Sheffield',
    slug: 'sheffield',
    region: 'England',
    population: 580000,
    coordinates: { lat: 53.3811, lng: -1.4701 },
    description: 'Comprehensive moving services throughout Sheffield and South Yorkshire including Rotherham and Doncaster.',
    keywords: ['man and van sheffield', 'removals sheffield', 'furniture delivery sheffield', 'moving service sheffield'],
    nearbyAreas: ['Rotherham', 'Doncaster', 'Barnsley', 'Chesterfield', 'Worksop'],
  },
  {
    name: 'Nottingham',
    slug: 'nottingham',
    region: 'England',
    population: 330000,
    coordinates: { lat: 52.9548, lng: -1.1581 },
    description: 'Fast and reliable moving services across Nottingham, Nottinghamshire, and surrounding areas.',
    keywords: ['man and van nottingham', 'removals nottingham', 'furniture delivery nottingham', 'house moving nottingham'],
    nearbyAreas: ['Derby', 'Leicester', 'Mansfield', 'Newark', 'Beeston'],
  },
  {
    name: 'Leicester',
    slug: 'leicester',
    region: 'England',
    population: 350000,
    coordinates: { lat: 52.6369, lng: -1.1398 },
    description: 'Professional moving and delivery services throughout Leicester and Leicestershire.',
    keywords: ['man and van leicester', 'removals leicester', 'furniture delivery leicester', 'moving service leicester'],
    nearbyAreas: ['Loughborough', 'Hinckley', 'Market Harborough', 'Melton Mowbray', 'Coalville'],
  },
  
  // Scotland
  {
    name: 'Glasgow',
    slug: 'glasgow',
    region: 'Scotland',
    population: 630000,
    coordinates: { lat: 55.8642, lng: -4.2518 },
    description: 'Expert moving services across Glasgow and Greater Glasgow including East Renfrewshire, Renfrewshire, and surrounding areas.',
    keywords: ['man and van glasgow', 'removals glasgow', 'furniture delivery glasgow', 'house moving glasgow'],
    nearbyAreas: ['Paisley', 'East Kilbride', 'Hamilton', 'Motherwell', 'Clydebank'],
  },
  {
    name: 'Edinburgh',
    slug: 'edinburgh',
    region: 'Scotland',
    population: 530000,
    coordinates: { lat: 55.9533, lng: -3.1883 },
    description: 'Professional moving and delivery services throughout Edinburgh and the Lothians including Midlothian and East Lothian.',
    keywords: ['man and van edinburgh', 'removals edinburgh', 'furniture delivery edinburgh', 'moving service edinburgh'],
    nearbyAreas: ['Leith', 'Musselburgh', 'Dalkeith', 'Livingston', 'Dunfermline'],
  },
  {
    name: 'Aberdeen',
    slug: 'aberdeen',
    region: 'Scotland',
    population: 200000,
    coordinates: { lat: 57.1497, lng: -2.0943 },
    description: 'Reliable moving services across Aberdeen, Aberdeenshire, and the North East of Scotland.',
    keywords: ['man and van aberdeen', 'removals aberdeen', 'furniture delivery aberdeen', 'house moving aberdeen'],
    nearbyAreas: ['Peterhead', 'Fraserburgh', 'Inverurie', 'Stonehaven', 'Ellon'],
  },
  {
    name: 'Dundee',
    slug: 'dundee',
    region: 'Scotland',
    population: 150000,
    coordinates: { lat: 56.4620, lng: -2.9707 },
    description: 'Comprehensive moving services throughout Dundee, Angus, and surrounding areas.',
    keywords: ['man and van dundee', 'removals dundee', 'furniture delivery dundee', 'moving service dundee'],
    nearbyAreas: ['Perth', 'Arbroath', 'Forfar', 'Montrose', 'Carnoustie'],
  },
  
  // Wales
  {
    name: 'Cardiff',
    slug: 'cardiff',
    region: 'Wales',
    population: 360000,
    coordinates: { lat: 51.4816, lng: -3.1791 },
    description: 'Professional moving and delivery services across Cardiff, Vale of Glamorgan, and South Wales.',
    keywords: ['man and van cardiff', 'removals cardiff', 'furniture delivery cardiff', 'house moving cardiff'],
    nearbyAreas: ['Newport', 'Swansea', 'Bridgend', 'Pontypridd', 'Barry'],
  },
  {
    name: 'Swansea',
    slug: 'swansea',
    region: 'Wales',
    population: 240000,
    coordinates: { lat: 51.6214, lng: -3.9436 },
    description: 'Fast and reliable moving services throughout Swansea and West Wales.',
    keywords: ['man and van swansea', 'removals swansea', 'furniture delivery swansea', 'moving service swansea'],
    nearbyAreas: ['Neath', 'Port Talbot', 'Llanelli', 'Carmarthen', 'Pembroke'],
  },
  
  // Northern Ireland
  {
    name: 'Belfast',
    slug: 'belfast',
    region: 'Northern Ireland',
    population: 340000,
    coordinates: { lat: 54.5973, lng: -5.9301 },
    description: 'Expert moving and delivery services across Belfast and Northern Ireland.',
    keywords: ['man and van belfast', 'removals belfast', 'furniture delivery belfast', 'house moving belfast'],
    nearbyAreas: ['Lisburn', 'Newtownabbey', 'Bangor', 'Carrickfergus', 'Holywood'],
  },
];

// Additional cities and towns
export const ADDITIONAL_AREAS: ServiceArea[] = [
  // England - Additional
  {
    name: 'Coventry',
    slug: 'coventry',
    region: 'England',
    population: 370000,
    coordinates: { lat: 52.4068, lng: -1.5197 },
    description: 'Professional moving services in Coventry and Warwickshire.',
    keywords: ['man and van coventry', 'removals coventry', 'furniture delivery coventry'],
    nearbyAreas: ['Warwick', 'Leamington Spa', 'Rugby', 'Nuneaton', 'Kenilworth'],
  },
  {
    name: 'Bradford',
    slug: 'bradford',
    region: 'England',
    population: 540000,
    coordinates: { lat: 53.7960, lng: -1.7594 },
    description: 'Reliable moving and delivery services across Bradford and surrounding areas.',
    keywords: ['man and van bradford', 'removals bradford', 'furniture delivery bradford'],
    nearbyAreas: ['Keighley', 'Shipley', 'Bingley', 'Ilkley', 'Baildon'],
  },
  {
    name: 'Southampton',
    slug: 'southampton',
    region: 'England',
    population: 250000,
    coordinates: { lat: 50.9097, lng: -1.4044 },
    description: 'Expert moving services throughout Southampton and Hampshire.',
    keywords: ['man and van southampton', 'removals southampton', 'furniture delivery southampton'],
    nearbyAreas: ['Portsmouth', 'Winchester', 'Eastleigh', 'Fareham', 'Romsey'],
  },
  {
    name: 'Portsmouth',
    slug: 'portsmouth',
    region: 'England',
    population: 210000,
    coordinates: { lat: 50.8198, lng: -1.0880 },
    description: 'Professional moving and delivery services in Portsmouth and surrounding areas.',
    keywords: ['man and van portsmouth', 'removals portsmouth', 'furniture delivery portsmouth'],
    nearbyAreas: ['Southsea', 'Gosport', 'Havant', 'Waterlooville', 'Fareham'],
  },
  {
    name: 'Reading',
    slug: 'reading',
    region: 'England',
    population: 160000,
    coordinates: { lat: 51.4543, lng: -0.9781 },
    description: 'Fast and reliable moving services across Reading and Berkshire.',
    keywords: ['man and van reading', 'removals reading', 'furniture delivery reading'],
    nearbyAreas: ['Wokingham', 'Bracknell', 'Maidenhead', 'Slough', 'Newbury'],
  },
  {
    name: 'Brighton',
    slug: 'brighton',
    region: 'England',
    population: 290000,
    coordinates: { lat: 50.8225, lng: -0.1372 },
    description: 'Professional moving services throughout Brighton, Hove, and East Sussex.',
    keywords: ['man and van brighton', 'removals brighton', 'furniture delivery brighton'],
    nearbyAreas: ['Hove', 'Worthing', 'Eastbourne', 'Lewes', 'Shoreham-by-Sea'],
  },
  
  // Scotland - Additional
  {
    name: 'Inverness',
    slug: 'inverness',
    region: 'Scotland',
    population: 70000,
    coordinates: { lat: 57.4778, lng: -4.2247 },
    description: 'Reliable moving services across Inverness and the Scottish Highlands.',
    keywords: ['man and van inverness', 'removals inverness', 'furniture delivery inverness'],
    nearbyAreas: ['Nairn', 'Fort William', 'Aviemore', 'Dingwall', 'Elgin'],
  },
  {
    name: 'Stirling',
    slug: 'stirling',
    region: 'Scotland',
    population: 37000,
    coordinates: { lat: 56.1165, lng: -3.9369 },
    description: 'Professional moving services in Stirling and Central Scotland.',
    keywords: ['man and van stirling', 'removals stirling', 'furniture delivery stirling'],
    nearbyAreas: ['Falkirk', 'Alloa', 'Dunblane', 'Bridge of Allan', 'Callander'],
  },
  
  // Wales - Additional
  {
    name: 'Newport',
    slug: 'newport',
    region: 'Wales',
    population: 150000,
    coordinates: { lat: 51.5842, lng: -2.9977 },
    description: 'Expert moving and delivery services across Newport and Gwent.',
    keywords: ['man and van newport', 'removals newport', 'furniture delivery newport'],
    nearbyAreas: ['Cwmbran', 'Pontypool', 'Chepstow', 'Caerleon', 'Caldicot'],
  },
  {
    name: 'Wrexham',
    slug: 'wrexham',
    region: 'Wales',
    population: 65000,
    coordinates: { lat: 53.0462, lng: -2.9930 },
    description: 'Professional moving services throughout Wrexham and North Wales.',
    keywords: ['man and van wrexham', 'removals wrexham', 'furniture delivery wrexham'],
    nearbyAreas: ['Chester', 'Mold', 'Llangollen', 'Ruthin', 'Chirk'],
  },
];

// All service areas combined
export const ALL_SERVICE_AREAS = [...MAJOR_CITIES, ...ADDITIONAL_AREAS];

// Get service area by slug
export function getServiceAreaBySlug(slug: string): ServiceArea | undefined {
  return ALL_SERVICE_AREAS.find(area => area.slug === slug);
}

// Get service areas by region
export function getServiceAreasByRegion(region: string): ServiceArea[] {
  return ALL_SERVICE_AREAS.filter(area => area.region === region);
}

// Get nearby service areas
export function getNearbyServiceAreas(slug: string): ServiceArea[] {
  const area = getServiceAreaBySlug(slug);
  if (!area) return [];
  
  return ALL_SERVICE_AREAS.filter(a => 
    area.nearbyAreas.includes(a.name)
  );
}

export default ALL_SERVICE_AREAS;

