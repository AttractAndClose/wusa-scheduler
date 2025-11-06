// Script to generate serviceable zip codes
// This generates a sample list - in production, you'd import actual zip code data

const states = {
  'AL': { name: 'Alabama', ranges: [[35000, 36999]] },
  'AR': { name: 'Arkansas', ranges: [[71600, 72999], [75502, 75502]] },
  'GA': { name: 'Georgia', ranges: [[30000, 31999], [39815, 39815], [39834, 39834], [39900, 39999]] },
  'IL': { name: 'Illinois', ranges: [[60000, 62999]] },
  'KS': { name: 'Kansas', ranges: [[66000, 67999]] },
  'KY': { name: 'Kentucky', ranges: [[40000, 42799], [45275, 45275]] },
  'LA': { name: 'Louisiana', ranges: [[70000, 71499], [71749, 71749]] },
  'MS': { name: 'Mississippi', ranges: [[38600, 39799]] },
  'MO': { name: 'Missouri', ranges: [[63000, 65999]] },
  'NC': { name: 'North Carolina', ranges: [[27000, 28999]] },
  'OK': { name: 'Oklahoma', ranges: [[73000, 74999]] },
  'SC': { name: 'South Carolina', ranges: [[29000, 29999]] },
  'TN': { name: 'Tennessee', ranges: [[37000, 38599]] },
  'TX': { name: 'Texas', ranges: [[75000, 77099], [77200, 79999]] }
};

// County mapping (simplified - in production use actual zip-to-county mapping)
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
    // Generate every 10th zip code for sample (in production, use all valid zips)
    for (let zip = start; zip <= end && zip <= start + 500; zip += 10) {
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

console.log(JSON.stringify(zips, null, 2));

