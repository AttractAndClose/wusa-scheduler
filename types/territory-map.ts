// Territory Map Type Definitions

export interface Territory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface TerritoryAssignment {
  [zipCode: string]: string | null; // zip code -> territory ID or null
}

export interface Representative {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: {
    lat: number;
    lng: number;
  };
  territoryId: string | null;
  active: boolean;
}

export interface ZipCodeMetadata {
  [zipCode: string]: {
    population?: number;
    householdIncome?: number;
    county?: string;
    state?: string;
  };
}

export interface FunnelData {
  zipCode: string;
  date: string;
  leads?: number;
  appointments?: number;
  sales?: number;
  revenue?: number;
}

export interface DriveTimeCache {
  [cacheKey: string]: {
    minutes: number;
    repLocations: Array<{ lat: number; lng: number }>;
    coveredZipCodes: string[];
    calculatedAt: string;
  };
}

export interface IsochroneRequest {
  minutes: number;
  repLocations: Array<{
    lat: number;
    lng: number;
    repId?: string;
  }>;
}

export interface IsochroneResponse {
  coveredZipCodes: string[];
  isochrones: Array<{
    type: 'Feature';
    geometry: {
      type: 'Polygon';
      coordinates: number[][][];
    };
    properties: {
      contour: number;
    };
  }>;
}

export type VisualizationMetric = 
  | 'leads' 
  | 'appointments' 
  | 'sales' 
  | 'revenue' 
  | 'population' 
  | 'householdIncome';

export type ColorScale = 'sequential' | 'diverging';

export interface VisualizationData {
  zipCode: string;
  value: number;
  metric: VisualizationMetric;
}

