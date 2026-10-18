import type { CaptchaVerifyInput } from "@/modules/system/backend/validators"
import { domainLog } from "@/modules/shared/backend/lib/domain-log"
import { cooliebasePrisma } from "@/modules/shared/backend/prisma"

type CaptchaRecord = {
  code: string
  expiresAt: number
}

const CAPTCHA_TTL_MS = 5 * 60 * 1000

function randomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export class SystemCaptchaService {
  static async generate() {
    const captchaId = `cap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const code = randomCode()
    const expiresAt = Date.now() + CAPTCHA_TTL_MS

    await cooliebasePrisma.setting.upsert({
      where: { key: `captcha:${captchaId}` },
      create: { key: `captcha:${captchaId}`, value: { code, expiresAt } },
      update: { value: { code, expiresAt } },
    })

    domainLog.event("system.captcha.generate", {
      captchaId,
      ttlSec: CAPTCHA_TTL_MS / 1000,
    })

    return {
      captchaId,
      imageBase64: Buffer.from(`CAPTCHA:${code}`).toString("base64"),
      expiresAt: new Date(expiresAt).toISOString(),
    }
  }

  static async verify(input: CaptchaVerifyInput) {
    const row = await cooliebasePrisma.setting.findUnique({ where: { key: `captcha:${input.captchaId}` } })
    const record = row?.value as CaptchaRecord | null
    const now = Date.now()

    domainLog.event("system.captcha.verify", {
      captchaId: input.captchaId,
      hasRecord: Boolean(record),
    })

    if (!record || record.expiresAt < now) {
      await cooliebasePrisma.setting.deleteMany({ where: { key: { startsWith: `captcha:${input.captchaId}` } } })
      throw new Error("验证码无效或已过期")
    }

    if (record.code.toLowerCase() !== input.code.toLowerCase()) {
      throw new Error("验证码错误")
    }

    await cooliebasePrisma.setting.deleteMany({ where: { key: { startsWith: `captcha:${input.captchaId}` } } })
    domainLog.audit("system.captcha.verify.success", {
      captchaId: input.captchaId,
    })

    return { success: true }
  }

  static async generateCaptcha(_input: Record<string, never> = {}) {
    return this.generate()
  }

  static async verifyCaptcha(input: CaptchaVerifyInput) {
    return this.verify(input)
  }
}
