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

// Simple geocoding using zip code approximation
// For MVP, we'll use approximate coordinates based on zip code
// This avoids API rate limits and works offline
function approximateGeocode(zip, city, state) {
  // Common zip code approximations (these are rough estimates)
  // In production, you'd use a real geocoding service
  // For now, we'll use a simple lookup or generate reasonable coordinates
  
  // For MVP, we'll generate coordinates based on state/region
  // This is a simplified approach - real geocoding would be better
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
  
  // Add some random variation (within ~50 miles)
  const lat = center.lat + (Math.random() - 0.5) * 0.5;
  const lng = center.lng + (Math.random() - 0.5) * 0.5;
  
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

