const fs = require('fs');
const path = require('path');

const csvPath = '/Users/dannyweber/Library/CloudStorage/OneDrive-SharedLibraries-WindowsUSALLC/WUSA 2025 Marketing Branding - Documents/Territories/_Master_Affiliate_Ziplist/WUSA-Master-Territories-Zips-10-1-2025.csv';
const outputPath = path.join(__dirname, '..', 'public', 'data', 'territory-map', 'affiliate-purchase-zips.json');

// Read and parse CSV
const csvContent = fs.readFileSync(csvPath, 'utf8');
// Handle both Windows (CRLF) and Unix (LF) line endings
const lines = csvContent.split(/\r\n|\r|\n/).filter(line => line.trim());

// Extract unique zip codes (skip header)
const zipCodes = new Set();
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Split by comma, handling quoted fields
  const parts = line.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    const zip = parts[1];
    // Remove quotes if present
    const cleanZip = zip.replace(/^"|"$/g, '');
    if (cleanZip && /^\d{5}$/.test(cleanZip)) {
      zipCodes.add(cleanZip);
    }
  }
}

const zipCodesArray = Array.from(zipCodes).sort();

// Save as JSON
fs.writeFileSync(outputPath, JSON.stringify(zipCodesArray, null, 2), 'utf8');

console.log(`Processed ${zipCodesArray.length} unique affiliate purchase zip codes`);
console.log(`Saved to ${outputPath}`);

