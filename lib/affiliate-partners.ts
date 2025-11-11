import { promises as fs } from 'fs';
import path from 'path';
import type { AffiliatePartner, AffiliateNote } from '@/types/affiliate-partner';

const PARTNERS_FILE = path.join(process.cwd(), 'public', 'data', 'affiliate-partners.json');

export async function loadAffiliatePartners(): Promise<AffiliatePartner[]> {
  try {
    const fileContents = await fs.readFile(PARTNERS_FILE, 'utf8');
    return JSON.parse(fileContents);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty array
      return [];
    }
    console.error('Error loading affiliate partners:', error);
    return [];
  }
}

export async function saveAffiliatePartners(partners: AffiliatePartner[]): Promise<void> {
  try {
    // Ensure directory exists
    const dir = path.dirname(PARTNERS_FILE);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(PARTNERS_FILE, JSON.stringify(partners, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving affiliate partners:', error);
    throw error;
  }
}

export async function getAffiliatePartner(id: string): Promise<AffiliatePartner | null> {
  const partners = await loadAffiliatePartners();
  return partners.find(p => p.id === id) || null;
}

export async function createAffiliatePartner(partner: Omit<AffiliatePartner, 'id' | 'createdAt' | 'updatedAt'>): Promise<AffiliatePartner> {
  const partners = await loadAffiliatePartners();
  const newPartner: AffiliatePartner = {
    ...partner,
    id: `partner-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  partners.push(newPartner);
  await saveAffiliatePartners(partners);
  return newPartner;
}

export async function updateAffiliatePartner(id: string, updates: Partial<AffiliatePartner>): Promise<AffiliatePartner> {
  const partners = await loadAffiliatePartners();
  const index = partners.findIndex(p => p.id === id);
  if (index === -1) {
    throw new Error('Partner not found');
  }
  partners[index] = {
    ...partners[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await saveAffiliatePartners(partners);
  return partners[index];
}

export async function addNoteToPartner(partnerId: string, note: Omit<AffiliateNote, 'id' | 'createdAt'>): Promise<AffiliateNote> {
  const partners = await loadAffiliatePartners();
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) {
    throw new Error('Partner not found');
  }
  const newNote: AffiliateNote = {
    ...note,
    id: `note-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  partner.notes.push(newNote);
  partner.updatedAt = new Date().toISOString();
  await saveAffiliatePartners(partners);
  return newNote;
}

