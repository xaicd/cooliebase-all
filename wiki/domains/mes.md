# 领域百科：mes (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-mes/`](../../packages/plugins/plugin-mes)  
> **演进阶段**：阶段 B | **独立部署默认端口**：3222 | **上游环境变量**：`COOLIEBASE_DOMAIN_MES_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（可独立拆分、打包、热插拔）
- **对外 HTTP API 前缀**：`/api/v1/admin/mes`
- **默认鉴权策略**：
  - 受众（Audience）：`admin`
  - 多租户策略：`required`
- **服务治理与韧性（Resilience）**：
  - 超时时间：`8000 ms`
  - 最大重试次数：`1`
  - 幂等要求：`强要求（需带 Idempotency-Key）`

---

## 二、 跨域 Facade 门面与 RPC 方法

其他业务域**禁止直接 import 本域的 Service / Repository**，跨域调用必须走 Domain Facade：

### 1. 契约门面定义
- [mes.facade.ts](../../packages/plugins/plugin-mes/contract/mes.facade.ts)

### 2. 公开支持的 RPC 方法清单
- `ping`
- `listWorkOrders`
- `reportWork`

---

## 三、 Agent 自动化实体与契约清单 (133 个)

本领域随代码生成器同源产出的机器可读契约，支持 `agent-device` (接口自动化运营) 与 `agent-browser` (Playwright 真实 UI 探针)：

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `MesCalHoliday` | MES 假期设置 | `/admin/mes/mes-cal-holiday` | `mes:mes_cal_holiday` | [`mes-cal-holiday.agent.json`](../../packages/plugins/plugin-mes/agent/mes-cal-holiday.agent.json) |
| `MesCalPlan` | MES 排班计划 | `/admin/mes/mes-cal-plan` | `mes:mes_cal_plan` | [`mes-cal-plan.agent.json`](../../packages/plugins/plugin-mes/agent/mes-cal-plan.agent.json) |
| `MesCalPlanShift` | MES 计划班次 | `/admin/mes/mes-cal-plan-shift` | `mes:mes_cal_plan_shift` | [`mes-cal-plan-shift.agent.json`](../../packages/plugins/plugin-mes/agent/mes-cal-plan-shift.agent.json) |
| `MesCalPlanTeam` | MES 计划班组关联 | `/admin/mes/mes-cal-plan-team` | `mes:mes_cal_plan_team` | [`mes-cal-plan-team.agent.json`](../../packages/plugins/plugin-mes/agent/mes-cal-plan-team.agent.json) |
| `MesCalTeam` | MES 班组 | `/admin/mes/mes-cal-team` | `mes:mes_cal_team` | [`mes-cal-team.agent.json`](../../packages/plugins/plugin-mes/agent/mes-cal-team.agent.json) |
| `MesCalTeamMember` | MES 班组成员 | `/admin/mes/mes-cal-team-member` | `mes:mes_cal_team_member` | [`mes-cal-team-member.agent.json`](../../packages/plugins/plugin-mes/agent/mes-cal-team-member.agent.json) |
| `MesCalTeamShift` | MES 班组排班 | `/admin/mes/mes-cal-team-shift` | `mes:mes_cal_team_shift` | [`mes-cal-team-shift.agent.json`](../../packages/plugins/plugin-mes/agent/mes-cal-team-shift.agent.json) |
| `MesDvCheckPlan` | MES 点检保养方案 | `/admin/mes/mes-dv-check-plan` | `mes:mes_dv_check_plan` | [`mes-dv-check-plan.agent.json`](../../packages/plugins/plugin-mes/agent/mes-dv-check-plan.agent.json) |
| `MesDvCheckPlanMachinery` | MES 点检保养方案设备 | `/admin/mes/mes-dv-check-plan-machinery` | `mes:mes_dv_check_plan_machinery` | [`mes-dv-check-plan-machinery.agent.json`](../../packages/plugins/plugin-mes/agent/mes-dv-check-plan-machinery.agent.json) |
| `MesDvCheckPlanSubject` | MES 点检保养方案项目 | `/admin/mes/mes-dv-check-plan-subject` | `mes:mes_dv_check_plan_subject` | [`mes-dv-check-plan-subject.agent.json`](../../packages/plugins/plugin-mes/agent/mes-dv-check-plan-subject.agent.json) |
| `MesDvCheckRecord` | MES 设备点检记录 | `/admin/mes/mes-dv-check-record` | `mes:mes_dv_check_record` | [`mes-dv-check-record.agent.json`](../../packages/plugins/plugin-mes/agent/mes-dv-check-record.agent.json) |
| `MesDvCheckRecordLine` | MES 设备点检记录明细 | `/admin/mes/mes-dv-check-record-line` | `mes:mes_dv_check_record_line` | [`mes-dv-check-record-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-dv-check-record-line.agent.json) |
| `MesDvMachinery` | MES 设备台账 | `/admin/mes/mes-dv-machinery` | `mes:mes_dv_machinery` | [`mes-dv-machinery.agent.json`](../../packages/plugins/plugin-mes/agent/mes-dv-machinery.agent.json) |
| `MesDvMachineryType` | MES 设备类型 | `/admin/mes/mes-dv-machinery-type` | `mes:mes_dv_machinery_type` | [`mes-dv-machinery-type.agent.json`](../../packages/plugins/plugin-mes/agent/mes-dv-machinery-type.agent.json) |
| `MesDvMaintenRecord` | MES 设备保养记录 | `/admin/mes/mes-dv-mainten-record` | `mes:mes_dv_mainten_record` | [`mes-dv-mainten-record.agent.json`](../../packages/plugins/plugin-mes/agent/mes-dv-mainten-record.agent.json) |
| `MesDvMaintenRecordLine` | MES 设备保养记录明细 | `/admin/mes/mes-dv-mainten-record-line` | `mes:mes_dv_mainten_record_line` | [`mes-dv-mainten-record-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-dv-mainten-record-line.agent.json) |
| `MesDvRepair` | MES 维修工单 | `/admin/mes/mes-dv-repair` | `mes:mes_dv_repair` | [`mes-dv-repair.agent.json`](../../packages/plugins/plugin-mes/agent/mes-dv-repair.agent.json) |
| `MesDvRepairLine` | MES 维修工单行 | `/admin/mes/mes-dv-repair-line` | `mes:mes_dv_repair_line` | [`mes-dv-repair-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-dv-repair-line.agent.json) |
| `MesDvSubject` | MES 点检保养项目 | `/admin/mes/mes-dv-subject` | `mes:mes_dv_subject` | [`mes-dv-subject.agent.json`](../../packages/plugins/plugin-mes/agent/mes-dv-subject.agent.json) |
| `MesMdAutoCodePart` | MES 编码规则组成 | `/admin/mes/mes-md-auto-code-part` | `mes:mes_md_auto_code_part` | [`mes-md-auto-code-part.agent.json`](../../packages/plugins/plugin-mes/agent/mes-md-auto-code-part.agent.json) |
| `MesMdAutoCodeRecord` | MES 编码生成记录 | `/admin/mes/mes-md-auto-code-record` | `mes:mes_md_auto_code_record` | [`mes-md-auto-code-record.agent.json`](../../packages/plugins/plugin-mes/agent/mes-md-auto-code-record.agent.json) |
| `MesMdAutoCodeRule` | MES 编码规则 | `/admin/mes/mes-md-auto-code-rule` | `mes:mes_md_auto_code_rule` | [`mes-md-auto-code-rule.agent.json`](../../packages/plugins/plugin-mes/agent/mes-md-auto-code-rule.agent.json) |
| `MesMdClient` | MES 客户 | `/admin/mes/mes-md-client` | `mes:mes_md_client` | [`mes-md-client.agent.json`](../../packages/plugins/plugin-mes/agent/mes-md-client.agent.json) |
| `MesMdItem` | MES 物料产品 | `/admin/mes/mes-md-item` | `mes:mes_md_item` | [`mes-md-item.agent.json`](../../packages/plugins/plugin-mes/agent/mes-md-item.agent.json) |
| `MesMdItemBatchConfig` | MES 物料批次属性配置 | `/admin/mes/mes-md-item-batch-config` | `mes:mes_md_item_batch_config` | [`mes-md-item-batch-config.agent.json`](../../packages/plugins/plugin-mes/agent/mes-md-item-batch-config.agent.json) |
| `MesMdItemType` | MES 物料产品分类 | `/admin/mes/mes-md-item-type` | `mes:mes_md_item_type` | [`mes-md-item-type.agent.json`](../../packages/plugins/plugin-mes/agent/mes-md-item-type.agent.json) |
| `MesMdProductBom` | MES 产品 BOM | `/admin/mes/mes-md-product-bom` | `mes:mes_md_product_bom` | [`mes-md-product-bom.agent.json`](../../packages/plugins/plugin-mes/agent/mes-md-product-bom.agent.json) |
| `MesMdProductSip` | MES 产品SIP | `/admin/mes/mes-md-product-sip` | `mes:mes_md_product_sip` | [`mes-md-product-sip.agent.json`](../../packages/plugins/plugin-mes/agent/mes-md-product-sip.agent.json) |
| `MesMdProductSop` | MES 产品SOP | `/admin/mes/mes-md-product-sop` | `mes:mes_md_product_sop` | [`mes-md-product-sop.agent.json`](../../packages/plugins/plugin-mes/agent/mes-md-product-sop.agent.json) |
| `MesMdUnitMeasure` | MES 计量单位 | `/admin/mes/mes-md-unit-measure` | `mes:mes_md_unit_measure` | [`mes-md-unit-measure.agent.json`](../../packages/plugins/plugin-mes/agent/mes-md-unit-measure.agent.json) |
| `MesMdVendor` | MES 供应商 | `/admin/mes/mes-md-vendor` | `mes:mes_md_vendor` | [`mes-md-vendor.agent.json`](../../packages/plugins/plugin-mes/agent/mes-md-vendor.agent.json) |
| `MesMdWorkshop` | MES 车间 | `/admin/mes/mes-md-workshop` | `mes:mes_md_workshop` | [`mes-md-workshop.agent.json`](../../packages/plugins/plugin-mes/agent/mes-md-workshop.agent.json) |
| `MesMdWorkstation` | MES 工作站 | `/admin/mes/mes-md-workstation` | `mes:mes_md_workstation` | [`mes-md-workstation.agent.json`](../../packages/plugins/plugin-mes/agent/mes-md-workstation.agent.json) |
| `MesMdWorkstationMachine` | MES 设备资源 | `/admin/mes/mes-md-workstation-machine` | `mes:mes_md_workstation_machine` | [`mes-md-workstation-machine.agent.json`](../../packages/plugins/plugin-mes/agent/mes-md-workstation-machine.agent.json) |
| `MesMdWorkstationTool` | MES 工装夹具资源 | `/admin/mes/mes-md-workstation-tool` | `mes:mes_md_workstation_tool` | [`mes-md-workstation-tool.agent.json`](../../packages/plugins/plugin-mes/agent/mes-md-workstation-tool.agent.json) |
| `MesMdWorkstationWorker` | MES 人力资源 | `/admin/mes/mes-md-workstation-worker` | `mes:mes_md_workstation_worker` | [`mes-md-workstation-worker.agent.json`](../../packages/plugins/plugin-mes/agent/mes-md-workstation-worker.agent.json) |
| `MesProAndonConfig` | MES 安灯呼叫配置 | `/admin/mes/mes-pro-andon-config` | `mes:mes_pro_andon_config` | [`mes-pro-andon-config.agent.json`](../../packages/plugins/plugin-mes/agent/mes-pro-andon-config.agent.json) |
| `MesProAndonRecord` | MES 安灯呼叫记录 | `/admin/mes/mes-pro-andon-record` | `mes:mes_pro_andon_record` | [`mes-pro-andon-record.agent.json`](../../packages/plugins/plugin-mes/agent/mes-pro-andon-record.agent.json) |
| `MesProCard` | MES 生产流转卡 | `/admin/mes/mes-pro-card` | `mes:mes_pro_card` | [`mes-pro-card.agent.json`](../../packages/plugins/plugin-mes/agent/mes-pro-card.agent.json) |
| `MesProCardProcess` | MES 流转卡工序记录 | `/admin/mes/mes-pro-card-process` | `mes:mes_pro_card_process` | [`mes-pro-card-process.agent.json`](../../packages/plugins/plugin-mes/agent/mes-pro-card-process.agent.json) |
| `MesProFeedback` | MES 生产报工 | `/admin/mes/mes-pro-feedback` | `mes:mes_pro_feedback` | [`mes-pro-feedback.agent.json`](../../packages/plugins/plugin-mes/agent/mes-pro-feedback.agent.json) |
| `MesProProcess` | MES 生产工序 | `/admin/mes/mes-pro-process` | `mes:mes_pro_process` | [`mes-pro-process.agent.json`](../../packages/plugins/plugin-mes/agent/mes-pro-process.agent.json) |
| `MesProProcessContent` | MES 生产工序内容 | `/admin/mes/mes-pro-process-content` | `mes:mes_pro_process_content` | [`mes-pro-process-content.agent.json`](../../packages/plugins/plugin-mes/agent/mes-pro-process-content.agent.json) |
| `MesProRoute` | MES 工艺路线 | `/admin/mes/mes-pro-route` | `mes:mes_pro_route` | [`mes-pro-route.agent.json`](../../packages/plugins/plugin-mes/agent/mes-pro-route.agent.json) |
| `MesProRouteProcess` | MES 工艺路线工序 | `/admin/mes/mes-pro-route-process` | `mes:mes_pro_route_process` | [`mes-pro-route-process.agent.json`](../../packages/plugins/plugin-mes/agent/mes-pro-route-process.agent.json) |
| `MesProRouteProduct` | MES 工艺路线产品 | `/admin/mes/mes-pro-route-product` | `mes:mes_pro_route_product` | [`mes-pro-route-product.agent.json`](../../packages/plugins/plugin-mes/agent/mes-pro-route-product.agent.json) |
| `MesProRouteProductBom` | MES 工艺路线产品 BOM | `/admin/mes/mes-pro-route-product-bom` | `mes:mes_pro_route_product_bom` | [`mes-pro-route-product-bom.agent.json`](../../packages/plugins/plugin-mes/agent/mes-pro-route-product-bom.agent.json) |
| `MesProTask` | MES 生产任务 | `/admin/mes/mes-pro-task` | `mes:mes_pro_task` | [`mes-pro-task.agent.json`](../../packages/plugins/plugin-mes/agent/mes-pro-task.agent.json) |
| `MesProTaskIssue` | MES 生产任务投料 | `/admin/mes/mes-pro-task-issue` | `mes:mes_pro_task_issue` | [`mes-pro-task-issue.agent.json`](../../packages/plugins/plugin-mes/agent/mes-pro-task-issue.agent.json) |
| `MesProWorkOrder` | MES 生产工单 | `/admin/mes/mes-pro-work-order` | `mes:mes_pro_work_order` | [`mes-pro-work-order.agent.json`](../../packages/plugins/plugin-mes/agent/mes-pro-work-order.agent.json) |
| `MesProWorkOrderBom` | MES 生产工单 BOM | `/admin/mes/mes-pro-work-order-bom` | `mes:mes_pro_work_order_bom` | [`mes-pro-work-order-bom.agent.json`](../../packages/plugins/plugin-mes/agent/mes-pro-work-order-bom.agent.json) |
| `MesProWorkRecord` | MES 用户工作站绑定关系（当前快照） | `/admin/mes/mes-pro-work-record` | `mes:mes_pro_work_record` | [`mes-pro-work-record.agent.json`](../../packages/plugins/plugin-mes/agent/mes-pro-work-record.agent.json) |
| `MesProWorkRecordLog` | MES 上下工记录流水 | `/admin/mes/mes-pro-work-record-log` | `mes:mes_pro_work_record_log` | [`mes-pro-work-record-log.agent.json`](../../packages/plugins/plugin-mes/agent/mes-pro-work-record-log.agent.json) |
| `MesQcDefect` | MES 缺陷类型 | `/admin/mes/mes-qc-defect` | `mes:mes_qc_defect` | [`mes-qc-defect.agent.json`](../../packages/plugins/plugin-mes/agent/mes-qc-defect.agent.json) |
| `MesQcDefectRecord` | MES 质检缺陷记录 DO通用缺陷记录表，通过 区分检验类型（IQC、IPQC、OQC、RQC），多模块复用 | `/admin/mes/mes-qc-defect-record` | `mes:mes_qc_defect_record` | [`mes-qc-defect-record.agent.json`](../../packages/plugins/plugin-mes/agent/mes-qc-defect-record.agent.json) |
| `MesQcIndicator` | MES 质检指标 | `/admin/mes/mes-qc-indicator` | `mes:mes_qc_indicator` | [`mes-qc-indicator.agent.json`](../../packages/plugins/plugin-mes/agent/mes-qc-indicator.agent.json) |
| `MesQcIndicatorResult` | MES 检验结果记录 | `/admin/mes/mes-qc-indicator-result` | `mes:mes_qc_indicator_result` | [`mes-qc-indicator-result.agent.json`](../../packages/plugins/plugin-mes/agent/mes-qc-indicator-result.agent.json) |
| `MesQcIndicatorResultDetail` | MES 检验结果明细记录 | `/admin/mes/mes-qc-indicator-result-detail` | `mes:mes_qc_indicator_result_detail` | [`mes-qc-indicator-result-detail.agent.json`](../../packages/plugins/plugin-mes/agent/mes-qc-indicator-result-detail.agent.json) |
| `MesQcIpqc` | MES 过程检验单（IPQC, In-Process Quality Control） | `/admin/mes/mes-qc-ipqc` | `mes:mes_qc_ipqc` | [`mes-qc-ipqc.agent.json`](../../packages/plugins/plugin-mes/agent/mes-qc-ipqc.agent.json) |
| `MesQcIpqcLine` | MES 过程检验单行 | `/admin/mes/mes-qc-ipqc-line` | `mes:mes_qc_ipqc_line` | [`mes-qc-ipqc-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-qc-ipqc-line.agent.json) |
| `MesQcIqc` | MES 来料检验单（IQC, Incoming Quality Control） | `/admin/mes/mes-qc-iqc` | `mes:mes_qc_iqc` | [`mes-qc-iqc.agent.json`](../../packages/plugins/plugin-mes/agent/mes-qc-iqc.agent.json) |
| `MesQcIqcLine` | MES 来料检验单行 | `/admin/mes/mes-qc-iqc-line` | `mes:mes_qc_iqc_line` | [`mes-qc-iqc-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-qc-iqc-line.agent.json) |
| `MesQcOqc` | MES 出货检验单（OQC, Outgoing Quality Control） | `/admin/mes/mes-qc-oqc` | `mes:mes_qc_oqc` | [`mes-qc-oqc.agent.json`](../../packages/plugins/plugin-mes/agent/mes-qc-oqc.agent.json) |
| `MesQcOqcLine` | MES 出货检验单行 | `/admin/mes/mes-qc-oqc-line` | `mes:mes_qc_oqc_line` | [`mes-qc-oqc-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-qc-oqc-line.agent.json) |
| `MesQcRqc` | MES 退货检验单（RQC, Return Quality Control） | `/admin/mes/mes-qc-rqc` | `mes:mes_qc_rqc` | [`mes-qc-rqc.agent.json`](../../packages/plugins/plugin-mes/agent/mes-qc-rqc.agent.json) |
| `MesQcRqcLine` | MES 退货检验行 | `/admin/mes/mes-qc-rqc-line` | `mes:mes_qc_rqc_line` | [`mes-qc-rqc-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-qc-rqc-line.agent.json) |
| `MesQcTemplate` | MES 质检方案 | `/admin/mes/mes-qc-template` | `mes:mes_qc_template` | [`mes-qc-template.agent.json`](../../packages/plugins/plugin-mes/agent/mes-qc-template.agent.json) |
| `MesQcTemplateIndicator` | MES 质检方案-检测指标项 | `/admin/mes/mes-qc-template-indicator` | `mes:mes_qc_template_indicator` | [`mes-qc-template-indicator.agent.json`](../../packages/plugins/plugin-mes/agent/mes-qc-template-indicator.agent.json) |
| `MesQcTemplateItem` | MES 质检方案-产品关联 | `/admin/mes/mes-qc-template-item` | `mes:mes_qc_template_item` | [`mes-qc-template-item.agent.json`](../../packages/plugins/plugin-mes/agent/mes-qc-template-item.agent.json) |
| `MesTmTool` | MES 工具台账 | `/admin/mes/mes-tm-tool` | `mes:mes_tm_tool` | [`mes-tm-tool.agent.json`](../../packages/plugins/plugin-mes/agent/mes-tm-tool.agent.json) |
| `MesTmToolType` | MES 工具类型 | `/admin/mes/mes-tm-tool-type` | `mes:mes_tm_tool_type` | [`mes-tm-tool-type.agent.json`](../../packages/plugins/plugin-mes/agent/mes-tm-tool-type.agent.json) |
| `MesWmArrivalNotice` | MES 到货通知单 | `/admin/mes/mes-wm-arrival-notice` | `mes:mes_wm_arrival_notice` | [`mes-wm-arrival-notice.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-arrival-notice.agent.json) |
| `MesWmArrivalNoticeLine` | MES 到货通知单行 | `/admin/mes/mes-wm-arrival-notice-line` | `mes:mes_wm_arrival_notice_line` | [`mes-wm-arrival-notice-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-arrival-notice-line.agent.json) |
| `MesWmBarcode` | MES 条码清单 | `/admin/mes/mes-wm-barcode` | `mes:mes_wm_barcode` | [`mes-wm-barcode.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-barcode.agent.json) |
| `MesWmBarcodeConfig` | MES 条码配置 | `/admin/mes/mes-wm-barcode-config` | `mes:mes_wm_barcode_config` | [`mes-wm-barcode-config.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-barcode-config.agent.json) |
| `MesWmBatch` | 批次管理 | `/admin/mes/mes-wm-batch` | `mes:mes_wm_batch` | [`mes-wm-batch.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-batch.agent.json) |
| `MesWmItemConsume` | MES 物料消耗记录 | `/admin/mes/mes-wm-item-consume` | `mes:mes_wm_item_consume` | [`mes-wm-item-consume.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-item-consume.agent.json) |
| `MesWmItemConsumeDetail` | MES 物料消耗记录明细 DO记录 line 级别的消耗按线边库 FIFO 分配到具体批次的明细。一条 line 可能拆分为多条 detail（当一个批次库存不够，需要从下一个批次继续分配时）。 | `/admin/mes/mes-wm-item-consume-detail` | `mes:mes_wm_item_consume_detail` | [`mes-wm-item-consume-detail.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-item-consume-detail.agent.json) |
| `MesWmItemConsumeLine` | MES 物料消耗记录行 | `/admin/mes/mes-wm-item-consume-line` | `mes:mes_wm_item_consume_line` | [`mes-wm-item-consume-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-item-consume-line.agent.json) |
| `MesWmItemReceipt` | MES 采购入库单 | `/admin/mes/mes-wm-item-receipt` | `mes:mes_wm_item_receipt` | [`mes-wm-item-receipt.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-item-receipt.agent.json) |
| `MesWmItemReceiptDetail` | MES 采购入库明细 | `/admin/mes/mes-wm-item-receipt-detail` | `mes:mes_wm_item_receipt_detail` | [`mes-wm-item-receipt-detail.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-item-receipt-detail.agent.json) |
| `MesWmItemReceiptLine` | MES 采购入库单行 | `/admin/mes/mes-wm-item-receipt-line` | `mes:mes_wm_item_receipt_line` | [`mes-wm-item-receipt-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-item-receipt-line.agent.json) |
| `MesWmMaterialStock` | MES 库存台账（仓库现有量） | `/admin/mes/mes-wm-material-stock` | `mes:mes_wm_material_stock` | [`mes-wm-material-stock.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-material-stock.agent.json) |
| `MesWmMiscIssue` | MES 杂项出库单 | `/admin/mes/mes-wm-misc-issue` | `mes:mes_wm_misc_issue` | [`mes-wm-misc-issue.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-misc-issue.agent.json) |
| `MesWmMiscIssueDetail` | MES 杂项出库明细 | `/admin/mes/mes-wm-misc-issue-detail` | `mes:mes_wm_misc_issue_detail` | [`mes-wm-misc-issue-detail.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-misc-issue-detail.agent.json) |
| `MesWmMiscIssueLine` | MES 杂项出库单行 | `/admin/mes/mes-wm-misc-issue-line` | `mes:mes_wm_misc_issue_line` | [`mes-wm-misc-issue-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-misc-issue-line.agent.json) |
| `MesWmMiscReceipt` | MES 杂项入库单 | `/admin/mes/mes-wm-misc-receipt` | `mes:mes_wm_misc_receipt` | [`mes-wm-misc-receipt.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-misc-receipt.agent.json) |
| `MesWmMiscReceiptDetail` | MES 杂项入库明细 | `/admin/mes/mes-wm-misc-receipt-detail` | `mes:mes_wm_misc_receipt_detail` | [`mes-wm-misc-receipt-detail.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-misc-receipt-detail.agent.json) |
| `MesWmMiscReceiptLine` | MES 杂项入库单行 | `/admin/mes/mes-wm-misc-receipt-line` | `mes:mes_wm_misc_receipt_line` | [`mes-wm-misc-receipt-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-misc-receipt-line.agent.json) |
| `MesWmOutsourceIssue` | MES 外协发料单 | `/admin/mes/mes-wm-outsource-issue` | `mes:mes_wm_outsource_issue` | [`mes-wm-outsource-issue.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-outsource-issue.agent.json) |
| `MesWmOutsourceIssueDetail` | MES 外协发料单明细 | `/admin/mes/mes-wm-outsource-issue-detail` | `mes:mes_wm_outsource_issue_detail` | [`mes-wm-outsource-issue-detail.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-outsource-issue-detail.agent.json) |
| `MesWmOutsourceIssueLine` | MES 外协发料单行 | `/admin/mes/mes-wm-outsource-issue-line` | `mes:mes_wm_outsource_issue_line` | [`mes-wm-outsource-issue-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-outsource-issue-line.agent.json) |
| `MesWmOutsourceReceipt` | MES 外协入库单 | `/admin/mes/mes-wm-outsource-receipt` | `mes:mes_wm_outsource_receipt` | [`mes-wm-outsource-receipt.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-outsource-receipt.agent.json) |
| `MesWmOutsourceReceiptDetail` | MES 外协入库明细 | `/admin/mes/mes-wm-outsource-receipt-detail` | `mes:mes_wm_outsource_receipt_detail` | [`mes-wm-outsource-receipt-detail.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-outsource-receipt-detail.agent.json) |
| `MesWmOutsourceReceiptLine` | MES 外协入库单行 | `/admin/mes/mes-wm-outsource-receipt-line` | `mes:mes_wm_outsource_receipt_line` | [`mes-wm-outsource-receipt-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-outsource-receipt-line.agent.json) |
| `MesWmPackage` | MES 装箱单 | `/admin/mes/mes-wm-package` | `mes:mes_wm_package` | [`mes-wm-package.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-package.agent.json) |
| `MesWmPackageLine` | MES 装箱明细 | `/admin/mes/mes-wm-package-line` | `mes:mes_wm_package_line` | [`mes-wm-package-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-package-line.agent.json) |
| `MesWmProductIssue` | MES 领料出库单 | `/admin/mes/mes-wm-product-issue` | `mes:mes_wm_product_issue` | [`mes-wm-product-issue.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-product-issue.agent.json) |
| `MesWmProductIssueDetail` | MES 领料出库明细 | `/admin/mes/mes-wm-product-issue-detail` | `mes:mes_wm_product_issue_detail` | [`mes-wm-product-issue-detail.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-product-issue-detail.agent.json) |
| `MesWmProductIssueLine` | MES 领料出库单行 | `/admin/mes/mes-wm-product-issue-line` | `mes:mes_wm_product_issue_line` | [`mes-wm-product-issue-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-product-issue-line.agent.json) |
| `MesWmProductProduce` | MES 生产入库单 | `/admin/mes/mes-wm-product-produce` | `mes:mes_wm_product_produce` | [`mes-wm-product-produce.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-product-produce.agent.json) |
| `MesWmProductProduceDetail` | MES 生产入库明细 | `/admin/mes/mes-wm-product-produce-detail` | `mes:mes_wm_product_produce_detail` | [`mes-wm-product-produce-detail.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-product-produce-detail.agent.json) |
| `MesWmProductProduceLine` | MES 生产入库单行 | `/admin/mes/mes-wm-product-produce-line` | `mes:mes_wm_product_produce_line` | [`mes-wm-product-produce-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-product-produce-line.agent.json) |
| `MesWmProductReceipt` | MES 产品收货（入库）单 | `/admin/mes/mes-wm-product-receipt` | `mes:mes_wm_product_receipt` | [`mes-wm-product-receipt.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-product-receipt.agent.json) |
| `MesWmProductReceiptDetail` | MES 产品收货（入库）单明细 | `/admin/mes/mes-wm-product-receipt-detail` | `mes:mes_wm_product_receipt_detail` | [`mes-wm-product-receipt-detail.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-product-receipt-detail.agent.json) |
| `MesWmProductReceiptLine` | MES 产品收货（入库）单行 | `/admin/mes/mes-wm-product-receipt-line` | `mes:mes_wm_product_receipt_line` | [`mes-wm-product-receipt-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-product-receipt-line.agent.json) |
| `MesWmProductSales` | MES 销售出库单 | `/admin/mes/mes-wm-product-sales` | `mes:mes_wm_product_sales` | [`mes-wm-product-sales.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-product-sales.agent.json) |
| `MesWmProductSalesDetail` | MES 销售出库明细 | `/admin/mes/mes-wm-product-sales-detail` | `mes:mes_wm_product_sales_detail` | [`mes-wm-product-sales-detail.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-product-sales-detail.agent.json) |
| `MesWmProductSalesLine` | MES 销售出库单行 | `/admin/mes/mes-wm-product-sales-line` | `mes:mes_wm_product_sales_line` | [`mes-wm-product-sales-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-product-sales-line.agent.json) |
| `MesWmReturnIssue` | MES 生产退料单 | `/admin/mes/mes-wm-return-issue` | `mes:mes_wm_return_issue` | [`mes-wm-return-issue.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-return-issue.agent.json) |
| `MesWmReturnIssueDetail` | MES 生产退料明细 | `/admin/mes/mes-wm-return-issue-detail` | `mes:mes_wm_return_issue_detail` | [`mes-wm-return-issue-detail.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-return-issue-detail.agent.json) |
| `MesWmReturnIssueLine` | MES 生产退料单行 | `/admin/mes/mes-wm-return-issue-line` | `mes:mes_wm_return_issue_line` | [`mes-wm-return-issue-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-return-issue-line.agent.json) |
| `MesWmReturnSales` | MES 销售退货单 | `/admin/mes/mes-wm-return-sales` | `mes:mes_wm_return_sales` | [`mes-wm-return-sales.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-return-sales.agent.json) |
| `MesWmReturnSalesDetail` | MES 销售退货明细 | `/admin/mes/mes-wm-return-sales-detail` | `mes:mes_wm_return_sales_detail` | [`mes-wm-return-sales-detail.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-return-sales-detail.agent.json) |
| `MesWmReturnSalesLine` | MES 销售退货单行 | `/admin/mes/mes-wm-return-sales-line` | `mes:mes_wm_return_sales_line` | [`mes-wm-return-sales-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-return-sales-line.agent.json) |
| `MesWmReturnVendor` | MES 供应商退货单 | `/admin/mes/mes-wm-return-vendor` | `mes:mes_wm_return_vendor` | [`mes-wm-return-vendor.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-return-vendor.agent.json) |
| `MesWmReturnVendorDetail` | MES 供应商退货明细 | `/admin/mes/mes-wm-return-vendor-detail` | `mes:mes_wm_return_vendor_detail` | [`mes-wm-return-vendor-detail.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-return-vendor-detail.agent.json) |
| `MesWmReturnVendorLine` | MES 供应商退货单行 | `/admin/mes/mes-wm-return-vendor-line` | `mes:mes_wm_return_vendor_line` | [`mes-wm-return-vendor-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-return-vendor-line.agent.json) |
| `MesWmSalesNotice` | MES 发货通知单 | `/admin/mes/mes-wm-sales-notice` | `mes:mes_wm_sales_notice` | [`mes-wm-sales-notice.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-sales-notice.agent.json) |
| `MesWmSalesNoticeLine` | MES 发货通知单行 | `/admin/mes/mes-wm-sales-notice-line` | `mes:mes_wm_sales_notice_line` | [`mes-wm-sales-notice-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-sales-notice-line.agent.json) |
| `MesWmSn` | MES SN 码 | `/admin/mes/mes-wm-sn` | `mes:mes_wm_sn` | [`mes-wm-sn.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-sn.agent.json) |
| `MesWmStockTakingPlan` | MES 盘点方案 | `/admin/mes/mes-wm-stock-taking-plan` | `mes:mes_wm_stock_taking_plan` | [`mes-wm-stock-taking-plan.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-stock-taking-plan.agent.json) |
| `MesWmStockTakingPlanParam` | MES 盘点方案参数 | `/admin/mes/mes-wm-stock-taking-plan-param` | `mes:mes_wm_stock_taking_plan_param` | [`mes-wm-stock-taking-plan-param.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-stock-taking-plan-param.agent.json) |
| `MesWmStockTakingTask` | MES 盘点任务 | `/admin/mes/mes-wm-stock-taking-task` | `mes:mes_wm_stock_taking_task` | [`mes-wm-stock-taking-task.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-stock-taking-task.agent.json) |
| `MesWmStockTakingTaskLine` | MES 盘点任务行 | `/admin/mes/mes-wm-stock-taking-task-line` | `mes:mes_wm_stock_taking_task_line` | [`mes-wm-stock-taking-task-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-stock-taking-task-line.agent.json) |
| `MesWmStockTakingTaskResult` | MES 盘点结果 | `/admin/mes/mes-wm-stock-taking-task-result` | `mes:mes_wm_stock_taking_task_result` | [`mes-wm-stock-taking-task-result.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-stock-taking-task-result.agent.json) |
| `MesWmTransaction` | MES 库存事务流水 DO记录每一笔库存增减事件，系统自动生成，只读查询，不允许人工维护。 | `/admin/mes/mes-wm-transaction` | `mes:mes_wm_transaction` | [`mes-wm-transaction.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-transaction.agent.json) |
| `MesWmTransfer` | MES 转移单 | `/admin/mes/mes-wm-transfer` | `mes:mes_wm_transfer` | [`mes-wm-transfer.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-transfer.agent.json) |
| `MesWmTransferDetail` | MES 调拨明细 | `/admin/mes/mes-wm-transfer-detail` | `mes:mes_wm_transfer_detail` | [`mes-wm-transfer-detail.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-transfer-detail.agent.json) |
| `MesWmTransferLine` | MES 转移单行 | `/admin/mes/mes-wm-transfer-line` | `mes:mes_wm_transfer_line` | [`mes-wm-transfer-line.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-transfer-line.agent.json) |
| `MesWmWarehouse` | MES 仓库 | `/admin/mes/mes-wm-warehouse` | `mes:mes_wm_warehouse` | [`mes-wm-warehouse.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-warehouse.agent.json) |
| `MesWmWarehouseArea` | MES 库位 | `/admin/mes/mes-wm-warehouse-area` | `mes:mes_wm_warehouse_area` | [`mes-wm-warehouse-area.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-warehouse-area.agent.json) |
| `MesWmWarehouseLocation` | MES 库区 | `/admin/mes/mes-wm-warehouse-location` | `mes:mes_wm_warehouse_location` | [`mes-wm-warehouse-location.agent.json`](../../packages/plugins/plugin-mes/agent/mes-wm-warehouse-location.agent.json) |


---

## 四、 研发指引与注意事项

1. **代码物理路径**：
   - 业务逻辑一律放于 `packages/plugins/plugin-mes/backend/services/`；
   - 仓储数据访问一律放于 `packages/plugins/plugin-mes/backend/repositories/`；
   - 契约接口一律放于 `packages/plugins/plugin-mes/contract/`；
2. **租户隔离**：
   - 表设计若含 `tenant_id`，查询与写入自动由 Kysely `tenantIsolationPlugin` 拦截，无需人肉拼写 `WHERE tenant_id = ?`。
