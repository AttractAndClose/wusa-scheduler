// scripts/process-csv.js
const fs = require('fs');
const path = require('path');

// Color palette for map visualization
const COLORS = [
  '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#F43F5E', '#A855F7', '#3B82F6', '#22C55E'
];

// Generate fake phone number based on state
function generatePhoneNumber(state) {
  const areaCodes = {
    'GA': '404', 'TX': '214', 'AR': '501', 'AL': '205', 'MS': '601',
    'TN': '615', 'LA': '225', 'NC': '704', 'SC': '843', 'OK': '405',
    'MO': '314', 'IL': '618', 'NJ': '856'
  };
  const areaCode = areaCodes[state] || '555';
  const exchange = Math.floor(Math.random() * 800) + 200;
  const number = Math.floor(Math.random() * 10000);
  return `${areaCode}-${exchange}-${String(number).padStart(4, '0')}`;
}

// Generate email from name
function generateEmail(firstName, lastName) {
  const first = firstName.toLowerCase();
  const last = lastName.toLowerCase();
  return `${first}.${last}@company.com`;
}

// Simple geocoding using city name lookup
// For MVP, we'll use approximate coordinates based on city name
// This avoids API rate limits and works offline
function approximateGeocode(zip, city, state) {
  // City-specific coordinates (major cities)
  const cityCoordinates = {
    // Texas cities
    'Houston': { lat: 29.7604, lng: -95.3698 },
    'San Antonio': { lat: 29.4241, lng: -98.4936 },
    'Dallas': { lat: 32.7767, lng: -96.7970 },
    'Fort Worth': { lat: 32.7555, lng: -97.3308 },
    'Austin': { lat: 30.2672, lng: -97.7431 },
    'McKinney': { lat: 33.1972, lng: -96.6397 },
    'Coppell': { lat: 32.9546, lng: -97.0150 },
    'Spring': { lat: 30.0799, lng: -95.4172 },
    'Conroe': { lat: 30.3119, lng: -95.4561 },
    'Richmond': { lat: 29.5820, lng: -95.7607 },
    'Greenville': { lat: 33.1384, lng: -96.1108 },
    'Tyler': { lat: 32.3513, lng: -95.3011 },
    'Anna': { lat: 33.3490, lng: -96.5486 },
    'Tom Bean': { lat: 33.5194, lng: -96.4850 },
    
    // Louisiana cities
    'Shreveport': { lat: 32.5252, lng: -93.7502 },
    'Baton Rouge': { lat: 30.4515, lng: -91.1871 },
    'Benton': { lat: 32.6949, lng: -93.7418 },
    'Greenwood': { lat: 32.4427, lng: -93.9727 },
    'Lafayette': { lat: 30.2241, lng: -92.0198 },
    'Covington': { lat: 30.4755, lng: -90.1009 },
    
    // Tennessee cities
    'Memphis': { lat: 35.1495, lng: -90.0490 },
    'Nashville': { lat: 36.1627, lng: -86.7816 },
    'Bartlett': { lat: 35.2045, lng: -89.8740 },
    'Atoka': { lat: 35.4412, lng: -89.7781 },
    'Olive Branch': { lat: 34.9618, lng: -89.8295 },
    'Collierville': { lat: 35.0420, lng: -89.6645 },
    'Knoxville': { lat: 35.9606, lng: -83.9207 },
    'Chattanooga': { lat: 35.0456, lng: -85.3097 },
    'Jackson': { lat: 35.6145, lng: -88.8139 },
    'Millington': { lat: 35.3415, lng: -89.8970 },
    'Lebanon': { lat: 36.2081, lng: -86.2911 },
    'Sequatchie': { lat: 35.1501, lng: -85.6258 },
    
    // Mississippi cities
    'Horn Lake': { lat: 34.9554, lng: -90.0348 },
    'Brandon': { lat: 32.2732, lng: -89.9859 },
    'Raymond': { lat: 32.2593, lng: -90.4226 },
    'Southaven': { lat: 34.9910, lng: -90.0026 },
    'Pearl': { lat: 32.2746, lng: -90.1320 },
    'Greenville': { lat: 33.4101, lng: -91.0617 },
    'Carriere': { lat: 30.6169, lng: -89.6526 },
    'Columbus': { lat: 33.4950, lng: -88.4274 },
    
    // Georgia cities
    'Atlanta': { lat: 33.7490, lng: -84.3880 },
    'Kennesaw': { lat: 34.0234, lng: -84.6155 },
    'Douglasville': { lat: 33.7515, lng: -84.7477 },
    'Fayetteville': { lat: 33.4487, lng: -84.4549 },
    'South Fulton': { lat: 33.6449, lng: -84.4480 },
    'Newman': { lat: 33.3807, lng: -84.7997 },
    'Graham': { lat: 36.0690, lng: -79.4006 },
    'Opelika': { lat: 32.6454, lng: -85.3783 },
    'Sylvester': { lat: 31.5307, lng: -83.8355 },
    'Macon': { lat: 32.8407, lng: -83.6324 },
    'McDonough': { lat: 33.4473, lng: -84.1469 },
    'Albany': { lat: 31.5785, lng: -84.1557 },
    'Morrow': { lat: 33.5832, lng: -84.3394 },
    'Canton': { lat: 34.2368, lng: -84.4908 },
    
    // Alabama cities
    'Alabaster': { lat: 33.2443, lng: -86.8164 },
    'Talladega': { lat: 33.4359, lng: -86.1058 },
    'Birmingham': { lat: 33.5186, lng: -86.8025 },
    'Vestavia Hills': { lat: 33.4487, lng: -86.7878 },
    'Hoover': { lat: 33.4054, lng: -86.8114 },
    'Tuscaloosa': { lat: 33.2098, lng: -87.5692 },
    'Leeds': { lat: 33.5482, lng: -86.5444 },
    'Prattville': { lat: 32.4640, lng: -86.4597 },
    'Athens': { lat: 34.8029, lng: -86.9717 },
    'Saraland': { lat: 30.8207, lng: -88.0711 },
    'Theodore': { lat: 30.5480, lng: -88.1781 },
    
    // Arkansas cities
    'Russellville': { lat: 35.2784, lng: -93.1338 },
    'Royal': { lat: 34.5120, lng: -93.2932 },
    'Bentonville': { lat: 36.3729, lng: -94.2088 },
    'Hot Springs': { lat: 34.5037, lng: -93.0550 },
    
    // North Carolina cities
    'Graham': { lat: 36.0690, lng: -79.4006 },
    
    // South Carolina cities
    'Ladson': { lat: 33.0007, lng: -80.1048 },
    'Pelion': { lat: 33.7868, lng: -81.2459 },
    'North Augusta': { lat: 33.5018, lng: -81.9651 },
    
    // Oklahoma cities
    'Owasso': { lat: 36.2695, lng: -95.8547 },
    'Oklahoma City': { lat: 35.4676, lng: -97.5164 },
    
    // Missouri cities
    'St. Louis': { lat: 38.6270, lng: -90.1994 },
    'Kansas City': { lat: 39.0997, lng: -94.5786 },
    
    // Illinois cities
    'Chester': { lat: 37.9137, lng: -89.8223 },
    
    // New Jersey cities
    'Sicklerville': { lat: 39.7173, lng: -74.9693 }
  };
  
  // Normalize city name (remove extra spaces, convert to title case)
  const normalizedCity = city.trim().split(/\s+/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
  
  // Check if we have coordinates for this city (case-insensitive)
  const cityKey = Object.keys(cityCoordinates).find(key => 
    key.toLowerCase() === normalizedCity.toLowerCase()
  );
  
  if (cityKey) {
    return cityCoordinates[cityKey];
  }
  
  // Fallback to state centers if city not found
  const stateCenters = {
    'GA': { lat: 33.7490, lng: -84.3880 }, // Atlanta area
    'TX': { lat: 32.7767, lng: -96.7970 }, // Dallas area
    'AR': { lat: 34.7465, lng: -92.2896 }, // Little Rock area
    'AL': { lat: 33.5186, lng: -86.8025 }, // Birmingham area
    'MS': { lat: 32.2988, lng: -90.1848 }, // Jackson area
    'TN': { lat: 36.1627, lng: -86.7816 }, // Nashville area
    'LA': { lat: 30.4515, lng: -91.1871 }, // Baton Rouge area
    'NC': { lat: 35.2271, lng: -80.8431 }, // Charlotte area
    'SC': { lat: 34.0007, lng: -81.0348 }, // Columbia area
    'OK': { lat: 35.4676, lng: -97.5164 }, // Oklahoma City area
    'MO': { lat: 38.6270, lng: -90.1994 }, // St. Louis area
    'IL': { lat: 38.6270, lng: -90.1994 }, // Southern IL
    'NJ': { lat: 39.8339, lng: -74.8721 }  // Southern NJ
  };
  
  const center = stateCenters[state] || { lat: 33.7490, lng: -84.3880 };
  
  // Add some random variation (within ~20 miles)
  const lat = center.lat + (Math.random() - 0.5) * 0.2;
  const lng = center.lng + (Math.random() - 0.5) * 0.2;
  
  return { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
}

// Parse CSV file (handles quoted fields)
function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  // Handle Windows line endings (CRLF or just CR)
  // Replace CRLF with LF, then CR with LF, then split
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    console.error('Not enough lines in CSV. Found:', lines.length);
    return [];
  }
  
  // Parse header
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  
  const reps = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map(v => v.trim());
    if (values.length < headers.length) {
      continue;
    }
    
    const rep = {};
    headers.forEach((header, index) => {
      rep[header] = values[index] || '';
    });
    
    // Only process active reps (check both 'TRUE' and true)
    const isActive = rep.Active === 'TRUE' || rep.Active === 'true' || rep.Active === true;
    const hasName = rep['First Name'] && rep['Last Name'];
    
    if (isActive && hasName) {
      reps.push(rep);
    }
  }
  
  return reps;
}

