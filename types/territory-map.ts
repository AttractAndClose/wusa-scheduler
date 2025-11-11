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

/**
 * Comprehensive affiliate funnel data from CSV
 * Based on All-Affiliate-Funnel.csv structure
 */
export interface AffiliateFunnelData {
  id: string; // Salesforce Lead ID
  leadSource: string; // Primary Lead Source
  leadSourceDetails: string; // Sub Lead Source
  leadCreateDate: string; // Date the lead was created
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  territory: string; // Sales territory
  efScore: number | null; // Equifax score
  thinkUnlimitedProspectScore: string | null; // Prospect score (Bronze, Silver, Gold, Platinum)
  thinkUnlimitedScheduleScore: string | null; // Schedule score (Low, Medium, High)
  set: number; // Appointment set, 1 yes, 0 no
  setDate: string | null; // Appointment set date
  apptCanceled: number; // Appointment canceled
  noPitch: number; // Rep showed up but was unable to make the sales pitch
  pitch: number; // Pitch complete
  pitchDate: string | null; // Pitch date
  creditRan: number; // We ran the credit yes or no
  creditScore: number | null; // Credit score
  lenderApproved: number; // The lender approved yes or no
  financeDecline: number; // Finance decline yes or no
  financeRejectedByCustomer: number; // Finance rejected by customer
  cashDeal: number; // Customer paid cash
  sold: number; // Sold job
  soldDate: string | null; // Sold date
  soldAmount: number | null; // Sale amount
  saleCanceled: number; // Job sold then canceled
  saleCanceledDate: string | null; // Cancel date
  installed: number; // Job installed
  installedDate: string | null; // Install date
  installedNumberOfWindows: number | null; // Number of windows installed
  installedRevenue: number | null; // Revenue of installed job
}


