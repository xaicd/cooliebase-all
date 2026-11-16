import { z } from "zod"
import { registerActionSchema } from "@/modules/shared/backend/lib/broker-validator"
import {
  pmsMilestoneCreateSchema,
  pmsMilestonePageQuerySchema,
  pmsMilestoneUpdateSchema,
  pmsProjectCreateSchema,
  pmsProjectPageQuerySchema,
  pmsProjectUpdateSchema,
  pmsTimesheetCreateSchema,
  pmsTimesheetPageQuerySchema,
  pmsTimesheetUpdateSchema,
} from "../backend/validators"

export const pmsPingSchema = z.object({
  n: z.number().optional(),
})

export const PMS_ACTION_SCHEMAS = {
  "pms.pmsMilestone.create": pmsMilestoneCreateSchema,
  "pms.pmsMilestone.page": pmsMilestonePageQuerySchema,
  "pms.pmsMilestone.update": pmsMilestoneUpdateSchema,
  "pms.pmsProject.create": pmsProjectCreateSchema,
  "pms.pmsProject.page": pmsProjectPageQuerySchema,
  "pms.pmsProject.update": pmsProjectUpdateSchema,
  "pms.pmsTimesheet.create": pmsTimesheetCreateSchema,
  "pms.pmsTimesheet.page": pmsTimesheetPageQuerySchema,
  "pms.pmsTimesheet.update": pmsTimesheetUpdateSchema,
} as const

export function registerActionSchemas() {
  for (const [action, schema] of Object.entries(PMS_ACTION_SCHEMAS)) {
    registerActionSchema(action, schema)
  }
}
