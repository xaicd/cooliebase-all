"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { projectProfile } from "@/shared/contract/project-profile"
import {
  DEFAULT_PORTAL_CATALOG_ITEMS,
  readPortalBlueprint,
  type PortalCatalogItemBlueprint,
} from "@/shared/contract/blueprint-vars"

export type BookItem = PortalCatalogItemBlueprint

export const CURATED_BOOKS: BookItem[] = DEFAULT_PORTAL_CATALOG_ITEMS

export function BookStorePortal({ initialCategory }: { initialCategory?: string } = {}) {
  const portal = readPortalBlueprint(projectProfile)
  const validInitialCategory =
    initialCategory && portal.categories.some((c) => c.key === initialCategory)
      ? initialCategory
      : "all"

  const [selectedCategory, setSelectedCategory] = useState<string>(validInitialCategory)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [readingBook, setReadingBook] = useState<BookItem | null>(null)
  const [readerTheme, setReaderTheme] = useState<"parchment" | "light" | "dark">("light")
  const [readerFontSize, setReaderFontSize] = useState<number>(16)
  const [purchasingBook, setPurchasingBook] = useState<BookItem | null>(null)
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(
    new Set([portal.catalogItems[0]?.id || "srv-01"])
  )
  const [cartItems, setCartItems] = useState<BookItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [paymentDone, setPaymentDone] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  const filteredBooks = useMemo(() => {
    return portal.catalogItems.filter((b) => {
      const matchCat = selectedCategory === "all" || b.category === selectedCategory
      const matchSearch =
        !searchQuery.trim() ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.intro.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchCat && matchSearch
    })
  }, [portal.catalogItems, selectedCategory, searchQuery])

  const handleAddToCart = (book: BookItem) => {
    if (!cartItems.find((i) => i.id === book.id)) {
      setCartItems([...cartItems, book])
      showToast(`已将「${book.title}」加入${portal.cartLabel}`)
    } else {
      showToast(`「${book.title}」已在${portal.cartLabel}中`)
    }
  }

  const handleStartPurchase = (book: BookItem) => {
    setPurchasingBook(book)
    setPaymentDone(false)
  }

  const handleConfirmPay = () => {
    if (purchasingBook) {
      setPurchasedIds(new Set([...purchasedIds, purchasingBook.id]))
      setPaymentDone(true)
      showToast(`「${purchasingBook.title}」开通成功，已解锁完整服务权限！`)
    }
  }

  return (
    <div
      data-portal-shell="cooliebase-portal-v1"
      className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-600 selection:text-white"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-full shadow-xl border border-slate-700 animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/portal" className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm"
                style={
                  projectProfile.branding.primaryColor
                    ? { backgroundColor: projectProfile.branding.primaryColor }
                    : undefined
                }
              >
                {portal.brandMark}
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">
                  {portal.title}
                </span>
                <span className="text-xs text-slate-500 block leading-tight font-mono">
                  {portal.subtitleEn}
                </span>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
              {portal.categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    selectedCategory === cat.key
                      ? "bg-slate-100 text-indigo-600 font-semibold"
                      : "hover:text-slate-900"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative hidden sm:block w-48 lg:w-64">
              <input
                type="text"
                placeholder={portal.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                🔍
              </span>
            </div>

            {/* Cart Trigger */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
              title={`查看${portal.cartLabel}`}
            >
              <span className="text-base">🛒</span>
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center scale-90">
                  {cartItems.length}
                </span>
              )}
            </button>

            {/* Admin Console Link */}
            <Link
              href="/admin"
              className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
            >
              <span>⚙️</span>
              <span>管理后台</span>
            </Link>

            {/* Login / Profile */}
            <Link
              href="/portal/profile"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <span>{portal.profileLabel}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 text-white py-12 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30 mb-4">
              <span>✦</span>
              <span>{portal.heroBadge}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              {portal.heroTitle}
            </h1>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              {portal.heroDesc}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="text-xs text-slate-400 self-center mr-2">分类导航：</span>
              {portal.categories.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedCategory(tab.key)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    selectedCategory === tab.key
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md font-medium"
                      : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {portal.title} · 精选目录
            </h2>
            <span className="text-xs text-slate-500">共 {filteredBooks.length} 项精选服务</span>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              清空搜索条件
            </button>
          )}
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book) => {
            const isUnlocked = purchasedIds.has(book.id)
            return (
              <div
                key={book.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
              >
                <div
                  className="h-48 w-full p-6 flex flex-col justify-between relative overflow-hidden text-white"
                  style={{ backgroundColor: book.accentColor }}
                >
                  <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded bg-black/20 backdrop-blur">
                      {book.categoryLabel}
                    </span>
                    {isUnlocked && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                        已开通
                      </span>
                    )}
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-base font-extrabold line-clamp-2 leading-snug drop-shadow-sm">
                      {book.title}
                    </h3>
                    <p className="text-xs text-white/80 mt-1 font-medium">{book.author}</p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/70 relative z-10 pt-2 border-t border-white/20">
                    <span>★ {book.rating.toFixed(1)} ({book.ratingCount})</span>
                    <span className="font-mono font-bold text-white text-sm">
                      ¥{(book.priceCents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Content Summary */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {book.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                      {book.intro}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setReadingBook(book)}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <span>📋</span>
                      <span>{portal.previewCta}</span>
                    </button>
                    {isUnlocked ? (
                      <button
                        onClick={() => setReadingBook(book)}
                        className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      >
                        进入服务
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartPurchase(book)}
                        className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      >
                        {portal.primaryCta}
                      </button>
                    )}
                    <button
                      onClick={() => handleAddToCart(book)}
                      className="p-1.5 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title={`加入${portal.cartLabel}`}
                    >
                      🛒
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Detail Preview Modal */}
      {readingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors border ${
              readerTheme === "parchment"
                ? "bg-[#fbf0d9] text-[#2b261f] border-[#e8d7b3]"
                : readerTheme === "dark"
                  ? "bg-[#0f172a] text-[#e2e8f0] border-slate-800"
                  : "bg-white text-slate-900 border-slate-200"
            }`}
          >
            <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider opacity-60 block font-mono">
                  {readingBook.categoryLabel} · {portal.previewCta}
                </span>
                <h3 className="text-base font-bold leading-tight mt-0.5">{readingBook.title}</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-black/5 p-1 rounded-lg">
                  <button
                    onClick={() => setReaderTheme("light")}
                    className={`px-2 py-0.5 text-xs rounded font-medium ${
                      readerTheme === "light"
                        ? "bg-white shadow-sm font-bold"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    明亮
                  </button>
                  <button
                    onClick={() => setReaderTheme("parchment")}
                    className={`px-2 py-0.5 text-xs rounded font-medium ${
                      readerTheme === "parchment"
                        ? "bg-white shadow-sm font-bold"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    护眼
                  </button>
                  <button
                    onClick={() => setReaderTheme("dark")}
                    className={`px-2 py-0.5 text-xs rounded font-medium ${
                      readerTheme === "dark"
                        ? "bg-slate-700 text-white shadow-sm font-bold"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    暗色
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-black/5 p-1 rounded-lg text-xs font-mono">
                  <button
                    onClick={() => setReaderFontSize(Math.max(14, readerFontSize - 2))}
                    className="px-2 py-0.5 rounded hover:bg-black/10 font-bold"
                  >
                    A-
                  </button>
                  <span className="px-1 text-[11px] opacity-70">{readerFontSize}</span>
                  <button
                    onClick={() => setReaderFontSize(Math.min(22, readerFontSize + 2))}
                    className="px-2 py-0.5 rounded hover:bg-black/10 font-bold"
                  >
                    A+
                  </button>
                </div>

                <button
                  onClick={() => setReadingBook(null)}
                  className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-sm font-bold transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-10 overflow-y-auto flex-1 leading-relaxed">
              <div className="max-w-2xl mx-auto">
                <h4 className="text-xl font-bold tracking-tight mb-6 pb-3 border-b border-black/10">
                  {readingBook.trialChapter.title}
                </h4>
                <div className="space-y-5" style={{ fontSize: `${readerFontSize}px` }}>
                  {readingBook.trialChapter.paragraphs.map((p, idx) => (
                    <p key={idx} className="text-justify leading-loose">
                      {p}
                    </p>
                  ))}
                </div>

                <div className="mt-12 p-6 rounded-xl border border-black/10 bg-black/5 text-center">
                  {purchasedIds.has(readingBook.id) ? (
                    <div>
                      <p className="text-xs font-bold text-emerald-600 mb-1">✓ 已开通完整服务权益</p>
                      <p className="text-xs opacity-70">
                        相关服务进度与权益凭证已同步至您的「{portal.profileLabel}」。
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold mb-1">方案预览概览</p>
                      <p className="text-xs opacity-70 mb-4">
                        仅需 ¥{(readingBook.priceCents / 100).toFixed(2)} 即可解锁「{readingBook.title}」完整权益。
                      </p>
                      <button
                        onClick={() => {
                          setReadingBook(null)
                          handleStartPurchase(readingBook)
                        }}
                        className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow hover:bg-indigo-700 transition-colors"
                      >
                        {portal.primaryCta} (¥{(readingBook.priceCents / 100).toFixed(2)})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-black/10 text-xs flex items-center justify-between opacity-70 font-mono">
              <span>{projectProfile.platformName} · {portal.title}</span>
              <span>Blueprint Driven</span>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {purchasingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {paymentDone ? "订单完成" : `确认${portal.primaryCta}`}
              </h3>
              <button
                onClick={() => setPurchasingBook(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {paymentDone ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-4">
                    ✓
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">服务权益已生效</h4>
                  <p className="text-xs text-slate-500 mt-2">
                    「{purchasingBook.title}」已同步至您的{portal.profileLabel}。
                  </p>
                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      onClick={() => {
                        const target = purchasingBook
                        setPurchasingBook(null)
                        setReadingBook(target)
                      }}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                    >
                      查看详情
                    </button>
                    <button
                      onClick={() => setPurchasingBook(null)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg"
                    >
                      返回门户
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-5 flex items-start gap-4">
                    <div
                      className="w-12 h-16 rounded-md shadow-sm flex items-center justify-center text-white text-xs font-bold text-center px-1"
                      style={{ backgroundColor: purchasingBook.accentColor }}
                    >
                      精选
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900">{purchasingBook.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {purchasingBook.author} · {purchasingBook.categoryLabel}
                      </p>
                      <div className="mt-2 text-indigo-600 font-bold font-mono text-base">
                        ¥{(purchasingBook.priceCents / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="text-xs font-semibold text-slate-700">结算渠道选择</div>
                    <label className="flex items-center justify-between p-3 border border-indigo-200 bg-indigo-50/50 rounded-lg cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 text-base">🟢</span>
                        <span className="text-xs font-medium text-slate-800">微信支付 (聚合网关)</span>
                      </div>
                      <input type="radio" name="pay-method" defaultChecked className="text-indigo-600" />
                    </label>
                    <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500 text-base">🔵</span>
                        <span className="text-xs font-medium text-slate-800">支付宝 (快捷收银)</span>
                      </div>
                      <input type="radio" name="pay-method" className="text-indigo-600" />
                    </label>
                    <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 text-base">🪙</span>
                        <span className="text-xs font-medium text-slate-800">会员账户余额支付</span>
                      </div>
                      <input type="radio" name="pay-method" className="text-indigo-600" />
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                      <span className="text-xs text-slate-500">应付总额:</span>
                      <span className="text-base font-bold text-slate-900 font-mono ml-2">
                        ¥{(purchasingBook.priceCents / 100).toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={handleConfirmPay}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                    >
                      确认支付并开通
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {portal.cartLabel} ({cartItems.length})
              </h3>
              <button
                onClick={() => setCartOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <span className="text-4xl block mb-2">🛒</span>
                  <p className="text-xs">{portal.cartLabel}暂无项目，快去挑选心仪的服务吧</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.author} · {item.categoryLabel}
                        </p>
                        <span className="text-xs font-bold text-indigo-600 font-mono mt-1 block">
                          ¥{(item.priceCents / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCartOpen(false)
                            handleStartPurchase(item)
                          }}
                          className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-md shadow-sm"
                        >
                          {portal.primaryCta}
                        </button>
                        <button
                          onClick={() => setCartItems(cartItems.filter((i) => i.id !== item.id))}
                          className="text-slate-400 hover:text-red-500 text-xs p-1"
                          title="移除"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-slate-600 font-medium">合计金额:</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    ¥{(cartItems.reduce((acc, i) => acc + i.priceCents, 0) / 100).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    cartItems.forEach((i) => purchasedIds.add(i.id))
                    setPurchasedIds(new Set(purchasedIds))
                    setCartItems([])
                    setCartOpen(false)
                    showToast(`${portal.cartLabel}全部项目已成功完成结算！`)
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  合并结算全部项目
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
