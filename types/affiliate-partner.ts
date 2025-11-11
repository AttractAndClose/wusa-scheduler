export interface AffiliatePartner {
  id: string;
  name: string; // Lead Source Details name
  leadSource: string; // Primary Lead Source
  startDate: string; // When partnership started
  avgCostPerLead: number; // Average cost per lead
  programType: 'CPA' | 'CPL' | 'Hybrid' | 'Revenue Share' | 'Other';
  status: 'Active' | 'Paused' | 'Inactive';
  
  // Contact Information
  primaryContact: {
    name: string;
    email: string;
    phone: string;
    title: string;
  };
  billingContact?: {
    name: string;
    email: string;
    phone: string;
  };
  
  // Credit Information
  offersCredits: boolean;
  creditPolicy?: string; // Description of credit policy
  creditTerms?: string; // Terms for credits
  
  // Links
  portalUrl?: string;
  reportingUrl?: string;
  contractUrl?: string;
  
  // Notes
  notes: AffiliateNote[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateNote {
  id: string;
  date: string;
  type: 'Meeting' | 'Call' | 'Email' | 'General';
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

