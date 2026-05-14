// config/permissions.ts
import { UserRole } from '@/types/user-roles';

export const SUPER_ADMIN_LOCK = '__SUPER_ADMIN_ONLY__';

export const ROLES = {
  VIEWERS:[
    UserRole.ADMINPRO,
    UserRole.ADMIN,
    UserRole.VIEWER,
    UserRole.AUTHENTICATED,
    UserRole.CPANADMIN,
    UserRole.MAANADMIN,
    UserRole.SDHADMIN,
    UserRole.ASSETADMIN,
    UserRole.OFCADMIN,
    UserRole.MNGADMIN
  ],
} as const;

// Simplify to read-only flags
export const PERMISSIONS = {
  canManageUsers:[], 
  canViewAuditLogs: ROLES.VIEWERS, 
  canManageEmployees:[], 
  canManageInventory: [],
  canManageSystems: [],
  canManageRoutes:[],
  canManage:[],
  canViewDashboard: ROLES.VIEWERS,
  canViewDocs: ROLES.VIEWERS,
  canExportData: ROLES.VIEWERS, // Exports are read operations
  canUploadData: [],
  canDeleteCritical:[] // Nobody can delete
} as const;