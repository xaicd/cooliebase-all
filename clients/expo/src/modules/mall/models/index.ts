import type { MallProductSpu } from "../api"
import type { MobileBlockDef } from "../../../shared/types"

export type { MallProductSpu }

export const MALL_PORTAL_BLOCKS: MobileBlockDef[] = [
  {
    id: "mall_hero_banner",
    type: "banner",
    title: "新零售多端旗舰专场",
    surface: "mobile",
    items: [
      {
        badge: "PAGEPLUG × COOLIEBASE 多端画布",
        title: "一套 PageBlockDSL 驱动 PC / App / 小程序",
        subtitle: "支持轮播、金刚区宫格、双列瀑布流与动态 SKU 下单",
      },
    ],
  },
  {
    id: "mall_kingkong_nav",
    type: "grid_nav",
    title: "核心业务金刚区",
    surface: "mobile",
    items: [
      { title: "新品首发", subtitle: "限时特惠", icon: "★", color: "#4f46e5" },
      { title: "企业集采", subtitle: "专享折扣", icon: "❖", color: "#059669" },
      { title: "极速履约", subtitle: "次日达", icon: "⚡", color: "#d97706" },
      { title: "售后保障", subtitle: "极速退换", icon: "✓", color: "#e11d48" },
    ],
  },
]
