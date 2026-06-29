import { prisma } from "./prisma"
import { CLIENT_MOT_CHECK_LIST } from "./formTemplates/clientMotCheckList"
import { MOT_SELECTION_LIST } from "./formTemplates/motSelectionList"
import { MOT_MEASUREMENT_SHEET } from "./formTemplates/motMeasurementSheet"
import { MOT_ELECTRIC_LINE } from "./formTemplates/motElectricLine"
import { MOT_ACCESSORIES_CUT_OUT_MEASURMENT_REPORT } from "./formTemplates/motAndAccessoriesCutOutMeasurementReport"
import { COMPLETE_SITE_CHECKING_REPORT } from "./formTemplates/completeSiteCheckingReport"
import { SUPPLY_DUCT_CHECKING } from "./formTemplates/supplyDuctChecking"
import { RETURN_DUCT_CHECKING } from "./formTemplates/returnDuctChecking"
import { AHU_CHECKLIST_REPORT } from "./formTemplates/ahuChecklistReport"
import { COMPOSER_CHECKLIST_REPORT } from "./formTemplates/composerChecklistReport"
import { PLENUM_BOX_CHECKLIST_REPORT } from "./formTemplates/plenumBoxChecklistReport"

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
]

export const DEFAULT_ROLES = [
  { name: "Admin", permissions: DEFAULT_PERMISSIONS },
  {
    name: "Manager",
    permissions: DEFAULT_PERMISSIONS,
  },
  { name: "Site supervisor", permissions: [] },
  { name: "Accountant", permissions: [] },
  { name: "Store Keeper", permissions: [] },
  { name: "Autocade", permissions: [] },
  { name: "Service Person", permissions: [] },
  { name: "Service Engineer", permissions: [] },
]

export const DEFAULT_COMPANIES = [
  {
    name: "Wellman Group",
    code: "WG",
  },
  {
    name: "Wellman Healthcare Services",
    code: "WHS",
  },
  {
    name: "Wellman Healthcare Infrastructure",
    code: "WHI",
  },
]

export const DEFAULT_PROJECT_FORMS = [
  {
    name: "Client MOT Check List",
    template: CLIENT_MOT_CHECK_LIST,
  },
  {
    name: "MOT Selection List",
    template: MOT_SELECTION_LIST,
  },
  {
    name: "MOT Measurement Sheet",
    template: MOT_MEASUREMENT_SHEET,
  },
  {
    name: "MOT & Accessories Cut-Out Measurement Report",
    template: MOT_ACCESSORIES_CUT_OUT_MEASURMENT_REPORT,
  },
  {
    name: "Complete Site Checking Report",
    template: COMPLETE_SITE_CHECKING_REPORT,
  },
  {
    name: "MOT Electrical Line",
    template: MOT_ELECTRIC_LINE,
  },
  {
    name: "Supply Duct Checking",
    template: SUPPLY_DUCT_CHECKING,
  },
  {
    name: "Return Duct Checking",
    template: RETURN_DUCT_CHECKING,
  },
  {
    name: "AHU Checklist Report",
    template: AHU_CHECKLIST_REPORT
  },
  {
    name: "Compressor Checklist Report",
    template: COMPOSER_CHECKLIST_REPORT
  },
  {
    name: "Plenum Box Checklist Report",
    template: PLENUM_BOX_CHECKLIST_REPORT
  }
]

let defaultsPromise: Promise<void> | null = null

export async function ensureDefaults() {
  if (!defaultsPromise) {
    defaultsPromise = (async () => {
      try {
        await prisma.$transaction(async (tx) => {
          for (const name of DEFAULT_PERMISSIONS) {
            await tx.permission.upsert({
              where: { name },
              update: {},
              create: { name },
            })
          }

          for (const role of DEFAULT_ROLES) {
            const roleRecord = await tx.role.upsert({
              where: { name: role.name },
              update: {},
              create: { name: role.name },
            })

            const permissionRecords = await tx.permission.findMany({
              where: { name: { in: role.permissions } },
            })

            await tx.rolePermission.createMany({
              data: permissionRecords.map((perm) => ({
                roleId: roleRecord.id,
                permissionId: perm.id,
              })),
              skipDuplicates: true,
            })
          }

          for (const company of DEFAULT_COMPANIES) {
            await tx.company.upsert({
              where: { code: company.code },
              update: {
                name: company.name,
              },
              create: {
                name: company.name,
                code: company.code,
              },
            })
          }

          for (const form of DEFAULT_PROJECT_FORMS) {
            await tx.projectForm.upsert({
              where: {
                name: form.name,
              },
              update: {
                template: form.template,
              },
              create: {
                name: form.name,
                template: form.template,
              },
            })
          }
        })
      } catch (error) {
        defaultsPromise = null
        throw error
      }
    })()
  }

  return defaultsPromise
}
