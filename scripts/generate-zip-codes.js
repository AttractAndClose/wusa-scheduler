// Script to generate serviceable zip codes
// Generates comprehensive list of all zip codes in serviceable states

const states = {
  'AL': { name: 'Alabama', ranges: [[35004, 36925]] },
  'AR': { name: 'Arkansas', ranges: [[71601, 72959]] },
  'GA': { name: 'Georgia', ranges: [[30002, 31999], [39815, 39815], [39834, 39834], [39900, 39901]] },
  'IL': { name: 'Illinois', ranges: [[60001, 62999]] },
  'KS': { name: 'Kansas', ranges: [[66002, 67954]] },
  'KY': { name: 'Kentucky', ranges: [[40003, 42788]] },
  'LA': { name: 'Louisiana', ranges: [[70001, 71497]] },
  'MS': { name: 'Mississippi', ranges: [[38601, 39776]] },
  'MO': { name: 'Missouri', ranges: [[63001, 65899]] },
  'NC': { name: 'North Carolina', ranges: [[27006, 28909]] },
  'OK': { name: 'Oklahoma', ranges: [[73001, 74966]] },
  'SC': { name: 'South Carolina', ranges: [[29001, 29945]] },
  'TN': { name: 'Tennessee', ranges: [[37010, 38589]] },
  'TX': { name: 'Texas', ranges: [[73301, 77099], [77200, 79999], [88501, 88595]] }
};

// County mapping (simplified - in production use actual zip-to-county mapping)
// For now, we'll use a default county per state
const countyMap = {
  'AL': 'Jefferson',
  'AR': 'Pulaski',
  'GA': 'Fulton',
  'IL': 'Cook',
  'KS': 'Johnson',
  'KY': 'Jefferson',
  'LA': 'Orleans',
  'MS': 'Hinds',
  'MO': 'St. Louis',
  'NC': 'Mecklenburg',
  'OK': 'Oklahoma',
  'SC': 'Richland',
  'TN': 'Davidson',
  'TX': 'Harris'
};

const zips = [];

for (const [code, state] of Object.entries(states)) {
  for (const [start, end] of state.ranges) {
    // Generate ALL zip codes in the range (not just samples)
    for (let zip = start; zip <= end; zip++) {
      const zipStr = zip.toString().padStart(5, '0');
      zips.push({
        zip: zipStr,
        state: code,
        stateName: state.name,
        county: countyMap[code] || 'Unknown',
        excluded: false,
        notes: ''
      });
    }
  }
}

// Sort by state, then zip
zips.sort((a, b) => {
  if (a.state !== b.state) {
    return a.state.localeCompare(b.state);
  }
  return a.zip.localeCompare(b.zip);
});

console.log(`Generated ${zips.length} zip codes`);
console.log(JSON.stringify(zips, null, 2));

