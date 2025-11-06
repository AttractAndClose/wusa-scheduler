const fs = require('fs');
const path = require('path');

// Load reps data
const repsPath = path.join(__dirname, '..', 'data', 'reps.json');
const reps = JSON.parse(fs.readFileSync(repsPath, 'utf8'));

// Customer names pool
const customerNames = [
  'Mike Davis', 'Lisa Brown', 'Tom Wilson', 'Sarah Johnson', 'David Lee',
  'Jennifer Martinez', 'Robert Taylor', 'Emily White', 'James Anderson',
  'Amanda Garcia', 'Michael Thompson', 'Jessica Moore', 'Christopher Harris',
  'Ashley Clark', 'Daniel Lewis', 'Michelle Walker', 'Matthew Hall',
  'Lauren Allen', 'Joshua Young', 'Stephanie King', 'Nicole Green',
  'Kevin Brown', 'Rachel Adams', 'Brian Wright', 'Melissa Scott',
  'Ryan Mitchell', 'Kimberly Crump', 'Jason Turner', 'Angela Martinez',
  'Eric Rodriguez', 'Samantha Lee', 'Brandon White', 'Amanda Johnson'
];

// Time slots
const timeSlots = ['10am', '2pm', '7pm'];

// Days of week names
const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Load availability data
const availabilityPath = path.join(__dirname, '..', 'data', 'availability.json');
const availability = JSON.parse(fs.readFileSync(availabilityPath, 'utf8'));

