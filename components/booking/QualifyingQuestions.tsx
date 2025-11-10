'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { HelpCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface QualifyingQuestionsData {
  isHomeowner?: boolean;
  homeBuiltYear?: string;
  homeType?: string;
  homeExterior?: string;
  estimatedFicoScore?: string;
  isHoaMember?: boolean;
  windowsStatus?: 'original' | 'replaced';
  windowsReplacedYear?: string;
  numberOfWindows?: number;
  numberOfSlidingDoors?: number;
  maritalStatus?: string;
}

interface QualifyingQuestionsProps {
  onDataChange: (data: QualifyingQuestionsData) => void;
  initialData?: QualifyingQuestionsData;
  disabled?: boolean;
}

export function QualifyingQuestions({ onDataChange, initialData, disabled = false }: QualifyingQuestionsProps) {
  const [isHomeowner, setIsHomeowner] = useState<boolean | undefined>(initialData?.isHomeowner);
  const [homeBuiltYear, setHomeBuiltYear] = useState(initialData?.homeBuiltYear || '');
  const [homeType, setHomeType] = useState(initialData?.homeType || '');
  const [homeExterior, setHomeExterior] = useState(initialData?.homeExterior || '');
  const [estimatedFicoScore, setEstimatedFicoScore] = useState(initialData?.estimatedFicoScore || '');
  const [isHoaMember, setIsHoaMember] = useState<boolean | undefined>(initialData?.isHoaMember);
  const [windowsStatus, setWindowsStatus] = useState<'original' | 'replaced' | ''>(initialData?.windowsStatus || '');
  const [windowsReplacedYear, setWindowsReplacedYear] = useState(initialData?.windowsReplacedYear || '');
  const [numberOfWindows, setNumberOfWindows] = useState(initialData?.numberOfWindows?.toString() || '');
  const [numberOfSlidingDoors, setNumberOfSlidingDoors] = useState(initialData?.numberOfSlidingDoors?.toString() || '');
  const [maritalStatus, setMaritalStatus] = useState(initialData?.maritalStatus || '');

  // Update parent whenever data changes
  useEffect(() => {
    onDataChange({
      isHomeowner,
      homeBuiltYear,
      homeType,
      homeExterior,
      estimatedFicoScore,
      isHoaMember,
      windowsStatus: windowsStatus || undefined,
      windowsReplacedYear: windowsStatus === 'replaced' ? windowsReplacedYear : undefined,
      numberOfWindows: numberOfWindows ? parseInt(numberOfWindows) : undefined,
      numberOfSlidingDoors: numberOfSlidingDoors ? parseInt(numberOfSlidingDoors) : undefined,
      maritalStatus,
    });
  }, [
    isHomeowner,
    homeBuiltYear,
    homeType,
    homeExterior,
    estimatedFicoScore,
    isHoaMember,
    windowsStatus,
    windowsReplacedYear,
    numberOfWindows,
    numberOfSlidingDoors,
    maritalStatus,
    onDataChange,
  ]);

  // Reset when initialData changes
  useEffect(() => {
    if (initialData) {
      setIsHomeowner(initialData.isHomeowner);
      setHomeBuiltYear(initialData.homeBuiltYear || '');
      setHomeType(initialData.homeType || '');
      setHomeExterior(initialData.homeExterior || '');
      setEstimatedFicoScore(initialData.estimatedFicoScore || '');
      setIsHoaMember(initialData.isHoaMember);
      setWindowsStatus(initialData.windowsStatus || '');
      setWindowsReplacedYear(initialData.windowsReplacedYear || '');
      setNumberOfWindows(initialData.numberOfWindows?.toString() || '');
      setNumberOfSlidingDoors(initialData.numberOfSlidingDoors?.toString() || '');
      setMaritalStatus(initialData.maritalStatus || '');
    }
  }, [initialData]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Qualifying Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 overflow-y-auto">
      {/* Homeowner */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium w-32 flex-shrink-0">
          Homeowner? <span className="text-red-500">*</span>
        </Label>
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="qual-homeowner-yes"
              checked={isHomeowner === true}
              onCheckedChange={(checked) => {
                setIsHomeowner(checked ? true : undefined);
              }}
              disabled={disabled}
            />
            <Label htmlFor="qual-homeowner-yes" className="text-sm font-normal cursor-pointer" onClick={() => setIsHomeowner(true)}>Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="qual-homeowner-no"
              checked={isHomeowner === false}
              onCheckedChange={(checked) => {
                setIsHomeowner(checked ? false : undefined);
              }}
              disabled={disabled}
            />
            <Label htmlFor="qual-homeowner-no" className="text-sm font-normal cursor-pointer" onClick={() => setIsHomeowner(false)}>No</Label>
          </div>
        </div>
      </div>

      {/* Home Built Year */}
      <div className="flex items-center gap-3">
        <Label htmlFor="qual-homeBuiltYear" className="text-sm font-medium w-32 flex-shrink-0">
          Year Built <span className="text-red-500">*</span>
        </Label>
        <Input
          id="qual-homeBuiltYear"
          type="text"
          value={homeBuiltYear}
          onChange={(e) => setHomeBuiltYear(e.target.value)}
          placeholder="e.g., 1995"
          required
          disabled={disabled}
          className="bg-white flex-1"
        />
      </div>

      {/* Home Type */}
      <div className="flex items-center gap-3">
        <Label htmlFor="qual-homeType" className="text-sm font-medium w-32 flex-shrink-0">
          Home Type <span className="text-red-500">*</span>
        </Label>
        <Select value={homeType} onValueChange={setHomeType} disabled={disabled}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single-family">Single Family</SelectItem>
            <SelectItem value="townhouse">Townhouse</SelectItem>
            <SelectItem value="condo">Condo</SelectItem>
            <SelectItem value="multi-family">Multi-Family</SelectItem>
            <SelectItem value="mobile">Mobile Home</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Home Exterior */}
      <div className="flex items-center gap-3">
        <Label htmlFor="qual-homeExterior" className="text-sm font-medium w-32 flex-shrink-0">
          Home Exterior <span className="text-red-500">*</span>
        </Label>
        <Select value={homeExterior} onValueChange={setHomeExterior} disabled={disabled}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select exterior" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vinyl">Vinyl</SelectItem>
            <SelectItem value="brick">Brick</SelectItem>
            <SelectItem value="stucco">Stucco</SelectItem>
            <SelectItem value="wood">Wood</SelectItem>
            <SelectItem value="fiber-cement">Fiber Cement</SelectItem>
            <SelectItem value="aluminum">Aluminum</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estimated FICO Score */}
      <div className="flex items-center gap-3">
        <Label htmlFor="qual-estimatedFicoScore" className="text-sm font-medium w-32 flex-shrink-0">
          Est. FICO Score <span className="text-red-500">*</span>
        </Label>
        <Select value={estimatedFicoScore} onValueChange={setEstimatedFicoScore} disabled={disabled}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select score range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="300-579">300-579 (Poor)</SelectItem>
            <SelectItem value="580-669">580-669 (Fair)</SelectItem>
            <SelectItem value="670-739">670-739 (Good)</SelectItem>
            <SelectItem value="740-799">740-799 (Very Good)</SelectItem>
            <SelectItem value="800-850">800-850 (Excellent)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* HOA Member */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium w-32 flex-shrink-0">
          HOA Member? <span className="text-red-500">*</span>
        </Label>
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="qual-hoa-yes"
              checked={isHoaMember === true}
              onCheckedChange={(checked) => {
                setIsHoaMember(checked ? true : undefined);
              }}
              disabled={disabled}
            />
            <Label htmlFor="qual-hoa-yes" className="text-sm font-normal cursor-pointer" onClick={() => setIsHoaMember(true)}>Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="qual-hoa-no"
              checked={isHoaMember === false}
              onCheckedChange={(checked) => {
                setIsHoaMember(checked ? false : undefined);
              }}
              disabled={disabled}
            />
            <Label htmlFor="qual-hoa-no" className="text-sm font-normal cursor-pointer" onClick={() => setIsHoaMember(false)}>No</Label>
          </div>
        </div>
      </div>

      {/* Windows Status */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium w-32 flex-shrink-0">
          Windows Status <span className="text-red-500">*</span>
        </Label>
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="qual-windows-original"
              checked={windowsStatus === 'original'}
              onCheckedChange={(checked) => {
                if (checked) {
                  setWindowsStatus('original');
                  setWindowsReplacedYear('');
                } else {
                  setWindowsStatus('');
                }
              }}
              disabled={disabled}
            />
            <Label htmlFor="qual-windows-original" className="text-sm font-normal cursor-pointer" onClick={() => { setWindowsStatus('original'); setWindowsReplacedYear(''); }}>Original</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="qual-windows-replaced"
              checked={windowsStatus === 'replaced'}
              onCheckedChange={(checked) => {
                if (checked) {
                  setWindowsStatus('replaced');
                } else {
                  setWindowsStatus('');
                  setWindowsReplacedYear('');
                }
              }}
              disabled={disabled}
            />
            <Label htmlFor="qual-windows-replaced" className="text-sm font-normal cursor-pointer" onClick={() => setWindowsStatus('replaced')}>Replaced</Label>
          </div>
        </div>
      </div>

      {/* Windows Replaced Year - Only show if replaced */}
      {windowsStatus === 'replaced' && (
        <div className="flex items-center gap-3">
          <Label htmlFor="qual-windowsReplacedYear" className="text-sm font-medium w-32 flex-shrink-0">
            Year Replaced <span className="text-red-500">*</span>
          </Label>
          <Input
            id="qual-windowsReplacedYear"
            type="text"
            value={windowsReplacedYear}
            onChange={(e) => setWindowsReplacedYear(e.target.value)}
            placeholder="e.g., 2020"
            required
            disabled={disabled}
            className="bg-white flex-1"
          />
        </div>
      )}

      {/* Number of Windows */}
      <div className="flex items-center gap-3">
        <Label htmlFor="qual-numberOfWindows" className="text-sm font-medium w-32 flex-shrink-0">
          # of Windows <span className="text-red-500">*</span>
        </Label>
        <Input
          id="qual-numberOfWindows"
          type="number"
          min="0"
          value={numberOfWindows}
          onChange={(e) => setNumberOfWindows(e.target.value)}
          placeholder="0"
          required
          disabled={disabled}
          className="bg-white flex-1"
        />
      </div>

      {/* Number of Sliding Doors */}
      <div className="flex items-center gap-3">
        <Label htmlFor="qual-numberOfSlidingDoors" className="text-sm font-medium w-32 flex-shrink-0">
          # of Sliding Doors <span className="text-red-500">*</span>
        </Label>
        <Input
          id="qual-numberOfSlidingDoors"
          type="number"
          min="0"
          value={numberOfSlidingDoors}
          onChange={(e) => setNumberOfSlidingDoors(e.target.value)}
          placeholder="0"
          required
          disabled={disabled}
          className="bg-white flex-1"
        />
      </div>

      {/* Marital Status */}
      <div className="flex items-center gap-3">
        <Label htmlFor="qual-maritalStatus" className="text-sm font-medium w-32 flex-shrink-0">
          Marital Status <span className="text-red-500">*</span>
        </Label>
        <Select value={maritalStatus} onValueChange={setMaritalStatus} disabled={disabled}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="married">Married</SelectItem>
            <SelectItem value="divorced">Divorced</SelectItem>
            <SelectItem value="widowed">Widowed</SelectItem>
            <SelectItem value="domestic-partnership">Domestic Partnership</SelectItem>
          </SelectContent>
        </Select>
      </div>
      </CardContent>
    </Card>
  );
}

