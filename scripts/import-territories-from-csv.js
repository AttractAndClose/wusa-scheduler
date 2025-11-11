const fs = require('fs');
const path = require('path');

// Color palette for territories
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
  '#EC7063', '#5DADE2', '#F39C12', '#1ABC9C', '#9B59B6',
  '#E74C3C', '#3498DB', '#F1C40F', '#16A085', '#8E44AD',
  '#C0392B', '#2980B9', '#D68910', '#138D75', '#7D3C98',
  '#A93226', '#1F618D', '#B9770E', '#0E6655', '#633974',
  '#922B21', '#154360', '#7E5109', '#0B5345', '#512E5F',
  '#641E16', '#0B3B4A', '#4A3A08', '#073A2F', '#3D1F3D'
];

// Read CSV file
const csvPath = process.argv[2] || '/Users/dannyweber/Library/CloudStorage/OneDrive-SharedLibraries-WindowsUSALLC/WUSA 2025 Marketing Branding - Documents/Territories/WUSA Maps/Zip-Territory-Master.csv';
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Parse CSV - simple format: ZIP,Territory
// Handle Windows line endings (\r\n) and Unix (\n)
const lines = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
const data = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Split on comma, but handle territories with commas in name
  const firstComma = line.indexOf(',');
  if (firstComma === -1) continue;
  
  const zipCode = line.substring(0, firstComma).trim();
  const territory = line.substring(firstComma + 1).trim();
  
  if (zipCode && territory) {
    data.push({ zipCode, territory });
  }
}

console.log(`Parsed ${data.length} zip code assignments`);

// Extract unique territories
const uniqueTerritories = [...new Set(data.map(d => d.territory))].filter(t => t);
console.log(`Found ${uniqueTerritories.length} unique territories:`);
uniqueTerritories.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));

// Create territories with colors
const territories = uniqueTerritories.map((name, index) => ({
  id: `territory-${index + 1}`,
  name: name,
  color: COLORS[index % COLORS.length],
  createdAt: new Date().toISOString()
}));

// Create assignments (zipCode -> territoryId)
const assignments = {};
const territoryMap = new Map(territories.map(t => [t.name, t.id]));

for (const { zipCode, territory } of data) {
  const territoryId = territoryMap.get(territory);
  if (territoryId) {
    assignments[zipCode] = territoryId;
  } else {
    console.warn(`Warning: Territory "${territory}" not found for zip ${zipCode}`);
  }
}

// Save territories
const territoriesPath = path.join(__dirname, '../public/data/territory-map/territories.json');
fs.writeFileSync(territoriesPath, JSON.stringify(territories, null, 2), 'utf8');
console.log(`\n✓ Saved ${territories.length} territories to ${territoriesPath}`);

// Save assignments
const assignmentsPath = path.join(__dirname, '../public/data/territory-map/assignments.json');
fs.writeFileSync(assignmentsPath, JSON.stringify(assignments, null, 2), 'utf8');
console.log(`✓ Saved ${Object.keys(assignments).length} zip code assignments to ${assignmentsPath}`);

// Save CSV backup
const csvBackupPath = path.join(__dirname, '../public/data/territory-map/zip-territory-master.csv');
fs.writeFileSync(csvBackupPath, csvContent, 'utf8');
console.log(`✓ Saved CSV backup to ${csvBackupPath}`);

console.log('\n✓ Import complete!');
console.log('\nTerritory summary:');
territories.forEach(t => {
  const zipCount = Object.values(assignments).filter(id => id === t.id).length;
  console.log(`  ${t.name}: ${zipCount} zip codes (${t.color})`);
});

