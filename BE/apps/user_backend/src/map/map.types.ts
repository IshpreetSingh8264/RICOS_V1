export interface ResponderLocationUpdate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  status: 'available' | 'deployed' | 'rescuing' | 'offline';
  battery_level?: number;
}

export interface DisasterReportSubmission {
  pincode?: string;
  city?: string;
  village?: string;
  latitude?: number;
  longitude?: number;
  severity: 'LOW' | 'MODERATE' | 'SEVERE';
  water_level?: string;
  affected_population?: number;
  stuck_people_found?: boolean;
  resources_needed?: string[];
  notes?: string;
  images?: string[];
}

export interface LiveResponderData {
  responder_id: string;
  responder_name: string;
  responder_type: string;
  latitude: number;
  longitude: number;
  status: string;
  battery_level?: number;
  last_updated: string;
}

export interface DisasterAreaData {
  report_id: string;
  pincode?: string;
  city?: string;
  severity: string;
  affected_population?: number;
  polygon?: any;
  status: string;
  submitted_by: string;
  timestamp: string;
}

export interface GroupLocationData {
  group_id: string;
  group_name: string;
  org_name: string;
  creator_type: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  status: string;
  battery_level?: number | null;
  last_updated: string;
  resources: string[];
  active_assignment: {
    assignment_id: string;
    disaster_report_id: string;
    assigned_at: string;
  } | null;
}

export interface MapDataResponse {
  success: boolean;
  responders: LiveResponderData[];
  disaster_areas: DisasterAreaData[];
  group_locations: GroupLocationData[];
}
