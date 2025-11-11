/* eslint-disable no-console */
/**
 * Fetch all ACS 5-year variables and values for all ZCTAs and write them
 * to public/data as two files:
 *  - zip-demographics-<YEAR>-all.json: { [zip]: { var: value, ... }, ... }
 *  - zip-demographics-<YEAR>-metadata.json: { variables: { name: { label, concept }, ... } }
 *
 * Notes:
 *  - Requires CENSUS_API_KEY in environment.
 *  - This can generate a very large file (hundreds of MB). Be mindful of disk space.
 *  - Uses parallel requests with controlled concurrency for speed.
 *  - Writes incrementally to avoid memory issues.
 */
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import process from 'process';

const YEAR = process.env.CENSUS_YEAR || '2022'; // ACS 5-year vintage
const DATASET = 'acs/acs5';
const API_ROOT = 'https://api.census.gov/data';
const API_KEY = process.env.CENSUS_API_KEY;

// Tuning knobs
const MAX_VARS_PER_CALL = 40; // keep URLs under limits
const CONCURRENT_REQUESTS = 10; // parallel requests for speed
const TEMP_DIR = path.join(os.tmpdir(), 'census-fetch');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 429 && attempt < retries - 1) {
          // Rate limited - wait longer and retry
          await sleep(2000 * (attempt + 1));
          continue;
        }
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} for ${url}\n${text}`);
      }
      return res.json();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await sleep(1000 * (attempt + 1));
    }
  }
}

async function getAllVariables() {
  const url = `${API_ROOT}/${YEAR}/${DATASET}/variables.json`;
  const payload = await fetchJson(url);
  return payload.variables || {};
}

function filterVariableNames(variablesObj) {
  const names = Object.keys(variablesObj);
  const excluded = new Set([
    'GEO_ID',
    'NAME',
    'state',
    'county',
    'tract',
    'block group',
    'us',
    'region',
    'division',
    'metropolitan statistical area/micropolitan statistical area',
    'combined statistical area',
    'metropolitan division',
    'urban area',
    'congressional district',
    'public use microdata area',
    'school district (elementary)',
    'school district (secondary)',
    'school district (unified)',
    'place',
    'county subdivision',
    'state legislative district (upper chamber)',
    'state legislative district (lower chamber)',
    'zip code tabulation area',
  ]);

  return names.filter((n) => {
    if (excluded.has(n)) return false;
    if (/_\d{3}[EM]$/.test(n)) return true;
    if (/^[A-Z]\w+$/.test(n) && !/[a-z]$/.test(n)) return true;
    return false;
  });
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function buildDataUrl(varsChunk) {
  const getParam = encodeURIComponent(varsChunk.join(','));
  const forParam = encodeURIComponent('zip code tabulation area:*');
  const key = API_KEY ? `&key=${encodeURIComponent(API_KEY)}` : '';
  return `${API_ROOT}/${YEAR}/${DATASET}?get=${getParam}&for=${forParam}${key}`;
}

function parseTable(headers, rows) {
  const zipIdx = headers.indexOf('zip code tabulation area');
  if (zipIdx < 0) {
    throw new Error('headers missing "zip code tabulation area"');
  }
  const headerToIndex = new Map(headers.map((h, i) => [h, i]));
  const out = new Map();
  for (const row of rows) {
    const zip = row[zipIdx];
    if (!zip) continue;
    const current = out.get(zip) || {};
    for (const h of headers) {
      if (h === 'zip code tabulation area') continue;
      const idx = headerToIndex.get(h);
      const val = row[idx];
      if (val === null || val === 'null' || val === '-666666666' || val === '-999999') {
        continue;
      }
      const num = Number(val);
      current[h] = Number.isFinite(num) ? num : val;
    }
    out.set(zip, current);
  }
  return out;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Process a single chunk and write to temp file
 */
async function processChunk(chunk, chunkIndex) {
  const url = buildDataUrl(chunk);
  try {
    const json = await fetchJson(url);
    const [headers, ...rows] = json;
    const parsed = parseTable(headers, rows);

    const tempFile = path.join(TEMP_DIR, `chunk-${chunkIndex}.json`);
    const tempObj = {};
    for (const [zip, data] of parsed.entries()) {
      tempObj[zip] = data;
    }
    await fs.writeFile(tempFile, JSON.stringify(tempObj), 'utf-8');
    return { success: true, tempFile, zipCount: parsed.size };
  } catch (err) {
    console.error(`Chunk ${chunkIndex} failed:`, err.message);
    return { success: false, tempFile: null, zipCount: 0 };
  }
}

/**
 * Process chunks in parallel with controlled concurrency
 */
async function processChunksParallel(chunks) {
  const results = [];
  const tempFiles = [];
  let processed = 0;
  let allZips = new Set();

  // Process in batches of CONCURRENT_REQUESTS
  for (let i = 0; i < chunks.length; i += CONCURRENT_REQUESTS) {
    const batch = chunks.slice(i, i + CONCURRENT_REQUESTS);
    const batchPromises = batch.map((chunk, batchIdx) => 
      processChunk(chunk, i + batchIdx)
    );

    const batchResults = await Promise.all(batchPromises);
    
    for (const result of batchResults) {
      if (result.success && result.tempFile) {
        tempFiles.push(result.tempFile);
        allZips.add(result.zipCount); // Track that we got data
      }
      results.push(result);
    }

    processed += batch.length;
    if (processed % 50 === 0 || processed === chunks.length) {
      console.log(`Processed ${processed}/${chunks.length} chunks...`);
    }

    // Small delay between batches to be polite
    if (i + CONCURRENT_REQUESTS < chunks.length) {
      await sleep(100);
    }
  }

  return { tempFiles, allZips };
}

/**
 * Merge multiple JSON files containing ZIP code data into a single object.
 */
async function mergeJsonFiles(filePaths) {
  const merged = {};
  let processed = 0;
  for (const filePath of filePaths) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      for (const [zip, zipData] of Object.entries(data)) {
        if (!merged[zip]) merged[zip] = {};
        Object.assign(merged[zip], zipData);
      }
      processed++;
      if (processed % 100 === 0) {
        console.log(`  Merged ${processed}/${filePaths.length} files...`);
      }
    } catch (err) {
      console.error(`Error reading ${filePath}:`, err.message);
    }
  }
  return merged;
}

async function main() {
  if (!API_KEY) {
    throw new Error('Missing CENSUS_API_KEY in environment');
  }

  const startTime = Date.now();
  await ensureDir(TEMP_DIR);
  const tempFiles = [];

  try {
    console.log(`Fetching ACS variables for ${YEAR} ${DATASET}...`);
    const variablesObj = await getAllVariables();
    const allVarNames = filterVariableNames(variablesObj);
    allVarNames.sort();
    console.log(`Variables discovered: ${allVarNames.length}`);

    const chunks = chunkArray(allVarNames, MAX_VARS_PER_CALL);
    console.log(`Downloading data in ${chunks.length} chunks (${CONCURRENT_REQUESTS} parallel requests)...`);

    const { tempFiles: files } = await processChunksParallel(chunks);
    tempFiles.push(...files);

    console.log(`\nMerging ${tempFiles.length} chunk files...`);
    const merged = await mergeJsonFiles(tempFiles);
    console.log(`Merged data for ${Object.keys(merged).length} ZIP codes`);

    const outDir = path.resolve('public', 'data');
    await ensureDir(outDir);

    // Write metadata
    const metadata = {
      year: YEAR,
      dataset: DATASET,
      variables: Object.fromEntries(
        Object.entries(variablesObj)
          .filter(([name]) => allVarNames.includes(name))
          .map(([name, meta]) => [
            name,
            {
              label: meta.label,
              concept: meta.concept,
              group: meta.group,
              predicateType: meta.predicateType,
            },
          ]),
      ),
      generatedAt: new Date().toISOString(),
      host: os.hostname(),
      totalZips: Object.keys(merged).length,
      totalVariables: allVarNames.length,
    };
    const metadataPath = path.resolve(outDir, `zip-demographics-${YEAR}-metadata.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`Wrote variable metadata: ${metadataPath}`);

    // Write data
    const dataPath = path.resolve(outDir, `zip-demographics-${YEAR}-all.json`);
    console.log(`Writing final data file (this may take a while for large datasets)...`);
    await fs.writeFile(dataPath, JSON.stringify(merged, null, 2), 'utf-8');
    
    const stats = await fs.stat(dataPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✓ Complete! Wrote ZIP data for ${Object.keys(merged).length} ZCTAs (${sizeMB} MB)`);
    console.log(`  Total time: ${elapsed}s`);
    console.log(`  Output: ${dataPath}`);
  } finally {
    // Clean up temp files
    console.log(`\nCleaning up ${tempFiles.length} temporary files...`);
    for (const tempFile of tempFiles) {
      try {
        await fs.unlink(tempFile);
      } catch (err) {
        // Ignore errors on cleanup
      }
    }
  }
}

// Node 18+ has global fetch; ensure it's available
if (typeof fetch === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  global.fetch = (await import('node-fetch')).default;
}

await main();
