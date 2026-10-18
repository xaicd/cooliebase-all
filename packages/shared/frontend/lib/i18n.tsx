"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from "react"

export type LocaleCode = "zh-CN" | "en-US" | "ja-JP" | "ko-KR"

export interface LocaleMeta {
  code: LocaleCode
  label: string
  nativeName: string
  flag: string
}

export const SUPPORTED_LOCALES: LocaleMeta[] = [
  { code: "zh-CN", label: "简体中文", nativeName: "中文", flag: "🇨🇳" },
  { code: "en-US", label: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "ja-JP", label: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko-KR", label: "Korean", nativeName: "한국어", flag: "🇰🇷" },
]

export const DEFAULT_LOCALE: LocaleCode = "zh-CN"

export type TranslationDictionary = Record<string, string>

export const TRANSLATIONS: Record<LocaleCode, TranslationDictionary> = {
  "zh-CN": {
    // 导航与工作区
    "nav.portalHome": "门户首页",
    "nav.searchMenu": "搜索菜单 (Ctrl+K)...",
    "nav.searchResults": "搜索结果",
    "nav.noMatches": "未找到匹配菜单",
    "nav.clear": "清除",
    "nav.pinnedMenus": "常用置顶菜单",
    "nav.unpin": "取消置顶",
    "nav.pin": "点击置顶到常用",
    "nav.collapseSidebar": "收起侧栏",
    "nav.expandSidebar": "展开侧栏",
    "nav.sidebarLocked": "侧边栏已锁定",
    "nav.sidebarFloat": "侧边栏悬浮模式",
    "nav.logout": "退出",
    "nav.switchLanguage": "切换语言",
    "nav.currentLanguage": "当前语言",

    // 常用按钮
    "action.create": "新建",
    "action.edit": "编辑",
    "action.delete": "删除",
    "action.search": "查询",
    "action.reset": "重置",
    "action.export": "导出",
    "action.import": "导入",
    "action.save": "保存",
    "action.confirm": "确认",
    "action.cancel": "取消",
    "action.refresh": "刷新",
    "action.close": "关闭",
    "action.details": "详情",
    "action.back": "返回",
    "action.batchDelete": "批量删除",

    // 常用字段
    "field.name": "名称",
    "field.status": "状态",
    "field.createdAt": "创建时间",
    "field.updatedAt": "更新时间",
    "field.creator": "创建人",
    "field.updater": "更新人",
    "field.operation": "操作",
    "field.remark": "备注",
    "field.enabled": "启用",
    "field.disabled": "禁用",

    // 状态提示
    "msg.success": "操作成功",
    "msg.failed": "操作失败",
    "msg.loadFailed": "数据加载失败",
    "msg.saveSuccess": "保存成功",
    "msg.saveFailed": "保存失败",
    "msg.deleteConfirm": "确定要删除所选项目吗？",
    "msg.loading": "加载中...",
    "msg.noData": "暂无数据",
  },

  "en-US": {
    // Navigation & Workspace
    "nav.portalHome": "Home",
    "nav.searchMenu": "Search menu (Ctrl+K)...",
    "nav.searchResults": "Search Results",
    "nav.noMatches": "No matching menus found",
    "nav.clear": "Clear",
    "nav.pinnedMenus": "Pinned Menus",
    "nav.unpin": "Unpin",
    "nav.pin": "Pin to favorites",
    "nav.collapseSidebar": "Collapse",
    "nav.expandSidebar": "Expand",
    "nav.sidebarLocked": "Sidebar Locked",
    "nav.sidebarFloat": "Sidebar Floating",
    "nav.logout": "Logout",
    "nav.switchLanguage": "Language",
    "nav.currentLanguage": "Current Language",

    // Common Actions
    "action.create": "Create",
    "action.edit": "Edit",
    "action.delete": "Delete",
    "action.search": "Search",
    "action.reset": "Reset",
    "action.export": "Export",
    "action.import": "Import",
    "action.save": "Save",
    "action.confirm": "Confirm",
    "action.cancel": "Cancel",
    "action.refresh": "Refresh",
    "action.close": "Close",
    "action.details": "Details",
    "action.back": "Back",
    "action.batchDelete": "Batch Delete",

    // Common Fields
    "field.name": "Name",
    "field.status": "Status",
    "field.createdAt": "Created At",
    "field.updatedAt": "Updated At",
    "field.creator": "Creator",
    "field.updater": "Updater",
    "field.operation": "Actions",
    "field.remark": "Remark",
    "field.enabled": "Enabled",
    "field.disabled": "Disabled",

    // Messages
    "msg.success": "Success",
    "msg.failed": "Failed",
    "msg.loadFailed": "Failed to load data",
    "msg.saveSuccess": "Saved successfully",
    "msg.saveFailed": "Failed to save",
    "msg.deleteConfirm": "Are you sure you want to delete the selected item(s)?",
    "msg.loading": "Loading...",
    "msg.noData": "No data available",
  },

  "ja-JP": {
    // ナビゲーションとワークスペース
    "nav.portalHome": "ポータルホーム",
    "nav.searchMenu": "メニュー検索 (Ctrl+K)...",
    "nav.searchResults": "検索結果",
    "nav.noMatches": "一致するメニューがありません",
    "nav.clear": "クリア",
    "nav.pinnedMenus": "お気に入り固定",
    "nav.unpin": "ピン解除",
    "nav.pin": "お気に入りに固定",
    "nav.collapseSidebar": "サイドバー縮小",
    "nav.expandSidebar": "サイドバー展開",
    "nav.sidebarLocked": "サイドバー固定中",
    "nav.sidebarFloat": "フローティング表示",
    "nav.logout": "ログアウト",
    "nav.switchLanguage": "言語切替",
    "nav.currentLanguage": "現在の言語",

    // アクション
    "action.create": "新規作成",
    "action.edit": "編集",
    "action.delete": "削除",
    "action.search": "検索",
    "action.reset": "リセット",
    "action.export": "出力",
    "action.import": "取込",
    "action.save": "保存",
    "action.confirm": "確認",
    "action.cancel": "取消",
    "action.refresh": "更新",
    "action.close": "閉じる",
    "action.details": "詳細",
    "action.back": "戻る",
    "action.batchDelete": "一括削除",

    // 項目フィールド
    "field.name": "名称",
    "field.status": "状態",
    "field.createdAt": "作成日時",
    "field.updatedAt": "更新日時",
    "field.creator": "作成者",
    "field.updater": "更新者",
    "field.operation": "操作",
    "field.remark": "備考",
    "field.enabled": "有効",
    "field.disabled": "無効",

    // メッセージ
    "msg.success": "正常に完了しました",
    "msg.failed": "処理に失敗しました",
    "msg.loadFailed": "データの取得に失敗しました",
    "msg.saveSuccess": "保存が完了しました",
    "msg.saveFailed": "保存に失敗しました",
    "msg.deleteConfirm": "選択した項目を削除してもよろしいですか？",
    "msg.loading": "読み込み中...",
    "msg.noData": "データがありません",
  },

  "ko-KR": {
    // 내비게이션 및 작업 공간
    "nav.portalHome": "포털 홈",
    "nav.searchMenu": "메뉴 검색 (Ctrl+K)...",
    "nav.searchResults": "검색 결과",
    "nav.noMatches": "일치하는 메뉴가 없습니다",
    "nav.clear": "지우기",
    "nav.pinnedMenus": "즐겨찾기 고정 메뉴",
    "nav.unpin": "고정 해제",
    "nav.pin": "즐겨찾기 고정",
    "nav.collapseSidebar": "사이드바 접기",
    "nav.expandSidebar": "사이드바 펼치기",
    "nav.sidebarLocked": "사이드바 고정됨",
    "nav.sidebarFloat": "플로팅 모드",
    "nav.logout": "로그아웃",
    "nav.switchLanguage": "언어 전환",
    "nav.currentLanguage": "현재 언어",

    // 일반 액션 버튼
    "action.create": "새로 만들기",
    "action.edit": "수정",
    "action.delete": "삭제",
    "action.search": "조회",
    "action.reset": "초기화",
    "action.export": "내보내기",
    "action.import": "가져오기",
    "action.save": "저장",
    "action.confirm": "확인",
    "action.cancel": "취소",
    "action.refresh": "새로고침",
    "action.close": "닫기",
    "action.details": "상세보기",
    "action.back": "뒤로",
    "action.batchDelete": "일괄 삭제",

    // 공통 필드
    "field.name": "이름",
    "field.status": "상태",
    "field.createdAt": "생성 시간",
    "field.updatedAt": "수정 시간",
    "field.creator": "생성자",
    "field.updater": "수정자",
    "field.operation": "작업",
    "field.remark": "비고",
    "field.enabled": "활성",
    "field.disabled": "비활성",

    // 메시지 안내
    "msg.success": "성공적으로 처리되었습니다",
    "msg.failed": "작업에 실패했습니다",
    "msg.loadFailed": "데이터 로드에 실패했습니다",
    "msg.saveSuccess": "저장되었습니다",
    "msg.saveFailed": "저장에 실패했습니다",
    "msg.deleteConfirm": "선택한 항목을 삭제하시겠습니까?",
    "msg.loading": "로딩 중...",
    "msg.noData": "데이터가 없습니다",
  },
}

interface I18nContextType {
  locale: LocaleCode
  setLocale: (locale: LocaleCode) => void
  t: (key: string, fallback?: string) => string
  locales: LocaleMeta[]
  currentMeta: LocaleMeta
}

const I18nContext = createContext<I18nContextType | null>(null)

const LOCALE_STORAGE_KEY = "cooliebase_locale"

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // 读取持久化偏好或浏览器默认语言
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as LocaleCode | null
    if (saved && ["zh-CN", "en-US", "ja-JP", "ko-KR"].includes(saved)) {
      setLocaleState(saved)
    } else if (typeof navigator !== "undefined" && navigator.language) {
      const navLang = navigator.language.toLowerCase()
      if (navLang.startsWith("en")) setLocaleState("en-US")
      else if (navLang.startsWith("ja")) setLocaleState("ja-JP")
      else if (navLang.startsWith("ko")) setLocaleState("ko-KR")
      else setLocaleState("zh-CN")
    }
    setInitialized(true)
  }, [])

  const setLocale = (newLocale: LocaleCode) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
      // 同步更新 html 标签的 lang 属性
      if (typeof document !== "undefined") {
        document.documentElement.lang = newLocale
      }
    } catch {}
  }

  const t = useMemo(() => {
    return (key: string, fallback?: string): string => {
      const dict = TRANSLATIONS[locale]
      if (dict && dict[key]) return dict[key]
      // Fallback 策略：先尝试中文词典，再尝试外部 fallback，最后返回 key
      const zhDict = TRANSLATIONS["zh-CN"]
      if (zhDict && zhDict[key]) return zhDict[key]
      return fallback !== undefined ? fallback : key
    }
  }, [locale])

  const currentMeta = useMemo(() => {
    return SUPPORTED_LOCALES.find((item) => item.code === locale) || SUPPORTED_LOCALES[0]
  }, [locale])

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        locales: SUPPORTED_LOCALES,
        currentMeta,
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    // 降级支持：未包裹 Provider 时亦安全可用
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: string, fallback?: string) => fallback || TRANSLATIONS["zh-CN"][key] || key,
      locales: SUPPORTED_LOCALES,
      currentMeta: SUPPORTED_LOCALES[0],
    }
  }
  return ctx
}
