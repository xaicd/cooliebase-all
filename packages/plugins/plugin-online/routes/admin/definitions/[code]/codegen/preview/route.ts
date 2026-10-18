import { NextResponse } from "next/server"
import { OnlineDefinitionService } from "@/modules/online/backend/services"
import { PERMISSIONS } from "@/modules/shared/backend/constants/permissions"
import { withAdminRoute } from "@/modules/shared/backend/http/admin-route"

type RouteContext = { params: Promise<{ code: string }> }

/** Preview shared CoolieBase CRUD output from the tenant-scoped immutable Published Release. */
export const POST = withAdminRoute(async (_request, auth, context: RouteContext) => {
  const { code } = await context.params
  const result = await OnlineDefinitionService.previewGeneratedCode(auth, code)
  return NextResponse.json({ success: true, data: { releaseId: result.releaseId, schemaRevision: result.schemaRevision, files: result.files.map(({ path, type, content }) => ({ path, type, content })) } })
}, { permission: PERMISSIONS.INFRA_ONLINE_DEFINITION_GENERATE })
