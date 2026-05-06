// ─── API Response Envelope ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  error?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ─── Radio Device ─────────────────────────────────────────────────────────────

export type DeviceVendor = 'CAMBIUM' | 'MIMOSA';
export type CambiumModel = 'ePMP' | 'PMP' | 'cnWave';
export type MimosaModel = 'B-Series' | 'A-Series' | 'C-Series';
export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNKNOWN';
export type DeviceRole = 'AP' | 'SM' | 'BACKHAUL' | 'PTP';

export interface RadioDevice {
  id: string;
  name: string;
  vendor: DeviceVendor;
  model: string;
  serialNumber: string;
  ipAddress: string;
  macAddress: string;
  role: DeviceRole;
  status: DeviceStatus;
  snmpVersion: 'v2c' | 'v3';
  location?: string;
  latitude?: number;
  longitude?: number;
  parentId?: string;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceListQuery extends PaginationQuery {
  vendor?: DeviceVendor;
  status?: DeviceStatus;
  role?: DeviceRole;
}

// ─── Metric Snapshot ──────────────────────────────────────────────────────────

export interface MetricSnapshot {
  deviceId: string;
  timestamp: string;
  signalLevel: number;
  noiseFloor: number;
  snr: number;
  txPower: number;
  frequency: number;
  channelWidth: number;
  airTimeTx: number;
  airTimeRx: number;
  throughputTx: number;
  throughputRx: number;
  linkDistance?: number;
}

// ─── RF Analytics ─────────────────────────────────────────────────────────────

export type InterferenceLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RfScore {
  deviceId: string;
  score: number;
  interferenceLevel: InterferenceLevel;
  recommendedFrequency?: number;
  analysedAt: string;
  notes?: string;
}

export interface FrequencyExclusion {
  id: string;
  frequency: number;
  bandwidth: number;
  reason: string;
  createdAt: string;
}

// ─── Orchestration ────────────────────────────────────────────────────────────

export type JobStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
export type JobType = 'CONFIG_PUSH' | 'FIRMWARE_UPDATE' | 'FREQUENCY_CHANGE' | 'POWER_ADJUST';

export interface OrchestrationJob {
  id: string;
  type: JobType;
  deviceId: string;
  device?: RadioDevice;
  status: JobStatus;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  errorMessage?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

// ─── Compliance ───────────────────────────────────────────────────────────────

export type ComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' | 'EXEMPT';

export interface DeviceCompliance {
  deviceId: string;
  device?: RadioDevice;
  status: ComplianceStatus;
  txPower: number;
  maxAllowedTxPower: number;
  frequency: number;
  checkedAt: string;
}

// ─── Alert ────────────────────────────────────────────────────────────────────

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Alert {
  id: string;
  deviceId: string;
  device?: RadioDevice;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'CONFIG_PUSH'
  | 'COMPLIANCE_RUN';

export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  oldConfig?: Record<string, unknown>;
  newConfig?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ─── Topology ─────────────────────────────────────────────────────────────────

export interface TopologyEdge {
  id: string;
  parentId: string;
  childId: string;
  linkType: 'PTP' | 'PTMP';
  parent?: RadioDevice;
  child?: RadioDevice;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  degradedDevices: number;
  activeAlerts: number;
  criticalAlerts: number;
  pendingJobs: number;
  avgRfScore: number;
  complianceRate: number;
}
