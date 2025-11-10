'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Territory, TerritoryAssignment, Representative, VisualizationData } from '@/types/territory-map';
import { loadTerritories, loadAssignments, loadRepresentatives, loadZipCodeBoundaries } from '@/lib/territory-map/dataLoader';
import { assignZipCode } from '@/lib/territory-map/dataWriter';
import { 
  initializeMap, 
  addZipCodeSource, 
  addTerritoryLayers, 
  updateZipCodeColors,
  addRepresentativeMarkers,
  addIsochroneLayer,
  addDataVisualizationLayer,
  removeDataVisualizationLayer
} from '@/lib/territory-map/mapbox';

interface TerritoryMapProps {
  onZipCodeSelect?: (zipCode: string | null) => void;
  selectedZipCode?: string | null;
  showDriveTime?: boolean;
  driveTimeMinutes?: number;
  driveTimeZipCodes?: string[];
  showDataVisualization?: boolean;
  visualizationData?: VisualizationData[];
  visualizationMetric?: string;
  visualizationMin?: number;
  visualizationMax?: number;
  visualizationColorScale?: 'sequential' | 'diverging';
}

export default function TerritoryMap({
  onZipCodeSelect,
  selectedZipCode,
  showDriveTime = false,
  driveTimeMinutes = 30,
  driveTimeZipCodes = [],
  showDataVisualization = false,
  visualizationData = [],
  visualizationMetric = 'leads',
  visualizationMin = 0,
  visualizationMax = 100,
  visualizationColorScale = 'sequential'
}: TerritoryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [assignments, setAssignments] = useState<TerritoryAssignment>({});
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [zipCodeBoundaries, setZipCodeBoundaries] = useState<GeoJSON.FeatureCollection>({ type: 'FeatureCollection', features: [] });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = initializeMap(mapContainer.current);
      
      map.current.on('load', async () => {
        await loadData();
      });

      // Handle zip code clicks
      map.current.on('click', 'zipcode-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties || {};
          const zipCode = props.zipCode || 
                         props.ZCTA5CE20 || 
                         props.ZCTA5CE10 || 
                         props.ZIP_CODE ||
                         props.ZIPCODE ||
                         props.ZIP ||
                         props.GEOID20?.substring(0, 5);
          if (zipCode && onZipCodeSelect) {
            onZipCodeSelect(zipCode.toString());
          }
        }
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'zipcode-fill', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current.on('mouseleave', 'zipcode-fill', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      setIsLoading(false);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, []);

  // Load data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [territoriesData, assignmentsData, representativesData, boundariesData] = await Promise.all([
        loadTerritories(),
        loadAssignments(),
        loadRepresentatives(),
        loadZipCodeBoundaries()
      ]);

      setTerritories(territoriesData);
      setAssignments(assignmentsData);
      setRepresentatives(representativesData);
      setZipCodeBoundaries(boundariesData);

      // Add zip code source and layers
      if (map.current && boundariesData.features.length > 0) {
        addZipCodeSource(map.current, boundariesData);
        addTerritoryLayers(map.current);
        updateZipCodeColors(map.current, boundariesData, territoriesData, assignmentsData);
        
        // Add representative markers
        const markers = addRepresentativeMarkers(map.current, representativesData, territoriesData);
        markersRef.current = markers;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update map when assignments change
  useEffect(() => {
    if (map.current && zipCodeBoundaries.features.length > 0 && territories.length > 0) {
      if (showDataVisualization && visualizationData.length > 0) {
        addDataVisualizationLayer(
          map.current,
          zipCodeBoundaries,
          visualizationData,
          visualizationMin,
          visualizationMax,
          visualizationColorScale
        );
      } else {
        updateZipCodeColors(map.current, zipCodeBoundaries, territories, assignments);
      }
    }
  }, [assignments, territories, zipCodeBoundaries, showDataVisualization, visualizationData, visualizationMin, visualizationMax, visualizationColorScale]);

  // Update drive time visualization
  useEffect(() => {
    if (!map.current || !showDriveTime) {
      // Remove isochrone layer
      if (map.current) {
        if (map.current.getLayer('isochrone-fill')) {
          map.current.removeLayer('isochrone-fill');
        }
        if (map.current.getLayer('isochrone-border')) {
          map.current.removeLayer('isochrone-border');
        }
        if (map.current.getSource('isochrones')) {
          map.current.removeSource('isochrones');
        }
      }
      return;
    }

    // Highlight covered zip codes
    if (driveTimeZipCodes.length > 0 && zipCodeBoundaries.features.length > 0) {
      const features = zipCodeBoundaries.features.map(feature => {
        const props = feature.properties || {};
        const zipCode = props.zipCode || 
                       props.ZCTA5CE20 || 
                       props.ZCTA5CE10 || 
                       props.ZIP_CODE ||
                       props.ZIPCODE ||
                       props.ZIP ||
                       props.GEOID20?.substring(0, 5) ||
                       '';
        const isCovered = driveTimeZipCodes.includes(zipCode.toString());
        
        return {
          ...feature,
          properties: {
            ...feature.properties,
            zipCode,
            isCovered,
            territoryColor: isCovered ? '#4ECDC4' : (feature.properties?.territoryColor || '#ffffff')
          }
        };
      });

      const updatedGeoJson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features
      };

      addZipCodeSource(map.current, updatedGeoJson);
    }
  }, [showDriveTime, driveTimeZipCodes, zipCodeBoundaries]);

  // Handle zip code assignment
  const handleAssignZipCode = async (zipCode: string, territoryId: string | null) => {
    const success = await assignZipCode(zipCode, territoryId);
    if (success) {
      const newAssignments = await loadAssignments();
      setAssignments(newAssignments);
    }
  };

  // Update representatives when they change
  useEffect(() => {
    if (map.current && representatives.length > 0 && territories.length > 0) {
      markersRef.current.forEach(marker => marker.remove());
      const markers = addRepresentativeMarkers(map.current, representatives, territories);
      markersRef.current = markers;
    }
  }, [representatives, territories]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-navy">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainer} className="h-full w-full" />
  );
}

