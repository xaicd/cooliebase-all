import React, { useEffect, useState } from "react"
import { View, Text, Alert, StyleSheet } from "react-native"
import { MallProductApi, MallTradeOrderApi, type MallProductSpu } from "../api"
import { MALL_PORTAL_BLOCKS } from "../models"
import { ProductWaterfallCard } from "../components/ProductWaterfallCard"
import { MobileBlockRenderer } from "../../../SchemaFieldRenderer"

export function MallHomePage({ brand = "#4f46e5" }: { brand?: string }) {
  const [products, setProducts] = useState<MallProductSpu[]>([])
  const [orderLoading, setOrderLoading] = useState(false)

  useEffect(() => {
    MallProductApi.list({ page: 1, pageSize: 10 })
      .then((res) => setProducts(res?.items ?? []))
      .catch(() => {})
  }, [])

  const placeOrder = async (spu: MallProductSpu) => {
    setOrderLoading(true)
    try {
      const order = await MallTradeOrderApi.create({
        no: `ORD-${Date.now()}`,
        total_price: spu.price ?? 99,
        pay_price: spu.price ?? 99,
        product_count: 1,
        remark: `购买 ${spu.name}`,
      })
      Alert.alert("下单成功", `订单编号: ${order.no || order.id}，金额: ￥${(order.pay_price ?? 0) / 100}`)
    } catch (e: any) {
      Alert.alert("下单失败", e?.message || "请稍后重试")
    } finally {
      setOrderLoading(false)
    }
  }

  return (
    <View>
      {MALL_PORTAL_BLOCKS.map((block) => (
        <MobileBlockRenderer key={block.id} block={block} brand={brand} />
      ))}
      <View style={styles.sectionHead}>
        <Text style={styles.h2}>商品瀑布流专区</Text>
        <Text style={styles.badge}>ProductWaterfallBlock</Text>
      </View>
      {products.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>暂无上架商品</Text>
        </View>
      ) : (
        <View style={styles.waterfallGrid}>
          {products.map((spu) => (
            <ProductWaterfallCard
              key={spu.id}
              spu={spu}
              brand={brand}
              disabled={orderLoading}
              onOrder={placeOrder}
            />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  h2: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  badge: {
    fontSize: 10,
    color: "#4f46e5",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  waterfallGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 13,
  },
})
