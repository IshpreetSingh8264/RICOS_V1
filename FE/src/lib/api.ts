/**
 * API Service Layer for RICOS Frontend
 *
 * Base URLs are resolved at BUILD time from Vite env vars, so the same source
 * runs against any host without code changes:
 * - dev (npm run dev)          -> VITE_* unset, fall back to localhost ports
 * - docker / production build  -> VITE_*_API_URL='/api/auth' etc. (relative),
 *                                 nginx on the same origin proxies to backends
 * - other hosts / domains      -> pass absolute URLs at build time
 */

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

// Base URLs
export const API_BASE_URLS = {
  AUTH: trimTrailingSlash(import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3000'),
  USER: trimTrailingSlash(import.meta.env.VITE_USER_API_URL || 'http://localhost:8080'),
  OFFICIAL: trimTrailingSlash(import.meta.env.VITE_OFFICIAL_API_URL || 'http://localhost:8081'),
};

// ==================== TYPES ====================

export type UserType = 'user' | 'ngo' | 'govt' | 'volunteer' | 'group';

export interface AuthResponse {
  access_token: string;
  user_type: UserType;
}

export interface GroupAuthResponse extends AuthResponse {
  group_name: string;
  username: string;
  email?: string;
  expires_at: string;
  user_type: 'group';
}

// User Signup Types
export interface UserSignupData {
  full_name: string;
  dob: string;
  gender: string;
  phone_number: string;
  alternate_phone?: string;
  email: string;
  password: string;
  current_address: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  aadhar_id: string;
  blood_group?: string;
  medical_conditions?: string;
  allergies?: string;
  disabilities?: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
  primary_language: string;
  secondary_language?: string;
  communication_assistance?: boolean;
  live_location_permission: boolean;
  home_location_lat?: number;
  home_location_lng?: number;
}

export interface NGOSignupData {
  ngo_name: string;
  registration_number: string;
  ngo_type: string;
  year_established: number;
  mission_statement?: string;
  email: string;
  password: string;
  official_contact: string;
  alternate_contact?: string;
  website?: string;
  registered_address: string;
  operational_areas: string[];
  location_lat?: number;
  location_lng?: number;
  admin_name: string;
  admin_designation: string;
  admin_mobile: string;
  admin_email: string;
  aadhar_card: string;
  resource_types?: string[];
  team_strength?: number;
  bank_account_number: string;
}

export interface GovtSignupData {
  agency_name: string;
  department: string;
  govt_level: string;
  official_id: string;
  department_code: string;
  email: string;
  password: string;
  hq_address: string;
  incharge_name: string;
  incharge_mobile: string;
  incharge_email: string;
  control_room_number?: string;
  jurisdiction_area: string[];
  resource_types?: string[];
  resource_capacity?: number;
  bank_account_number: string;
}

export interface VolunteerSignupData {
  group_name: string;
  volunteer_type: string;
  group_size: number;
  operational_areas: string[];
  email: string;
  password: string;
  social_media_link?: string;
  leader_name: string;
  leader_phone: string;
  leader_email: string;
  id_proof?: string;
  has_medical_training?: boolean;
  has_first_aid_cert?: boolean;
  has_vehicle?: boolean;
  languages_spoken: string[];
}

export interface SigninData {
  email: string;
  password: string;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  item: string;
  total_quantity: number;
  remaining_quantity: number;
  ngo_id: string | null;
  volunteer_id: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryData {
  item: string;
  total_quantity: number;
}

export interface UpdateInventoryData {
  item?: string;
  total_quantity?: number;
}

// Group Types
export type TTLType = '5_days' | '20_days' | '30_days' | 'no_expiry';

export interface ResourceAllocation {
  inventory_item_id: string;
  allocated_quantity: number;
}

export interface CreateGroupData {
  group_name: string;
  password: string;
  ttl_type: TTLType;
  resource_allocations?: ResourceAllocation[];
}

export interface GroupData {
  id: string;
  group_name: string;
  username: string;
  email?: string;
  password: string;
  ttl_type: TTLType;
  is_active: boolean;
  created_by_id: string;
  creator_type: 'ngo' | 'govt' | 'volunteer';
  expires_at: string | null;
  createdAt: string;
  updatedAt: string;
  resourceAllocations?: Array<{
    id: string;
    allocated_quantity: number;
    inventoryItem: InventoryItem;
    inventory_item_id: string;
  }>;
}

export interface UpdateGroupData {
  group_name?: string;
  password?: string;
  ttl_type?: TTLType;
  is_active?: boolean;
  resource_allocations?: ResourceAllocation[];
}

export interface GroupSigninData {
  username: string;
  password: string;
}

// ==================== ERROR HANDLING ====================

export class APIError extends Error {
  statusCode: number;
  details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new APIError(
      response.status,
      errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      errorData
    );
  }
  return response.json();
}

// ==================== HELPER FUNCTIONS ====================

function getAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ==================== AUTHENTICATION API ====================

export const authAPI = {
  /**
   * Get current user profile
   * The endpoint depends on user type (user vs official)
   */
  async getProfile(token: string, userType: UserType): Promise<any> {
    const baseUrl = userType === 'user' ? API_BASE_URLS.USER : API_BASE_URLS.OFFICIAL;
    const response = await fetch(`${baseUrl}/profile`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<any>(response);
  },

  /**
   * Sign up as a regular user (citizen)
   */
  async signupUser(data: UserSignupData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URLS.AUTH}/auth/signup/user`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(response);
  },

  /**
   * Sign up as an NGO
   */
  async signupNGO(data: NGOSignupData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URLS.AUTH}/auth/signup/ngo`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(response);
  },

  /**
   * Sign up as a Government Agency
   */
  async signupGovt(data: GovtSignupData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URLS.AUTH}/auth/signup/govt`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(response);
  },

  /**
   * Sign up as a Volunteer Group
   */
  async signupVolunteer(data: VolunteerSignupData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URLS.AUTH}/auth/signup/volunteer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(response);
  },

  /**
   * Sign in (all user types)
   * System automatically detects user type from email
   */
  async signin(data: SigninData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URLS.AUTH}/auth/signin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(response);
  },
};

// ==================== INVENTORY API ====================

export const inventoryAPI = {
  /**
   * Create a new inventory item
   * Requires: NGO or Volunteer token
   */
  async create(data: CreateInventoryData, token: string): Promise<InventoryItem> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/inventory`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<InventoryItem>(response);
  },

  /**
   * Get all inventory items (only your own)
   * Requires: NGO or Volunteer token
   */
  async getAll(token: string): Promise<InventoryItem[]> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/inventory`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<InventoryItem[]>(response);
  },

  /**
   * Get a single inventory item by ID
   * Requires: NGO or Volunteer token
   */
  async getById(id: string, token: string): Promise<InventoryItem> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/inventory/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<InventoryItem>(response);
  },

  /**
   * Update an inventory item
   * Requires: NGO or Volunteer token
   */
  async update(id: string, data: UpdateInventoryData, token: string): Promise<InventoryItem> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/inventory/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<InventoryItem>(response);
  },

  /**
   * Delete an inventory item
   * Requires: NGO or Volunteer token
   */
  async delete(id: string, token: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/inventory/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    return handleResponse<{ message: string }>(response);
  },
};

// ==================== GROUPS API ====================

export const groupsAPI = {
  /**
   * Create a new group with optional resource allocations
   * Requires: NGO, Govt, or Volunteer token
   */
  async create(data: CreateGroupData, token: string): Promise<GroupData> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/groups`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<GroupData>(response);
  },

  /**
   * Get all groups (only your own)
   * Requires: NGO, Govt, or Volunteer token
   */
  async getAll(token: string): Promise<GroupData[]> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/groups`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<GroupData[]>(response);
  },

  /**
   * Get a single group by ID with details
   * Requires: NGO, Govt, or Volunteer token
   */
  async getById(id: string, token: string): Promise<GroupData> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/groups/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<GroupData>(response);
  },

  /**
   * Update a group
   * Requires: NGO, Govt, or Volunteer token
   */
  async update(id: string, data: UpdateGroupData, token: string): Promise<GroupData> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/groups/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<GroupData>(response);
  },

  /**
   * Delete a group (restores inventory allocations)
   * Requires: NGO, Govt, or Volunteer token
   */
  async delete(id: string, token: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/groups/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    return handleResponse<{ message: string }>(response);
  },

  /**
   * Group sign in (public endpoint, no token required)
   */
  async signin(data: GroupSigninData): Promise<GroupAuthResponse> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/groups/signin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<GroupAuthResponse>(response);
  },

  // ==================== LOCATION & ASSIGNMENT ====================

  /**
   * Group pings its own GPS location
   * Requires: Group token (role=group)
   * groupId: the group's own ID (available from auth response)
   */
  async updateMyLocation(groupId: string, data: UpdateGroupLocationData, token: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/groups/${groupId}/location`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Get all active group locations (for map view)
   * Requires: NGO/Govt/Volunteer token
   */
  async getAllLocations(token: string): Promise<GroupLocation[]> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/groups/locations/all`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<GroupLocation[]>(response);
  },

  /**
   * Get smart team recommendations for an incident
   * Requires: NGO/Govt/Volunteer token
   */
  async recommendTeams(incidentId: string, token: string): Promise<RecommendTeamsResponse> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/groups/recommend?incident_id=${incidentId}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<RecommendTeamsResponse>(response);
  },

  /**
   * Assign a group to an incident
   * Requires: NGO/Govt/Volunteer token
   */
  async assignGroup(groupId: string, data: AssignGroupData, token: string): Promise<AssignGroupResponse> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/groups/${groupId}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<AssignGroupResponse>(response);
  },

  /**
   * Get all assignments for the organization
   * Requires: NGO/Govt/Volunteer token
   */
  async getAssignments(token: string): Promise<GroupAssignmentsResponse> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/groups/assignments/all`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<GroupAssignmentsResponse>(response);
  },

  /**
   * Update an assignment status (complete / cancel)
   * Requires: NGO/Govt/Volunteer token
   */
  async updateAssignmentStatus(
    assignmentId: string,
    data: UpdateAssignmentStatusData,
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/groups/assignments/${assignmentId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Get the current assignment for the authenticated group (group-role JWT)
   */
  async getMyAssignment(token: string): Promise<GroupCurrentAssignmentResponse> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/groups/me/assignment`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<GroupCurrentAssignmentResponse>(response);
  },

  /**
   * Group self-reports operational status (available / deployed / rescuing)
   * Requires: Group token (role=group)
   * If status='rescuing', also sets disaster_report.status = 'in_progress'
   */
  async updateMyOperationStatus(
    status: 'available' | 'deployed' | 'rescuing',
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/groups/me/operation-status`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  /**
   * Group marks its active mission as complete
   * Requires: Group token (role=group)
   * Sets assignment.status='completed', disaster_report.status='resolved'
   */
  async completeMyAssignment(
    token: string,
    notes?: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/groups/me/complete-assignment`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ notes }),
    });
    return handleResponse(response);
  },
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expiryTime;
  } catch {
    return true;
  }
}

/**
 * JWT Token Payload structure
 */
export interface JWTPayload {
  sub: string;           // User ID
  email: string;
  userType: UserType;
  full_name: string;     // User's display name
  iat: number;           // Issued at
  exp: number;           // Expiry time
}

/**
 * Decode JWT token to get payload
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

/**
 * Get user type from token
 */
export function getUserTypeFromToken(token: string): UserType | null {
  const payload = decodeToken(token);
  return payload?.userType || null;
}

/**
 * Check if user has permission for inventory operations
 */
export function canManageInventory(userType: UserType): boolean {
  return userType === 'ngo' || userType === 'volunteer';
}

/**
 * Check if user has permission for group operations
 */
export function canManageGroups(userType: UserType): boolean {
  return userType === 'ngo' || userType === 'govt' || userType === 'volunteer';
}

/**
 * Calculate expiry date from TTL type
 */
export function calculateExpiryDate(ttlType: TTLType): Date | null {
  const now = new Date();
  switch (ttlType) {
    case '5_days':
      return new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    case '20_days':
      return new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
    case '30_days':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case 'no_expiry':
      return null;
  }
}

/**
 * Get group status based on expiry date
 */
export function getGroupStatus(group: GroupData): {
  label: string;
  color: 'gray' | 'red' | 'yellow' | 'green';
} {
  if (!group.is_active) {
    return { label: 'Inactive', color: 'gray' };
  }

  if (group.expires_at) {
    const expiryDate = new Date(group.expires_at);
    const now = new Date();

    if (now > expiryDate) {
      return { label: 'Expired', color: 'red' };
    }

    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 2) {
      return { label: `Expires in ${daysLeft}d`, color: 'yellow' };
    }
  }

  return { label: 'Active', color: 'green' };
}

/**
 * Calculate inventory usage percentage
 */
export function calculateInventoryUsage(item: InventoryItem): number {
  if (item.total_quantity === 0) return 0;
  return ((item.total_quantity - item.remaining_quantity) / item.total_quantity) * 100;
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// ==================== NEWS API ====================

// News Types
export interface NewsSource {
  name: string;
  logo: string;
  url: string;
}

export interface BundledNews {
  slug: string;
  title: string;
  description: string;
  content: string;
  urlToImage: string;
  publishedAt: string;
  totalArticles: number;
  sources: NewsSource[];
}

export interface NewsResponse {
  success: boolean;
  location: {
    state: string;
    city: string;
  };
  totalResults: number;
  bundledNews: BundledNews[];
}

export interface NewsDetailResponse {
  success: boolean;
  news: BundledNews;
  fullArticles?: Array<{
    title: string;
    description: string;
    content: string;
    url: string;
    source: {
      name: string;
    };
  }>;
}

export interface ChatMessage {
  message: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  conversationId: string;
}

export const newsAPI = {
  /**
   * Get disaster news for location
   * Requires: User token
   */
  async getDisasterNews(
    token: string,
    location?: string,
    latitude?: number,
    longitude?: number,
    refresh?: boolean,
  ): Promise<NewsResponse> {
    // API_BASE_URLS.USER may be relative (e.g. "/api/user") so the app stays
    // domain-agnostic; new URL() needs a base for relative input. An absolute
    // base is returned unchanged, so this works either way.
    const url = new URL(`${API_BASE_URLS.USER}/news/disaster`, window.location.origin);
    if (location) {
      url.searchParams.append('location', location);
    }
    if (latitude !== undefined) {
      url.searchParams.append('latitude', latitude.toString());
    }
    if (longitude !== undefined) {
      url.searchParams.append('longitude', longitude.toString());
    }
    if (refresh) {
      url.searchParams.append('refresh', 'true');
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<NewsResponse>(response);
  },

  /**
   * Get specific news details by slug
   * Requires: User token
   */
  async getNewsDetail(slug: string, token: string): Promise<NewsDetailResponse> {
    const response = await fetch(`${API_BASE_URLS.USER}/news/detail/${slug}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<NewsDetailResponse>(response);
  },

  /**
   * Chat with LLM about news article
   * Requires: User token
   */
  async chatWithLLM(slug: string, message: string, token: string): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URLS.USER}/news/${slug}/chat`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ message }),
    });
    return handleResponse<ChatResponse>(response);
  },

  /**
   * Clear news cache
   * Requires: User token
   */
  async clearCache(token: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URLS.USER}/news/cache/clear`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${API_BASE_URLS.USER}/news/health`, {
      method: 'GET',
    });
    return handleResponse<{ status: string; timestamp: string }>(response);
  },
};

// ==================== MAP API ====================

export interface DisasterReportData {
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

export interface DisasterReportResponse {
  success: boolean;
  report_id: string;
  message?: string;
}

export interface LiveResponder {
  responder_id: string;
  responder_name: string;
  responder_type: string;
  latitude: number;
  longitude: number;
  status: string;
  battery_level?: number;
  last_updated: string;
}

export interface DisasterArea {
  report_id: string;
  pincode?: string;
  city?: string;
  severity: string;
  affected_population?: number;
  polygon: any;
  status: string;
  submitted_by: string;
  timestamp: string;
}

export interface GroupLocation {
  group_id: string;
  group_name: string;
  org_name: string;
  creator_type: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  status: string; // available | deployed | rescuing | offline
  battery_level?: number | null;
  last_updated: string;
  resources: string[];
  active_assignment: {
    assignment_id: string;
    disaster_report_id: string;
    assigned_at: string;
  } | null;
}

export interface LiveMapDataResponse {
  success: boolean;
  responders: LiveResponder[];
  disaster_areas: DisasterArea[];
  group_locations: GroupLocation[];
}

// Group Location + Assignment Types
export interface UpdateGroupLocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  status?: 'available' | 'deployed' | 'rescuing' | 'offline';
  battery_level?: number;
}

export interface TeamRecommendation {
  group_id: string;
  group_name: string;
  latitude: number;
  longitude: number;
  status: string;
  battery_level?: number | null;
  last_updated: string;
  distance_km: number;
  resource_match_score: number;
  matched_resources: string[];
  missing_resources: string[];
  available_resources: string[];
  already_assigned: boolean;
  composite_score: number;
  current_assignment: any | null;
}

export interface RecommendTeamsResponse {
  success: boolean;
  disaster_report: {
    id: string;
    city?: string | null;
    severity: string;
    resources_needed: string[];
    latitude?: number | null;
    longitude?: number | null;
  };
  recommendations: TeamRecommendation[];
  total_available: number;
}

export interface AssignGroupData {
  disaster_report_id: string;
  notes?: string;
}

export interface AssignGroupResponse {
  success: boolean;
  message: string;
  assignment: any;
}

export interface GroupAssignment {
  assignment_id: string;
  group_id: string;
  group_name: string;
  disaster_report_id: string;
  assigned_at: string;
  status: string; // active | completed | cancelled
  notes?: string | null;
  completed_at?: string | null;
  group_location?: {
    latitude: number;
    longitude: number;
    status: string;
    last_updated: string;
  } | null;
  resources: Array<{ item: string; quantity: number }>;
}

export interface GroupAssignmentsResponse {
  success: boolean;
  assignments: GroupAssignment[];
}

export interface UpdateAssignmentStatusData {
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
}

export interface GroupCurrentAssignmentResponse {
  success: boolean;
  assignment: {
    assignment_id: string;
    disaster_report_id: string;
    assigned_at: string;
    notes?: string | null;
    incident: {
      city?: string | null;
      pincode?: string | null;
      severity: string;
      latitude?: number | null;
      longitude?: number | null;
      notes?: string | null;
      resources_needed?: string | null;
      water_level?: string | null;
      is_sos?: boolean;
      status?: string;
    } | null;
    citizen: {
      full_name?: string | null;
      phone_number?: string | null;
      blood_group?: string | null;
      medical_conditions?: string | null;
      allergies?: string | null;
      emergency_contact_name?: string | null;
      emergency_contact_phone?: string | null;
      emergency_contact_relation?: string | null;
    } | null;
  } | null;
  message?: string;
}

export const mapAPI = {
  /**
   * Submit disaster report
   * Requires: NGO, Government, or Volunteer token
   */
  async submitDisasterReport(
    token: string,
    data: DisasterReportData,
  ): Promise<DisasterReportResponse> {
    const response = await fetch(`${API_BASE_URLS.USER}/map/report`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<DisasterReportResponse>(response);
  },

  /**
   * Get live map data (responders and disaster areas)
   * Requires: User token
   */
  async getLiveMapData(token: string): Promise<LiveMapDataResponse> {
    const response = await fetch(`${API_BASE_URLS.USER}/map/live`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<LiveMapDataResponse>(response);
  },
};

// ==================== DASHBOARD API ====================

export interface DashboardStats {
  activeIncidents: number;
  peopleHelped: number;
  activeMissions: number;
  totalInventoryItems: number;
  resourcesAllocated: number;
  responseRate: number;
}

export interface Incident {
  id: string;
  responder_id: string;
  pincode?: string;
  city?: string;
  village?: string;
  latitude?: number;
  longitude?: number;
  severity: string;
  water_level?: string;
  affected_population?: number;
  stuck_people_found: boolean;
  resources_needed: string[];
  notes?: string;
  images: string[];
  status: string;
  approved_at?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentsResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  incidents: Incident[];
}

export interface IncidentsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  severity?: 'LOW' | 'MODERATE' | 'SEVERE';
}

export const dashboardAPI = {
  /**
   * Get dashboard statistics for NGO/Govt/Volunteer
   * Requires: NGO, Government, or Volunteer token
   */
  async getStats(token: string): Promise<DashboardStats> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/dashboard/stats`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<DashboardStats>(response);
  },

  /**
   * Get incident reports submitted by users with search and pagination
   * Requires: NGO, Government, or Volunteer token
   */
  async getIncidents(token: string, params?: IncidentsQueryParams): Promise<IncidentsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.severity) queryParams.append('severity', params.severity);

    const url = `${API_BASE_URLS.OFFICIAL}/dashboard/incidents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<IncidentsResponse>(response);
  },
};

// ==================== USER INCIDENT API ====================

export interface UserIncidentData {
  latitude?: number;
  longitude?: number;
  severity: 'LOW' | 'MODERATE' | 'SEVERE';
  notes?: string;
  stuck_people_found?: boolean;
  resources_needed?: string[];
  images?: string[];
}

export interface UserIncidentResponse {
  success: boolean;
  report_id: string;
  message: string;
}

export interface UserIncident {
  id: string;
  user_id: string;
  latitude?: number;
  longitude?: number;
  pincode?: string;
  city?: string;
  village?: string;
  severity: string;
  water_level?: string;
  affected_population?: number;
  stuck_people_found: boolean;
  resources_needed?: string;
  notes?: string;
  images?: string;
  status: string;
  is_sos?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserIncidentsResponse {
  success: boolean;
  incidents: UserIncident[];
  total: number;
}

export interface GroupedIncidentsResponse {
  success: boolean;
  data: {
    city: string;
    pincode: string;
    incidents: UserIncident[];
    activeGroups: any[];
  }[];
}

export const userIncidentAPI = {
  /**
   * Report an incident as a user (SOS or regular report)
   * Requires: User token
   */
  async reportIncident(token: string, data: UserIncidentData): Promise<UserIncidentResponse> {
    const response = await fetch(`${API_BASE_URLS.USER}/map/user/report`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<UserIncidentResponse>(response);
  },

  /**
   * Get user's own incident reports
   * Requires: User token
   */
  async getMyIncidents(token: string): Promise<UserIncidentsResponse> {
    const response = await fetch(`${API_BASE_URLS.USER}/map/user/reports`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<UserIncidentsResponse>(response);
  },

  /**
   * Get all user incidents grouped by location with active groups
   * Requires: User token
   */
  async getAllIncidentsGrouped(token: string): Promise<GroupedIncidentsResponse> {
    const response = await fetch(`${API_BASE_URLS.USER}/map/incidents/all`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<GroupedIncidentsResponse>(response);
  },
};

// ==================== DONATION API ====================

export interface DonationData {
  amount: number;
  recipient_type: 'ngo' | 'govt' | 'volunteer' | 'ricos';
  recipient_id?: string; // Required if not donating to RICOS
  message?: string;
}

export interface DonationResponse {
  success: boolean;
  donation_id: string;
  payment_url: string; // Dummy payment URL
  message: string;
}

export interface Donation {
  id: string;
  donor_user_id: string;
  donor_name: string;
  recipient_type: string;
  recipient_id?: string;
  recipient_name: string;
  amount: number;
  message?: string;
  payment_status: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface DonationsResponse {
  success: boolean;
  donations: Donation[];
  total: number;
  totalAmount: number;
}

export interface RecipientOrg {
  id: string;
  name: string;
  type: 'ngo' | 'govt' | 'volunteer';
  description?: string;
  activeGroups: number;
}

export interface RecipientOrgsResponse {
  success: boolean;
  organizations: RecipientOrg[];
}

export const donationAPI = {
  /**
   * Create a donation
   * Requires: User token
   */
  async createDonation(token: string, data: DonationData): Promise<DonationResponse> {
    const response = await fetch(`${API_BASE_URLS.USER}/donations/create`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<DonationResponse>(response);
  },

  /**
   * Get user's donation history
   * Requires: User token
   */
  async getMyDonations(token: string): Promise<DonationsResponse> {
    const response = await fetch(`${API_BASE_URLS.USER}/donations/my-donations`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<DonationsResponse>(response);
  },

  /**
   * Get available recipient organizations
   * Requires: User token
   */
  async getRecipientOrgs(token: string): Promise<RecipientOrgsResponse> {
    const response = await fetch(`${API_BASE_URLS.USER}/donations/recipients`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<RecipientOrgsResponse>(response);
  },

  /**
   * Get donations received by organization (for NGO/Govt/Volunteer dashboards)
   * Requires: NGO, Govt, or Volunteer token
   */
  async getReceivedDonations(token: string): Promise<DonationsResponse> {
    const response = await fetch(`${API_BASE_URLS.OFFICIAL}/donations/received`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<DonationsResponse>(response);
  },
};

// ==================== SOS REPORTS ====================

export interface SOSReport {
  id: string;
  user_id: string;
  // User Information
  user_name: string;
  phone_number?: string;
  alternate_phone?: string;
  email?: string;
  gender?: string;
  age?: number;
  blood_group?: string;
  medical_conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  // Address
  current_address?: string;
  city?: string;
  pincode?: string;
  state?: string;
  // Location
  latitude: number;
  longitude: number;
  accuracy?: number;
  location_timestamp: string;
  // SOS Details
  notes?: string;
  severity: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SOSReportsResponse {
  success: boolean;
  reports: SOSReport[];
  total?: number;
}

export const sosAPI = {
  /**
   * Get all active SOS reports (for responder dashboard)
   * Requires: Responder token (NGO/Govt/Volunteer)
   */
  async getAllActiveReports(token: string): Promise<SOSReportsResponse> {
    const response = await fetch(`${API_BASE_URLS.USER}/sos/active`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<SOSReportsResponse>(response);
  },

  /**
   * Get user's own SOS reports
   * Requires: User token
   */
  async getMyReports(token: string): Promise<SOSReportsResponse> {
    const response = await fetch(`${API_BASE_URLS.USER}/sos/my-reports`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse<SOSReportsResponse>(response);
  },
};
