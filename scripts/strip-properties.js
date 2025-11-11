#!/usr/bin/env node

/**
 * Script to strip unnecessary properties from GeoJSON
 * Keeps only: zipCode, state, territoryColor
 * Adds feature IDs for efficient updates
 */

const fs = require('fs');
const path = require('path');

function stripProperties(inputPath, outputPath) {
  console.log(`Reading GeoJSON from: ${inputPath}`);
  
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  if (data.type !== 'FeatureCollection') {
    throw new Error('Input must be a GeoJSON FeatureCollection');
  }
  
  console.log(`Processing ${data.features.length} features...`);
  
  let processed = 0;
  const originalSize = fs.statSync(inputPath).size;
  
  for (const feature of data.features) {
    processed++;
    
    // Extract zipCode from various possible property names
    const props = feature.properties || {};
    const zipCode = props.zipCode ||
                    props.ZCTA5CE20 || 
                    props.ZCTA5CE10 || 
                    props.ZIP_CODE || 
                    props.ZIPCODE || 
                    props.ZIP || 
                    props.GEOID20?.substring(0, 5);
    
    // Determine state from zipCode if not present
    let state = props.state;
    if (!state && zipCode) {
      const zipNum = parseInt(zipCode);
      if (!isNaN(zipNum)) {
        // Simple state detection based on zip ranges (simplified)
        if (zipNum >= 35004 && zipNum <= 36925) state = 'AL';
        else if (zipNum >= 71601 && zipNum <= 72959) state = 'AR';
        else if (zipNum >= 30002 && zipNum <= 31999) state = 'GA';
        else if (zipNum >= 60001 && zipNum <= 62999) state = 'IL';
        else if (zipNum >= 66002 && zipNum <= 67954) state = 'KS';
        else if (zipNum >= 40003 && zipNum <= 42788) state = 'KY';
        else if (zipNum >= 70001 && zipNum <= 71497) state = 'LA';
        else if (zipNum >= 38601 && zipNum <= 39776) state = 'MS';
        else if (zipNum >= 63001 && zipNum <= 65899) state = 'MO';
        else if (zipNum >= 27006 && zipNum <= 28909) state = 'NC';
        else if (zipNum >= 73001 && zipNum <= 74966) state = 'OK';
        else if (zipNum >= 29001 && zipNum <= 29945) state = 'SC';
        else if (zipNum >= 37010 && zipNum <= 38589) state = 'TN';
        else if ((zipNum >= 73301 && zipNum <= 77099) || 
                 (zipNum >= 77200 && zipNum <= 79999) || 
                 (zipNum >= 88501 && zipNum <= 88595)) state = 'TX';
      }
    }
    
    // Strip all properties except essential ones
    feature.properties = {
      zipCode: zipCode || '',
      state: state || '',
      territoryColor: '#ffffff' // Default color
    };
    
    // Add feature ID for efficient updates
    if (zipCode) {
      feature.id = zipCode;
    }
    
    if (processed % 1000 === 0) {
      process.stdout.write(`\rProcessed ${processed} features...`);
    }
  }
  
  console.log(`\nWriting to: ${outputPath}`);
  
  // Write compact JSON
  fs.writeFileSync(outputPath, JSON.stringify(data));
  
  const newSize = fs.statSync(outputPath).size;
  const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);
  
  console.log(`\nProperty stripping complete!`);
  console.log(`  Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  New size: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Size reduction: ${reduction}%`);
}

// Main execution
const args = process.argv.slice(2);
const inputPath = args[0] || path.join(__dirname, '../public/data/territory-map/zipcode-boundaries.geojson');
const outputPath = args[1] || inputPath;

if (!fs.existsSync(inputPath)) {
  console.error(`Error: Input file not found: ${inputPath}`);
  process.exit(1);
}

try {
  stripProperties(inputPath, outputPath);
  console.log('\n✓ Property stripping complete!');
} catch (error) {
  console.error('\n✗ Error:', error.message);
  process.exit(1);
}


