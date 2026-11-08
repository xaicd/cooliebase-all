import { MemberCenterPage } from "./member/pages/MemberCenterPage"
import { MallHomePage } from "./mall/pages/MallHomePage"

/**
 * 客户端业务模块注册表（与后端 domain-catalog 同源对齐，支持 ProjectReactor 按域动态裁剪）。
 * 每个模块对应 `clients/expo/src/modules/<domain>/{api,models,pages,components}`。
 */
export const CLIENT_DOMAIN_MODULES = [
  { domain: "member", tabId: "user", title: "用户中心", Component: MemberCenterPage },
  { domain: "mall", tabId: "mall", title: "商城专区", Component: MallHomePage },
]