function generatePhoneNumber(state) {
  // Generate area codes based on state
  const areaCodes = {
    'AL': ['205', '251', '256', '334'],
    'AR': ['479', '501', '870'],
    'GA': ['229', '404', '470', '478', '678', '706', '762', '770', '912'],
    'IL': ['217', '224', '309', '312', '331', '618', '630', '708', '773', '815', '847'],
    'KS': ['316', '620', '785', '913'],
    'KY': ['270', '364', '502', '606', '859'],
    'LA': ['225', '318', '337', '504', '985'],
    'MS': ['228', '601', '662', '769'],
    'MO': ['314', '417', '573', '636', '660', '816'],
    'NC': ['252', '336', '704', '828', '910', '919', '980', '984'],
    'OK': ['405', '539', '580', '918'],
    'SC': ['803', '843', '854', '864'],
    'TN': ['423', '615', '629', '731', '865', '901', '931'],
    'TX': ['210', '214', '254', '281', '325', '361', '409', '430', '432', '469', '512', '713', '737', '806', '817', '830', '832', '903', '915', '936', '940', '956', '972', '979']
  };
  
  const codes = areaCodes[state] || ['555'];
  const areaCode = codes[Math.floor(Math.random() * codes.length)];
  const exchange = Math.floor(Math.random() * 800) + 200;
  const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${areaCode}-${exchange}-${number}`;
}

function generateAppointments() {
  const appointments = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Track appointments per rep
  const repAppointmentCounts = {};
  const repTotalSlots = {}; // Track total available slots per rep over 3 weeks
  const repBookedSlots = {}; // Track which slots are booked (date-timeSlot pairs)
  
  reps.forEach(rep => {
    repAppointmentCounts[rep.id] = 0;
    repTotalSlots[rep.id] = 0;
    repBookedSlots[rep.id] = new Set();
  });
  
  // First pass: Calculate total available slots for each rep over 3 weeks (21 days)
  for (let dayOffset = 0; dayOffset < 21; dayOffset++) {
    const appointmentDate = new Date(today);
    appointmentDate.setDate(today.getDate() + dayOffset);
    const dayOfWeek = dayNames[appointmentDate.getDay()];
    
    reps.forEach(rep => {
      const repAvailability = availability[rep.id];
      if (repAvailability && repAvailability[dayOfWeek]) {
        repTotalSlots[rep.id] += repAvailability[dayOfWeek].length;
      }
    });
  }
  
  // Calculate target appointments per rep (50% of available slots)
  const targetAppointmentsPerRep = {};
  reps.forEach(rep => {
    targetAppointmentsPerRep[rep.id] = Math.floor(repTotalSlots[rep.id] * 0.5);
  });
  
  // Generate appointments for the next 3 weeks (21 days)
  for (let dayOffset = 0; dayOffset < 21; dayOffset++) {
    const appointmentDate = new Date(today);
    appointmentDate.setDate(today.getDate() + dayOffset);
    const dayOfWeek = dayNames[appointmentDate.getDay()];
    const dateString = appointmentDate.toISOString().split('T')[0];
    
    // For each rep, check their availability and create appointments
    reps.forEach((rep) => {
      const repAvailability = availability[rep.id];
      if (!repAvailability || !repAvailability[dayOfWeek]) {
        return; // Rep not available this day
      }
      
      const targetCount = targetAppointmentsPerRep[rep.id];
      const currentCount = repAppointmentCounts[rep.id];
      const remainingDays = 21 - dayOffset;
      
      // Calculate how many appointments we still need
      const needed = targetCount - currentCount;
      
      // If we've reached the target, skip
      if (needed <= 0) {
        return;
      }
      
      // Calculate probability: distribute remaining appointments across remaining days
      // Higher probability if we're behind schedule
      const slotsToday = repAvailability[dayOfWeek].length;
      const avgNeededPerDay = needed / Math.max(remainingDays, 1);
      const probability = Math.min(0.7, Math.max(0.3, avgNeededPerDay / slotsToday));
      
      repAvailability[dayOfWeek].forEach((slot) => {
        const slotKey = `${dateString}-${slot}`;
        
        // Skip if already booked
        if (repBookedSlots[rep.id].has(slotKey)) {
          return;
        }
        
        // Book this slot if we haven't reached target and probability check passes
        if (currentCount < targetCount && Math.random() < probability) {
          const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
          
          // Generate customer address near rep's location (within same city/state)
          const customerAddress = {
            street: `${Math.floor(Math.random() * 9999) + 100} ${['Main St', 'Oak Ave', 'Park Blvd', 'Maple Dr', 'Cedar Ln', 'Pine St', 'Elm St'][Math.floor(Math.random() * 7)]}`,
            city: rep.startingAddress.city,
            state: rep.startingAddress.state,
            zip: rep.startingAddress.zip,
            lat: rep.startingAddress.lat + (Math.random() - 0.5) * 0.1, // Within ~10 miles
            lng: rep.startingAddress.lng + (Math.random() - 0.5) * 0.1
          };
          
          appointments.push({
            id: `apt-${Date.now()}-${appointments.length}`,
            repId: rep.id,
            date: dateString,
            timeSlot: slot,
            customerName: customerName,
            customerPhone: generatePhoneNumber(rep.startingAddress.state),
            customerEmail: `${customerName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
            address: customerAddress,
            status: 'scheduled',
            createdAt: new Date(Date.now() - Math.random() * 21 * 24 * 60 * 60 * 1000).toISOString()
          });
          
          repAppointmentCounts[rep.id]++;
          repBookedSlots[rep.id].add(slotKey);
        }
      });
    });
  }
  
  // Second pass: Fill any gaps to ensure we're close to 50% for each rep
  reps.forEach(rep => {
    const targetCount = targetAppointmentsPerRep[rep.id];
    const currentCount = repAppointmentCounts[rep.id];
    const needed = targetCount - currentCount;
    
    if (needed > 0) {
      // Find available slots for this rep in the next 21 days
      for (let dayOffset = 0; dayOffset < 21 && repAppointmentCounts[rep.id] < targetCount; dayOffset++) {
        const appointmentDate = new Date(today);
        appointmentDate.setDate(today.getDate() + dayOffset);
        const dayOfWeek = dayNames[appointmentDate.getDay()];
        const dateString = appointmentDate.toISOString().split('T')[0];
        
        const repAvailability = availability[rep.id];
        if (!repAvailability || !repAvailability[dayOfWeek]) {
          continue;
        }
        
        // Find available slots (not already booked)
        repAvailability[dayOfWeek].forEach((slot) => {
          if (repAppointmentCounts[rep.id] >= targetCount) {
            return;
          }
          
          const slotKey = `${dateString}-${slot}`;
          if (repBookedSlots[rep.id].has(slotKey)) {
            return;
          }
          
          const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
          
          const customerAddress = {
            street: `${Math.floor(Math.random() * 9999) + 100} ${['Main St', 'Oak Ave', 'Park Blvd', 'Maple Dr', 'Cedar Ln', 'Pine St', 'Elm St'][Math.floor(Math.random() * 7)]}`,
            city: rep.startingAddress.city,
            state: rep.startingAddress.state,
            zip: rep.startingAddress.zip,
            lat: rep.startingAddress.lat + (Math.random() - 0.5) * 0.1,
            lng: rep.startingAddress.lng + (Math.random() - 0.5) * 0.1
          };
          
          appointments.push({
            id: `apt-${Date.now()}-${appointments.length}`,
            repId: rep.id,
            date: dateString,
            timeSlot: slot,
            customerName: customerName,
            customerPhone: generatePhoneNumber(rep.startingAddress.state),
            customerEmail: `${customerName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
            address: customerAddress,
            status: 'scheduled',
            createdAt: new Date(Date.now() - Math.random() * 21 * 24 * 60 * 60 * 1000).toISOString()
          });
          
          repAppointmentCounts[rep.id]++;
          repBookedSlots[rep.id].add(slotKey);
        });
      }
    }
  });
  
  // Log statistics
  console.log('\nAppointment generation statistics:');
  reps.forEach(rep => {
    const total = repTotalSlots[rep.id];
    const booked = repAppointmentCounts[rep.id];
    const percentage = total > 0 ? ((booked / total) * 100).toFixed(1) : 0;
    console.log(`${rep.name}: ${booked}/${total} slots (${percentage}%)`);
  });
  
  return appointments;
}

// Generate appointments
console.log('Generating sample appointments...');
const appointments = generateAppointments();
console.log(`Generated ${appointments.length} appointments`);

// Save to data/appointments.json
const outputPath = path.join(__dirname, '..', 'data', 'appointments.json');
fs.writeFileSync(outputPath, JSON.stringify(appointments, null, 2));
console.log(`Saved appointments to ${outputPath}`);

