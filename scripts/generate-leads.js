const fs = require('fs');
const path = require('path');

// Load reps data
const repsPath = path.join(__dirname, '../data/reps.json');
const reps = JSON.parse(fs.readFileSync(repsPath, 'utf8'));

// First and last names for generating lead names
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa',
  'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Sharon',
  'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy',
  'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Brenda', 'Stephen', 'Emma',
  'Larry', 'Olivia', 'Justin', 'Catherine', 'Scott', 'Christine', 'Brandon', 'Samantha',
  'Benjamin', 'Debra', 'Frank', 'Rachel', 'Gregory', 'Carolyn', 'Raymond', 'Janet',
  'Alexander', 'Virginia', 'Patrick', 'Maria', 'Jack', 'Heather', 'Dennis', 'Diane',
  'Jerry', 'Julie', 'Tyler', 'Joyce', 'Aaron', 'Victoria', 'Jose', 'Kelly',
  'Henry', 'Christina', 'Adam', 'Joan', 'Douglas', 'Evelyn', 'Nathan', 'Judith',
  'Zachary', 'Megan', 'Peter', 'Cheryl', 'Kyle', 'Andrea', 'Noah', 'Hannah',
  'Ethan', 'Jacqueline', 'Jeremy', 'Martha', 'Walter', 'Gloria', 'Christian', 'Teresa',
  'Keith', 'Sara', 'Roger', 'Janice', 'Terry', 'Marie', 'Austin', 'Julia',
  'Sean', 'Grace', 'Gerald', 'Judy', 'Carl', 'Theresa', 'Harold', 'Madison',
  'Dylan', 'Beverly', 'Arthur', 'Denise', 'Jordan', 'Marilyn', 'Alan', 'Amber',
  'Juan', 'Danielle', 'Lawrence', 'Brittany', 'Willie', 'Diana', 'Ralph', 'Abigail',
  'Roy', 'Jane', 'Eugene', 'Lori', 'Wayne', 'Mildred', 'Louis', 'Katherine',
  'Philip', 'Joan', 'Bobby', 'Rose', 'Johnny', 'Janice', 'Randy', 'Nicole'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
  'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez',
  'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams',
  'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards',
  'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers',
  'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly',
  'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks',
  'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross',
  'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry', 'Russell', 'Sullivan', 'Bell',
  'Coleman', 'Butler', 'Henderson', 'Barnes', 'Gonzales', 'Fisher', 'Vasquez', 'Simmons',
  'Romero', 'Jordan', 'Patterson', 'Alexander', 'Hamilton', 'Graham', 'Reynolds', 'Griffin',
  'Wallace', 'Moreno', 'West', 'Cole', 'Hayes', 'Bryant', 'Herrera', 'Gibson',
  'Ellis', 'Tran', 'Medina', 'Aguilar', 'Stevens', 'Murray', 'Ford', 'Castro',
  'Marshall', 'Owens', 'Harrison', 'Fernandez', 'Mcdonald', 'Woods', 'Washington', 'Kennedy',
  'Wells', 'Vargas', 'Henry', 'Chen', 'Freeman', 'Webb', 'Tucker', 'Guzman',
  'Burns', 'Crawford', 'Olson', 'Simpson', 'Porter', 'Hunter', 'Gordon', 'Mendez',
  'Silva', 'Shaw', 'Snyder', 'Mason', 'Dixon', 'Munoz', 'Hunt', 'Hicks',
  'Holmes', 'Palmer', 'Wagner', 'Black', 'Robertson', 'Boyd', 'Rose', 'Stone',
  'Salazar', 'Fox', 'Warren', 'Mills', 'Meyer', 'Rice', 'Schmidt', 'Garza',
  'Daniels', 'Ferguson', 'Nichols', 'Stephens', 'Soto', 'Weaver', 'Ryan', 'Gardner',
  'Payne', 'Grant', 'Dunn', 'Kelley', 'Spencer', 'Hawkins', 'Arnold', 'Pierce',
  'Vazquez', 'Hansen', 'Peters', 'Santos', 'Hart', 'Bradley', 'Knight', 'Elliott',
  'Cunningham', 'Duncan', 'Armstrong', 'Hudson', 'Carroll', 'Lane', 'Riley', 'Andrews',
  'Alvarado', 'Ray', 'Delgado', 'Berry', 'Perkins', 'Hoffman', 'Johnston', 'Matthews',
  'Pena', 'Richards', 'Contreras', 'Willis', 'Carpenter', 'Lawrence', 'Sandoval', 'Guerrero',
  'George', 'Chapman', 'Rios', 'Estrada', 'Ortega', 'Watkins', 'Greene', 'Nunez',
  'Wheeler', 'Valdez', 'Harper', 'Lynch', 'Santana', 'Barker', 'Maldonado', 'Zimmerman',
  'Bishop', 'Fuller', 'Mccoy', 'Mckinney', 'Moran', 'Lucas', 'Hodges', 'Robbins',
  'Cortez', 'Todd', 'Blair', 'Newton', 'Potter', 'Hampton', 'Ortega', 'Strickland',
  'Brady', 'Bowers', 'Mueller', 'Bradshaw', 'Zuniga', 'Swanson', 'Chan', 'Parks',
  'Norris', 'Buchanan', 'Bowman', 'Mendez', 'Carr', 'Davidson', 'Shannon', 'Tyler',
  'Figueroa', 'Marsh', 'Hammond', 'Carrillo', 'Townsend', 'Yates', 'Luna', 'Logan',
  'Fleming', 'Phelps', 'Strickland', 'Barton', 'Norton', 'Pope', 'Frost', 'Roth',
  'Anthony', 'Bruce', 'Singleton', 'Mathis', 'Craig', 'Leonard', 'Fields', 'May',
  'Terry', 'Herrera', 'Wade', 'Mack', 'Lucas', 'Mclaughlin', 'Gibbs', 'Bond',
  'Duffy', 'Valentine', 'Booker', 'Vaughn', 'Rush', 'Avery', 'Herring', 'Dodson',
  'Clements', 'Sampson', 'Tapia', 'Bean', 'Lynn', 'Crane', 'Farley', 'Cisneros',
  'Bentley', 'Shepard', 'Everett', 'Pugh', 'David', 'Mcmahon', 'Dunlap', 'Bender',
  'Acevedo', 'Booker', 'Vang', 'Friedman', 'Clay', 'Horne', 'Gallegos', 'Escobar',
  'Downs', 'Cote', 'Calderon', 'Sexton', 'Lozano', 'Hendricks', 'Miranda', 'Hoover',
  'Ware', 'Chandler', 'Blanchard', 'Oneal', 'Mccall', 'Mcknight', 'Bauer', 'Maddox',
  'Rush', 'Mcconnell', 'Howell', 'Hines', 'Juarez', 'Reid', 'Mcneil', 'Suarez',
  'Hoffman', 'Petty', 'Bright', 'Herring', 'Lozano', 'Hendricks', 'Miranda', 'Hoover'
];

