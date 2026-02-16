
import { UserRole, AppState, User, ClearanceType, ClearanceStatus } from './types';
import { DEFAULT_ADMIN_EMAIL, OFFICES } from './constants';

const initialUsers: User[] = [
  {
    id: 'ADMIN001',
    email: DEFAULT_ADMIN_EMAIL,
    name: 'Melvin Sereno',
    role: UserRole.ADMIN,
    passwordChanged: false,
    isActive: true
  },
  {
    id: 'FAC001',
    email: 'operations@see-org.com',
    name: 'Jane Smith',
    role: UserRole.FACULTY,
    office: 'Library',
    passwordChanged: true,
    isActive: true
  },
  {
    id: 'STU001',
    email: 'member@see-org.com',
    name: 'John Doe',
    role: UserRole.STUDENT,
    program: 'SEE Fellowship Program',
    yearLevel: 3,
    passwordChanged: true,
    isActive: true
  }
];

export const initialAppState: AppState = {
  currentUser: null,
  users: initialUsers,
  requests: [
    {
      id: 'REQ-001',
      studentId: 'STU001',
      studentName: 'John Doe',
      type: ClearanceType.SEMESTER,
      academicYear: '2023-2024',
      semester: '1st Semester',
      status: ClearanceStatus.PENDING,
      approvals: OFFICES.map(office => ({
        officeId: office.toLowerCase().replace(' ', '-'),
        officeName: office,
        status: ClearanceStatus.PENDING,
        updatedAt: new Date().toISOString()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  logs: [
    {
      id: 'LOG-001',
      userId: 'SYSTEM',
      userName: 'System',
      action: 'INIT',
      details: 'System initialized successfully.',
      timestamp: new Date().toISOString()
    }
  ],
  settings: {
    printEnabled: true,
    allowProvisionalPrint: false,
    lockdownMode: false,
    clearancePeriodActive: true
  }
};
