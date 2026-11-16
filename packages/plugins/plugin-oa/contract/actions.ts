import { z } from "zod"
import { registerActionSchema } from "@/modules/shared/backend/lib/broker-validator"
import {
  oaAttendanceCreateSchema,
  oaAttendancePageQuerySchema,
  oaAttendanceUpdateSchema,
  oaLeaveApplyCreateSchema,
  oaLeaveApplyPageQuerySchema,
  oaLeaveApplyUpdateSchema,
  oaNoticeCreateSchema,
  oaNoticePageQuerySchema,
  oaNoticeUpdateSchema,
} from "../backend/validators"

export const oaPingSchema = z.object({
  n: z.number().optional(),
})

export const OA_ACTION_SCHEMAS = {
  "oa.oaAttendance.create": oaAttendanceCreateSchema,
  "oa.oaAttendance.page": oaAttendancePageQuerySchema,
  "oa.oaAttendance.update": oaAttendanceUpdateSchema,
  "oa.oaLeaveApply.create": oaLeaveApplyCreateSchema,
  "oa.oaLeaveApply.page": oaLeaveApplyPageQuerySchema,
  "oa.oaLeaveApply.update": oaLeaveApplyUpdateSchema,
  "oa.oaNotice.create": oaNoticeCreateSchema,
  "oa.oaNotice.page": oaNoticePageQuerySchema,
  "oa.oaNotice.update": oaNoticeUpdateSchema,
} as const

export function registerActionSchemas() {
  for (const [action, schema] of Object.entries(OA_ACTION_SCHEMAS)) {
    registerActionSchema(action, schema)
  }
}