// Street names
const streetNames = [
  'Main St', 'Oak Ave', 'Park Blvd', 'Maple Dr', 'Cedar Ln', 'Pine St', 'Elm St',
  'First St', 'Second St', 'Third St', 'Fourth St', 'Fifth Ave', 'Washington St',
  'Lincoln Ave', 'Jefferson Dr', 'Madison Blvd', 'Adams Ln', 'Jackson St', 'Monroe Ave',
  'Roosevelt Dr', 'Kennedy Blvd', 'Church St', 'Broadway', 'Market St', 'Center St',
  'High St', 'Spring St', 'Summer Ave', 'Winter Dr', 'Lake Rd', 'River Rd', 'Hill Ave',
  'Valley Dr', 'Forest Ln', 'Meadow St', 'Garden Ave', 'Parkway', 'Boulevard', 'Drive',
  'Court', 'Circle', 'Lane', 'Way', 'Place', 'Terrace', 'Heights', 'Ridge',
  'Creek', 'Brook', 'Bridge', 'Mill', 'Farm', 'Orchard', 'Grove', 'Woods'
];

// Generate random phone number
function generatePhoneNumber(state) {
  const areaCodes = {
    'GA': ['404', '470', '678', '770', '912'],
    'TX': ['214', '469', '972', '281', '713', '832', '409', '936', '430', '903'],
    'AR': ['501', '479', '870'],
    'AL': ['205', '251', '256', '334'],
    'MS': ['228', '601', '662', '769'],
    'TN': ['423', '615', '731', '865', '901', '931'],
    'LA': ['225', '318', '337', '504', '985'],
    'NC': ['252', '336', '704', '828', '910', '919', '980'],
    'SC': ['803', '843', '864'],
    'OK': ['405', '539', '918', '580'],
    'MO': ['314', '417', '573', '636', '660', '816'],
    'IL': ['217', '224', '309', '312', '618', '630', '708', '773', '815', '847'],
    'NJ': ['201', '551', '609', '732', '848', '856', '862', '908', '973']
  };
  
  const codes = areaCodes[state] || ['404'];
  const areaCode = codes[Math.floor(Math.random() * codes.length)];
  const exchange = Math.floor(Math.random() * 800) + 200;
  const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${areaCode}-${exchange}-${number}`;
}

// Generate random email
function generateEmail(firstName, lastName) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const variations = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName.charAt(0).toLowerCase()}${Math.floor(Math.random() * 100)}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}`
  ];
  const email = variations[Math.floor(Math.random() * variations.length)];
  return `${email}@${domain}`;
}

