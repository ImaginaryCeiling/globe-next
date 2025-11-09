export interface Profile {
  id: string;
  name: string;
  location: [number, number]; // [latitude, longitude]
  met_at: string;
  met_on: string;
  notes: string;
  tags: string[];
}
