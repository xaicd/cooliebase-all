-- 参考插件自带的迁移。
--
-- 注意：这里**不加 schema 限定** —— 宿主执行时会把自己的 search_path 固定到
-- plugin_<插件key>（本例是 plugin_cooliebase_hello_world），所以未限定的表名自然落在插件自己的
-- schema 里，看不到也碰不到宿主表（public）。带 public. 限定的语句会被宿主静态拒绝。
CREATE TABLE IF NOT EXISTS hello_items (
  id TEXT PRIMARY KEY,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO hello_items (id, note) VALUES ('seed-1', '来自插件自带迁移的种子数据')
ON CONFLICT (id) DO NOTHING;
