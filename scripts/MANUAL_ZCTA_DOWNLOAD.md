# Manual ZCTA Data Download Instructions

Since automated download from Census Bureau is not working, please follow these steps:

## Step 1: Download ZCTA Shapefile

1. Go to: https://www.census.gov/cgi-bin/geo/shapefiles/index.php
2. Select:
   - **Layer Group:** ZIP Code Tabulation Areas
   - **Year:** 2020 (or latest available)
3. Click "Download" - this will download a zip file (~500MB)

OR use direct download (if available):
- https://www2.census.gov/geo/tiger/TIGER2020/ZCTA5/tl_2020_us_zcta520.zip

## Step 2: Convert Shapefile to GeoJSON

### Option A: Using MapShaper (Easiest - No Installation)
1. Go to: https://mapshaper.org/
2. Drag and drop the downloaded `.zip` file
3. Click "Export" → Select "GeoJSON"
4. Save the file as `zcta-all.geojson`

### Option B: Using GDAL (Command Line)
```bash
# Extract the zip file first
unzip tl_2020_us_zcta520.zip

# Convert to GeoJSON
ogr2ogr -f GeoJSON zcta-all.geojson tl_2020_us_zcta520.shp
```

## Step 3: Process and Filter

Run the processing script to filter to your serviceable states (excluding IL and KY):

```bash
node scripts/process-zip-boundaries.js zcta-all.geojson public/data/territory-map/zipcode-boundaries.geojson
```

This will:
- Filter to: AL, AR, GA, KS, LA, MS, MO, NC, OK, SC, TN, TX
- Remove: IL and KY
- Standardize zip code properties
- Optimize the file

## Step 4: Verify

After processing, the map should show all zip codes in your territories, including Oklahoma.

## Alternative: Use Pre-processed Data

If you have access to a pre-processed GeoJSON file with all US zip codes, you can skip steps 1-2 and go directly to Step 3.


