import { UUID } from "crypto";

export interface Organization {
  id: UUID;
  name: string;
  website?: string;
  industry?: string;
  created_at?: string;
}

export interface Event {
  id: UUID;
  name: string;
  date: string;
  location_name: string;
  location_lat?: number;
  location_lng?: number;
  created_at?: string;
}

export interface Person {
  id: UUID;
  name: string;
  contact_info: {
    phone?: string;
    email?: string;
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    [key: string]: any;
  };
  organization_id?: UUID;
  current_location_lat: number;
  current_location_lng: number;
  notes?: string;
  created_at?: string;
  
  // Joined fields (optional, for UI convenience)
  organization?: Organization;
}

export interface Interaction {
  id: UUID;
  person_id: UUID;
  event_id?: UUID;
  date: string;
  type: string;
  notes?: string;
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  created_at?: string;

  // Joined fields
  person?: Person;
  event?: Event;
}

