#!/usr/bin/env node

/**
 * Script to simplify GeoJSON polygons to reduce file size
 * Uses Turf.js to simplify geometry while preserving shape
 * 
 * Usage:
 *   node scripts/simplify-geojson.js [tolerance] [input] [output]
 * 
 * tolerance: simplification tolerance (0.0001 to 0.01, default: 0.001)
 */

const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');

function simplifyGeoJSON(inputPath, outputPath, tolerance = 0.001) {
  console.log(`Reading GeoJSON from: ${inputPath}`);
  
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  if (data.type !== 'FeatureCollection') {
    throw new Error('Input must be a GeoJSON FeatureCollection');
  }
  
  console.log(`Processing ${data.features.length} features with tolerance ${tolerance}...`);
  
  const simplifiedFeatures = [];
  let processed = 0;
  let totalOriginalCoords = 0;
  let totalSimplifiedCoords = 0;
  
  for (const feature of data.features) {
    processed++;
    
    if (feature.geometry && feature.geometry.type === 'Polygon') {
      // Simplify the polygon
      const simplified = turf.simplify(feature, {
        tolerance: tolerance,
        highQuality: true
      });
      
      // Count coordinates
      const originalCoords = JSON.stringify(feature.geometry.coordinates).length;
      const simplifiedCoords = JSON.stringify(simplified.geometry.coordinates).length;
      totalOriginalCoords += originalCoords;
      totalSimplifiedCoords += simplifiedCoords;
      
      simplifiedFeatures.push(simplified);
    } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
      // Handle MultiPolygon
      const simplified = turf.simplify(feature, {
        tolerance: tolerance,
        highQuality: true
      });
      
      const originalCoords = JSON.stringify(feature.geometry.coordinates).length;
      const simplifiedCoords = JSON.stringify(simplified.geometry.coordinates).length;
      totalOriginalCoords += originalCoords;
      totalSimplifiedCoords += simplifiedCoords;
      
      simplifiedFeatures.push(simplified);
    } else {
      // Keep non-polygon features as-is
      simplifiedFeatures.push(feature);
    }
    
    if (processed % 1000 === 0) {
      const reduction = ((1 - totalSimplifiedCoords / totalOriginalCoords) * 100).toFixed(1);
      process.stdout.write(`\rProcessed ${processed} features... (${reduction}% reduction so far)`);
    }
  }
  
  const output = {
    type: 'FeatureCollection',
    features: simplifiedFeatures
  };
  
  const originalSize = fs.statSync(inputPath).size;
  fs.writeFileSync(outputPath, JSON.stringify(output));
  const newSize = fs.statSync(outputPath).size;
  
  const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);
  const coordReduction = ((1 - totalSimplifiedCoords / totalOriginalCoords) * 100).toFixed(1);
  
  console.log(`\n\nSimplification complete!`);
  console.log(`  Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  New size: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Size reduction: ${reduction}%`);
  console.log(`  Coordinate reduction: ${coordReduction}%`);
  console.log(`\nOutput written to: ${outputPath}`);
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Usage: node scripts/simplify-geojson.js [tolerance] [input] [output]

Arguments:
  tolerance  Simplification tolerance (0.0001 to 0.01, default: 0.001)
             Higher values = more simplification = smaller file
  input      Input GeoJSON file path (default: public/data/territory-map/zipcode-boundaries.geojson)
  output     Output GeoJSON file path (default: input file, overwrites)

Examples:
  node scripts/simplify-geojson.js 0.001
  node scripts/simplify-geojson.js 0.002 input.geojson output.geojson
  node scripts/simplify-geojson.js 0.005 public/data/territory-map/zipcode-boundaries.geojson
  `);
  process.exit(1);
}

let tolerance = 0.001;
let inputPath = path.join(__dirname, '../public/data/territory-map/zipcode-boundaries.geojson');
let outputPath = inputPath;

if (args.length >= 1) {
  const firstArg = parseFloat(args[0]);
  if (!isNaN(firstArg)) {
    tolerance = firstArg;
    if (args.length >= 2) inputPath = args[1];
    if (args.length >= 3) outputPath = args[2];
  } else {
    inputPath = args[0];
    if (args.length >= 2) outputPath = args[1];
  }
}

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
  simplifyGeoJSON(inputPath, outputPath, tolerance);
  console.log('\n✓ Simplification complete!');
} catch (error) {
  console.error('\n✗ Error simplifying GeoJSON:', error.message);
  console.error(error.stack);
  process.exit(1);
}


