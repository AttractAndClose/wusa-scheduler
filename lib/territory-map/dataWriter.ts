import type { 
  Territory, 
  TerritoryAssignment, 
  Representative, 
  ZipCodeMetadata, 
  FunnelData 
} from '@/types/territory-map';
import { clearTerritoriesCache, clearAssignmentsCache, clearRepresentativesCache, clearZipCodeMetadataCache, clearFunnelDataCache } from './dataLoader';

/**
 * Save data via API routes (server-side file writes)
 */

export async function saveTerritories(territories: Territory[]): Promise<boolean> {
  try {
    const response = await fetch('/api/territory-map/territories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(territories)
    });
    if (!response.ok) {
      throw new Error('Failed to save territories');
    }
    clearTerritoriesCache();
    return true;
  } catch (error) {
    console.error('Error saving territories:', error);
    return false;
  }
}

export async function createTerritory(territory: Omit<Territory, 'id' | 'createdAt'>): Promise<Territory | null> {
  try {
    const response = await fetch('/api/territory-map/territories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(territory)
    });
    if (!response.ok) {
      throw new Error('Failed to create territory');
    }
    const data = await response.json();
    clearTerritoriesCache();
    return data;
  } catch (error) {
    console.error('Error creating territory:', error);
    return null;
  }
}

export async function updateTerritory(id: string, updates: Partial<Territory>): Promise<boolean> {
  try {
    const response = await fetch(`/api/territory-map/territories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      throw new Error('Failed to update territory');
    }
    clearTerritoriesCache();
    return true;
  } catch (error) {
    console.error('Error updating territory:', error);
    return false;
  }
}

export async function deleteTerritory(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/territory-map/territories/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete territory');
    }
    clearTerritoriesCache();
    return true;
  } catch (error) {
    console.error('Error deleting territory:', error);
    return false;
  }
}

export async function saveAssignments(assignments: TerritoryAssignment): Promise<boolean> {
  try {
    const response = await fetch('/api/territory-map/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignments)
    });
    if (!response.ok) {
      throw new Error('Failed to save assignments');
    }
    clearAssignmentsCache();
    return true;
  } catch (error) {
    console.error('Error saving assignments:', error);
    return false;
  }
}

export async function assignZipCode(zipCode: string, territoryId: string | null): Promise<boolean> {
  try {
    const response = await fetch(`/api/territory-map/zipcodes/${zipCode}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ territoryId })
    });
    if (!response.ok) {
      throw new Error('Failed to assign zip code');
    }
    clearAssignmentsCache();
    return true;
  } catch (error) {
    console.error('Error assigning zip code:', error);
    return false;
  }
}

export async function saveRepresentatives(representatives: Representative[]): Promise<boolean> {
  try {
    const response = await fetch('/api/territory-map/representatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(representatives)
    });
    if (!response.ok) {
      throw new Error('Failed to save representatives');
    }
    clearRepresentativesCache();
    return true;
  } catch (error) {
    console.error('Error saving representatives:', error);
    return false;
  }
}

export async function saveFunnelData(funnelData: FunnelData[]): Promise<boolean> {
  try {
    const response = await fetch('/api/territory-map/data/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'funnel', data: funnelData })
    });
    if (!response.ok) {
      throw new Error('Failed to save funnel data');
    }
    clearFunnelDataCache();
    return true;
  } catch (error) {
    console.error('Error saving funnel data:', error);
    return false;
  }
}

export async function saveZipCodeMetadata(metadata: ZipCodeMetadata): Promise<boolean> {
  try {
    const response = await fetch('/api/territory-map/data/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metrics', data: metadata })
    });
    if (!response.ok) {
      throw new Error('Failed to save zip code metadata');
    }
    clearZipCodeMetadataCache();
    return true;
  } catch (error) {
    console.error('Error saving zip code metadata:', error);
    return false;
  }
}

