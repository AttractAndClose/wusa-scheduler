import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { VisualizationData, VisualizationMetric } from '@/types/territory-map';

export const dynamic = 'force-dynamic';

const FUNNEL_DATA_FILE = path.join(process.cwd(), 'public', 'data', 'territory-map', 'funnel-data.json');
const METADATA_FILE = path.join(process.cwd(), 'public', 'data', 'territory-map', 'zipcode-metadata.json');

// GET - Return aggregated data for visualization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric') as VisualizationMetric || 'leads';
    
    const visualizationData: VisualizationData[] = [];
    
    if (['leads', 'appointments', 'sales', 'revenue'].includes(metric)) {
      // Load funnel data
      try {
        const funnelContent = await fs.readFile(FUNNEL_DATA_FILE, 'utf8');
        const funnelData = JSON.parse(funnelContent);
        
        // Aggregate by zip code
        const aggregated: { [zipCode: string]: number } = {};
        
        for (const record of funnelData) {
          const zipCode = record.zipCode;
          if (!aggregated[zipCode]) {
            aggregated[zipCode] = 0;
          }
          
          if (metric === 'leads') {
            aggregated[zipCode] += record.leads || 0;
          } else if (metric === 'appointments') {
            aggregated[zipCode] += record.appointments || 0;
          } else if (metric === 'sales') {
            aggregated[zipCode] += record.sales || 0;
          } else if (metric === 'revenue') {
            aggregated[zipCode] += record.revenue || 0;
          }
        }
        
        // Convert to array
        for (const [zipCode, value] of Object.entries(aggregated)) {
          visualizationData.push({
            zipCode,
            value,
            metric
          });
        }
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    } else if (['population', 'householdIncome'].includes(metric)) {
      // Load metadata
      try {
        const metadataContent = await fs.readFile(METADATA_FILE, 'utf8');
        const metadata = JSON.parse(metadataContent);
        
        for (const [zipCode, data] of Object.entries(metadata)) {
          const value = metric === 'population' 
            ? (data as any).population || 0
            : (data as any).householdIncome || 0;
          
          visualizationData.push({
            zipCode,
            value,
            metric
          });
        }
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }
    
    return NextResponse.json(visualizationData);
  } catch (error) {
    console.error('Error loading visualization data:', error);
    return NextResponse.json({ error: 'Failed to load visualization data' }, { status: 500 });
  }
}

