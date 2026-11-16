import { z } from "zod"
import { registerActionSchema } from "@/modules/shared/backend/lib/broker-validator"
import {
  hrmEmployeeCreateSchema,
  hrmEmployeePageQuerySchema,
  hrmEmployeeUpdateSchema,
  hrmPayrollCreateSchema,
  hrmPayrollPageQuerySchema,
  hrmPayrollUpdateSchema,
  hrmPositionCreateSchema,
  hrmPositionPageQuerySchema,
  hrmPositionUpdateSchema,
} from "../backend/validators"

export const hrmPingSchema = z.object({
  n: z.number().optional(),
})

export const HRM_ACTION_SCHEMAS = {
  "hrm.hrmEmployee.create": hrmEmployeeCreateSchema,
  "hrm.hrmEmployee.page": hrmEmployeePageQuerySchema,
  "hrm.hrmEmployee.update": hrmEmployeeUpdateSchema,
  "hrm.hrmPayroll.create": hrmPayrollCreateSchema,
  "hrm.hrmPayroll.page": hrmPayrollPageQuerySchema,
  "hrm.hrmPayroll.update": hrmPayrollUpdateSchema,
  "hrm.hrmPosition.create": hrmPositionCreateSchema,
  "hrm.hrmPosition.page": hrmPositionPageQuerySchema,
  "hrm.hrmPosition.update": hrmPositionUpdateSchema,
} as const

export function registerActionSchemas() {
  for (const [action, schema] of Object.entries(HRM_ACTION_SCHEMAS)) {
    registerActionSchema(action, schema)
  }
}
