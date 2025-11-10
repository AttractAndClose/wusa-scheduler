'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Phone } from 'lucide-react';

interface CallScriptProps {
  customerName?: string;
}

export function CallScript({ customerName = 'the customer' }: CallScriptProps) {
  const firstName = customerName.split(' ')[0] || customerName;
  
  // State for tracking checked items
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    opening: false,
    homeownerStatus: false,
    homeDetails: false,
    windowCondition: false,
    scope: false,
    hoa: false,
    timeline: false,
    valueProposition: false,
    objectionThink: false,
    objectionExpensive: false,
    objectionNotReady: false,
    closing: false,
    confirmation: false,
  });

  const handleCheckChange = (item: string, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [item]: checked,
    }));
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Call Script
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm flex-1 overflow-y-auto">
        <div className="space-y-3">
          <div>
            <div className="flex items-start gap-2 mb-2">
              <Checkbox
                id="opening"
                checked={checkedItems.opening}
                onCheckedChange={(checked) => handleCheckChange('opening', checked === true)}
              />
              <Label htmlFor="opening" className="font-semibold text-navy cursor-pointer">Opening (30 seconds)</Label>
            </div>
            <p className="text-gray-700 leading-relaxed ml-6">
              &quot;Hi {firstName}, this is [Your Name] from Windows USA. I&apos;m calling because you recently expressed interest in learning more about our window replacement services. Is now a good time to talk for about 5 minutes?&quot;
            </p>
          </div>

          <div>
            <p className="font-semibold text-navy mb-2">Discovery Questions (2-3 minutes)</p>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="homeownerStatus"
                  checked={checkedItems.homeownerStatus}
                  onCheckedChange={(checked) => handleCheckChange('homeownerStatus', checked === true)}
                />
                <Label htmlFor="homeownerStatus" className="leading-relaxed cursor-pointer flex-1">
                  <strong>1. Homeowner Status:</strong> &quot;First, I want to make sure I&apos;m speaking with the homeowner. Are you the owner of the property?&quot;
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="homeDetails"
                  checked={checkedItems.homeDetails}
                  onCheckedChange={(checked) => handleCheckChange('homeDetails', checked === true)}
                />
                <Label htmlFor="homeDetails" className="leading-relaxed cursor-pointer flex-1">
                  <strong>2. Home Details:</strong> &quot;Great! Can you tell me a bit about your home? What year was it built, and what type of home is it?&quot;
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="windowCondition"
                  checked={checkedItems.windowCondition}
                  onCheckedChange={(checked) => handleCheckChange('windowCondition', checked === true)}
                />
                <Label htmlFor="windowCondition" className="leading-relaxed cursor-pointer flex-1">
                  <strong>3. Window Condition:</strong> &quot;Are the windows in your home original, or have they been replaced before?&quot;
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="scope"
                  checked={checkedItems.scope}
                  onCheckedChange={(checked) => handleCheckChange('scope', checked === true)}
                />
                <Label htmlFor="scope" className="leading-relaxed cursor-pointer flex-1">
                  <strong>4. Scope:</strong> &quot;How many windows are you looking to replace? And do you have any sliding glass doors that need attention?&quot;
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="hoa"
                  checked={checkedItems.hoa}
                  onCheckedChange={(checked) => handleCheckChange('hoa', checked === true)}
                />
                <Label htmlFor="hoa" className="leading-relaxed cursor-pointer flex-1">
                  <strong>5. HOA:</strong> &quot;Are you part of a homeowners association? Sometimes they have specific requirements we need to be aware of.&quot;
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="timeline"
                  checked={checkedItems.timeline}
                  onCheckedChange={(checked) => handleCheckChange('timeline', checked === true)}
                />
                <Label htmlFor="timeline" className="leading-relaxed cursor-pointer flex-1">
                  <strong>6. Timeline:</strong> &quot;What&apos;s your timeline for this project? Are you looking to move forward in the next few weeks or months?&quot;
                </Label>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-start gap-2 mb-2">
              <Checkbox
                id="valueProposition"
                checked={checkedItems.valueProposition}
                onCheckedChange={(checked) => handleCheckChange('valueProposition', checked === true)}
              />
              <Label htmlFor="valueProposition" className="font-semibold text-navy cursor-pointer">Value Proposition (1-2 minutes)</Label>
            </div>
            <p className="text-gray-700 leading-relaxed ml-6">
              &quot;Based on what you&apos;ve told me, I think we can help. Our windows are energy-efficient, can reduce your utility bills, and increase your home&apos;s value. We offer free, no-obligation consultations where one of our specialists will come to your home, take measurements, and provide you with a detailed quote.&quot;
            </p>
          </div>

          <div>
            <p className="font-semibold text-navy mb-2">Overcoming Objections</p>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="objectionThink"
                  checked={checkedItems.objectionThink}
                  onCheckedChange={(checked) => handleCheckChange('objectionThink', checked === true)}
                />
                <Label htmlFor="objectionThink" className="leading-relaxed cursor-pointer flex-1">
                  <strong>&quot;I need to think about it&quot;:</strong> &quot;I completely understand. That&apos;s why we offer a free consultation with no obligation. It&apos;s just an opportunity to see what&apos;s possible and get accurate pricing. Would you be open to that?&quot;
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="objectionExpensive"
                  checked={checkedItems.objectionExpensive}
                  onCheckedChange={(checked) => handleCheckChange('objectionExpensive', checked === true)}
                />
                <Label htmlFor="objectionExpensive" className="leading-relaxed cursor-pointer flex-1">
                  <strong>&quot;It&apos;s too expensive&quot;:</strong> &quot;I hear you. Many of our customers are surprised to learn about our financing options and the long-term energy savings. The consultation is free, and there&apos;s no pressure - just information.&quot;
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="objectionNotReady"
                  checked={checkedItems.objectionNotReady}
                  onCheckedChange={(checked) => handleCheckChange('objectionNotReady', checked === true)}
                />
                <Label htmlFor="objectionNotReady" className="leading-relaxed cursor-pointer flex-1">
                  <strong>&quot;I&apos;m not ready yet&quot;:</strong> &quot;That&apos;s perfectly fine. Our consultations are valid for 6 months, so even if you&apos;re planning ahead, it&apos;s good to have the information when you&apos;re ready.&quot;
                </Label>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-start gap-2 mb-2">
              <Checkbox
                id="closing"
                checked={checkedItems.closing}
                onCheckedChange={(checked) => handleCheckChange('closing', checked === true)}
              />
              <Label htmlFor="closing" className="font-semibold text-navy cursor-pointer">Closing for Appointment (1 minute)</Label>
            </div>
            <p className="text-gray-700 leading-relaxed ml-6">
              &quot;Perfect! I have some availability this week. Would you prefer a morning, afternoon, or evening appointment? We can schedule something that works with your schedule. The consultation typically takes about 45 minutes, and our specialist will answer all your questions and provide you with a detailed estimate.&quot;
            </p>
          </div>

          <div>
            <div className="flex items-start gap-2 mb-2">
              <Checkbox
                id="confirmation"
                checked={checkedItems.confirmation}
                onCheckedChange={(checked) => handleCheckChange('confirmation', checked === true)}
              />
              <Label htmlFor="confirmation" className="font-semibold text-navy cursor-pointer">Confirmation</Label>
            </div>
            <p className="text-gray-700 leading-relaxed ml-6">
              &quot;Great! I have you scheduled for [Date] at [Time]. Our specialist, [Rep Name], will call you the day before to confirm. Is there anything specific you&apos;d like them to focus on during the visit?&quot;
            </p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 italic">
              <strong>Pro Tip:</strong> Listen actively, take notes on their responses, and match their energy level. Be genuine, helpful, and focus on understanding their needs rather than pushing a sale.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

