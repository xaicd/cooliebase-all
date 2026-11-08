"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { apiPath, request } from "@/modules/shared/frontend/lib/request"

export interface BookItem {
  id: string
  title: string
  author: string
  category: "scifi" | "arch" | "cs" | "classics" | "philosophy"
  categoryLabel: string
  priceCents: number
  rating: number
  ratingCount: number
  tags: string[]
  intro: string
  accentColor: string
  trialChapter: {
    title: string
    paragraphs: string[]
  }
}

export const CURATED_BOOKS: BookItem[] = [
  {
    id: "bk-01",
    title: "三体：死神永生与黑暗森林法则",
    author: "刘慈欣",
    category: "scifi",
    categoryLabel: "科幻史诗",
    priceCents: 3900,
    rating: 4.9,
    ratingCount: 3820,
    tags: ["硬科幻", "雨果奖", "宇宙社会学"],
    intro: "宇宙就是一座黑暗森林，每个文明都是带枪的猎人。当广播纪元降临，智子的锁死与二维化跌落终将改写整个恒星系的命运。",
    accentColor: "#6366f1",
    trialChapter: {
      title: "第一章 · 时间之外的往事（节选）",
      paragraphs: [
        "云天明买下了一颗恒星，送给了程心。这颗编号为DX3906的恒星，在亿万光年外静静闪烁着微弱的红光。",
        "在掩体工程全面竣工的第三个世纪，人们终于意识到：真正的危险从来不是可见的舰队，而是物理法则本身的坍缩与降维。",
        "‘毁灭你，与你有何相干？’这句冷酷的宇宙谶语，像恒星引力波一样穿透了所有文明的虚荣与幻想。"
      ]
    }
  },
  {
    id: "bk-02",
    title: "领域驱动设计：软件核心复杂性应对之道",
    author: "Eric Evans",
    category: "arch",
    categoryLabel: "系统架构",
    priceCents: 8900,
    rating: 4.9,
    ratingCount: 2450,
    tags: ["DDD", "统一语言", "限界上下文"],
    intro: "面向复杂业务系统的经典圣经。通过通用语言、实体、值对象与限界上下文，构建深层领域模型并驱散代码腐败。",
    accentColor: "#059669",
    trialChapter: {
      title: "导言 · 消化知识与提炼模型",
      paragraphs: [
        "软件开发的核心挑战从来不是编写代码的语法细节，而是对业务领域本质复杂性的提炼与抽象。",
        "当领域专家和技术团队使用两套截然不同的词汇交谈时，系统的失真与技术债务便已经开始悄然累积。",
        "一个有效的模型并不是现实世界的忠实复制品，而是为了特定目的而对现实进行的严密抽象。"
      ]
    }
  },
  {
    id: "bk-03",
    title: "设计数据密集型应用 (DDIA)",
    author: "Martin Kleppmann",
    category: "arch",
    categoryLabel: "系统架构",
    priceCents: 9800,
    rating: 5.0,
    ratingCount: 5120,
    tags: ["分布式系统", "一致性协议", "数据流"],
    intro: "深入剖析可靠性、可扩展性与可维护性三大支柱。全面拆解事务隔离、共识算法、复制拓扑与事件溯源体系。",
    accentColor: "#0284c7",
    trialChapter: {
      title: "第一章 · 可靠性、可扩展性与可维护性",
      paragraphs: [
        "现代互联网应用不再受限于 CPU 计算瓶颈，而是受限于数据量、数据复杂度以及数据的变更速率。",
        "可靠性意味着即使系统遭遇硬件故障、软件缺陷甚至人为操作失误，系统仍能持续正确执行既定功能。",
        "一个健壮的架构设计，必须在网络分区（Partition）与节点崩溃常态化的物理现实之上，构建出可信赖的因果保证。"
      ]
    }
  },
  {
    id: "bk-04",
    title: "深入理解计算机系统 (CS:APP)",
    author: "Randal E. Bryant / David R. O'Hallaron",
    category: "cs",
    categoryLabel: "计算机科学",
    priceCents: 12800,
    rating: 4.9,
    ratingCount: 4680,
    tags: ["底层原理", "汇编与链接", "虚存与缓存"],
    intro: "程序员必读的底层透视典籍。从位操作、机器级代码、流水线，到内存层次结构、虚拟内存与并发编程。",
    accentColor: "#4f46e5",
    trialChapter: {
      title: "漫游导引 · 计算机系统的抽象层级",
      paragraphs: [
        "‘Hello World’ 的执行旅程穿透了预处理器、编译器、汇编器与动态链接器，最终化为二进制机器指令载入物理内存。",
        "理解高速缓存（L1/L2/L3 Cache）的局部性原理，是编写高性能并发服务端代码的核心命门。",
        "虚拟内存不仅为每个进程提供了连续私有地址空间的错觉，更是现代多道操作系统进程隔离与安全保护的基石。"
      ]
    }
  },
  {
    id: "bk-05",
    title: "百年孤独：马孔多神话与宿命流转",
    author: "加夫列尔·加西亚·马尔克斯",
    category: "classics",
    categoryLabel: "世界名著",
    priceCents: 4500,
    rating: 4.8,
    ratingCount: 6210,
    tags: ["魔幻现实主义", "诺贝尔文学奖", "经典名著"],
    intro: "布恩迪亚家族七代人的传奇史诗。在吉普赛人的磁铁与飞毯中，见证马孔多的兴盛、暴雨与被飓风卷走的宿命。",
    accentColor: "#ea580c",
    trialChapter: {
      title: "卷首 · 冰块与吉普赛人的预言",
      paragraphs: [
        "多年以后，面对行刑队，奥雷里亚诺·布恩迪亚上校将会回想起父亲带他去见识冰块的那个遥远的下午。",
        "那时的马孔多是一个二十户人家的村落，泥巴和芦苇盖成的房屋沿河岸排开，湍急的河水清澈见底。",
        "世界太新，很多事情还没有名字，必须用手指头指着才能说清楚。"
      ]
    }
  },
  {
    id: "bk-06",
    title: "纯粹理性批判导读：康德认识论探微",
    author: "伊曼努尔·康德 (著) / 邓晓芒 (导读)",
    category: "philosophy",
    categoryLabel: "哲学人文",
    priceCents: 5200,
    rating: 4.7,
    ratingCount: 1530,
    tags: ["哥白尼式革命", "先验感性论", "二律背反"],
    intro: "划时代的哥白尼式哲学革命。考察人类理性的界限与能力，阐明先天综合判断如何可能，厘清物自体与现象界的鸿沟。",
    accentColor: "#854d0e",
    trialChapter: {
      title: "序言 · 经验与先验之辨",
      paragraphs: [
        "我们的一切知识都以经验开始，这乃是毋庸置疑的；但并不因此可以说，一切知识都由经验发源。",
        "时间与空间并非存在于物自体的外部客观属性，而是人类感性主体接受外界刺激的纯形式感官框架。",
        "理性向自然请教，不是像个小学生被动听讲，而是像一个钦定的法官，强迫证人回答他所拟定的问题。"
      ]
    }
  },
  {
    id: "bk-07",
    title: "代码整洁之道 (Clean Code)",
    author: "Robert C. Martin (Uncle Bob)",
    category: "cs",
    categoryLabel: "计算机科学",
    priceCents: 6900,
    rating: 4.8,
    ratingCount: 3990,
    tags: ["重构", "SOLID原则", "工程素养"],
    intro: "敏捷软件工程价值观的标杆之作。讲述有意义的命名、函数职责单一化、防御性异常处理与童子军军规。",
    accentColor: "#0d9488",
    trialChapter: {
      title: "第二章 · 有意义的命名",
      paragraphs: [
        "软件中随处可见命名。我们给变量、函数、参数、类和封包命名，我们给源文件以及包含这些源文件的目录命名。",
        "名副其实说起来容易，做起来难。选个好名字需要花时间，但省下来的时间却更丰厚。",
        "代码的阅读时间与编写时间之比远超 10:1。让新代码容易被读懂，其实就是让写新代码变得更快。"
      ]
    }
  },
  {
    id: "bk-08",
    title: "人类简史：从动物到上帝",
    author: "尤瓦尔·赫拉利",
    category: "philosophy",
    categoryLabel: "哲学人文",
    priceCents: 4800,
    rating: 4.8,
    ratingCount: 7800,
    tags: ["认知革命", "虚构故事", "全球智识"],
    intro: "十万年前地球上至少有六种不同的人，为什么今天只剩下了我们？从认知革命、农业革命到科学革命，重新审视智人历程。",
    accentColor: "#d97706",
    trialChapter: {
      title: "第一章 · 人类：一种也没什么特别的动物",
      paragraphs: [
        "智人之所以能征服整个星球并组织起成千上万人的复杂社会，关键就在于我们拥有创造并相信‘虚构故事’的认知能力。",
        "国家、宗教、货币和有限责任公司，全部建立在互为主体的共同想象之上。",
        "当智人学会了讨论不存在的事物，历史便彻底脱离了纯粹生物学的轨道，开启了浩瀚的文化演化。"
      ]
    }
  }
]

