'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import type { Territory, TerritoryAssignment } from '@/types/territory-map';
import { loadTerritories, loadAssignments } from '@/lib/territory-map/dataLoader';
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
      const [territoriesData, assignmentsData] = await Promise.all([
        loadTerritories(),
        loadAssignments()
      ]);
      setTerritories(territoriesData);
      setAssignments(assignmentsData);
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

  if (isLoading) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-navy">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-navy">Territories</h2>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Territory List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {territories.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            No territories yet. Create one to get started.
          </div>
        ) : (
          territories.map((territory) => (
            <Card key={territory.id} className="border-gray-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: territory.color }}
                    />
                    <CardTitle className="text-sm font-medium">{territory.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setEditingTerritory(territory)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteTerritory(territory.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-gray-500">
                  {getZipCodeCount(territory.id)} zip codes
                </p>
              </CardContent>
            </Card>
          ))
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
                  {territory.name}
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

