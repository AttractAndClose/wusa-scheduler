'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Users, DollarSign, GraduationCap, Home, TrendingUp } from 'lucide-react';
import type { Address } from '@/types';

interface CensusStatsProps {
  address: Address;
}

interface CensusData {
  population?: number;
  medianIncome?: number;
  education?: number;
  medianHomeValue?: number;
  unemploymentRate?: number;
}

const CENSUS_API_KEY = '0df30a31dc37d3ead8748c5d536f86cb7e379b59';
const CENSUS_YEAR = '2022'; // Using 2022 ACS 5-Year estimates (most recent comprehensive data)

export function CensusStats({ address }: CensusStatsProps) {
  const [censusData, setCensusData] = useState<CensusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCensusData() {
      if (!address.zip) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Extract just the 5-digit zip code (in case of ZIP+4)
        const zipCode = address.zip.substring(0, 5);

        // Census API variables:
        // B01003_001E: Total Population
        // B19013_001E: Median Household Income
        // B15003_022E: Bachelor's Degree or Higher (25 years and over)
        // B15003_001E: Total Population 25 years and over (for percentage calculation)
        // B25077_001E: Median Home Value
        // B23025_005E: Unemployed Population
        // B23025_002E: Labor Force (for unemployment rate calculation)

        const variables = [
          'B01003_001E', // Total Population
          'B19013_001E', // Median Household Income
          'B15003_022E', // Bachelor's Degree or Higher
          'B15003_001E', // Total 25+ Population
          'B25077_001E', // Median Home Value
          'B23025_005E', // Unemployed
          'B23025_002E', // Labor Force
        ].join(',');

        const url = `https://api.census.gov/data/${CENSUS_YEAR}/acs/acs5?get=${variables}&for=zip%20code%20tabulation%20area:${zipCode}&key=${CENSUS_API_KEY}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Census API error: ${response.status}`);
        }

        const data = await response.json();

        // Census API returns data as array of arrays
        // First array is headers, second is data
        if (data && data.length > 1 && data[1]) {
          const row = data[1];
          const headers = data[0];

          // Find indices for each variable
          const getValue = (varName: string): number | null => {
            const index = headers.indexOf(varName);
            if (index === -1 || !row[index] || row[index] === '-999999' || row[index] === 'null') {
              return null;
            }
            return parseInt(row[index], 10);
          };

          const population = getValue('B01003_001E');
          const medianIncome = getValue('B19013_001E');
          const bachelorsPlus = getValue('B15003_022E');
          const total25Plus = getValue('B15003_001E');
          const medianHomeValue = getValue('B25077_001E');
          const unemployed = getValue('B23025_005E');
          const laborForce = getValue('B23025_002E');

          // Calculate education percentage
          let educationPercent = null;
          if (bachelorsPlus !== null && total25Plus !== null && total25Plus > 0) {
            educationPercent = Math.round((bachelorsPlus / total25Plus) * 100);
          }

          // Calculate unemployment rate
          let unemploymentRate = null;
          if (unemployed !== null && laborForce !== null && laborForce > 0) {
            unemploymentRate = Math.round((unemployed / laborForce) * 100 * 10) / 10; // Round to 1 decimal
          }

          setCensusData({
            population: population || undefined,
            medianIncome: medianIncome || undefined,
            education: educationPercent || undefined,
            medianHomeValue: medianHomeValue || undefined,
            unemploymentRate: unemploymentRate || undefined,
          });
        } else {
          setError('No data available for this ZIP code');
        }
      } catch (err) {
        console.error('Error fetching census data:', err);
        setError('Unable to load census data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCensusData();
  }, [address.zip]);

  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <h2 className="text-xl font-semibold text-navy mb-4">
          ZIP Code Demographics
        </h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-navy text-sm">Loading census data...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <h2 className="text-xl font-semibold text-navy mb-4">
          ZIP Code Demographics
        </h2>
        <div className="text-center py-4">
          <p className="text-navy/70 text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  if (!censusData || Object.keys(censusData).length === 0) {
    return null;
  }

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return 'N/A';
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return num.toLocaleString();
  };

  const formatPopulation = (num: number | undefined): string => {
    if (num === undefined || num === null) return 'N/A';
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  return (
    <Card className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
      <h2 className="text-xl font-semibold text-navy mb-4">
        ZIP Code Demographics ({address.zip.substring(0, 5)})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {censusData.population !== undefined && (
          <div className="flex items-start gap-3 p-3 bg-gray-light rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-navy/60 font-medium">Population</div>
              <div className="text-lg font-semibold text-navy">
                {formatPopulation(censusData.population)}
              </div>
            </div>
          </div>
        )}

        {censusData.medianIncome !== undefined && (
          <div className="flex items-start gap-3 p-3 bg-gray-light rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-navy/60 font-medium">Median Household Income</div>
              <div className="text-lg font-semibold text-navy">
                {formatNumber(censusData.medianIncome)}
              </div>
            </div>
          </div>
        )}

        {censusData.education !== undefined && (
          <div className="flex items-start gap-3 p-3 bg-gray-light rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-navy/60 font-medium">Bachelor's Degree or Higher</div>
              <div className="text-lg font-semibold text-navy">
                {censusData.education}%
              </div>
            </div>
          </div>
        )}

        {censusData.medianHomeValue !== undefined && (
          <div className="flex items-start gap-3 p-3 bg-gray-light rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-navy/60 font-medium">Median Home Value</div>
              <div className="text-lg font-semibold text-navy">
                {formatNumber(censusData.medianHomeValue)}
              </div>
            </div>
          </div>
        )}

        {censusData.unemploymentRate !== undefined && (
          <div className="flex items-start gap-3 p-3 bg-gray-light rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-navy/60 font-medium">Unemployment Rate</div>
              <div className="text-lg font-semibold text-navy">
                {censusData.unemploymentRate}%
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-xs text-navy/50">
        Data from U.S. Census Bureau {CENSUS_YEAR} ACS 5-Year Estimates
      </p>
    </Card>
  );
}

