'use client';

import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { calculateIsochrone } from '@/lib/territory-map/driveTime';
import type { Representative } from '@/types/territory-map';

interface DriveTimeLayerProps {
  representatives: Representative[];
  onCalculate: (minutes: number, coveredZipCodes: string[]) => void;
  isCalculating?: boolean;
  coveredZipCodes?: string[];
}

export default function DriveTimeLayer({
  representatives,
  onCalculate,
  isCalculating = false,
  coveredZipCodes = []
}: DriveTimeLayerProps) {
  const [minutes, setMinutes] = useState(30);
  const [isLoading, setIsLoading] = useState(false);

  const handleCalculate = async () => {
    if (representatives.length === 0) {
      alert('No representatives available');
      return;
    }

    setIsLoading(true);
    try {
      const repLocations = representatives
        .filter(rep => rep.active && rep.location)
        .map(rep => ({
          lat: rep.location.lat,
          lng: rep.location.lng,
          repId: rep.id
        }));

      if (repLocations.length === 0) {
        alert('No active representatives with locations');
        setIsLoading(false);
        return;
      }

      const response = await calculateIsochrone({
        minutes,
        repLocations
      });

      onCalculate(minutes, response.coveredZipCodes);
    } catch (error) {
      console.error('Error calculating drive time:', error);
      alert('Failed to calculate drive time. Please check your Mapbox token.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Drive Time Coverage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Drive Time (minutes)</label>
          <Input
            type="number"
            min="5"
            max="120"
            value={minutes}
            onChange={(e) => setMinutes(parseInt(e.target.value) || 30)}
            className="w-full"
          />
        </div>
        <Button
          onClick={handleCalculate}
          disabled={isLoading || isCalculating}
          className="w-full"
        >
          {isLoading || isCalculating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Calculating...
            </>
          ) : (
            'Calculate Coverage'
          )}
        </Button>
        {coveredZipCodes.length > 0 && (
          <div className="text-xs text-gray-600 pt-2 border-t">
            <p className="font-medium text-navy">
              {coveredZipCodes.length} zip codes covered
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

