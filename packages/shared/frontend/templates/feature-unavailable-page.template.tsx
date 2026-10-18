"use client"

type Props = { title: string; description: string }

/** Prevent unfinished CoolieBase menu entries from masquerading as empty, working pages. */
export function FeatureUnavailablePage({ title, description }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        当前版本尚未实现该功能的数据模型、关联选择和业务接口，已临时禁用，避免误把其它配置数据当作此功能的数据。
      </div>
    </div>
  )
}
