export interface AssignmentCandidate {
  id: string;
  full_name: string;
  license_level: string | null;
  profile_photo_url: string | null;
  is_active: boolean;
  kabupaten_kota_id: string | null;
  kabupaten_kota_name: string | null;
}

export async function getAssignmentCandidates(): Promise<AssignmentCandidate[]> {
  throw new Error("Assignment candidate capability unavailable; referee selection is blocked.");
}