// Generate random coordinates within a radius (0-90 miles)
function generateCoordinatesInRadius(centerLat, centerLng, maxRadiusMiles) {
  // Generate random distance (0 to maxRadiusMiles)
  const distance = Math.random() * maxRadiusMiles;
  
  // Generate random bearing (0 to 360 degrees)
  const bearing = Math.random() * 360;
  
  // Convert to radians
  const R = 3959; // Earth's radius in miles
  const lat1 = centerLat * Math.PI / 180;
  const lng1 = centerLng * Math.PI / 180;
  const brng = bearing * Math.PI / 180;
  
  // Calculate new coordinates
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distance / R) +
    Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng)
  );
  
  const lng2 = lng1 + Math.atan2(
    Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
    Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
  );
  
  return {
    lat: lat2 * 180 / Math.PI,
    lng: lng2 * 180 / Math.PI
  };
}

// Generate leads for a rep
function generateLeadsForRep(rep, numLeads = 100) {
  const leads = [];
  const repLat = rep.startingAddress.lat;
  const repLng = rep.startingAddress.lng;
  const repState = rep.startingAddress.state;
  const repCity = rep.startingAddress.city;
  
  for (let i = 0; i < numLeads; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    
    // Generate coordinates within 0-90 miles
    const coords = generateCoordinatesInRadius(repLat, repLng, 90);
    
    // Generate address
    const streetNumber = Math.floor(Math.random() * 9999) + 100;
    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    const street = `${streetNumber} ${streetName}`;
    
    // Use rep's city/state for simplicity, or generate nearby city
    const city = repCity;
    const state = repState;
    const zip = rep.startingAddress.zip; // Keep same zip for simplicity
    
    // Generate scores
    const faradayCreditPropensity = Math.floor(Math.random() * 100) + 1; // 1-100
    const thinkUnlimitedScores = ['Platinum', 'Gold', 'Silver', 'Bronze'];
    const thinkUnlimitedScore = thinkUnlimitedScores[Math.floor(Math.random() * thinkUnlimitedScores.length)];
    
    // EF Score: 0, 1, or range 640-800
    // 30% chance of 0 or 1, 70% chance of 640-800
    let efScore;
    if (Math.random() < 0.3) {
      efScore = Math.random() < 0.5 ? 0 : 1;
    } else {
      efScore = Math.floor(Math.random() * (800 - 640 + 1)) + 640; // 640-800
    }
    
    // Lead Source: 60% Referral, 40% Affiliate
    const isReferral = Math.random() < 0.6;
    let leadSource, leadSourceDetails;
    let refererName, refererPhone, refererAddress, refererRelationship;
    
    if (isReferral) {
      leadSource = 'Referral';
      // Distribute among Referral options
      const referralOptions = [
        'ReferralBD', 'ReferralEX', 'ReferralNG', 'ReferralPL', 'ReferralSA',
        'ReferralTH', 'ReferralTM', 'ReferralTP', 'ReferralTX', 'ReferralYS',
        'ReferralEX-PLUS'
      ];
      leadSourceDetails = referralOptions[Math.floor(Math.random() * referralOptions.length)];
      
      // Generate referrer data for Referral leads
      const refererFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const refererLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      refererName = `${refererFirstName} ${refererLastName}`;
      refererPhone = generatePhoneNumber(state);
      
      // Generate referrer address (within 20 miles of lead address, or same city)
      const refererCoords = generateCoordinatesInRadius(coords.lat, coords.lng, 20);
      const refererStreetNumber = Math.floor(Math.random() * 9999) + 100;
      const refererStreetName = streetNames[Math.floor(Math.random() * streetNames.length)];
      
      refererAddress = {
        street: `${refererStreetNumber} ${refererStreetName}`,
        city: city, // Same city as lead
        state: state,
        zip: zip, // Same zip or nearby - keeping same for simplicity
        lat: parseFloat(refererCoords.lat.toFixed(6)),
        lng: parseFloat(refererCoords.lng.toFixed(6))
      };
      
      // Referrer relationship: 50% Friend, 50% Family
      refererRelationship = Math.random() < 0.5 ? 'Friend' : 'Family';
    } else {
      leadSource = 'Affiliate';
      // Distribute among Affiliate options
      const affiliateOptions = [
        'My Home Pros', 'Modernize', 'Angi', 'Buyerlink', 'Blue Fire', 'Exact Customer'
      ];
      leadSourceDetails = affiliateOptions[Math.floor(Math.random() * affiliateOptions.length)];
    }
    
    const lead = {
      id: `lead-${rep.id}-${i + 1}`,
      name: name,
      email: generateEmail(firstName, lastName),
      phone: generatePhoneNumber(state),
      address: {
        street: street,
        city: city,
        state: state,
        zip: zip,
        lat: parseFloat(coords.lat.toFixed(6)),
        lng: parseFloat(coords.lng.toFixed(6))
      },
      status: 'new',
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      faradayCreditPropensity: faradayCreditPropensity,
      thinkUnlimitedScore: thinkUnlimitedScore,
      efScore: efScore,
      leadSource: leadSource,
      leadSourceDetails: leadSourceDetails
    };
    
    // Add referrer fields only for Referral leads
    if (isReferral) {
      lead.refererName = refererName;
      lead.refererPhone = refererPhone;
      lead.refererAddress = refererAddress;
      lead.refererRelationship = refererRelationship;
    }
    
    leads.push(lead);
  }
  
  return leads;
}

// Generate all leads
function generateLeads() {
  const allLeads = [];
  
  reps.forEach(rep => {
    const numLeads = 95 + Math.floor(Math.random() * 11); // 95-105 leads per rep
    const repLeads = generateLeadsForRep(rep, numLeads);
    allLeads.push(...repLeads);
  });
  
  return allLeads;
}

// Main execution
const leads = generateLeads();
console.log(`Generated ${leads.length} leads for ${reps.length} reps`);

// Save to data directory
const dataPath = path.join(__dirname, '../data/leads.json');
fs.writeFileSync(dataPath, JSON.stringify(leads, null, 2));
console.log(`Saved leads to ${dataPath}`);

// Also save to public/data directory
const publicPath = path.join(__dirname, '../public/data/leads.json');
fs.writeFileSync(publicPath, JSON.stringify(leads, null, 2));
console.log(`Saved leads to ${publicPath}`);