export function BookStorePortal({ initialCategory }: { initialCategory?: string } = {}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [readingBook, setReadingBook] = useState<BookItem | null>(null)
  const [readerTheme, setReaderTheme] = useState<"parchment" | "light" | "dark">("parchment")
  const [readerFontSize, setReaderFontSize] = useState<number>(16)
  const [purchasingBook, setPurchasingBook] = useState<BookItem | null>(null)
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set(["bk-01"]))
  const [cartItems, setCartItems] = useState<BookItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [paymentDone, setPaymentDone] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  const filteredBooks = useMemo(() => {
    return CURATED_BOOKS.filter((b) => {
      const matchCat = selectedCategory === "all" || b.category === selectedCategory
      const matchSearch =
        !searchQuery.trim() ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.intro.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchCat && matchSearch
    })
  }, [selectedCategory, searchQuery])

  const handleAddToCart = (book: BookItem) => {
    if (!cartItems.find((i) => i.id === book.id)) {
      setCartItems([...cartItems, book])
      showToast(`已将《${book.title}》加入阅读车`)
    } else {
      showToast(`《${book.title}》已在阅读车中`)
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
      showToast(`《${purchasingBook.title}》购买成功，已解锁全本研读权限！`)
    }
  }

  return (
    <div data-portal-shell="cooliebase-portal-v1" className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
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
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                肆
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">九夏书肆</span>
                <span className="text-xs text-slate-500 block leading-tight font-mono">DIGITAL BOOKSTORE</span>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-md transition-colors ${selectedCategory === "all" ? "bg-slate-100 text-indigo-600 font-semibold" : "hover:text-slate-900"}`}
              >
                全部典藏
              </button>
              <button
                onClick={() => setSelectedCategory("arch")}
                className={`px-3 py-1.5 rounded-md transition-colors ${selectedCategory === "arch" ? "bg-slate-100 text-indigo-600 font-semibold" : "hover:text-slate-900"}`}
              >
                系统架构
              </button>
              <button
                onClick={() => setSelectedCategory("scifi")}
                className={`px-3 py-1.5 rounded-md transition-colors ${selectedCategory === "scifi" ? "bg-slate-100 text-indigo-600 font-semibold" : "hover:text-slate-900"}`}
              >
                科幻史诗
              </button>
              <button
                onClick={() => setSelectedCategory("cs")}
                className={`px-3 py-1.5 rounded-md transition-colors ${selectedCategory === "cs" ? "bg-slate-100 text-indigo-600 font-semibold" : "hover:text-slate-900"}`}
              >
                计算机科学
              </button>
              <button
                onClick={() => setSelectedCategory("philosophy")}
                className={`px-3 py-1.5 rounded-md transition-colors ${selectedCategory === "philosophy" ? "bg-slate-100 text-indigo-600 font-semibold" : "hover:text-slate-900"}`}
              >
                哲学人文
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative hidden sm:block w-48 lg:w-64">
              <input
                type="text"
                placeholder="搜索著作、学者或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            </div>

            {/* Cart Trigger */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="查看阅读车"
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
              <span>研读中心</span>
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
              <span>沉浸式数字通识与工程思想库</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              在思辨与代码之间，<br className="hidden sm:inline" />
              随时开启全沉浸式在线研读
            </h1>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              严格依托 CoolieBase 旗舰底座构建，全站遵循 basePath 契约规范与零死穴交互设计。
              收录硬核系统架构、经典哲学文献与先锋科幻巨作。
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="text-xs text-slate-400 self-center mr-2">典藏专区：</span>
              {[
                { id: "all", label: "全部典藏" },
                { id: "arch", label: "系统架构" },
                { id: "scifi", label: "科幻史诗" },
                { id: "cs", label: "计算机科学" },
                { id: "classics", label: "世界名著" },
                { id: "philosophy", label: "哲学人文" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    selectedCategory === tab.id
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
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">精选著录清单</h2>
            <span className="text-xs text-slate-500">共 {filteredBooks.length} 卷典藏文献</span>
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

        {/* Book Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book) => {
            const isUnlocked = purchasedIds.has(book.id)
            return (
              <div
                key={book.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
              >
                {/* Book Cover (Vector SVG Artwork - 100% self-contained & CSP safe) */}
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
                        已入典藏
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
                    <span>★ {book.rating.toFixed(1)} ({book.ratingCount}研读)</span>
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
                      <span>📖</span>
                      <span>在线试读</span>
                    </button>
                    {isUnlocked ? (
                      <button
                        onClick={() => setReadingBook(book)}
                        className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      >
                        继续研读
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartPurchase(book)}
                        className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      >
                        订购
                      </button>
                    )}
                    <button
                      onClick={() => handleAddToCart(book)}
                      className="p-1.5 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="加阅读车"
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

      {/* Reader Modal (沉浸式阅读器) */}
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
            {/* Reader Header */}
            <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider opacity-60 block font-mono">
                  {readingBook.categoryLabel} · 在线卷帙
                </span>
                <h3 className="text-base font-bold leading-tight mt-0.5">{readingBook.title}</h3>
              </div>
              <div className="flex items-center gap-3">
                {/* Theme Selector */}
                <div className="flex items-center gap-1 bg-black/5 p-1 rounded-lg">
                  <button
                    onClick={() => setReaderTheme("parchment")}
                    className={`px-2 py-0.5 text-xs rounded font-medium ${readerTheme === "parchment" ? "bg-white shadow-sm font-bold" : "opacity-70 hover:opacity-100"}`}
                  >
                    羊皮
                  </button>
                  <button
                    onClick={() => setReaderTheme("light")}
                    className={`px-2 py-0.5 text-xs rounded font-medium ${readerTheme === "light" ? "bg-white shadow-sm font-bold" : "opacity-70 hover:opacity-100"}`}
                  >
                    明亮
                  </button>
                  <button
                    onClick={() => setReaderTheme("dark")}
                    className={`px-2 py-0.5 text-xs rounded font-medium ${readerTheme === "dark" ? "bg-slate-700 text-white shadow-sm font-bold" : "opacity-70 hover:opacity-100"}`}
                  >
                    夜间
                  </button>
                </div>

                {/* Font Size Adjuster */}
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

                {/* Close Button */}
                <button
                  onClick={() => setReadingBook(null)}
                  className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-sm font-bold transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Reader Content Area */}
            <div className="p-6 sm:p-10 overflow-y-auto flex-1 leading-relaxed">
              <div className="max-w-2xl mx-auto">
                <h4 className="text-xl font-bold tracking-tight mb-6 pb-3 border-b border-black/10">
                  {readingBook.trialChapter.title}
                </h4>
                <div className="space-y-5" style={{ fontSize: `${readerFontSize}px` }}>
                  {readingBook.trialChapter.paragraphs.map((p, idx) => (
                    <p key={idx} className="indent-8 text-justify leading-loose">
                      {p}
                    </p>
                  ))}
                </div>

                {/* Unlocked / Locked Banner */}
                <div className="mt-12 p-6 rounded-xl border border-black/10 bg-black/5 text-center">
                  {purchasedIds.has(readingBook.id) ? (
                    <div>
                      <p className="text-xs font-bold text-emerald-600 mb-1">✓ 已取得全本正式授权</p>
                      <p className="text-xs opacity-70">
                        您可以持续翻阅后续完整章节，阅读进度将自动同步至个人研读中心。
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold mb-1">本章试读已结束</p>
                      <p className="text-xs opacity-70 mb-4">
                        仅需 ¥{(readingBook.priceCents / 100).toFixed(2)} 即可永久解锁全书 32 章完整正文及离线离线归档。
                      </p>
                      <button
                        onClick={() => {
                          setReadingBook(null)
                          handleStartPurchase(readingBook)
                        }}
                        className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow hover:bg-indigo-700 transition-colors"
                      >
                        立即订购全本 (¥{(readingBook.priceCents / 100).toFixed(2)})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reader Footer */}
            <div className="px-6 py-3 border-t border-black/10 text-xs flex items-center justify-between opacity-70 font-mono">
              <span>研读模式 · 遵守著作权保护协定</span>
              <span>第 1 卷 / 共 1 卷</span>
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
                {paymentDone ? "订购完成" : "确认典藏订购"}
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
                  <h4 className="text-lg font-bold text-slate-900">典藏授权已生效</h4>
                  <p className="text-xs text-slate-500 mt-2">
                    《{purchasingBook.title}》已成功收录至您的个人典藏书架。
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
                      立即开启研读
                    </button>
                    <button
                      onClick={() => setPurchasingBook(null)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg"
                    >
                      返回书肆
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
                      典藏
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900">{purchasingBook.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{purchasingBook.author} · {purchasingBook.categoryLabel}</p>
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
                        <span className="text-xs font-medium text-slate-800">研读金余额支付</span>
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
                      确认支付并解锁
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shopping Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">典藏阅读车 ({cartItems.length})</h3>
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
                  <p className="text-xs">阅读车空空如也，快去书肆挑选心仪的卷帙吧</p>
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
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.author} · {item.categoryLabel}</p>
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
                          订购
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
                    showToast("阅读车全部书籍已成功完成结算！")
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  合并结算全部典藏
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
