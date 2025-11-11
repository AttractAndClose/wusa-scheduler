#!/usr/bin/env node

/**
 * Script to download and process zip code boundary GeoJSON data
 * Downloads ZCTA shapefile from US Census Bureau, converts to GeoJSON, and filters to serviceable states
 * 
 * Usage:
 *   node scripts/download-zip-boundaries.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');
const { pipeline } = require('stream/promises');
const { execSync } = require('child_process');
const shapefile = require('shapefile');

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
  return props.ZCTA5CE20 || 
         props.ZCTA5CE10 || 
         props.ZIP_CODE || 
         props.ZIPCODE || 
         props.ZIP || 
         props.GEOID20?.substring(0, 5) ||
         null;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    let downloadedSize = 0;
    let totalSize = 0;
    
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        // Follow redirect
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      totalSize = parseInt(response.headers['content-length'], 10);
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize) {
          const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(`\rProgress: ${percent}% (${(downloadedSize / 1024 / 1024).toFixed(2)} MB / ${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
        } else {
          process.stdout.write(`\rDownloaded: ${(downloadedSize / 1024 / 1024).toFixed(2)} MB`);
        }
      });
      
      response.pipe(file);
      
      file.on('error', (err) => {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`File write error: ${err.message}`));
      });
      
      file.on('finish', () => {
        file.close((err) => {
          if (err) {
            reject(new Error(`File close error: ${err.message}`));
            return;
          }
          // Verify file was written
          const stats = fs.statSync(dest);
          if (stats.size === 0) {
            reject(new Error('Downloaded file is empty'));
            return;
          }
          console.log(`\nDownload complete! (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
          resolve();
        });
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) {
        fs.unlinkSync(dest);
      }
      reject(new Error(`Download error: ${err.message}`));
    });
  });
}

function unzipFile(zipPath, destDir) {
  console.log(`Extracting ${zipPath}...`);
  try {
    // Try using unzip command (available on macOS)
    execSync(`unzip -q -o "${zipPath}" -d "${destDir}"`, { stdio: 'inherit' });
    console.log('Extraction complete!');
  } catch (error) {
    throw new Error(`Failed to extract zip file: ${error.message}`);
  }
}

async function convertShapefileToGeoJSON(shpPath, outputPath) {
  console.log(`Converting shapefile to GeoJSON...`);
  
  const source = await shapefile.open(shpPath);
  const features = [];
  let count = 0;
  
  while (true) {
    const result = await source.read();
    if (result.done) break;
    
    features.push(result.value);
    count++;
    
    if (count % 1000 === 0) {
      process.stdout.write(`\rConverted ${count} features...`);
    }
  }
  
  console.log(`\nConverted ${count} features to GeoJSON`);
  
  const geojson = {
    type: 'FeatureCollection',
    features: features
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(geojson));
  console.log(`GeoJSON written to ${outputPath}`);
  
  return geojson;
}

function filterGeoJSON(geojson, outputPath) {
  console.log(`Filtering GeoJSON to serviceable states...`);
  
  const filteredFeatures = [];
  let processed = 0;
  let filtered = 0;
  
  for (const feature of geojson.features) {
    processed++;
    
    const zipCode = extractZipCode(feature);
    if (!zipCode) {
      continue;
    }
    
    const state = getStateFromZip(zipCode);
    if (!state || !SERVICEABLE_STATES.has(state)) {
      continue;
    }
    
    feature.properties = {
      ...feature.properties,
      zipCode: zipCode,
      state: state
    };
    
    filteredFeatures.push(feature);
    filtered++;
    
    if (processed % 1000 === 0) {
      process.stdout.write(`\rProcessed ${processed} features, kept ${filtered}...`);
    }
  }
  
  const output = {
    type: 'FeatureCollection',
    features: filteredFeatures
  };
  
  console.log(`\nFiltered to ${filtered} zip codes in serviceable states`);
  
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
  
  fs.writeFileSync(outputPath, JSON.stringify(output));
  
  const fileSizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
  console.log(`\nOutput file size: ${fileSizeMB} MB`);
  console.log(`Output written to: ${outputPath}`);
}

async function main() {
  const tempDir = path.join(__dirname, '../temp-zip-data');
  const outputDir = path.join(__dirname, '../public/data/territory-map');
  
  // Create temp directory
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // Step 1: Download state-by-state GeoJSON files from OpenDataDC repository
    // This is more reliable than trying to download and convert shapefiles
    const stateCodes = {
      'AL': { code: 'al', name: 'alabama' },
      'AR': { code: 'ar', name: 'arkansas' }, 
      'GA': { code: 'ga', name: 'georgia' },
      'KS': { code: 'ks', name: 'kansas' },
      'LA': { code: 'la', name: 'louisiana' },
      'MS': { code: 'ms', name: 'mississippi' },
      'MO': { code: 'mo', name: 'missouri' },
      'NC': { code: 'nc', name: 'north_carolina' },
      'OK': { code: 'ok', name: 'oklahoma' },
      'SC': { code: 'sc', name: 'south_carolina' },
      'TN': { code: 'tn', name: 'tennessee' },
      'TX': { code: 'tx', name: 'texas' }
    };
    
    const baseUrl = 'https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/';
    const geojsonPath = path.join(tempDir, 'zcta-all.geojson');
    let allFeatures = [];
    
    console.log('Downloading state-by-state GeoJSON files from OpenDataDC repository...\n');
    
    for (const [stateCode, stateInfo] of Object.entries(stateCodes)) {
      // Files are named like: al_alabama_zip_codes_geo.min.json
      const stateUrl = `${baseUrl}${stateInfo.code}_${stateInfo.name}_zip_codes_geo.min.json`;
      const stateFile = path.join(tempDir, `${stateCode}.geojson`);
      
      try {
        if (!fs.existsSync(stateFile)) {
          console.log(`Downloading ${stateCode} (${stateInfo.name})...`);
          await downloadFile(stateUrl, stateFile);
        } else {
          console.log(`${stateCode} already downloaded, skipping...`);
        }
        
        // Load and process state file
        const stateData = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        if (stateData.type === 'FeatureCollection' && stateData.features) {
          // Ensure zip code property is standardized
          stateData.features.forEach(feature => {
            const props = feature.properties || {};
            // The OpenDataDC format uses 'ZCTA5CE10' or similar
            const zipCode = props.ZCTA5CE10 || props.ZCTA5CE20 || props.ZIP_CODE || 
                          props.ZIPCODE || props.ZIP || props.GEOID10?.substring(0, 5) ||
                          Object.values(props).find(v => typeof v === 'string' && /^\d{5}$/.test(v));
            
            if (zipCode) {
              feature.properties = {
                ...props,
                zipCode: zipCode,
                state: stateCode
              };
              allFeatures.push(feature);
            }
          });
          console.log(`  Added ${stateData.features.length} zip codes from ${stateCode}\n`);
        }
      } catch (error) {
        console.warn(`Warning: Failed to download ${stateCode}: ${error.message}`);
        console.warn(`  URL: ${stateUrl}`);
        console.warn(`  You may need to download this state manually.\n`);
      }
    }
    
    if (allFeatures.length === 0) {
      throw new Error('No zip code data was downloaded. Please check your internet connection or try downloading manually.');
    }
    
    const geojson = {
      type: 'FeatureCollection',
      features: allFeatures
    };
    
    console.log(`\nCombined ${allFeatures.length} zip codes from all serviceable states.`);
    fs.writeFileSync(geojsonPath, JSON.stringify(geojson));
    console.log(`Combined GeoJSON saved to ${geojsonPath}\n`);
    
    // Step 4: Filter to serviceable states
    const outputPath = path.join(outputDir, 'zipcode-boundaries.geojson');
    filterGeoJSON(geojson, outputPath);
    
    console.log('\n✓ Processing complete!');
    console.log(`\nFinal file: ${outputPath}`);
    console.log('\nYou can now use the territory map with zip code boundaries.');
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Optionally clean up temp directory
    // Uncomment the next line if you want to clean up after processing
    // if (fs.existsSync(tempDir)) {
    //   fs.rmSync(tempDir, { recursive: true, force: true });
    // }
  }
}

main();

