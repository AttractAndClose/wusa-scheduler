'use client';

import { useState, useEffect } from 'react';
import { Users, DollarSign, GraduationCap, Home, TrendingUp, Key, Baby, Calendar, Building2, Clock, TrendingDown } from 'lucide-react';
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
  homeownershipRate?: number;
  medianGrossRent?: number;
  highIncomeHouseholds?: number;
  perCapitaIncome?: number;
  medianAge?: number;
  newConstruction?: number;
  singleFamilyHomes?: number;
  meanCommuteTime?: number;
  householdsWithChildren?: number;
  bachelorsOrHigher?: number;
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
        // B15003_022E: Bachelor's Degree (25 years and over)
        // B15003_023E: Master's Degree
        // B15003_024E: Professional School Degree
        // B15003_025E: Doctorate Degree
        // B15003_001E: Total Population 25 years and over (for percentage calculation)
        // B25077_001E: Median Home Value
        // B23025_005E: Unemployed Population
        // B23025_002E: Labor Force (for unemployment rate calculation)
        // B25003_002E: Owner-occupied Housing Units
        // B25003_001E: Total Housing Units (for homeownership rate)
        // B25064_001E: Median Gross Rent
        // B19001_014E: $100,000 to $124,999
        // B19001_015E: $125,000 to $149,999
        // B19001_016E: $150,000 to $199,999
        // B19001_017E: $200,000 or more
        // B19001_001E: Total Households (for high-income percentage)
        // B19301_001E: Per Capita Income
        // B01002_001E: Median Age
        // B25034_002E: Built 2014 or later
        // B25034_003E: Built 2010 to 2013
        // B25034_001E: Total Housing Units (for new construction percentage)
        // B25024_002E: Single-family Detached
        // B25024_001E: Total Housing Units (for single-family percentage)
        // B08013_001E: Mean Travel Time to Work (in minutes)
        // B11012_001E: Total Households (with children)
        // B11001_001E: Total Households (for households with children percentage)

        const variables = [
          'B01003_001E', // Total Population
          'B19013_001E', // Median Household Income
          'B15003_022E', // Bachelor's Degree
          'B15003_023E', // Master's Degree
          'B15003_024E', // Professional School Degree
          'B15003_025E', // Doctorate Degree
          'B15003_001E', // Total 25+ Population
          'B25077_001E', // Median Home Value
          'B23025_005E', // Unemployed
          'B23025_002E', // Labor Force
          'B25003_002E', // Owner-occupied Housing Units
          'B25003_001E', // Total Housing Units
          'B25064_001E', // Median Gross Rent
          'B19001_014E', // $100,000 to $124,999
          'B19001_015E', // $125,000 to $149,999
          'B19001_016E', // $150,000 to $199,999
          'B19001_017E', // $200,000 or more
          'B19001_001E', // Total Households (Income)
          'B19301_001E', // Per Capita Income
          'B01002_001E', // Median Age
          'B25034_002E', // Built 2014 or later
          'B25034_003E', // Built 2010 to 2013
          'B25034_001E', // Total Housing Units (Year Built)
          'B25024_002E', // Single-family Detached
          'B25024_001E', // Total Housing Units (Structure Type)
          'B08013_001E', // Mean Travel Time to Work
          'B11012_001E', // Total Households (with children)
          'B11001_001E', // Total Households
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
          const bachelors = getValue('B15003_022E');
          const masters = getValue('B15003_023E');
          const professional = getValue('B15003_024E');
          const doctorate = getValue('B15003_025E');
          const total25Plus = getValue('B15003_001E');
          const medianHomeValue = getValue('B25077_001E');
          const unemployed = getValue('B23025_005E');
          const laborForce = getValue('B23025_002E');
          const ownerOccupied = getValue('B25003_002E');
          const totalHousingUnits = getValue('B25003_001E');
          const medianGrossRent = getValue('B25064_001E');
          const income100_124 = getValue('B19001_014E');
          const income125_149 = getValue('B19001_015E');
          const income150_199 = getValue('B19001_016E');
          const income200Plus = getValue('B19001_017E');
          const totalHouseholds = getValue('B19001_001E');
          const perCapitaIncome = getValue('B19301_001E');
          const medianAge = getValue('B01002_001E');
          const built2014Plus = getValue('B25034_002E');
          const built2010_2013 = getValue('B25034_003E');
          const totalHousingYearBuilt = getValue('B25034_001E');
          const singleFamilyDetached = getValue('B25024_002E');
          const totalHousingStructure = getValue('B25024_001E');
          const meanCommuteTime = getValue('B08013_001E');
          const householdsWithChildren = getValue('B11012_001E');
          const totalHouseholdsForChildren = getValue('B11001_001E');

          // Calculate education percentage (Bachelor's only - currently displayed)
          let educationPercent = null;
          if (bachelors !== null && total25Plus !== null && total25Plus > 0) {
            educationPercent = Math.round((bachelors / total25Plus) * 100);
          }

          // Calculate Bachelor's Degree or Higher percentage
          let bachelorsOrHigherPercent = null;
          if (total25Plus !== null && total25Plus > 0) {
            const bachelorsPlus = (bachelors || 0) + (masters || 0) + (professional || 0) + (doctorate || 0);
            if (bachelorsPlus > 0) {
              bachelorsOrHigherPercent = Math.round((bachelorsPlus / total25Plus) * 100);
            }
          }

          // Calculate unemployment rate
          let unemploymentRate = null;
          if (unemployed !== null && laborForce !== null && laborForce > 0) {
            unemploymentRate = Math.round((unemployed / laborForce) * 100 * 10) / 10; // Round to 1 decimal
          }

          // Calculate homeownership rate
          let homeownershipRate = null;
          if (ownerOccupied !== null && totalHousingUnits !== null && totalHousingUnits > 0) {
            homeownershipRate = Math.round((ownerOccupied / totalHousingUnits) * 100);
          }

          // Calculate high-income households percentage
          let highIncomePercent = null;
          if (totalHouseholds !== null && totalHouseholds > 0) {
            const highIncome = (income100_124 || 0) + (income125_149 || 0) + (income150_199 || 0) + (income200Plus || 0);
            if (highIncome > 0) {
              highIncomePercent = Math.round((highIncome / totalHouseholds) * 100);
            }
          }

          // Calculate new construction percentage
          let newConstructionPercent = null;
          if (totalHousingYearBuilt !== null && totalHousingYearBuilt > 0) {
            const newConstruction = (built2014Plus || 0) + (built2010_2013 || 0);
            if (newConstruction > 0) {
              newConstructionPercent = Math.round((newConstruction / totalHousingYearBuilt) * 100);
            }
          }

          // Calculate single-family homes percentage
          let singleFamilyPercent = null;
          if (singleFamilyDetached !== null && totalHousingStructure !== null && totalHousingStructure > 0) {
            singleFamilyPercent = Math.round((singleFamilyDetached / totalHousingStructure) * 100);
          }

          // Calculate households with children percentage
          let householdsWithChildrenPercent = null;
          if (householdsWithChildren !== null && totalHouseholdsForChildren !== null && totalHouseholdsForChildren > 0) {
            householdsWithChildrenPercent = Math.round((householdsWithChildren / totalHouseholdsForChildren) * 100);
          }

          setCensusData({
            population: population || undefined,
            medianIncome: medianIncome || undefined,
            education: educationPercent || undefined,
            medianHomeValue: medianHomeValue || undefined,
            unemploymentRate: unemploymentRate || undefined,
            homeownershipRate: homeownershipRate || undefined,
            medianGrossRent: medianGrossRent || undefined,
            highIncomeHouseholds: highIncomePercent || undefined,
            perCapitaIncome: perCapitaIncome || undefined,
            medianAge: medianAge || undefined,
            newConstruction: newConstructionPercent || undefined,
            singleFamilyHomes: singleFamilyPercent || undefined,
            meanCommuteTime: meanCommuteTime || undefined,
            householdsWithChildren: householdsWithChildrenPercent || undefined,
            bachelorsOrHigher: bachelorsOrHigherPercent || undefined,
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
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <h2 className="text-xl font-semibold text-navy mb-4">
          ZIP Code Demographics
        </h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-navy text-sm">Loading census data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <h2 className="text-xl font-semibold text-navy mb-4">
          ZIP Code Demographics
        </h2>
        <div className="text-center py-4">
          <p className="text-navy/70 text-sm">{error}</p>
        </div>
      </div>
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
    <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
      <h2 className="text-xl font-semibold text-navy mb-4">
        ZIP Code Demographics ({address.zip.substring(0, 5)})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
              <div className="text-xs text-navy/60 font-medium">Bachelor&apos;s Degree or Higher</div>
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

        {/* New Statistics - 10 Additional Stats */}
        {censusData.homeownershipRate !== undefined && (
          <div className="flex items-start gap-3 p-3 bg-gray-light rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-navy/60 font-medium">Homeownership Rate</div>
              <div className="text-lg font-semibold text-navy">
                {censusData.homeownershipRate}%
              </div>
            </div>
          </div>
        )}

        {censusData.medianGrossRent !== undefined && (
          <div className="flex items-start gap-3 p-3 bg-gray-light rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-navy/60 font-medium">Median Gross Rent</div>
              <div className="text-lg font-semibold text-navy">
                {formatNumber(censusData.medianGrossRent)}
              </div>
            </div>
          </div>
        )}

        {censusData.highIncomeHouseholds !== undefined && (
          <div className="flex items-start gap-3 p-3 bg-gray-light rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingDown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-navy/60 font-medium">High-Income Households</div>
              <div className="text-lg font-semibold text-navy">
                {censusData.highIncomeHouseholds}%
              </div>
              <div className="text-xs text-navy/50">($100K+)</div>
            </div>
          </div>
        )}

        {censusData.perCapitaIncome !== undefined && (
          <div className="flex items-start gap-3 p-3 bg-gray-light rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-navy/60 font-medium">Per Capita Income</div>
              <div className="text-lg font-semibold text-navy">
                {formatNumber(censusData.perCapitaIncome)}
              </div>
            </div>
          </div>
        )}

        {censusData.medianAge !== undefined && (
          <div className="flex items-start gap-3 p-3 bg-gray-light rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-navy/60 font-medium">Median Age</div>
              <div className="text-lg font-semibold text-navy">
                {censusData.medianAge} years
              </div>
            </div>
          </div>
        )}

        {censusData.newConstruction !== undefined && (
          <div className="flex items-start gap-3 p-3 bg-gray-light rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-navy/60 font-medium">New Construction</div>
              <div className="text-lg font-semibold text-navy">
                {censusData.newConstruction}%
              </div>
              <div className="text-xs text-navy/50">(Built 2010+)</div>
            </div>
          </div>
        )}

        {censusData.singleFamilyHomes !== undefined && (
          <div className="flex items-start gap-3 p-3 bg-gray-light rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-navy/60 font-medium">Single-Family Homes</div>
              <div className="text-lg font-semibold text-navy">
                {censusData.singleFamilyHomes}%
              </div>
            </div>
          </div>
        )}

        {censusData.meanCommuteTime !== undefined && (
          <div className="flex items-start gap-3 p-3 bg-gray-light rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-navy/60 font-medium">Mean Commute Time</div>
              <div className="text-lg font-semibold text-navy">
                {censusData.meanCommuteTime} min
              </div>
            </div>
          </div>
        )}

        {censusData.householdsWithChildren !== undefined && (
          <div className="flex items-start gap-3 p-3 bg-gray-light rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Baby className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-navy/60 font-medium">Households with Children</div>
              <div className="text-lg font-semibold text-navy">
                {censusData.householdsWithChildren}%
              </div>
            </div>
          </div>
        )}

        {censusData.bachelorsOrHigher !== undefined && (
          <div className="flex items-start gap-3 p-3 bg-gray-light rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-navy/60 font-medium">Bachelor&apos;s Degree or Higher</div>
              <div className="text-lg font-semibold text-navy">
                {censusData.bachelorsOrHigher}%
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-xs text-navy/50">
        Data from U.S. Census Bureau {CENSUS_YEAR} ACS 5-Year Estimates
      </p>
    </div>
  );
}

