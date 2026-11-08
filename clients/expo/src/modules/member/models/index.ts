import type { MemberPublic, PageSchema, MobileBlockDef } from "../../../shared/types"

export type { MemberPublic, PageSchema }

export const MEMBER_PORTAL_BLOCKS: MobileBlockDef[] = [
  {
    id: "member_metrics",
    type: "stat_metrics",
    title: "会员资产概览",
    surface: "mobile",
    items: [
      { title: "成长积分", subtitle: "1,280" },
      { title: "优惠卡券", subtitle: "3 张" },
      { title: "账户等级", subtitle: "VIP" },
    ],
  },
]

export const DEFAULT_MEMBER_SCHEMA: PageSchema = {
  entity: "member_user",
  title: "会员扩展画像（支持表达式联动）",
  fields: [
    {
      code: "memberType",
      label: "会员身份类型",
      type: "select",
      options: [
        { label: "个人会员", value: "PERSONAL" },
        { label: "企业 VIP", value: "ENTERPRISE" },
      ],
      showInList: true,
      showInForm: true,
      sort: 1,
    },
    {
      code: "companyName",
      label: "企业抬头名称",
      type: "text",
      placeholder: "仅当选『企业 VIP』时联动显示",
      visibleOn: "{{ $form.memberType === 'ENTERPRISE' }}",
      requiredOn: "{{ $form.memberType === 'ENTERPRISE' }}",
      showInList: true,
      showInForm: true,
      sort: 2,
    },
    {
      code: "satisfaction",
      label: "服务满意度评分",
      type: "rate",
      showInList: true,
      showInForm: true,
      sort: 3,
    },
  ],
}