// Parse a CSV line handling quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// Generate availability template (Mon-Fri, 10am, 2pm, 7pm)
function generateAvailability() {
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const timeSlots = ['10am', '2pm', '7pm'];
  
  const availability = {
    monday: [...timeSlots],
    tuesday: [...timeSlots],
    wednesday: [...timeSlots],
    thursday: [...timeSlots],
    friday: [...timeSlots],
    saturday: [],
    sunday: []
  };
  
  // Randomly remove some slots for variety (10% chance)
  weekdays.forEach(day => {
    if (Math.random() < 0.1) {
      availability[day] = availability[day].filter(() => Math.random() > 0.3);
    }
  });
  
  // Some reps work Saturdays (20% chance)
  if (Math.random() < 0.2) {
    availability.saturday = ['10am', '2pm'];
  }
  
  return availability;
}

// Generate sample appointments
function generateSampleAppointments(reps, numAppointments = 15) {
  const appointments = [];
  const timeSlots = ['10am', '2pm', '7pm'];
  const customerNames = [
    'Mike Davis', 'Lisa Brown', 'Tom Wilson', 'Sarah Johnson', 'David Lee',
    'Jennifer Martinez', 'Robert Taylor', 'Emily White', 'James Anderson',
    'Amanda Garcia', 'Michael Thompson', 'Jessica Moore', 'Christopher Harris',
    'Ashley Clark', 'Daniel Lewis', 'Michelle Walker', 'Matthew Hall',
    'Lauren Allen', 'Joshua Young', 'Stephanie King'
  ];
  
  // Generate appointments for the next 7 days
  const today = new Date();
  for (let i = 0; i < numAppointments; i++) {
    const rep = reps[Math.floor(Math.random() * reps.length)];
    const daysOffset = Math.floor(Math.random() * 7);
    const appointmentDate = new Date(today);
    appointmentDate.setDate(today.getDate() + daysOffset);
    
    const dateString = appointmentDate.toISOString().split('T')[0];
    const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
    const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
    
    // Generate customer address near rep's location
    const repCoords = rep.startingAddress;
    const customerLat = repCoords.lat + (Math.random() - 0.5) * 0.2; // Within ~20 miles
    const customerLng = repCoords.lng + (Math.random() - 0.5) * 0.2;
    
    const customerAddress = {
      street: `${Math.floor(Math.random() * 9999)} Main St`,
      city: rep.startingAddress.city,
      state: rep.startingAddress.state,
      zip: rep.startingAddress.zip,
      lat: parseFloat(customerLat.toFixed(6)),
      lng: parseFloat(customerLng.toFixed(6))
    };
    
    appointments.push({
      id: `apt-${Date.now()}-${i}`,
      repId: rep.id,
      date: dateString,
      timeSlot: timeSlot,
      customerName: customerName,
      customerPhone: generatePhoneNumber(rep.startingAddress.state),
      customerEmail: `${customerName.toLowerCase().replace(' ', '.')}@email.com`,
      address: customerAddress,
      status: 'scheduled',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return appointments;
}

// Main processing function
function processCSV() {
  console.log('Processing CSV file...');
  
  const csvPath = path.join(__dirname, '..', 'Oct-2025-Rep Addresses.csv');
  const reps = parseCSV(csvPath);
  
  console.log(`Found ${reps.length} active reps`);
  
  if (reps.length === 0) {
    console.error('No reps found! Check CSV parsing.');
    return;
  }
  
  // Process reps
  const processedReps = reps.map((rep, index) => {
    const firstName = rep['First Name'];
    const lastName = rep['Last Name'];
    const fullName = `${firstName} ${lastName}`;
    const address = rep.Address || '';
    const city = rep.City || '';
    const state = rep.State || '';
    const zip = rep.Zip || '';
    
    // Geocode address
    const coords = approximateGeocode(zip, city, state);
    
    const processedRep = {
      id: `rep${index + 1}`,
      name: fullName,
      email: generateEmail(firstName, lastName),
      phone: generatePhoneNumber(state),
      startingAddress: {
        street: address,
        city: city,
        state: state,
        zip: zip,
        lat: coords.lat,
        lng: coords.lng
      },
      color: COLORS[index % COLORS.length]
    };
    
    return processedRep;
  });
  
  // Generate availability templates
  const availability = {};
  processedReps.forEach(rep => {
    availability[rep.id] = generateAvailability();
  });
  
  // Generate sample appointments
  const appointments = generateSampleAppointments(processedReps, 20);
  
  // Write JSON files
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(dataDir, 'reps.json'),
    JSON.stringify(processedReps, null, 2)
  );
  
  fs.writeFileSync(
    path.join(dataDir, 'availability.json'),
    JSON.stringify(availability, null, 2)
  );
  
  fs.writeFileSync(
    path.join(dataDir, 'appointments.json'),
    JSON.stringify(appointments, null, 2)
  );
  
  console.log(`✅ Generated ${processedReps.length} reps`);
  console.log(`✅ Generated availability templates`);
  console.log(`✅ Generated ${appointments.length} sample appointments`);
  console.log('\nFiles created:');
  console.log('  - data/reps.json');
  console.log('  - data/availability.json');
  console.log('  - data/appointments.json');
}

// Run the script
processCSV();

