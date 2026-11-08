"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { request } from "@/modules/shared/frontend/lib/request"
import { projectProfile } from "@/shared/contract/project-profile"
import { readPortalBlueprint } from "@/shared/contract/blueprint-vars"

interface SkuItem {
  id: number
  spu_id?: string
  properties?: string
  property_name?: string
  value_name?: string
  price?: number
  market_price?: number
  stock?: number
}

interface SpuItem {
  id: number
  name?: string
  keyword?: string
  introduction?: string
  category_id?: string
  categoryName?: string
  price?: number
  market_price?: number
  stock?: number
  sales_count?: number
  skus?: SkuItem[]
  seckill?: {
    activityId: string
    activityName: string
    seckillPrice: number
    stock: number
  } | null
}

interface CategoryItem {
  id: number
  name?: string
  sort?: number
}

interface CouponTemplateItem {
  id: number
  name?: string
  description?: string
  use_price?: number
  discount_type?: number
  discount_price?: number
  discount_percent?: number
  claimedCount?: number
  canTake?: boolean
}

interface UserCouponItem {
  id: number
  template_id?: string
  name?: string
  status?: number
  use_price?: number
  discount_type?: number
  discount_price?: number
  discount_percent?: number
  calculatedDiscount?: number
}

interface RewardActivityItem {
  id: number
  name?: string
  remark?: string
  limit?: number
  discount_price?: number
  free_delivery?: boolean
}

interface CartItem {
  id: number
  spu_id?: string
  sku_id?: string
  spuName: string
  skuSpec: string
  count?: number
  unitPrice: number
  originalPrice: number
  stock: number
}

interface SettlementResult {
  items: Array<{
    spuId: string
    spuName: string
    skuId: string
    skuSpec: string
    count: number
    originalUnitPrice: number
    unitPrice: number
    lineTotal: number
    lineDiscount: number
    stock: number
    cartId?: string
  }>
  price: {
    totalPrice: number
    seckillDiscount: number
    rewardDiscount: number
    couponDiscount: number
    totalDiscount: number
    deliveryPrice: number
    payPrice: number
    givePoint: number
  }
  matchedRewardName: string | null
  usableCoupons: UserCouponItem[]
  selectedCouponId: string | null
  selectedCouponName: string | null
}

interface PortalOrder {
  id: number
  no?: string
  type?: number
  status?: number
  total_price?: number
  discount_price?: number
  coupon_price?: number
  delivery_price?: number
  pay_price?: number
  pay_order_id?: string
  pay_channel_code?: string
  logistics_no?: string
  refund_status?: number
  receiver_name?: string
  receiver_mobile?: string
  receiver_detail_address?: string
  created_at?: string
  items?: Array<{
    id: number
    spu_name?: string
    properties?: string
    count?: number
    pay_price?: number
  }>
  logs?: Array<{
    id: number
    content?: string
    created_at?: string
  }>
}

