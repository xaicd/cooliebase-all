"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { projectProfile } from "@/shared/contract/project-profile"
import { request, apiPath } from "@/shared/frontend/lib/request"
import { I18nProvider, useI18n } from "@/shared/frontend/lib/i18n"
import { LanguageSwitcher } from "@/shared/frontend/components/language-switcher"

type SidebarItem = { id: string; href: string | null; label: string; icon: string; children: SidebarItem[] }
type SidebarGroup = { id: string; title: string; icon: string; children: SidebarItem[] }

type FlatMenuItem = {
  id: string
  label: string
  href: string
  icon: string
  groupTitle: string
  parentLabel?: string
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [isLocked, setIsLocked] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [username, setUsername] = useState("admin")
  const [authChecked, setAuthChecked] = useState(false)
  const [menuGroups, setMenuGroups] = useState<SidebarGroup[]>([])
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])

  useEffect(() => {
    // Read persisted state
    const savedLock = localStorage.getItem("cooliebase_sidebar_locked")
    if (savedLock !== null) setIsLocked(savedLock === "true")

    const savedFavorites = localStorage.getItem("cooliebase_favorite_menus")
    if (savedFavorites) {
      try { setFavoriteIds(JSON.parse(savedFavorites)) } catch {}
    }

    // Auth guard
    const token = localStorage.getItem("cooliebase_token")
    if (!token) { window.location.href = apiPath("/login"); return }

    try {
      const parts = token.split(".")
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem("cooliebase_token")
          localStorage.removeItem("cooliebase_user")
          window.location.href = apiPath("/login?expired=1")
          return
        }
      }
    } catch {
      localStorage.removeItem("cooliebase_token")
      localStorage.removeItem("cooliebase_user")
      window.location.href = apiPath("/login")
      return
    }

    try {
      const user = localStorage.getItem("cooliebase_user")
      if (user) {
        const parsed = JSON.parse(user)
        setUsername(parsed.nickname || parsed.username || "admin")
      }
    } catch {}

    setAuthChecked(true)

    // Fetch sidebar
    request.get<SidebarGroup[]>("/api/v1/admin/system/menus/sidebar")
      .then((res) => {
        if (res.success) setMenuGroups(res.data ?? [])
      })
      .catch(() => setMenuGroups([]))
  }, [])

  // Keyboard shortcut Ctrl+K for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        const input = document.getElementById("admin-menu-search-input")
        input?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const toggleLock = () => {
    const nextState = !isLocked
    setIsLocked(nextState)
    localStorage.setItem("cooliebase_sidebar_locked", String(nextState))
  }

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const nextFavorites = favoriteIds.includes(id)
      ? favoriteIds.filter((item) => item !== id)
      : [...favoriteIds, id]
    setFavoriteIds(nextFavorites)
    localStorage.setItem("cooliebase_favorite_menus", JSON.stringify(nextFavorites))
  }

  // Flatten all navigable leaf menus for search and favorites
  const flatMenus = useMemo(() => {
    const list: FlatMenuItem[] = []
    const traverse = (items: SidebarItem[], groupTitle: string, parentLabel?: string) => {
      for (const item of items) {
        if (item.href) {
          list.push({
            id: item.id,
            label: item.label,
            href: item.href,
            icon: item.icon,
            groupTitle,
            parentLabel,
          })
        }
        if (item.children.length > 0) {
          traverse(item.children, groupTitle, item.label)
        }
      }
    }
    for (const g of menuGroups) {
      traverse(g.children, g.title)
    }
    return list
  }, [menuGroups])

  // Filtered search results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return flatMenus.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.groupTitle.toLowerCase().includes(q) ||
        m.href.toLowerCase().includes(q) ||
        (m.parentLabel && m.parentLabel.toLowerCase().includes(q))
    )
  }, [searchQuery, flatMenus])

  // Pinned / favorite menu items
  const favoriteMenus = useMemo(() => {
    return flatMenus.filter((m) => favoriteIds.includes(m.id))
  }, [flatMenus, favoriteIds])

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-xs text-slate-400 font-medium">验证登录状态...</div>
      </div>
    )
  }

  const handleLogout = () => {
    localStorage.removeItem("cooliebase_token")
    localStorage.removeItem("cooliebase_user")
    window.location.href = apiPath("/login")
  }

  return (
    <div className="flex h-screen bg-slate-100/80 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Sidebar - 普鲁士深砚冷墨色高定侧边栏 */}
      <aside
        className={`flex flex-col border-r border-slate-800/80 bg-slate-950 text-slate-300 transition-all duration-300 ease-in-out relative z-20 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-sm text-white shadow-md shadow-blue-500/20">
                {projectProfile.branding.mark}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span className="truncate">{projectProfile.platformName}</span>
                  <span className="px-1.5 py-0.2 text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded font-mono">
                    v{projectProfile.version}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 truncate">{projectProfile.loginTagline}</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-sm text-white shadow-md">
              {projectProfile.branding.mark}
            </div>
          )}

          {!collapsed && (
            <button
              type="button"
              onClick={toggleLock}
              className={`p-1.5 rounded-lg text-xs transition ${
                isLocked ? "text-blue-400 bg-blue-950/60 border border-blue-500/30" : "text-slate-500 hover:text-slate-300"
              }`}
              title={isLocked ? "侧边栏已锁定" : "侧边栏悬浮模式"}
            >
              {isLocked ? "🔒" : "🔓"}
            </button>
          )}
        </div>

        {/* Menu Search Box (when expanded) */}
        {!collapsed && (
          <div className="border-b border-slate-800/80 p-2.5 bg-slate-900/40">
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="admin-menu-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("nav.searchMenu", "搜索菜单 (Ctrl+K)...")}
                className="h-8 w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-8 pr-7 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        {/* Menu Navigation Area */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
          {/* 1. Search Results Mode */}
          {searchQuery.trim() !== "" ? (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>搜索结果 ({searchResults.length})</span>
                <button onClick={() => setSearchQuery("")} className="text-blue-400 hover:underline">
                  清除
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  未找到匹配 &ldquo;{searchQuery}&rdquo; 的菜单
                </div>
              ) : (
                searchResults.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setSearchQuery("")}
                    className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition ${
                      pathname === item.href
                        ? "bg-blue-600 font-bold text-white shadow-md shadow-blue-500/25"
                        : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MenuIcon label={item.label} icon={item.icon} isSub isActive={pathname === item.href} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ml-1 ${
                      pathname === item.href ? "bg-blue-700 text-white" : "bg-slate-800 text-slate-400"
                    }`}>
                      {item.groupTitle}
                    </span>
                  </Link>
                ))
              )}
            </div>
          ) : (
            /* 2. Normal Menu Tree Mode */
            <>
              {/* Pinned / Favorite Menus Section */}
              {!collapsed && favoriteMenus.length > 0 && (
                <div className="mb-2 pb-2 border-b border-slate-800/60">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    ★ {t("nav.pinnedMenus", "常用置顶菜单")}
                  </div>
                  <div className="space-y-0.5">
                    {favoriteMenus.map((fav) => (
                      <Link
                        key={fav.id}
                        href={fav.href}
                        className={`group flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition ${
                          pathname === fav.href
                            ? "bg-blue-600 font-bold text-white shadow-md shadow-blue-500/25"
                            : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm">{fav.icon || "📌"}</span>
                          <span className="truncate">{fav.label}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(fav.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-xs text-slate-400 hover:text-rose-400 transition"
                          title="取消置顶"
                        >
                          ×
                        </button>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Domain Menu Groups */}
              {menuGroups.map((group) => (
                <MenuGroup
                  key={group.id}
                  group={group}
                  pathname={pathname}
                  collapsed={collapsed}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </>
          )}
        </nav>

        {/* Bottom Collapse & Lock Control */}
        <div className="border-t border-slate-800/80 p-2 bg-slate-950 flex items-center gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex-1 flex items-center justify-center rounded-xl py-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white text-xs font-medium"
            title={collapsed ? t("nav.expandSidebar", "展开侧栏") : t("nav.collapseSidebar", "收起侧栏")}
          >
            <svg className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180 text-blue-400" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!collapsed && <span className="ml-1.5">{t("nav.collapseSidebar", "收起侧栏")}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Viewport - 钛白微灰高级工作区 */}
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-100/70">
        {/* Top Navbar */}
        <header className="flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition font-medium">{t("nav.portalHome", "门户首页")}</Link>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-900">{getPageTitle(pathname, menuGroups)}</span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-800">{username}</span>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 shadow-2xs"
            >
              🚪 {t("nav.logout", "退出")}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </I18nProvider>
  )
}


function isActive(item: SidebarItem, pathname: string): boolean {
  return Boolean(item.href && (pathname === item.href || pathname.startsWith(item.href + "/")))
    || item.children.some((child) => isActive(child, pathname))
}

function MenuGroup({
  group,
  pathname,
  collapsed,
  favoriteIds,
  onToggleFavorite,
}: {
  group: SidebarGroup
  pathname: string
  collapsed: boolean
  favoriteIds: string[]
  onToggleFavorite: (id: string, e: React.MouseEvent) => void
}) {
  const hasActiveChild = group.children.some((item) => isActive(item, pathname))
  // 默认折叠：导航已由页面注册表生成（18 组 / 470 项），全展开会把侧栏撑成一条长龙，
  // 反而找不到东西。只展开"当前所在"的组，其余点开即用。
  const [open, setOpen] = useState<boolean>(hasActiveChild)

  useEffect(() => {
    if (hasActiveChild) setOpen(true)
  }, [hasActiveChild])

  if (collapsed) {
    const links = flattenLinks(group.children)
    return (
      <div className="mb-2">
        {links.map((item) => (
          <SidebarLink key={item.id} item={item} pathname={pathname} collapsed favoriteIds={favoriteIds} onToggleFavorite={onToggleFavorite} />
        ))}
      </div>
    )
  }

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
          hasActiveChild
            ? "text-white bg-slate-900 font-bold border border-slate-800"
            : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
        }`}
      >
        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition ${
          hasActiveChild ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20" : "bg-slate-800 text-slate-300"
        }`}>
          <MenuIcon label={group.title} icon={group.icon} isActive={hasActiveChild} isDirectory />
        </div>
        <span className="flex-1 truncate text-left">{group.title}</span>
        <Chevron open={open} active={hasActiveChild} />
      </button>

      {open && (
        <MenuTreeItems
          items={group.children}
          pathname={pathname}
          level={1}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </div>
  )
}

function MenuTreeItems({
  items,
  pathname,
  level,
  favoriteIds,
  onToggleFavorite,
}: {
  items: SidebarItem[]
  pathname: string
  level: number
  favoriteIds: string[]
  onToggleFavorite: (id: string, e: React.MouseEvent) => void
}) {
  return (
    <ul className={`mt-0.5 space-y-0.5 ${level === 1 ? "ml-3.5 border-l border-slate-800/80 pl-2" : "ml-2.5 border-l border-slate-800/80 pl-2"}`}>
      {items.map((item) => (
        <MenuTreeItem
          key={item.id}
          item={item}
          pathname={pathname}
          level={level}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </ul>
  )
}

function MenuTreeItem({
  item,
  pathname,
  level,
  favoriteIds,
  onToggleFavorite,
}: {
  item: SidebarItem
  pathname: string
  level: number
  favoriteIds: string[]
  onToggleFavorite: (id: string, e: React.MouseEvent) => void
}) {
  const hasChildren = item.children.length > 0
  const active = isActive(item, pathname)
  const [open, setOpen] = useState(active)

  useEffect(() => {
    if (active) setOpen(true)
  }, [active])

  if (!hasChildren) {
    return <li><SidebarLink item={item} pathname={pathname} favoriteIds={favoriteIds} onToggleFavorite={onToggleFavorite} /></li>
  }

  return (
    <li>
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium transition ${
          active
            ? "font-bold text-white bg-slate-900 border border-slate-800"
            : "text-slate-200 hover:bg-slate-900 hover:text-white"
        }`}
      >
        <MenuIcon label={item.label} icon={item.icon} isSub isActive={active} />
        <span className="flex-1 truncate text-left text-slate-100 font-medium">{item.label}</span>
        <Chevron open={open} active={active} />
      </button>
      {open && (
        <MenuTreeItems
          items={item.children}
          pathname={pathname}
          level={level + 1}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </li>
  )
}

function SidebarLink({
  item,
  pathname,
  collapsed = false,
  favoriteIds,
  onToggleFavorite,
}: {
  item: SidebarItem
  pathname: string
  collapsed?: boolean
  favoriteIds: string[]
  onToggleFavorite: (id: string, e: React.MouseEvent) => void
}) {
  const active = isActive(item, pathname)
  const isFav = favoriteIds.includes(item.id)

  const className = collapsed
    ? `mb-1 flex items-center justify-center rounded-xl py-2 transition ${
        active
          ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold"
          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
      }`
    : `group flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition ${
        active
          ? "bg-blue-600 font-bold text-white shadow-md shadow-blue-500/25"
          : "text-slate-200 hover:bg-slate-900/90 hover:text-white font-medium"
      }`

  if (!item.href) {
    return (
      <span title={`${item.label}（尚未开通）`} className={`${className} opacity-30 cursor-not-allowed`}>
        <div className="flex items-center gap-2 truncate">
          <MenuIcon label={item.label} icon={item.icon} isSub isActive={active} />
          {!collapsed && <span className="truncate text-slate-400">{item.label}</span>}
        </div>
      </span>
    )
  }

  return (
    <Link href={item.href} title={collapsed ? item.label : undefined} className={className}>
      <div className="flex items-center gap-2 truncate">
        <MenuIcon label={item.label} icon={item.icon} isSub isActive={active} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </div>

      {!collapsed && (
        <button
          type="button"
          onClick={(e) => onToggleFavorite(item.id, e)}
          className={`opacity-0 group-hover:opacity-100 transition p-0.5 rounded text-xs ${
            isFav
              ? active
                ? "opacity-100 text-amber-300 hover:text-amber-200"
                : "opacity-100 text-amber-500 hover:text-amber-600"
              : active
              ? "text-blue-200 hover:text-white"
              : "text-slate-400 hover:text-amber-500"
          }`}
          title={isFav ? "取消快捷常用置顶" : "点击锁定置顶到常用"}
        >
          <svg className="h-3 w-3" fill={isFav ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      )}
    </Link>
  )
}

/** Modern, crisp SVG Icon Component mapping domain titles to clean vector icons */
function MenuIcon({
  label,
  icon,
  isSub = false,
  isActive = false,
  isDirectory = false,
  className = "",
}: {
  label: string
  icon?: string
  isSub?: boolean
  isActive?: boolean
  isDirectory?: boolean
  className?: string
}) {
  const iconSize = isDirectory ? "h-3.5 w-3.5" : "h-4 w-4"
  const colorClass = isActive
    ? "text-white"
    : isSub
    ? "text-blue-400 group-hover:text-blue-300"
    : "text-blue-400"

  const c = `${iconSize} shrink-0 stroke-[1.8] ${colorClass} ${className}`

  if (label.includes("系统管理") || label.includes("权限")) {
    return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
  }
  if (label.includes("基础设施") || label.includes("参数") || label.includes("配置")) {
    return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  }
  if (label.includes("支付") || label.includes("退款") || label.includes("账单")) {
    return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
  }
  if (label.includes("工作流") || label.includes("流程") || label.includes("审批")) {
    return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
  }
  if (label.includes("会员") || label.includes("用户") || label.includes("客户") || label.includes("角色")) {
    return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
  }
  if (label.includes("商城") || label.includes("商品") || label.includes("订单")) {
    return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
  }
  if (label.includes("公众号") || label.includes("微信") || label.includes("消息")) {
    return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
  }
  if (label.includes("CRM") || label.includes("商机") || label.includes("线索")) {
    return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
  }
  if (label.includes("ERP") || label.includes("物料") || label.includes("采购")) {
    return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
  }
  if (label.includes("WMS") || label.includes("仓库") || label.includes("库存")) {
    return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" /></svg>
  }
  if (label.includes("MES") || label.includes("工单") || label.includes("制造")) {
    return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
  }
  if (label.includes("AI") || label.includes("模型") || label.includes("智能")) {
    return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
  }
  if (label.includes("IoT") || label.includes("物联网") || label.includes("设备")) {
    return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
  }
  if (label.includes("IM") || label.includes("即时通讯") || label.includes("会话")) {
    return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
  }
  if (label.includes("报表") || label.includes("大屏") || label.includes("统计")) {
    return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  }

  // Default subtle folder / document icon for sub-items
  if (isSub) {
    return (
      <svg className={`${iconSize} shrink-0 stroke-[1.75] ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  }

  return (
    <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
}

function Chevron({ open, active = false }: { open: boolean; active?: boolean }) {
  return (
    <svg className={`h-3 w-3 shrink-0 transition-transform ${
      open ? "rotate-90 text-blue-600 font-bold" : active ? "text-blue-500" : "text-slate-400"
    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function flattenLinks(items: SidebarItem[]): SidebarItem[] {
  return items.flatMap((item) => item.href ? [item] : flattenLinks(item.children))
}

function getPageTitle(pathname: string, menuGroups: SidebarGroup[]): string {
  const findTitle = (items: SidebarItem[]): string | undefined => {
    for (const item of items) {
      if (item.href && (pathname === item.href || pathname.startsWith(item.href + "/"))) return item.label
      const childTitle = findTitle(item.children)
      if (childTitle) return childTitle
    }
  }
  for (const group of menuGroups) {
    const title = findTitle(group.children)
    if (title) return title
  }
  return "管理后台"
}
