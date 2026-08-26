import { prisma } from "./prisma"
import { CLIENT_MOT_CHECK_LIST } from "./formTemplates/clientMotCheckList"
import { MOT_MEASUREMENT_SHEET } from "./formTemplates/motMeasurementSheet"
import { MOT_ELECTRIC_LINE } from "./formTemplates/motElectricLine"
import { MOT_ACCESSORIES_CUT_OUT_MEASURMENT_REPORT } from "./formTemplates/motAndAccessoriesCutOutMeasurementReport"
import { COMPLETE_SITE_CHECKING_REPORT } from "./formTemplates/completeSiteCheckingReport"
import { SOP_AND_CHECKLIST_OF_HVAC_SYSTEM } from "./formTemplates/sopAndCheckListOfHvacSystem"
import { MOT_MEASUREMENT_SHEET_FORM } from "./formTemplates/motMeasurementSheetForm"
import { OT_VALIDATION_AND_CALIBRATION } from "./formTemplates/otValidationAndCalibration"

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

export const DEFAULT_DRAWING_CATEGORIES = [
  "Basic Layout Rough Sketch Drawing",
  "AutoCAD Drawing",
  "Duct Drawing",
  "Rough Wall Panel Drawing",
  "Electric Drawing",
  "Wall Panel",
  "Ceiling Panel",
  "Elevation Drawing",
]

export const DEFAULT_PROJECT_FORMS = [
  {
    name: "Client MOT Check List",
    template: CLIENT_MOT_CHECK_LIST,
  },
  {
    name: "MOT Electrical Line",
    template: MOT_ELECTRIC_LINE,
  },
  {
    name: "MOT Selection Sheet",
    template: MOT_MEASUREMENT_SHEET,
  },
  {
    name: "SOP and Check List of HVAC System",
    template: SOP_AND_CHECKLIST_OF_HVAC_SYSTEM,
  },
  {
    name: "MOT Measurement Sheet",
    template: MOT_MEASUREMENT_SHEET_FORM,
  },
  {
    name: "Complete Site Checking Report",
    template: COMPLETE_SITE_CHECKING_REPORT,
  },
  {
    name: "OT Validation and Calibration",
    template: OT_VALIDATION_AND_CALIBRATION,
  },
  {
    name: "MOT & Accessories Cut-Out Measurement Report",
    template: MOT_ACCESSORIES_CUT_OUT_MEASURMENT_REPORT,
  },
]

// Applied before the upserts below. ProjectForm is keyed on name, so renaming
// in DEFAULT_PROJECT_FORMS alone would create a second form on any database
// that still holds the old name instead of renaming the existing one.
export const RENAMED_PROJECT_FORMS = [
  { from: "MOT Measurement Sheet", to: "MOT Selection Sheet" },
]

// Forms no longer offered on new projects. Kept in the database and
// deactivated rather than deleted, since deleting a ProjectForm
// cascade-deletes every submission ever made against it.
export const RETIRED_PROJECT_FORMS = [
  // Superseded by "SOP and Check List of HVAC System", which carries these
  // five as sections.
  "Supply Duct Checking",
  "Return Duct Checking",
  "AHU Checklist Report",
  "Compressor Checklist Report",
  "Plenum Box Checklist Report",
  // Discontinued.
  "MOT Selection List",
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

          for (const { from, to } of RENAMED_PROJECT_FORMS) {
            const existing = await tx.projectForm.findUnique({
              where: { name: from },
              select: { id: true },
            })
            const taken = await tx.projectForm.findUnique({
              where: { name: to },
              select: { id: true },
            })
            if (existing && !taken) {
              await tx.projectForm.update({
                where: { id: existing.id },
                data: { name: to },
              })
            }
          }

          // Position in DEFAULT_PROJECT_FORMS drives the order forms are listed
          // against a project. Anything not seeded here keeps the column
          // default of 999 and therefore sorts last.
          for (const [index, form] of DEFAULT_PROJECT_FORMS.entries()) {
            await tx.projectForm.upsert({
              where: {
                name: form.name,
              },
              update: {
                template: form.template,
                sortOrder: index,
              },
              create: {
                name: form.name,
                template: form.template,
                sortOrder: index,
              },
            })
          }

          await tx.projectForm.updateMany({
            where: { name: { in: RETIRED_PROJECT_FORMS } },
            data: { isActive: false },
          })

          for (const [index, name] of DEFAULT_DRAWING_CATEGORIES.entries()) {
            await tx.drawingCategory.upsert({
              where: { name },
              update: { sortOrder: index },
              create: { name, sortOrder: index },
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
