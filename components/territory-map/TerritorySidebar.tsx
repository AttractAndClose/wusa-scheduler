'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import type { Territory, TerritoryAssignment, Representative } from '@/types/territory-map';
import { loadTerritories, loadAssignments, loadRepresentatives, loadAffiliatePurchaseZips } from '@/lib/territory-map/dataLoader';
import { createTerritory, updateTerritory, deleteTerritory, assignZipCode } from '@/lib/territory-map/dataWriter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface TerritorySidebarProps {
  selectedZipCode?: string | null;
  onTerritoryChange?: () => void;
}

export default function TerritorySidebar({ selectedZipCode, onTerritoryChange }: TerritorySidebarProps) {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [assignments, setAssignments] = useState<TerritoryAssignment>({});
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [affiliatePurchaseZips, setAffiliatePurchaseZips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTerritoryName, setNewTerritoryName] = useState('');
  const [newTerritoryColor, setNewTerritoryColor] = useState('#FF6B6B');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [territoriesData, assignmentsData, representativesData, affiliateZipsData] = await Promise.all([
        loadTerritories(),
        loadAssignments(),
        loadRepresentatives(),
        loadAffiliatePurchaseZips()
      ]);
      setTerritories(territoriesData);
      setAssignments(assignmentsData);
      setRepresentatives(representativesData);
      setAffiliatePurchaseZips(affiliateZipsData);
      console.log('Loaded affiliate purchase zips:', affiliateZipsData.length);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTerritory = async () => {
    if (!newTerritoryName.trim()) return;

    const territory = await createTerritory({
      name: newTerritoryName,
      color: newTerritoryColor
    });

    if (territory) {
      setNewTerritoryName('');
      setNewTerritoryColor('#FF6B6B');
      setShowCreateDialog(false);
      await loadData();
      if (onTerritoryChange) onTerritoryChange();
    }
  };

  const handleUpdateTerritory = async (id: string, updates: Partial<Territory>) => {
    const success = await updateTerritory(id, updates);
    if (success) {
      await loadData();
      setEditingTerritory(null);
      if (onTerritoryChange) onTerritoryChange();
    }
  };

  const handleDeleteTerritory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this territory?')) return;

    const success = await deleteTerritory(id);
    if (success) {
      await loadData();
      if (onTerritoryChange) onTerritoryChange();
    }
  };

  const handleAssignZipCode = async (zipCode: string, territoryId: string | null) => {
    const success = await assignZipCode(zipCode, territoryId);
    if (success) {
      await loadData();
      if (onTerritoryChange) onTerritoryChange();
    }
  };

  const getZipCodeCount = (territoryId: string): number => {
    return Object.values(assignments).filter(id => id === territoryId).length;
  };

  const getRepCount = (territoryId: string): number => {
    return representatives.filter(rep => rep.territoryId === territoryId && rep.active).length;
  };

  const getPurchaseZipCount = (territoryId: string): number => {
    if (!affiliatePurchaseZips || affiliatePurchaseZips.length === 0) {
      return 0;
    }
    const territoryZipCodes = Object.entries(assignments)
      .filter(([_, id]) => id === territoryId)
      .map(([zipCode]) => zipCode.toString().trim());
    const affiliateZipSet = new Set(affiliatePurchaseZips.map(z => z.toString().trim()));
    const count = territoryZipCodes.filter(zip => affiliateZipSet.has(zip)).length;
    return count;
  };

  const formatTerritoryName = (name: string): string => {
    // Remove surrounding quotes if present
    return name.replace(/^"|"$/g, '');
  };

  if (isLoading) {
    return (
      <div className="w-96 bg-white border-l border-gray-200 p-4">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-navy">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy">Territories</h2>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="h-7 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Territory List */}
      <div className="flex-1 overflow-y-auto">
        {territories.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500 px-4">
            No territories yet. Create one to get started.
          </div>
        ) : (
          <div className="border-t border-gray-200">
            {/* Header Row */}
            <div className="grid grid-cols-[40px_1fr_50px_50px_80px] border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
              <div className="px-2 py-1.5 flex items-center justify-center"></div>
              <div className="px-2 py-1.5 flex items-center text-xs font-semibold text-gray-600">Territory</div>
              <div className="px-2 py-1.5 flex items-center justify-center text-xs font-semibold text-gray-600">All</div>
              <div className="px-2 py-1.5 flex items-center justify-center text-xs font-semibold text-gray-600">Purchase</div>
              <div className="px-2 py-1.5 flex items-center justify-end"></div>
            </div>
            {/* Territory Rows */}
            {territories.map((territory) => (
              <div
                key={territory.id}
                className="grid grid-cols-[40px_1fr_50px_50px_80px] border-b border-gray-200 hover:bg-gray-50"
              >
                {/* Color Label */}
                <div className="px-2 py-1 flex items-center justify-center">
                  <div
                    className="w-3 h-3 rounded border border-gray-300"
                    style={{ backgroundColor: territory.color }}
                  />
                </div>
                {/* Territory Name */}
                <div className="px-2 py-1 flex items-start text-xs font-medium text-gray-900 break-words">
                  <span className="break-words">{formatTerritoryName(territory.name)}</span>
                </div>
                {/* Territory Zip Count */}
                <div className="px-2 py-1 flex items-center justify-center text-xs text-gray-600">
                  {getZipCodeCount(territory.id)}
                </div>
                {/* Purchase Zip Count */}
                <div className="px-2 py-1 flex items-center justify-center text-xs text-gray-600">
                  {getPurchaseZipCount(territory.id)}
                </div>
                {/* Action Buttons - Edit and Trash together */}
                <div className="px-2 py-1 flex items-center justify-end gap-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => setEditingTerritory(territory)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteTerritory(territory.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Zip Code Info */}
      {selectedZipCode && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-navy mb-2">Zip Code: {selectedZipCode}</h3>
          <div className="space-y-2">
            <label className="text-xs text-gray-600">Assign to Territory:</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={assignments[selectedZipCode] || ''}
              onChange={(e) => handleAssignZipCode(selectedZipCode, e.target.value || null)}
            >
              <option value="">Unassigned</option>
              {territories.map((territory) => (
                <option key={territory.id} value={territory.id}>
                  {formatTerritoryName(territory.name)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Create Territory Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Territory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-navy mb-1 block">Name</label>
              <Input
                value={newTerritoryName}
                onChange={(e) => setNewTerritoryName(e.target.value)}
                placeholder="Territory name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-navy mb-1 block">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newTerritoryColor}
                  onChange={(e) => setNewTerritoryColor(e.target.value)}
                  className="h-10 w-20 rounded border border-gray-300"
                />
                <Input
                  value={newTerritoryColor}
                  onChange={(e) => setNewTerritoryColor(e.target.value)}
                  placeholder="#FF6B6B"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTerritory}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Territory Dialog */}
      {editingTerritory && (
        <Dialog open={!!editingTerritory} onOpenChange={() => setEditingTerritory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Territory</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-navy mb-1 block">Name</label>
                <Input
                  value={editingTerritory.name}
                  onChange={(e) => setEditingTerritory({ ...editingTerritory, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-navy mb-1 block">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingTerritory.color}
                    onChange={(e) => setEditingTerritory({ ...editingTerritory, color: e.target.value })}
                    className="h-10 w-20 rounded border border-gray-300"
                  />
                  <Input
                    value={editingTerritory.color}
                    onChange={(e) => setEditingTerritory({ ...editingTerritory, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTerritory(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateTerritory(editingTerritory.id, editingTerritory)}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

