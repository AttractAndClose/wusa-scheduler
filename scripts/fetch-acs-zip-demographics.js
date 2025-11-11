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
 *  - Uses chunking to respect URL length limits and API rate limits.
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
const PAUSE_MS_BETWEEN_CALLS = 250; // be polite to the API
const TEMP_DIR = path.join(os.tmpdir(), 'census-fetch');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} for ${url}\n${text}`);
  }
  return res.json();
}

async function getAllVariables() {
  const url = `${API_ROOT}/${YEAR}/${DATASET}/variables.json`;
  const payload = await fetchJson(url);
  // payload.variables is an object: { varName: { label, concept, ... }, ... }
  return payload.variables || {};
}

function filterVariableNames(variablesObj) {
  const names = Object.keys(variablesObj);
  // Keep only numeric table variables and geography fields needed.
  // Exclude predicate-only fields and annotations that are not numeric (e.g., "GEO_ID", "NAME")
  // The ACS uses suffixes:
  //  - _001E (estimate), _001M (MOE). We'll include both to satisfy "every data point".
  // Geography fields required: "zip code tabulation area"
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
    'zip code tabulation area', // we don't request it as a "get" variable; it's in 'for='
  ]);

  return names.filter((n) => {
    if (excluded.has(n)) return false;
    // Keep B*, C* tables and numeric aggregates. Many valid ACS var names start with letters.
    // Exclude annotations ending in "A", "EA", "MA", etc. Keep E (estimate) and M (MOE).
    // Variables often look like B01001_001E, B01001_001M
    // Keep if ends with E or M, or looks numeric without suffix (e.g., some totals).
    if (/_\d{3}[EM]$/.test(n)) return true; // common ACS pattern
    // Some variables are simple aggregates like B00001e1 in other datasets; be permissive:
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
  const out = new Map(); // zip -> rowData
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
      // Cast to number when appropriate
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
 * Merge multiple JSON files containing ZIP code data into a single object.
 * Each file should be { [zip]: { ...data... }, ... }
 */
async function mergeJsonFiles(filePaths) {
  const merged = {};
  for (const filePath of filePaths) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      for (const [zip, zipData] of Object.entries(data)) {
        if (!merged[zip]) merged[zip] = {};
        Object.assign(merged[zip], zipData);
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

  // Clean up temp directory
  await ensureDir(TEMP_DIR);
  const tempFiles = [];

  try {
    console.log(`Fetching ACS variables for ${YEAR} ${DATASET}...`);
    const variablesObj = await getAllVariables();
    const allVarNames = filterVariableNames(variablesObj);
    allVarNames.sort();
    console.log(`Variables discovered: ${allVarNames.length}`);

    const chunks = chunkArray(allVarNames, MAX_VARS_PER_CALL);
    console.log(`Downloading data in ${chunks.length} chunks of up to ${MAX_VARS_PER_CALL} variables each...`);

    let processed = 0;
    let allZips = new Set();

    // Process chunks and write each to a temp file
    for (const chunk of chunks) {
      const url = buildDataUrl(chunk);
      try {
        const json = await fetchJson(url);
        const [headers, ...rows] = json;
        const parsed = parseTable(headers, rows);

        // Track all ZIPs we've seen
        for (const zip of parsed.keys()) {
          allZips.add(zip);
        }

        // Write this chunk to a temp file
        const tempFile = path.join(TEMP_DIR, `chunk-${processed}.json`);
        const tempObj = {};
        for (const [zip, data] of parsed.entries()) {
          tempObj[zip] = data;
        }
        await fs.writeFile(tempFile, JSON.stringify(tempObj), 'utf-8');
        tempFiles.push(tempFile);

        processed += 1;
        if (processed % 10 === 0) {
          console.log(`Processed ${processed}/${chunks.length} chunks... unique ZIPs: ${allZips.size}`);
        }
      } catch (err) {
        console.error(`Chunk failed (${processed + 1}/${chunks.length}):`, err.message);
        processed += 1;
      }
      await sleep(PAUSE_MS_BETWEEN_CALLS);
    }

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

    // Write data - use streaming write for large files
    const dataPath = path.resolve(outDir, `zip-demographics-${YEAR}-all.json`);
    console.log(`Writing final data file (this may take a while for large datasets)...`);
    await fs.writeFile(dataPath, JSON.stringify(merged, null, 2), 'utf-8');
    
    const stats = await fs.stat(dataPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`Wrote ZIP data for ${Object.keys(merged).length} ZCTAs (${sizeMB} MB): ${dataPath}`);
  } finally {
    // Clean up temp files
    console.log(`Cleaning up ${tempFiles.length} temporary files...`);
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
