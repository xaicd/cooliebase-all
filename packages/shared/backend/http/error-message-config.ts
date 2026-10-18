import { configCenter } from "../lib/config-center"
import type { ErrorCode, ErrorDefinition, ErrorMessageResolver } from "./error-catalog"

const NAMESPACE = "shared"
const KEY_PREFIX = "ERROR_MESSAGE_"
const MAX_MESSAGE_LENGTH = 300

function sanitizeMessage(value: string | null | undefined): string | undefined {
  const message = value?.replace(/[\r\n\t]+/g, " ").trim()
  if (!message || message.length > MAX_MESSAGE_LENGTH) return undefined
  return message
}

/**
 * Resolves only display text from config. The stable error code, HTTP status,
 * category, and retry policy are always defined by the source-controlled catalog.
 *
 * Example runtime key: shared.ERROR_MESSAGE_DEPENDENCY_UNAVAILABLE
 * Environment equivalent: COOLIEBASE_SHARED_ERROR_MESSAGE_DEPENDENCY_UNAVAILABLE
 */
export const configCenterErrorMessageResolver: ErrorMessageResolver = (
  definition: ErrorDefinition,
  code: ErrorCode,
) => sanitizeMessage(configCenter.get(NAMESPACE, `${KEY_PREFIX}${code}`, definition.defaultMessage))
