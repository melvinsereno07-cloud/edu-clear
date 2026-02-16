
export enum UserRole {
  ADMIN = 'ADMIN',
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT'
}

export enum ClearanceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONDITIONAL = 'CONDITIONAL',
  REVOKED = 'REVOKED'
}

export enum ClearanceType {
  SEMESTER = 'End-of-Semester',
  GRADUATION = 'Graduation',
  TRANSFER = 'Transfer',
  SPECIAL = 'Special'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  office?: string; // For faculty
  program?: string; // For students
  yearLevel?: number;
  tempPassword?: string;
  passwordChanged: boolean;
  isActive: boolean;
}

export interface OfficeApproval {
  officeId: string;
  officeName: string;
  status: ClearanceStatus;
  remarks?: string;
  approvedBy?: string;
  updatedAt: string;
}

export interface ClearanceRequest {
  id: string;
  studentId: string;
  studentName: string;
  type: ClearanceType;
  academicYear: string;
  semester: string;
  status: ClearanceStatus;
  approvals: OfficeApproval[];
  createdAt: string;
  updatedAt: string;
  adminJustification?: string;
  isRevoked?: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  ip?: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  requests: ClearanceRequest[];
  logs: AuditLog[];
  settings: {
    printEnabled: boolean;
    allowProvisionalPrint: boolean;
    lockdownMode: boolean;
    clearancePeriodActive: boolean;
  };
}
