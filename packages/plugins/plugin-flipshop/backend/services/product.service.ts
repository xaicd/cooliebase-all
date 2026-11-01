import { ApiError } from "@/modules/shared/backend/http/api-error"
import type { AuthContext } from "@/modules/shared/backend/auth/context"
import { domainLog } from "@/modules/shared/backend/lib/domain-log"
import { KyselyFlipProductRepository } from "../repositories/product.repository"
import type { ProductDTO, ProductPageDTO } from "../types/product.types"
import type { FlipshopProductCreateInput, FlipshopProductPageQueryInput } from "../validators"

function tenantScope(auth: AuthContext): { tenantId: string; actorId: string } {
  if (!auth.tenantId) throw new ApiError("FORBIDDEN", "商品必须在租户上下文中管理")
  return { tenantId: auth.tenantId, actorId: auth.userId }
}

/**
 * 商品应用服务 —— list / get / create 三个暴露入口。
 *
 * 写入口(create)拦截不变量：
 *   INV-PRODUCT-01/03 由 validator 在 parse 阶段拦截（负价/负库存/非法状态）；
 *   INV-PRODUCT-02 由本层先查（未软删）再由部分唯一索引兜底并发。
 * 本期 OpenAPI 无 update/delete 端点（HLD §1 Out），故未开放 CAS 更新路径；
 * version / 乐观锁口径已随表结构落库，供下一期编辑动作直接复用。
 */
export class FlipProductService {
  static async list(auth: AuthContext, input: FlipshopProductPageQueryInput): Promise<ProductPageDTO> {
    const { tenantId } = tenantScope(auth)
    return KyselyFlipProductRepository.page({ tenantId, ...input })
  }

  static async get(auth: AuthContext, id: string): Promise<ProductDTO> {
    const { tenantId } = tenantScope(auth)
    const product = await KyselyFlipProductRepository.findById({ tenantId, id })
    if (!product) throw new ApiError("NOT_FOUND", `商品 ${id} 不存在或不属于当前租户`)
    return product
  }

  static async create(auth: AuthContext, input: FlipshopProductCreateInput): Promise<ProductDTO> {
    const { tenantId, actorId } = tenantScope(auth)
    if (await KyselyFlipProductRepository.existsBySku({ tenantId, skuCode: input.skuCode })) {
      throw new ApiError("CONFLICT", `SKU ${input.skuCode} 在当前租户内已存在`)
    }
    const product = await KyselyFlipProductRepository.create({
      tenantId,
      actorId,
      name: input.name,
      skuCode: input.skuCode,
      priceCents: input.priceCents,
      stock: input.stock,
      status: input.status,
      coverUrl: input.coverUrl ?? null,
      description: input.description ?? null,
    })
    domainLog.audit("flipshop.product.create", { targetType: "FLIP_PRODUCT", targetId: product.id })
    return product
  }
}
