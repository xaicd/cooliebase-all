import React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import type { MallProductSpu } from "../models"

export function ProductWaterfallCard({
  spu,
  brand = "#4f46e5",
  disabled = false,
  onOrder,
}: {
  spu: MallProductSpu
  brand?: string
  disabled?: boolean
  onOrder: (spu: MallProductSpu) => void
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.thumb, { backgroundColor: `${brand}12` }]}>
        <Text style={[styles.thumbTag, { color: brand }]}>SPU #{spu.id}</Text>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {spu.name}
      </Text>
      <Text style={styles.sub}>库存：{spu.stock ?? 99} 件</Text>
      <View style={styles.footer}>
        <Text style={[styles.price, { color: brand }]}>¥{((spu.price ?? 0) / 100).toFixed(2)}</Text>
        <TouchableOpacity
          style={[styles.buyBtn, { backgroundColor: brand }]}
          onPress={() => onOrder(spu)}
          disabled={disabled}
        >
          <Text style={styles.buyBtnText}>下单</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
  },
  thumb: {
    height: 76,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  thumbTag: {
    fontSize: 11,
    fontWeight: "700",
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    minHeight: 34,
  },
  sub: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
  },
  buyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  buyBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
})
