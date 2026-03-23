import { prisma } from "@/lib/prisma";

export const DEFAULT_PERMISSIONS = [
  "create_user",
  "edit_user",
  "delete_user",
  "view_users",
  "manage_roles",
  "manage_permissions",
  "assign_roles",
  "view_reports",
  "manage_employees",
  "view_team",
  "update_profile",
];

export const DEFAULT_ROLES = [
  { name: "Admin", permissions: DEFAULT_PERMISSIONS },
  {
    name: "HR Admin",
    permissions: [
      "create_user",
      "edit_user",
      "delete_user",
      "view_users",
      "manage_employees",
      "update_profile",
    ],
  },
  {
    name: "Manager",
    permissions: ["view_team", "view_reports", "update_profile"],
  },
  {
    name: "Employee",
    permissions: ["update_profile"],
  },
];

export async function ensureDefaults() {
  const permissions = await prisma.permission.findMany();
  if (permissions.length === 0) {
    await prisma.permission.createMany({
      data: DEFAULT_PERMISSIONS.map((name) => ({ name })),
      skipDuplicates: true,
    });
  }

  for (const role of DEFAULT_ROLES) {
    const roleRecord = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: { name: role.name },
    });

    const permissionRecords = await prisma.permission.findMany({
      where: { name: { in: role.permissions } },
    });

    if (permissionRecords.length) {
      await prisma.rolePermission.createMany({
        data: permissionRecords.map((perm) => ({
          roleId: roleRecord.id,
          permissionId: perm.id,
        })),
        skipDuplicates: true,
      });
    }
  }
}