const ORDER_STATUS_TEXT: Record<number, { text: string; cls: string }> = {
  0: { text: "待付款", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  10: { text: "待发货", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  20: { text: "已发货 · 运输中", cls: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  30: { text: "交易完成", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  40: { text: "已取消/关闭", cls: "bg-slate-100 text-slate-600 border-slate-200" },
}

export function BookStorePortal({ initialCategory }: { initialCategory?: string } = {}) {
  const profile = projectProfile
  const brandName = profile.shortName || profile.platformName
  const portalBlueprint = readPortalBlueprint(profile)

  const [userId] = useState("member-demo-01")
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [products, setProducts] = useState<SpuItem[]>([])
  const [couponTemplates, setCouponTemplates] = useState<CouponTemplateItem[]>([])
  const [myCoupons, setMyCoupons] = useState<UserCouponItem[]>([])
  const [rewardActivities, setRewardActivities] = useState<RewardActivityItem[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<PortalOrder[]>([])

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory && initialCategory !== "all" ? initialCategory : "ALL")
  const [keyword, setKeyword] = useState<string>("")
  const [toast, setToast] = useState<string | null>(null)

  // SPU/SKU 选规格弹窗
  const [activeSpu, setActiveSpu] = useState<SpuItem | null>(null)
  const [selectedSkuId, setSelectedSkuId] = useState<string>("")
  const [buyCount, setBuyCount] = useState<number>(1)

  // 购物车与结算抽屉
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutItemsInput, setCheckoutItemsInput] = useState<
    Array<{ spuId: string | number; skuId?: string | number; count: number; cartId?: string | number }>
  >([])
  const [settlement, setSettlement] = useState<SettlementResult | null>(null)
  const [selectedCouponId, setSelectedCouponId] = useState<string>("")
  const [deliveryType, setDeliveryType] = useState<number>(1)
  const [receiverName, setReceiverName] = useState("张明远")
  const [receiverMobile, setReceiverMobile] = useState("13800138000")
  const [receiverAddress, setReceiverAddress] = useState("上海市浦东新区张江高科技园区科苑路88号")
  const [userRemark, setUserRemark] = useState("")
  const [submittingOrder, setSubmittingOrder] = useState(false)

  // 收银台弹窗
  const [cashierOrder, setCashierOrder] = useState<{
    orderId: number | string
    orderNo: string
    payOrderId: string
    payPrice: number
  } | null>(null)
  const [payChannel, setPayChannel] = useState<string>("wx_pub")
  const [paying, setPaying] = useState(false)

  // 我的订单与售后抽屉
  const [ordersDrawerOpen, setOrdersDrawerOpen] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const loadStorefront = useCallback(async () => {
    setLoading(true)
    try {
      const res = await request.get("/api/v1/app/mall/products", {
        params: {
          userId,
          categoryId: activeCategory === "ALL" ? undefined : activeCategory,
          keyword: keyword.trim() || undefined,
        },
        noAuth: true,
      })
      if (res.success && res.data) {
        const d = res.data
        setCategories(d.categories ?? [])
        setProducts(d.products ?? d.items ?? [])
        setCouponTemplates(d.couponTemplates ?? [])
        setMyCoupons(d.myCoupons ?? [])
        setRewardActivities(d.rewardActivities ?? [])
        setCartItems(d.cartItems ?? [])
        setOrders(d.orders ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [userId, activeCategory, keyword])

  useEffect(() => {
    loadStorefront()
  }, [loadStorefront])

  const handleTakeCoupon = async (templateId: number) => {
    const res = await request.post(
      "/api/v1/app/mall/products",
      { action: "takeCoupon", templateId, userId },
      { noAuth: true },
    )
    if (res.success) {
      showToast(`已成功领取优惠券「${res.data?.name || "满减券"}」，可在结算时直接抵扣！`)
      loadStorefront()
    } else {
      showToast(res.error || "领取失败")
    }
  }

  const openSkuSelector = (spu: SpuItem) => {
    setActiveSpu(spu)
    const firstSku = spu.skus?.[0]
    setSelectedSkuId(firstSku ? String(firstSku.id) : String(spu.id))
    setBuyCount(1)
  }

  const handleAddToCart = async (spu: SpuItem, skuId?: string, count = 1) => {
    const resolvedSkuId = skuId || (spu.skus?.[0] ? String(spu.skus[0].id) : String(spu.id))
    const existing = cartItems.find(
      (c) => String(c.spu_id) === String(spu.id) && String(c.sku_id) === String(resolvedSkuId),
    )
    const nextCount = Number(existing?.count ?? 0) + count
    const res = await request.post(
      "/api/v1/app/mall/products",
      {
        action: "saveCart",
        userId,
        spuId: spu.id,
        skuId: resolvedSkuId,
        count: nextCount,
      },
      { noAuth: true },
    )
    if (res.success) {
      setActiveSpu(null)
      showToast(`已将「${spu.name}」加入购物车（共 ${nextCount} 件）`)
      loadStorefront()
    } else {
      showToast(res.error || "加购失败")
    }
  }

  const handleUpdateCartCount = async (item: CartItem, nextCount: number) => {
    await request.post(
      "/api/v1/app/mall/products",
      {
        action: "saveCart",
        userId,
        spuId: item.spu_id,
        skuId: item.sku_id,
        count: nextCount,
      },
      { noAuth: true },
    )
    const updatedRes = await request.get("/api/v1/app/mall/products", {
      params: { userId },
      noAuth: true,
    })
    const latestCart: CartItem[] = updatedRes.data?.cartItems ?? []
    setCartItems(latestCart)
    if (latestCart.length > 0) {
      await refreshSettlement(
        latestCart.map((c) => ({
          spuId: String(c.spu_id),
          skuId: String(c.sku_id),
          count: Number(c.count ?? 1),
          cartId: String(c.id),
        })),
        selectedCouponId,
        deliveryType,
      )
    } else {
      setSettlement(null)
    }
  }

  const refreshSettlement = async (
    itemsToSettle: Array<{ spuId: string | number; skuId?: string | number; count: number; cartId?: string | number }>,
    couponChoice?: string,
    deliveryChoice?: number,
  ) => {
    if (itemsToSettle.length === 0) {
      setSettlement(null)
      return
    }
    const res = await request.post(
      "/api/v1/app/mall/products",
      {
        action: "settlement",
        userId,
        items: itemsToSettle,
        couponId: couponChoice || undefined,
        deliveryType: deliveryChoice ?? deliveryType,
      },
      { noAuth: true },
    )
    if (res.success && res.data) {
      setSettlement(res.data)
      setSelectedCouponId(res.data.selectedCouponId ?? "NONE")
    } else {
      showToast(res.error || "结算算价失败")
    }
  }

  const openCartCheckout = async () => {
    const items = cartItems.map((c) => ({
      spuId: String(c.spu_id),
      skuId: String(c.sku_id),
      count: Number(c.count ?? 1),
      cartId: String(c.id),
    }))
    setCheckoutItemsInput(items)
    setCheckoutOpen(true)
    if (items.length > 0) {
      await refreshSettlement(items, undefined, deliveryType)
    } else {
      setSettlement(null)
    }
  }

  const handleDirectBuy = async (spu: SpuItem, skuId?: string, count = 1) => {
    const resolvedSkuId = skuId || (spu.skus?.[0] ? String(spu.skus[0].id) : String(spu.id))
    const items = [{ spuId: spu.id, skuId: resolvedSkuId, count }]
    setActiveSpu(null)
    setCheckoutItemsInput(items)
    setCheckoutOpen(true)
    await refreshSettlement(items, undefined, deliveryType)
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settlement || checkoutItemsInput.length === 0) return
    setSubmittingOrder(true)
    try {
      const res = await request.post(
        "/api/v1/app/mall/products",
        {
          action: "checkout",
          userId,
          items: checkoutItemsInput,
          couponId: selectedCouponId || undefined,
          deliveryType,
          receiverName,
          receiverMobile,
          receiverDetailAddress: receiverAddress,
          userRemark,
        },
        { noAuth: true },
      )
      if (res.success && res.data?.order) {
        const ord = res.data.order
        setCheckoutOpen(false)
        setCashierOrder({
          orderId: ord.id,
          orderNo: ord.no,
          payOrderId: res.data.payOrderId || `PAY-${ord.id}`,
          payPrice: Number(ord.pay_price ?? settlement.price.payPrice),
        })
        showToast(`订单 ${ord.no} 创建成功，已扣减实时库存！请完成收银台支付`)
        loadStorefront()
      } else {
        showToast(res.error || "创建订单失败")
      }
    } finally {
      setSubmittingOrder(false)
    }
  }

  const handleConfirmCashierPay = async () => {
    if (!cashierOrder) return
    setPaying(true)
    try {
      const res = await request.post(
        "/api/v1/app/mall/products",
        {
          action: "payOrder",
          userId,
          orderId: cashierOrder.orderId,
          payOrderId: cashierOrder.payOrderId,
          channelCode: payChannel,
        },
        { noAuth: true },
      )
      if (res.success) {
        showToast(`支付成功！订单 ${cashierOrder.orderNo} 已进入「待发货」状态`)
        setCashierOrder(null)
        setOrdersDrawerOpen(true)
        loadStorefront()
      } else {
        showToast(res.error || "支付失败")
      }
    } finally {
      setPaying(false)
    }
  }

  const handleReceiveOrder = async (order: PortalOrder) => {
    const res = await request.post(
      "/api/v1/app/mall/products",
      { action: "receiveOrder", orderId: order.id, userId },
      { noAuth: true },
    )
    if (res.success) {
      showToast(`订单 ${order.no} 已确认收货，交易完成！`)
      loadStorefront()
    } else {
      showToast(res.error || "确认收货失败")
    }
  }

  const handleCancelOrder = async (order: PortalOrder) => {
    const res = await request.post(
      "/api/v1/app/mall/products",
      { action: "cancelOrder", orderId: order.id, reason: "买家主动取消订单", userId },
      { noAuth: true },
    )
    if (res.success) {
      showToast(`订单 ${order.no} 已取消，商品库存与优惠券已自动归还`)
      loadStorefront()
    } else {
      showToast(res.error || "取消订单失败")
    }
  }

  const handleApplyAfterSale = async (order: PortalOrder) => {
    const res = await request.post(
      "/api/v1/app/mall/products",
      {
        action: "applyAfterSale",
        orderId: order.id,
        userId,
        applyReason: "7天无理由退货退款",
        applyDescription: "C端用户申请售后原路退款",
        way: 10,
      },
      { noAuth: true },
    )
    if (res.success) {
      showToast(`已提交售后退款单 ${res.data?.no || ""}，可在 B 端订单工作台审核通过！`)
      loadStorefront()
    } else {
      showToast(res.error || "申请售后失败")
    }
  }

  const totalCartCount = cartItems.reduce((sum, item) => sum + Number(item.count ?? 0), 0)
  const unusedCouponsCount = myCoupons.filter((c) => Number(c.status ?? 1) === 1).length

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 顶部品牌与实时交易导航栏 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center shadow-xs">
              {profile.branding?.mark || brandName.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">{brandName}</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  真实数据库驱动 · 全闭环商城
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">{profile.description || portalBlueprint.heroDesc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setOrdersDrawerOpen(true)}
              data-testid="portal-my-orders-btn"
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            >
              <span>我的订单</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-white text-[10px]">{orders.length}</span>
            </button>
            <button
              type="button"
              onClick={openCartCheckout}
              data-testid="portal-cart-btn"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <span>购物车 / 结算</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white text-indigo-700 text-[10px] font-bold">
                {totalCartCount}
              </span>
            </button>
            <Link
              href="/admin/mall/trade-order"
              className="hidden md:inline-flex px-3 py-2 rounded-xl text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              B端订单履约台 →
            </Link>
          </div>
        </div>
      </header>

      {toast && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-medium shadow-lg flex items-center justify-between">
            <span>✨ {toast}</span>
            <button type="button" onClick={() => setToast(null)} className="text-slate-300 hover:text-white">
              关闭
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 营销会场：满减活动 + 实时领券中心 */}
        <section className="rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-medium">
                <span>🔥 实时营销引擎 (Promotion Engine)</span>
                {rewardActivities[0] && (
                  <span className="text-amber-300 font-semibold">· {rewardActivities[0].name}</span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {brandName} · 数字化商品与营销交易中心
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                全量商品 SPU/SKU、分类、优惠券模板、限时秒杀与满减规则 100% 实时读取自后端数据库；支持领券抵扣、多规格加购、自动算价、库存扣减、收银台支付与售后退款全链路闭环。
              </p>
            </div>

            {/* 领券中心卡片组 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:w-[540px]">
              {couponTemplates.slice(0, 3).map((tpl) => (
                <div
                  key={tpl.id}
                  className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-3.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-black text-amber-300">
                        {Number(tpl.discount_type ?? 1) === 2
                          ? `${Number(tpl.discount_percent ?? 90) / 10}折`
                          : `¥${tpl.discount_price ?? 20}`}
                      </span>
                      <span className="text-[10px] text-indigo-200">满¥{tpl.use_price ?? 100}可用</span>
                    </div>
                    <div className="text-xs font-semibold text-white mt-1 truncate">{tpl.name}</div>
                    <div className="text-[11px] text-slate-300 mt-0.5 truncate">{tpl.description}</div>
                  </div>
                  <button
                    type="button"
                    disabled={!tpl.canTake}
                    onClick={() => handleTakeCoupon(tpl.id)}
                    data-testid={`claim-coupon-${tpl.id}`}
                    className={`mt-3 w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                      tpl.canTake
                        ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
                        : "bg-white/15 text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    {tpl.canTake ? "立即领券" : `已领 (${tpl.claimedCount ?? 1}张)`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 分类筛选与搜索栏 */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveCategory("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              全部商品 ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(String(cat.id))}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeCategory === String(cat.id)
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">可用券: {unusedCouponsCount} 张</span>
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索商品名称、关键词或规格..."
              className="w-full sm:w-60 px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </section>

        {/* 商品 SPU/SKU 瀑布流列表 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-72 rounded-2xl bg-white border border-slate-200 p-5 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
            <div className="text-sm font-semibold text-slate-700">当前筛选条件下暂无商品</div>
            <button
              type="button"
              onClick={() => {
                setActiveCategory("ALL")
                setKeyword("")
              }}
              className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded-lg"
            >
              查看全部商品
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((spu) => {
              const displayPrice = spu.seckill?.seckillPrice ?? spu.price ?? 0
              const originalPrice = spu.market_price ?? spu.price ?? displayPrice
              return (
                <article
                  key={spu.id}
                  data-testid={`portal-product-card-${spu.id}`}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {spu.categoryName || "精选商品"}
                      </span>
                      {spu.seckill ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                          ⚡ 限时秒杀直降 ¥{((spu.price ?? 0) - spu.seckill.seckillPrice).toFixed(0)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">库存 {spu.stock ?? 0} · 已售 {spu.sales_count ?? 0}</span>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-slate-900 mt-3 line-clamp-1">{spu.name}</h2>
                    {spu.keyword && (
                      <p className="text-xs font-medium text-indigo-600 mt-1">{spu.keyword}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {spu.introduction}
                    </p>

                    {/* SKU 规格标签预览 */}
                    {spu.skus && spu.skus.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {spu.skus.map((sku) => (
                          <span
                            key={sku.id}
                            className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600"
                          >
                            {sku.value_name || sku.properties} (余{sku.stock ?? 0})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-slate-900">¥{Number(displayPrice).toFixed(2)}</span>
                        {Number(originalPrice) > Number(displayPrice) && (
                          <span className="text-xs text-slate-400 line-through">¥{Number(originalPrice).toFixed(2)}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        支持满减叠加与优惠券抵扣
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openSkuSelector(spu)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        选规格
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDirectBuy(spu)}
                        data-testid={`portal-buy-now-${spu.id}`}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      >
                        立即购买
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </main>

      {/* SPU 多规格 SKU 选择器弹窗 */}
      {activeSpu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">{activeSpu.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{activeSpu.keyword}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSpu(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                关闭
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">选择商品规格 (SKU)</label>
              <div className="space-y-2">
                {(activeSpu.skus ?? []).map((sku) => {
                  const selected = String(sku.id) === selectedSkuId
                  return (
                    <button
                      key={sku.id}
                      type="button"
                      onClick={() => setSelectedSkuId(String(sku.id))}
                      className={`w-full p-3 rounded-xl border text-left text-xs flex items-center justify-between transition-all ${
                        selected
                          ? "border-indigo-600 bg-indigo-50/60 text-indigo-900 font-semibold"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <span>{sku.value_name || sku.properties || "标准规格"}</span>
                      <span className="font-mono">
                        ¥{Number(sku.price ?? activeSpu.price ?? 0).toFixed(2)} (库存 {sku.stock ?? 0})
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold text-slate-700">购买数量</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBuyCount((c) => Math.max(1, c - 1))}
                  className="w-7 h-7 rounded-lg border border-slate-300 text-xs font-bold"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-bold">{buyCount}</span>
                <button
                  type="button"
                  onClick={() => setBuyCount((c) => c + 1)}
                  className="w-7 h-7 rounded-lg border border-slate-300 text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                type="button"
                onClick={() => handleAddToCart(activeSpu, selectedSkuId, buyCount)}
                className="py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 hover:bg-slate-200"
              >
                加入购物车
              </button>
              <button
                type="button"
                onClick={() => handleDirectBuy(activeSpu, selectedSkuId, buyCount)}
                className="py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
              >
                立即结算下单
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 购物车与结算算价抽屉 (对标芋道 TradePriceCalculator) */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">购物车与结算算价引擎</h3>
                  <p className="text-xs text-slate-500">自动计算秒杀直降、满减活动与优惠券最优抵扣</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  className="px-3 py-1 text-xs rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  关闭
                </button>
              </div>

              {!settlement || settlement.items.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  购物车暂无商品，请先在商城选品加购或点击「立即购买」
                </div>
              ) : (
                <form id="portal-checkout-form" onSubmit={handleCreateOrder} className="space-y-4">
                  {/* 结算商品清单 */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-700">结算商品清单</div>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                      {settlement.items.map((item) => (
                        <div key={`${item.spuId}-${item.skuId}`} className="p-3 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-slate-900">{item.spuName}</div>
                            <div className="text-[11px] text-slate-500">{item.skuSpec}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900">¥{item.unitPrice.toFixed(2)} × {item.count}</div>
                            {item.lineDiscount > 0 && (
                              <div className="text-[10px] text-rose-600">已享秒杀立减 -¥{item.lineDiscount.toFixed(2)}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 优惠券选择 */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      选择优惠券 ({settlement.usableCoupons.length} 张可用)
                    </label>
                    <select
                      value={selectedCouponId || "NONE"}
                      onChange={(e) => {
                        const val = e.target.value
                        setSelectedCouponId(val)
                        refreshSettlement(checkoutItemsInput, val, deliveryType)
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    >
                      <option value="NONE">不使用优惠券</option>
                      {settlement.usableCoupons.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name} (立减 ¥{Number(c.calculatedDiscount ?? 0).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 配送方式与收货地址 */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">配送方式</span>
                      <div className="flex gap-2">
                        {[
                          { val: 1, label: "快递发货" },
                          { val: 2, label: "到店自提 (免运费)" },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => {
                              setDeliveryType(opt.val)
                              refreshSettlement(checkoutItemsInput, selectedCouponId, opt.val)
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                              deliveryType === opt.val
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        placeholder="收货人姓名"
                        className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                      />
                      <input
                        type="text"
                        required
                        value={receiverMobile}
                        onChange={(e) => setReceiverMobile(e.target.value)}
                        placeholder="联系电话"
                        className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      value={receiverAddress}
                      onChange={(e) => setReceiverAddress(e.target.value)}
                      placeholder="详细收货地址"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      value={userRemark}
                      onChange={(e) => setUserRemark(e.target.value)}
                      placeholder="买家留言（选填）"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>

                  {/* 算价明细账单 */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>商品原价总额</span>
                      <span>¥{settlement.price.totalPrice.toFixed(2)}</span>
                    </div>
                    {settlement.price.seckillDiscount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>限时秒杀立减</span>
                        <span>-¥{settlement.price.seckillDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {settlement.price.rewardDiscount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>{settlement.matchedRewardName || "满减活动优惠"}</span>
                        <span>-¥{settlement.price.rewardDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {settlement.price.couponDiscount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>优惠券抵扣 ({settlement.selectedCouponName})</span>
                        <span>-¥{settlement.price.couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>运费</span>
                      <span>{settlement.price.deliveryPrice === 0 ? "免运费 (¥0.00)" : `¥${settlement.price.deliveryPrice.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>预计成交返积分</span>
                      <span>+{settlement.price.givePoint} 积分</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                      <span className="font-bold text-slate-900">应付实付金额</span>
                      <span className="text-xl font-black text-indigo-600">¥{settlement.price.payPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingOrder}
                    data-testid="portal-submit-order-btn"
                    className="w-full py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
                  >
                    {submittingOrder ? "正在锁定库存并创建订单..." : `提交订单并锁库存 (¥${settlement.price.payPrice.toFixed(2)})`}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 聚合收银台弹窗 (Pay Cashier Modal) */}
      {cashierOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">聚合支付收银台</h3>
                <p className="text-xs text-slate-500">商城订单号：{cashierOrder.orderNo}</p>
              </div>
              <button
                type="button"
                onClick={() => setCashierOrder(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                稍后支付
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center">
              <div className="text-xs text-slate-500">应付金额</div>
              <div className="text-2xl font-black text-indigo-700 mt-1">¥{cashierOrder.payPrice.toFixed(2)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">支付单号：{cashierOrder.payOrderId}</div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">选择支付渠道</div>
              {[
                { code: "wx_pub", name: "微信支付 (WeChat Pay)", desc: "推荐 · 实时回调通知商城" },
                { code: "alipay_wap", name: "支付宝支付 (Alipay)", desc: "支持花呗与余额宝极速付款" },
                { code: "wallet", name: "会员钱包余额支付", desc: "实时扣减账户预存余额" },
              ].map((ch) => (
                <button
                  key={ch.code}
                  type="button"
                  onClick={() => setPayChannel(ch.code)}
                  className={`w-full p-3 rounded-xl border text-left text-xs flex items-center justify-between ${
                    payChannel === ch.code
                      ? "border-indigo-600 bg-indigo-50/50 font-semibold text-indigo-900"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  <div>
                    <div>{ch.name}</div>
                    <div className="text-[10px] text-slate-400">{ch.desc}</div>
                  </div>
                  <span className="text-xs">{payChannel === ch.code ? "●" : "○"}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={paying}
              onClick={handleConfirmCashierPay}
              data-testid="portal-confirm-pay-btn"
              className="w-full py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm"
            >
              {paying ? "正在处理支付回调..." : `确认立即支付 ¥${cashierOrder.payPrice.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}

      {/* 我的订单与售后退款抽屉 */}
      {ordersDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">我的交易订单与售后中心</h3>
                <p className="text-xs text-slate-500">支持待付款支付、物流单号查看、确认收货与发起售后退款</p>
              </div>
              <button
                type="button"
                onClick={() => setOrdersDrawerOpen(false)}
                className="px-3 py-1 text-xs rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                关闭
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">暂无历史订单</div>
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => {
                  const st = Number(ord.status ?? 0)
                  const stInfo = ORDER_STATUS_TEXT[st] ?? { text: `状态(${st})`, cls: "bg-slate-100 text-slate-600" }
                  const refundSt = Number(ord.refund_status ?? 0)
                  return (
                    <div key={ord.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-900">{ord.no}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${stInfo.cls}`}>
                            {stInfo.text}
                          </span>
                          {refundSt === 10 && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              售后审核中
                            </span>
                          )}
                          {refundSt === 20 && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                              已退款
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl p-2.5 text-xs">
                        {(ord.items ?? []).map((sub) => (
                          <div key={sub.id} className="py-1 flex items-center justify-between">
                            <span className="text-slate-800 font-medium">
                              {sub.spu_name} <span className="text-slate-400">({sub.properties})</span>
                            </span>
                            <span className="text-slate-600">×{sub.count ?? 1}</span>
                          </div>
                        ))}
                      </div>

                      {ord.logistics_no && (
                        <div className="text-xs text-indigo-700 bg-indigo-50/70 px-3 py-1.5 rounded-lg font-mono">
                          📦 商家已发货 · 物流运单号：{ord.logistics_no}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <div>
                          <span className="text-slate-500">实付：</span>
                          <span className="font-black text-slate-900 text-sm">¥{Number(ord.pay_price ?? 0).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {st === 0 && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setOrdersDrawerOpen(false)
                                  setCashierOrder({
                                    orderId: ord.id,
                                    orderNo: ord.no || String(ord.id),
                                    payOrderId: ord.pay_order_id || `PAY-${ord.id}`,
                                    payPrice: Number(ord.pay_price ?? 0),
                                  })
                                }}
                                className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
                              >
                                去付款
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelOrder(ord)}
                                className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-600"
                              >
                                取消订单
                              </button>
                            </>
                          )}
                          {st === 20 && (
                            <button
                              type="button"
                              onClick={() => handleReceiveOrder(ord)}
                              className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-semibold"
                            >
                              确认收货
                            </button>
                          )}
                          {(st === 10 || st === 20 || st === 30) && refundSt === 0 && (
                            <button
                              type="button"
                              onClick={() => handleApplyAfterSale(ord)}
                              className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                            >
                              申请售后退款
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
