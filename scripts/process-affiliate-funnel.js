const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, '..', 'All-Affiliate-Funnel.csv');
const outputPath = path.join(__dirname, '..', 'public', 'data', 'territory-map', 'affiliate-funnel-data.json');

console.log('Reading CSV file:', csvPath);

if (!fs.existsSync(csvPath)) {
  console.error('CSV file not found:', csvPath);
  process.exit(1);
}

const csvContent = fs.readFileSync(csvPath, 'utf8');

// Simple CSV parser (since we can't use PapaParse in Node.js script without setup)
// Handle Windows line endings (\r\n) and Unix (\n)
const lines = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');

if (lines.length < 2) {
  console.error('CSV file is empty or has no data rows');
  process.exit(1);
}

// Parse header
const headerLine = lines[0];
const headers = headerLine.split(',').map(h => h.trim());

console.log('Headers found:', headers.length);
console.log('Processing', lines.length - 1, 'data rows...');

// Helper functions
const parseNumber = (value) => {
  if (!value || value === '' || value === null || value === undefined) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

const parseFlag = (value) => {
  if (!value || value === '' || value === null || value === undefined) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

const parseDate = (value) => {
  if (!value || value === '' || value === null || value === undefined) return null;
  return String(value).trim();
};

const parseString = (value) => {
  return value ? String(value).trim() : '';
};

// Map headers to property names
const headerMap = {
  'Id': 'id',
  'Lead Source': 'leadSource',
  'Lead Source Details': 'leadSourceDetails',
  'Lead Create Date': 'leadCreateDate',
  'First Name': 'firstName',
  'Last Name': 'lastName',
  'Phone': 'phone',
  'Email': 'email',
  'Street': 'street',
  'City': 'city',
  'State': 'state',
  'Zip': 'zip',
  'Territory': 'territory',
  'EF Score': 'efScore',
  'Think Unlimited Prospect Score': 'thinkUnlimitedProspectScore',
  'Think Unlimited Schedule Score': 'thinkUnlimitedScheduleScore',
  'Set': 'set',
  'Set Date': 'setDate',
  'Appt Canceled': 'apptCanceled',
  'No Pitch': 'noPitch',
  'Pitch': 'pitch',
  'Pitch Date': 'pitchDate',
  'Credit Ran': 'creditRan',
  'Credit Score': 'creditScore',
  'Lender Approved': 'lenderApproved',
  'Finance Decline': 'financeDecline',
  'Finance Rejected by Customer': 'financeRejectedByCustomer',
  'Cash Deal': 'cashDeal',
  'Sold': 'sold',
  'Sold Date': 'soldDate',
  'Sold Amount': 'soldAmount',
  'Sale Canceled': 'saleCanceled',
  'Sale Canceled Date': 'saleCanceledDate',
  'Installed': 'installed',
  'Installed Date': 'installedDate',
  'Installed # of Windows': 'installedNumberOfWindows',
  'Installed Revenue': 'installedRevenue',
};

// Create index map
const headerIndexMap = {};
headers.forEach((header, index) => {
  const mappedName = headerMap[header] || header;
  headerIndexMap[mappedName] = index;
});

// Parse CSV rows
const data = [];
let processedCount = 0;
let skippedCount = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Parse CSV line - handle quoted fields with commas
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  fields.push(currentField); // Add last field
  
  // Skip if no ID
  if (!fields[headerIndexMap.id] || fields[headerIndexMap.id].trim() === '') {
    skippedCount++;
    continue;
  }
  
  // Build data object
  const row = {
    id: parseString(fields[headerIndexMap.id]),
    leadSource: parseString(fields[headerIndexMap.leadSource]),
    leadSourceDetails: parseString(fields[headerIndexMap.leadSourceDetails]),
    leadCreateDate: parseString(fields[headerIndexMap.leadCreateDate]),
    firstName: parseString(fields[headerIndexMap.firstName]),
    lastName: parseString(fields[headerIndexMap.lastName]),
    phone: parseString(fields[headerIndexMap.phone]),
    email: parseString(fields[headerIndexMap.email]),
    street: parseString(fields[headerIndexMap.street]),
    city: parseString(fields[headerIndexMap.city]),
    state: parseString(fields[headerIndexMap.state]),
    zip: parseString(fields[headerIndexMap.zip] || '').padStart(5, '0'),
    territory: parseString(fields[headerIndexMap.territory]),
    efScore: parseNumber(fields[headerIndexMap.efScore]),
    thinkUnlimitedProspectScore: parseString(fields[headerIndexMap.thinkUnlimitedProspectScore]) || null,
    thinkUnlimitedScheduleScore: parseString(fields[headerIndexMap.thinkUnlimitedScheduleScore]) || null,
    set: parseFlag(fields[headerIndexMap.set]),
    setDate: parseDate(fields[headerIndexMap.setDate]),
    apptCanceled: parseFlag(fields[headerIndexMap.apptCanceled]),
    noPitch: parseFlag(fields[headerIndexMap.noPitch]),
    pitch: parseFlag(fields[headerIndexMap.pitch]),
    pitchDate: parseDate(fields[headerIndexMap.pitchDate]),
    creditRan: parseFlag(fields[headerIndexMap.creditRan]),
    creditScore: parseNumber(fields[headerIndexMap.creditScore]),
    lenderApproved: parseFlag(fields[headerIndexMap.lenderApproved]),
    financeDecline: parseFlag(fields[headerIndexMap.financeDecline]),
    financeRejectedByCustomer: parseFlag(fields[headerIndexMap.financeRejectedByCustomer]),
    cashDeal: parseFlag(fields[headerIndexMap.cashDeal]),
    sold: parseFlag(fields[headerIndexMap.sold]),
    soldDate: parseDate(fields[headerIndexMap.soldDate]),
    soldAmount: parseNumber(fields[headerIndexMap.soldAmount]),
    saleCanceled: parseFlag(fields[headerIndexMap.saleCanceled]),
    saleCanceledDate: parseDate(fields[headerIndexMap.saleCanceledDate]),
    installed: parseFlag(fields[headerIndexMap.installed]),
    installedDate: parseDate(fields[headerIndexMap.installedDate]),
    installedNumberOfWindows: parseNumber(fields[headerIndexMap.installedNumberOfWindows]),
    installedRevenue: parseNumber(fields[headerIndexMap.installedRevenue]),
  };
  
  data.push(row);
  processedCount++;
  
  if (processedCount % 1000 === 0) {
    console.log(`Processed ${processedCount} rows...`);
  }
}

console.log(`\nProcessing complete!`);
console.log(`- Processed: ${processedCount} rows`);
console.log(`- Skipped: ${skippedCount} rows`);
console.log(`- Total: ${data.length} records`);

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write JSON file
console.log('\nWriting JSON file:', outputPath);
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');

const fileSize = fs.statSync(outputPath).size;
console.log(`✓ Successfully created JSON file (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
console.log(`✓ File saved to: ${outputPath}`);

