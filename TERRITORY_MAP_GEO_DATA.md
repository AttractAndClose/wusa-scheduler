# Getting GeoJSON Data for Territory Map

This guide explains how to obtain zip code boundary GeoJSON data for the territory mapping system.

## Quick Start - Recommended Sources

### Option 1: US Census Bureau TIGER/Line (Free, Official)

**Best for:** Production use, official boundaries

1. **Download ZCTA (Zip Code Tabulation Areas) Shapefiles:**
   - Go to: https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html
   - Select the latest year (2023 or 2024)
   - Download "ZIP Code Tabulation Areas (ZCTAs)"
   - File will be a `.shp` shapefile

2. **Convert Shapefile to GeoJSON:**
   - Use online converter: https://mapshaper.org/
     - Upload the `.shp` file
     - Export as GeoJSON
   - Or use command line with `ogr2ogr`:
     ```bash
     ogr2ogr -f GeoJSON zcta.geojson tl_2023_us_zcta520.shp
     ```

3. **Filter to Your Serviceable States:**
   - The GeoJSON will include all US zip codes
   - Filter to your states: AL, AR, GA, IL, KS, KY, LA, MS, MO, NC, OK, SC, TN, TX
   - See script below for automated filtering

### Option 2: SimpleMaps (Paid, Easy)

**Best for:** Quick setup, smaller file sizes

- Website: https://simplemaps.com/data/us-zips
- Provides pre-filtered GeoJSON by state
- Costs ~$50-100 but saves processing time
- Download GeoJSON directly

### Option 3: OpenStreetMap (Free, Community)

**Best for:** International coverage, open source

- Use Overpass API or download from Geofabrik
- Requires more processing but completely free
- May need to filter and clean data

## Automated Processing Script

I've created a script to help you process the data. See `scripts/process-zip-boundaries.js`

## Manual Processing Steps

### Step 1: Download Data

```bash
# Example: Download 2023 ZCTA data
wget https://www2.census.gov/geo/tiger/TIGER2023/ZCTA5/tl_2023_us_zcta520.zip
unzip tl_2023_us_zcta520.zip
```

### Step 2: Convert to GeoJSON

```bash
# Install GDAL tools (if not installed)
# macOS: brew install gdal
# Ubuntu: sudo apt-get install gdal-bin

ogr2ogr -f GeoJSON zcta-all.geojson tl_2023_us_zcta520.shp
```

### Step 3: Filter to Serviceable States

Use the provided script or manually filter in a GIS tool.

### Step 4: Place in Project

```bash
# Copy filtered GeoJSON to project
cp zcta-filtered.geojson public/data/territory-map/zipcode-boundaries.geojson
```

## GeoJSON Format Requirements

Your GeoJSON file should have this structure:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "ZCTA5CE20": "30144",  // or "ZCTA5CE10" or "ZIP_CODE"
        "GEOID20": "30144"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], [lng, lat], ...]]
      }
    }
  ]
}
```

**Important:** The zip code property name may vary:
- `ZCTA5CE20` (2020 Census)
- `ZCTA5CE10` (2010 Census)
- `ZIP_CODE` (some sources)

The code handles multiple property names automatically.

## File Size Considerations

- Full US ZCTA GeoJSON: ~200-500 MB
- Filtered to your 14 states: ~50-150 MB
- Consider simplifying polygons for web use (reduce precision)

### Simplify Polygons (Reduce File Size)

```bash
# Using mapshaper (online or CLI)
mapshaper zcta-filtered.geojson -simplify 10% -o zcta-simplified.geojson
```

## Testing Your GeoJSON

1. Place file in `public/data/territory-map/zipcode-boundaries.geojson`
2. Open territory map page
3. Check browser console for errors
4. Verify zip codes appear on map

## Territory Boundaries

Territory boundaries are created dynamically from assigned zip codes - no separate file needed. The map colors zip codes based on territory assignments.

## Need Help?

- Check browser console for GeoJSON parsing errors
- Verify zip code property names match
- Ensure coordinates are in [lng, lat] format (GeoJSON standard)
- Test with a small subset first

