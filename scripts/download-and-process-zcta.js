#!/usr/bin/env node

/**
 * Script to download and process Census ZCTA data for territory map
 * Downloads 2023 ZCTA shapefile, converts to GeoJSON, and filters to serviceable states
 * 
 * Requirements:
 * - Node.js
 * - Access to Census Bureau website
 * 
 * Usage:
 *   node scripts/download-and-process-zcta.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEMP_DIR = '/tmp';
const ZIP_FILE = path.join(TEMP_DIR, 'tl_2023_us_zcta520.zip');
const OUTPUT_FILE = path.join(__dirname, '../public/data/territory-map/zipcode-boundaries.geojson');

// Serviceable states (excluding IL and KY)
const SERVICEABLE_STATES = new Set([
  'AL', 'AR', 'GA', 'KS', 'LA', 'MS', 'MO', 'NC', 'OK', 'SC', 'TN', 'TX'
]);

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

function processGeoJSON(geojson) {
  console.log(`Processing ${geojson.features.length} features...`);
  
  const filteredFeatures = [];
  let processed = 0;
  
  for (const feature of geojson.features) {
    processed++;
    
    const zipCode = extractZipCode(feature);
    if (!zipCode) continue;
    
    const state = getStateFromZip(zipCode);
    if (!state || !SERVICEABLE_STATES.has(state)) {
      continue;
    }
    
    // Standardize properties
    feature.properties = {
      zipCode: zipCode,
      state: state,
      territoryColor: '#ffffff'
    };
    
    feature.id = zipCode;
    filteredFeatures.push(feature);
    
    if (processed % 10000 === 0) {
      console.log(`Processed ${processed} features, kept ${filteredFeatures.length}...`);
    }
  }
  
  return {
    type: 'FeatureCollection',
    features: filteredFeatures
  };
}

async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading from ${url}...`);
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        return downloadFile(response.headers.location, outputPath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloaded = 0;
      
      response.on('data', (chunk) => {
        downloaded += chunk.length;
        if (totalSize) {
          const percent = ((downloaded / totalSize) * 100).toFixed(1);
          process.stdout.write(`\rDownloaded: ${percent}%`);
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\nDownload complete!');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('ZCTA Data Download and Processing Script');
  console.log('========================================\n');
  
  // Check if we can use ogr2ogr or need alternative
  let hasOgr2ogr = false;
  try {
    execSync('which ogr2ogr', { stdio: 'ignore' });
    hasOgr2ogr = true;
    console.log('✓ ogr2ogr found - will use for conversion\n');
  } catch (e) {
    console.log('⚠ ogr2ogr not found - will need manual conversion\n');
    console.log('Please download the shapefile manually from:');
    console.log('https://www2.census.gov/geo/tiger/TIGER2023/ZCTA5/tl_2023_us_zcta520.zip');
    console.log('\nThen convert using mapshaper.org or install GDAL:\n  brew install gdal\n');
    console.log('After conversion, run:');
    console.log(`  node scripts/process-zip-boundaries.js <converted.geojson> ${OUTPUT_FILE}\n`);
    return;
  }
  
  // Download the shapefile - try multiple years (2020 is most reliable)
  const urls = [
    'https://www2.census.gov/geo/tiger/TIGER2020/ZCTA5/tl_2020_us_zcta520.zip',
    'https://www2.census.gov/geo/tiger/TIGER2022/ZCTA5/tl_2022_us_zcta520.zip',
    'https://www2.census.gov/geo/tiger/TIGER2023/ZCTA5/tl_2023_us_zcta520.zip',
    'https://www2.census.gov/geo/tiger/TIGER2021/ZCTA5/tl_2021_us_zcta520.zip'
  ];
  
  let url = urls[0];
  let downloadSuccess = false;
  
  for (const testUrl of urls) {
    try {
      console.log(`Trying ${testUrl}...`);
      const response = await new Promise((resolve, reject) => {
        https.get(testUrl, { method: 'HEAD' }, (res) => {
          resolve(res.statusCode);
        }).on('error', reject);
      });
      
      if (response === 200) {
        url = testUrl;
        downloadSuccess = true;
        console.log(`✓ Found available data at ${url}\n`);
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!downloadSuccess) {
    throw new Error('Could not find available Census data. Please download manually.');
  }
  
  try {
    await downloadFile(url, ZIP_FILE);
    
    // Extract
    console.log('\nExtracting shapefile...');
    execSync(`cd ${TEMP_DIR} && unzip -q -o ${ZIP_FILE}`, { stdio: 'inherit' });
    
    // Convert to GeoJSON
    const shpFile = path.join(TEMP_DIR, 'tl_2023_us_zcta520.shp');
    const tempGeoJSON = path.join(TEMP_DIR, 'zcta-all.geojson');
    
    console.log('\nConverting to GeoJSON (this may take a few minutes)...');
    execSync(`ogr2ogr -f GeoJSON ${tempGeoJSON} ${shpFile}`, { stdio: 'inherit' });
    
    // Load and process
    console.log('\nLoading GeoJSON...');
    const geojsonData = JSON.parse(fs.readFileSync(tempGeoJSON, 'utf8'));
    
    console.log('\nFiltering to serviceable states...');
    const filtered = processGeoJSON(geojsonData);
    
    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save
    console.log(`\nSaving to ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(filtered));
    
    // Print statistics
    const stateCounts = {};
    filtered.features.forEach(f => {
      const state = f.properties.state;
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    });
    
    console.log('\n✓ Processing complete!');
    console.log('\nZip codes by state:');
    Object.entries(stateCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([state, count]) => {
        console.log(`  ${state}: ${count}`);
      });
    
    const fileSizeMB = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2);
    console.log(`\nOutput file size: ${fileSizeMB} MB`);
    
    // Cleanup
    console.log('\nCleaning up temporary files...');
    fs.unlinkSync(ZIP_FILE);
    fs.unlinkSync(tempGeoJSON);
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error('\nPlease download manually and process:');
    console.error('1. Download from: https://www2.census.gov/geo/tiger/TIGER2023/ZCTA5/tl_2023_us_zcta520.zip');
    console.error('2. Convert to GeoJSON using mapshaper.org');
    console.error(`3. Run: node scripts/process-zip-boundaries.js <file.geojson> ${OUTPUT_FILE}`);
    process.exit(1);
  }
}

main().catch(console.error);

