#!/usr/bin/env node

/**
 * Script to process zip code boundary GeoJSON files
 * Filters to serviceable states and ensures correct format
 * 
 * Usage:
 *   node scripts/process-zip-boundaries.js input.geojson output.geojson
 * 
 * Or process from stdin:
 *   cat input.geojson | node scripts/process-zip-boundaries.js > output.geojson
 */

const fs = require('fs');
const path = require('path');

// Serviceable states from your app (excluding IL and KY)
const SERVICEABLE_STATES = new Set([
  'AL', 'AR', 'GA', 'KS', 'LA', 'MS', 'MO', 'NC', 'OK', 'SC', 'TN', 'TX'
]);

// Zip code ranges for each state (for validation) - excluding IL and KY
const STATE_ZIP_RANGES = {
  'AL': [[35004, 36925]],
  'AR': [[71601, 72959]],
  'GA': [[30002, 31999], [39815, 39815], [39834, 39834], [39900, 39901]],
  'KS': [[66002, 67954]],
  'LA': [[70001, 71497]],
  'MS': [[38601, 39776]],
  'MO': [[63001, 65899]],
  'NC': [[27006, 28909]],
  'OK': [[73001, 74966]],
  'SC': [[29001, 29945]],
  'TN': [[37010, 38589]],
  'TX': [[73301, 77099], [77200, 79999], [88501, 88595]]
};

function isZipInState(zipCode, state) {
  const zipNum = parseInt(zipCode);
  if (isNaN(zipNum)) return false;
  
  const ranges = STATE_ZIP_RANGES[state];
  if (!ranges) return false;
  
  return ranges.some(([start, end]) => zipNum >= start && zipNum <= end);
}

function getStateFromZip(zipCode) {
  const zipNum = parseInt(zipCode);
  if (isNaN(zipNum)) return null;
  
  for (const [state, ranges] of Object.entries(STATE_ZIP_RANGES)) {
    if (ranges.some(([start, end]) => zipNum >= start && zipNum <= end)) {
      return state;
    }
  }
  return null;
}

function extractZipCode(feature) {
  // Try different property names, prioritizing zipCode since we set it
  const props = feature.properties || {};
  return props.zipCode ||
         props.ZCTA5CE20 || 
         props.ZCTA5CE10 || 
         props.ZIP_CODE || 
         props.ZIPCODE || 
         props.ZIP || 
         props.GEOID20?.substring(0, 5) ||
         null;
}

function processGeoJSON(inputPath, outputPath) {
  console.log(`Reading GeoJSON from: ${inputPath}`);
  
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  if (data.type !== 'FeatureCollection') {
    throw new Error('Input must be a GeoJSON FeatureCollection');
  }
  
  console.log(`Processing ${data.features.length} features...`);
  
  const filteredFeatures = [];
  let processed = 0;
  let filtered = 0;
  
  for (const feature of data.features) {
    processed++;
    
    const zipCode = extractZipCode(feature);
    if (!zipCode) {
      console.warn(`Skipping feature without zip code: ${JSON.stringify(feature.properties)}`);
      continue;
    }
    
    // Determine state from zip code
    const state = getStateFromZip(zipCode);
    if (!state || !SERVICEABLE_STATES.has(state)) {
      continue;
    }
    
    // Strip all properties except essential ones for rendering
    // This significantly reduces file size
    feature.properties = {
      zipCode: zipCode,
      state: state,
      territoryColor: '#ffffff' // Default color, will be updated dynamically
    };
    
    // Add feature ID for efficient updates (using zipCode as ID)
    feature.id = zipCode;
    
    filteredFeatures.push(feature);
    filtered++;
    
    if (processed % 1000 === 0) {
      console.log(`Processed ${processed} features, kept ${filtered}...`);
    }
  }
  
  const output = {
    type: 'FeatureCollection',
    features: filteredFeatures
  };
  
  console.log(`\nFiltered to ${filtered} zip codes in serviceable states`);
  console.log(`Writing to: ${outputPath}`);
  
  // Write compact JSON (no pretty formatting) to reduce file size
  fs.writeFileSync(outputPath, JSON.stringify(output));
  
  // Print statistics
  const stateCounts = {};
  filteredFeatures.forEach(f => {
    const state = f.properties.state;
    stateCounts[state] = (stateCounts[state] || 0) + 1;
  });
  
  console.log('\nZip codes by state:');
  Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([state, count]) => {
      console.log(`  ${state}: ${count}`);
    });
  
  const fileSizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
  console.log(`\nOutput file size: ${fileSizeMB} MB`);
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Usage: node scripts/process-zip-boundaries.js <input.geojson> [output.geojson]

Examples:
  node scripts/process-zip-boundaries.js zcta-all.geojson zcta-filtered.geojson
  node scripts/process-zip-boundaries.js zcta-all.geojson public/data/territory-map/zipcode-boundaries.geojson

This script:
  1. Filters GeoJSON to only serviceable states
  2. Standardizes zip code property names
  3. Adds state information to each feature
  4. Outputs optimized GeoJSON for the territory map
  `);
  process.exit(1);
}

const inputPath = args[0];
const outputPath = args[1] || path.join(__dirname, '../public/data/territory-map/zipcode-boundaries.geojson');

if (!fs.existsSync(inputPath)) {
  console.error(`Error: Input file not found: ${inputPath}`);
  process.exit(1);
}

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

try {
  processGeoJSON(inputPath, outputPath);
  console.log('\n✓ Processing complete!');
} catch (error) {
  console.error('\n✗ Error processing GeoJSON:', error.message);
  process.exit(1);
}

