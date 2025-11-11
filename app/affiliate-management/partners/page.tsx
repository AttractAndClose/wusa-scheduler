'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Save, X, Calendar, DollarSign, Building2, Mail, Phone, Link as LinkIcon, FileText, CreditCard, MessageSquare } from 'lucide-react';
import { useIsAuthorizedEmail } from '@/lib/use-admin';
import { getUniqueLeadSources } from '@/lib/affiliate-analytics';
import { loadAffiliateFunnelData } from '@/lib/territory-map/dataLoader';
import type { AffiliatePartner, AffiliateNote } from '@/types/affiliate-partner';

const AUTHORIZED_EMAIL = 'dan@windowsusa.com';

export default function AffiliatePartnersPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const isAuthorized = useIsAuthorizedEmail(AUTHORIZED_EMAIL);
  const [partners, setPartners] = useState<AffiliatePartner[]>([]);
  const [availableLeadSources, setAvailableLeadSources] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPartner, setEditingPartner] = useState<AffiliatePartner | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load partners
      const partnersRes = await fetch('/api/affiliate-partners');
      const partnersData = await partnersRes.json();
      setPartners(partnersData);

      // Load available lead sources
      const funnelData = await loadAffiliateFunnelData();
      const sources = getUniqueLeadSources(funnelData);
      setAvailableLeadSources(sources);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      loadData();
    }
  }, [isAuthorized, loadData]);

  const handleCreatePartner = async (formData: any) => {
    try {
      const response = await fetch('/api/affiliate-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        await loadData();
        setShowCreateDialog(false);
      }
    } catch (error) {
      console.error('Error creating partner:', error);
    }
  };

  const handleUpdatePartner = async (id: string, updates: Partial<AffiliatePartner>) => {
    try {
      const response = await fetch('/api/affiliate-partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await response.json();
      if (data.success) {
        await loadData();
        setEditingPartner(null);
      }
    } catch (error) {
      console.error('Error updating partner:', error);
    }
  };

  const handleAddNote = async (partnerId: string, note: Omit<AffiliateNote, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch(`/api/affiliate-partners/${partnerId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
      const data = await response.json();
      if (data.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleInitializeFromLeadSources = async () => {
    if (!confirm("This will create partner entries for all lead sources that don't already have partners. Continue?")) {
      return;
    }

    try {
      const existingPartnerNames = partners.map(p => p.name);
      const sourcesToCreate = availableLeadSources.filter(source => !existingPartnerNames.includes(source));

      for (const source of sourcesToCreate) {
        await handleCreatePartner({
          name: source,
          leadSource: '',
          startDate: new Date().toISOString().split('T')[0],
          avgCostPerLead: 0,
          programType: 'CPL',
          status: 'Active',
          primaryContact: {
            name: '',
            email: '',
            phone: '',
            title: '',
          },
          offersCredits: false,
          notes: [],
        });
      }

      await loadData();
    } catch (error) {
      console.error('Error initializing partners:', error);
    }
  };

  if (!isLoaded || !isAuthorized) {
    return (
      <AppLayout>
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">
                {!isLoaded ? 'Checking access...' : 'Loading affiliate partners...'}
              </p>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-navy mb-2">Affiliate Partners</h1>
              <p className="text-gray-600">
                Manage affiliate partner information and relationships
              </p>
            </div>
            <div className="flex gap-2">
              {partners.length === 0 && availableLeadSources.length > 0 && (
                <Button variant="outline" onClick={handleInitializeFromLeadSources}>
                  <Plus className="h-4 w-4 mr-2" />
                  Initialize from Lead Sources
                </Button>
              )}
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-navy hover:bg-navy/90">
                    <Plus className="h-4 w-4 mr-2" />
                    New Partner
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Affiliate Partner</DialogTitle>
                  </DialogHeader>
                  <CreatePartnerForm
                    availableLeadSources={availableLeadSources}
                    onSubmit={handleCreatePartner}
                    onCancel={() => setShowCreateDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Partners List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading partners...</p>
            </div>
          ) : partners.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No affiliate partners yet</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Partner
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {partners.map((partner) => (
                <PartnerCard
                  key={partner.id}
                  partner={partner}
                  isEditing={editingPartner?.id === partner.id}
                  onEdit={() => setEditingPartner(partner)}
                  onSave={(updates: Partial<AffiliatePartner>) => handleUpdatePartner(partner.id, updates)}
                  onCancel={() => setEditingPartner(null)}
                  onAddNote={(note: Omit<AffiliateNote, 'id' | 'createdAt'>) => handleAddNote(partner.id, note)}
                  isExpanded={selectedPartner === partner.id}
                  onToggleExpand={() => setSelectedPartner(selectedPartner === partner.id ? null : partner.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}

function CreatePartnerForm({ availableLeadSources, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: '',
    leadSource: '',
    startDate: new Date().toISOString().split('T')[0],
    avgCostPerLead: 0,
    programType: 'CPL' as const,
    status: 'Active' as const,
    primaryContact: {
      name: '',
      email: '',
      phone: '',
      title: '',
    },
    offersCredits: false,
    creditPolicy: '',
    creditTerms: '',
    portalUrl: '',
    reportingUrl: '',
    contractUrl: '',
    notes: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Partner Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="leadSource">Lead Source</Label>
          <Select value={formData.leadSource} onValueChange={(value) => setFormData({ ...formData, leadSource: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select lead source" />
            </SelectTrigger>
            <SelectContent>
              {availableLeadSources.map((source: string) => (
                <SelectItem key={source} value={source}>{source}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="avgCostPerLead">Avg Cost per Lead ($)</Label>
          <Input
            id="avgCostPerLead"
            type="number"
            step="0.01"
            value={formData.avgCostPerLead}
            onChange={(e) => setFormData({ ...formData, avgCostPerLead: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="programType">Program Type</Label>
          <Select value={formData.programType} onValueChange={(value: any) => setFormData({ ...formData, programType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CPA">CPA</SelectItem>
              <SelectItem value="CPL">CPL</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
              <SelectItem value="Revenue Share">Revenue Share</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-3">Primary Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contactName">Name</Label>
            <Input
              id="contactName"
              value={formData.primaryContact.name}
              onChange={(e) => setFormData({
                ...formData,
                primaryContact: { ...formData.primaryContact, name: e.target.value }
              })}
            />
          </div>
          <div>
            <Label htmlFor="contactTitle">Title</Label>
            <Input
              id="contactTitle"
              value={formData.primaryContact.title}
              onChange={(e) => setFormData({
                ...formData,
                primaryContact: { ...formData.primaryContact, title: e.target.value }
              })}
            />
          </div>
          <div>
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.primaryContact.email}
              onChange={(e) => setFormData({
                ...formData,
                primaryContact: { ...formData.primaryContact, email: e.target.value }
              })}
            />
          </div>
          <div>
            <Label htmlFor="contactPhone">Phone</Label>
            <Input
              id="contactPhone"
              value={formData.primaryContact.phone}
              onChange={(e) => setFormData({
                ...formData,
                primaryContact: { ...formData.primaryContact, phone: e.target.value }
              })}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="offersCredits"
            checked={formData.offersCredits}
            onChange={(e) => setFormData({ ...formData, offersCredits: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="offersCredits">Offers Credits</Label>
        </div>
        {formData.offersCredits && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="creditPolicy">Credit Policy</Label>
              <Textarea
                id="creditPolicy"
                value={formData.creditPolicy}
                onChange={(e) => setFormData({ ...formData, creditPolicy: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="creditTerms">Credit Terms</Label>
              <Textarea
                id="creditTerms"
                value={formData.creditTerms}
                onChange={(e) => setFormData({ ...formData, creditTerms: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-3">Links</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="portalUrl">Portal URL</Label>
            <Input
              id="portalUrl"
              type="url"
              value={formData.portalUrl}
              onChange={(e) => setFormData({ ...formData, portalUrl: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="reportingUrl">Reporting URL</Label>
            <Input
              id="reportingUrl"
              type="url"
              value={formData.reportingUrl}
              onChange={(e) => setFormData({ ...formData, reportingUrl: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="contractUrl">Contract URL</Label>
            <Input
              id="contractUrl"
              type="url"
              value={formData.contractUrl}
              onChange={(e) => setFormData({ ...formData, contractUrl: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-navy hover:bg-navy/90">
          Create Partner
        </Button>
      </div>
    </form>
  );
}

function PartnerCard({ partner, isEditing, onEdit, onSave, onCancel, onAddNote, isExpanded, onToggleExpand }: any) {
  const [formData, setFormData] = useState(partner);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteForm, setNoteForm] = useState({
    type: 'General' as const,
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    setFormData(partner);
  }, [partner]);

  const handleSave = () => {
    onSave(formData);
  };

  const handleAddNote = () => {
    onAddNote({
      ...noteForm,
      createdBy: 'Current User', // TODO: Get from auth
    });
    setShowNoteDialog(false);
    setNoteForm({
      type: 'General',
      title: '',
      content: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-navy" />
            <div>
              <CardTitle className="text-xl">{partner.name}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{partner.leadSource || 'No lead source'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              partner.status === 'Active' ? 'bg-green-100 text-green-800' :
              partner.status === 'Paused' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {partner.status}
            </span>
            {!isEditing && (
              <>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={onToggleExpand}>
                  {isExpanded ? 'Collapse' : 'Expand'}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <EditPartnerForm
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onCancel={onCancel}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-xs text-gray-500 mb-1">Start Date</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{new Date(partner.startDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Avg Cost/Lead</div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">${partner.avgCostPerLead.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Program Type</div>
                <div className="font-medium">{partner.programType}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Credits</div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{partner.offersCredits ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Primary Contact
                </h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">{partner.primaryContact.name}</span> - {partner.primaryContact.title}</div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-gray-400" />
                    <a href={`mailto:${partner.primaryContact.email}`} className="text-blue-600 hover:underline">
                      {partner.primaryContact.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-gray-400" />
                    <a href={`tel:${partner.primaryContact.phone}`} className="text-blue-600 hover:underline">
                      {partner.primaryContact.phone}
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Links
                </h3>
                <div className="space-y-2 text-sm">
                  {partner.portalUrl && (
                    <div>
                      <a href={partner.portalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Portal
                      </a>
                    </div>
                  )}
                  {partner.reportingUrl && (
                    <div>
                      <a href={partner.reportingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Reporting
                      </a>
                    </div>
                  )}
                  {partner.contractUrl && (
                    <div>
                      <a href={partner.contractUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Contract
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {partner.offersCredits && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Credit Information
                </h3>
                {partner.creditPolicy && (
                  <div className="mb-2">
                    <div className="text-xs text-gray-500 mb-1">Policy</div>
                    <div className="text-sm">{partner.creditPolicy}</div>
                  </div>
                )}
                {partner.creditTerms && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Terms</div>
                    <div className="text-sm">{partner.creditTerms}</div>
                  </div>
                )}
              </div>
            )}

            {isExpanded && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Notes ({partner.notes.length})
                  </h3>
                  <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Note</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Type</Label>
                          <Select value={noteForm.type} onValueChange={(value: any) => setNoteForm({ ...noteForm, type: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Meeting">Meeting</SelectItem>
                              <SelectItem value="Call">Call</SelectItem>
                              <SelectItem value="Email">Email</SelectItem>
                              <SelectItem value="General">General</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={noteForm.date}
                            onChange={(e) => setNoteForm({ ...noteForm, date: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={noteForm.title}
                            onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Content</Label>
                          <Textarea
                            value={noteForm.content}
                            onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                            rows={5}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddNote}>
                            Save Note
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-3">
                  {partner.notes.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
                  ) : (
                    partner.notes.map((note: AffiliateNote) => (
                      <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium text-sm">{note.title}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(note.date).toLocaleDateString()} • {note.type} • {note.createdBy}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function EditPartnerForm({ formData, setFormData, onSave, onCancel }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Partner Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <Input
            type="date"
            value={formData.startDate.split('T')[0]}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
        <div>
          <Label>Avg Cost per Lead ($)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.avgCostPerLead}
            onChange={(e) => setFormData({ ...formData, avgCostPerLead: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div>
        <Label>Program Type</Label>
        <Select value={formData.programType} onValueChange={(value: any) => setFormData({ ...formData, programType: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CPA">CPA</SelectItem>
            <SelectItem value="CPL">CPL</SelectItem>
            <SelectItem value="Hybrid">Hybrid</SelectItem>
            <SelectItem value="Revenue Share">Revenue Share</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-3">Primary Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            <Input
              value={formData.primaryContact.name}
              onChange={(e) => setFormData({
                ...formData,
                primaryContact: { ...formData.primaryContact, name: e.target.value }
              })}
            />
          </div>
          <div>
            <Label>Title</Label>
            <Input
              value={formData.primaryContact.title}
              onChange={(e) => setFormData({
                ...formData,
                primaryContact: { ...formData.primaryContact, title: e.target.value }
              })}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.primaryContact.email}
              onChange={(e) => setFormData({
                ...formData,
                primaryContact: { ...formData.primaryContact, email: e.target.value }
              })}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={formData.primaryContact.phone}
              onChange={(e) => setFormData({
                ...formData,
                primaryContact: { ...formData.primaryContact, phone: e.target.value }
              })}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={formData.offersCredits}
            onChange={(e) => setFormData({ ...formData, offersCredits: e.target.checked })}
            className="rounded"
          />
          <Label>Offers Credits</Label>
        </div>
        {formData.offersCredits && (
          <div className="space-y-3">
            <div>
              <Label>Credit Policy</Label>
              <Textarea
                value={formData.creditPolicy || ''}
                onChange={(e) => setFormData({ ...formData, creditPolicy: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Credit Terms</Label>
              <Textarea
                value={formData.creditTerms || ''}
                onChange={(e) => setFormData({ ...formData, creditTerms: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-3">Links</h3>
        <div className="space-y-3">
          <div>
            <Label>Portal URL</Label>
            <Input
              type="url"
              value={formData.portalUrl || ''}
              onChange={(e) => setFormData({ ...formData, portalUrl: e.target.value })}
            />
          </div>
          <div>
            <Label>Reporting URL</Label>
            <Input
              type="url"
              value={formData.reportingUrl || ''}
              onChange={(e) => setFormData({ ...formData, reportingUrl: e.target.value })}
            />
          </div>
          <div>
            <Label>Contract URL</Label>
            <Input
              type="url"
              value={formData.contractUrl || ''}
              onChange={(e) => setFormData({ ...formData, contractUrl: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={onSave} className="bg-navy hover:bg-navy/90">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

