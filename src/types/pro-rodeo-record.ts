export type SanctioningBody = "WPRA" | "PRCA";

export interface ProRodeoRecord {
  id: string;
  created_at: string;
  rodeo_name: string;
  sanctioning_body: SanctioningBody;
  city: string;
  state: string;
  start_date: string;
  end_date: string | null;
  latitude: number | null;
  longitude: number | null;
  location?: unknown;
  external_link: string;
}

export type ProRodeoRecordInsert = Omit<ProRodeoRecord, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};
