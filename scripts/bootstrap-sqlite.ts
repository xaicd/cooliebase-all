/**
 * SQLite 零配置数据库极速自动初始化脚本
 * 
 * 适用于：
 * 1. 容器内秒级启动与极速预览（不需要外部 PostgreSQL/MySQL 容器）
 * 2. 自动化测试与 MVP 模式
 * 3. 单文件数据库 data/cooliebase.db 零配置开箱即用
 * 4. 内置企业级 8 大标准审计底座字段 (tenant_id, created_by, created_at, updated_by, updated_at, deleted, deleted_at, remark)
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { createHash, randomBytes, randomInt } from 'crypto';

const DB_PATH = process.env.SQLITE_DB_PATH || path.resolve(process.cwd(), 'data/cooliebase.db');

function md5(value: string) {
  return createHash('md5').update(value).digest('hex');
}

function passwordHash(password: string, salt: string): string {
  return md5(md5(password) + salt);
}

function generateSecurePassword(length = 16): string {
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "!@#$%^&*";
  const all = lower + upper + digits + symbols;
  const pwd = [
    lower[randomInt(lower.length)],
    upper[randomInt(upper.length)],
    digits[randomInt(digits.length)],
    symbols[randomInt(symbols.length)],
  ];
  for (let i = 4; i < length; i++) {
    pwd.push(all[randomInt(all.length)]);
  }
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }
  return pwd.join("");
}

function updateEnvLocalCredentials(username: string, password: string, salt: string) {
  try {
    const envLocalPath = path.resolve(process.cwd(), '.env.local');
    let content = fs.existsSync(envLocalPath) ? fs.readFileSync(envLocalPath, 'utf8') : '';
    const setVar = (c: string, key: string, val: string) => {
      const reg = new RegExp(`^${key}=.*$`, 'm');
      if (reg.test(c)) return c.replace(reg, `${key}=${val}`);
      return c ? `${c.trimEnd()}\n${key}=${val}\n` : `${key}=${val}\n`;
    };
    content = setVar(content, 'ADMIN_BOOTSTRAP_USERNAME', username);
    content = setVar(content, 'ADMIN_BOOTSTRAP_PASSWORD', password);
    content = setVar(content, 'ADMIN_BOOTSTRAP_SALT', salt);
    content = setVar(content, 'TENANT_PLATFORM_USERNAMES', `${username},admin`);
    fs.writeFileSync(envLocalPath, content, 'utf8');
  } catch (err) {
    // ignore in read-only environments
  }
}

export async function bootstrapSqlite(targetPath = DB_PATH, options?: { username?: string; password?: string }) {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const isNewDb = !fs.existsSync(targetPath);
  const db = new Database(targetPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  console.log(`[Bootstrap-SQLite] 初始化数据库: ${targetPath} (新库: ${isNewDb})`);

  // 创建核心 RBAC 与系统表结构 (统一内置 8 大企业级审计底座字段)
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_user (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      nickname TEXT NOT NULL,
      password TEXT NOT NULL,
      salt TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      avatar TEXT,
      status TEXT DEFAULT 'ACTIVE',
      dept_id TEXT,
      login_ip TEXT,
      login_date DATETIME,
      tenant_id TEXT DEFAULT 'default',
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT DEFAULT 'system',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      remark TEXT
    );

    CREATE TABLE IF NOT EXISTS system_role (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      sort INTEGER DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE',
      data_scope TEXT DEFAULT 'ALL',
      tenant_id TEXT DEFAULT 'default',
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT DEFAULT 'system',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      remark TEXT
    );

    CREATE TABLE IF NOT EXISTS system_dept (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      sort INTEGER DEFAULT 0,
      leader TEXT,
      phone TEXT,
      email TEXT,
      status TEXT DEFAULT 'ACTIVE',
      tenant_id TEXT DEFAULT 'default',
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT DEFAULT 'system',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      remark TEXT
    );

    CREATE TABLE IF NOT EXISTS system_menu (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      sort INTEGER DEFAULT 0,
      path TEXT,
      component TEXT,
      component_name TEXT,
      icon TEXT,
      permission TEXT,
      type TEXT DEFAULT 'MENU',
      status TEXT DEFAULT 'ACTIVE',
      visible INTEGER DEFAULT 1,
      keep_alive INTEGER DEFAULT 1,
      always_show INTEGER DEFAULT 0,
      tenant_id TEXT DEFAULT 'default',
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT DEFAULT 'system',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      remark TEXT
    );

    CREATE TABLE IF NOT EXISTS system_user_role (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      tenant_id TEXT DEFAULT 'default',
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_role_menu (
      id TEXT PRIMARY KEY,
      role_id TEXT NOT NULL,
      menu_id TEXT NOT NULL,
      tenant_id TEXT DEFAULT 'default',
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_tenant_package (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'ACTIVE',
      account_limit INTEGER DEFAULT 9999,
      tenant_id TEXT DEFAULT 'default',
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT DEFAULT 'system',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      remark TEXT
    );

    CREATE TABLE IF NOT EXISTS system_tenant_package_menu (
      id TEXT PRIMARY KEY,
      package_id TEXT NOT NULL,
      menu_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_tenant (
      id TEXT PRIMARY KEY,
      tenant_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      contact_name TEXT,
      contact_phone TEXT,
      domain TEXT,
      package_id TEXT,
      status TEXT DEFAULT 'ACTIVE',
      effective_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expire_time DATETIME,
      account_limit INTEGER DEFAULT 9999,
      tenant_id TEXT DEFAULT 'default',
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT DEFAULT 'system',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      remark TEXT
    );

    CREATE TABLE IF NOT EXISTS system_dict_type (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      tenant_id TEXT DEFAULT 'default',
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT DEFAULT 'system',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      remark TEXT
    );

    CREATE TABLE IF NOT EXISTS system_dict_data (
      id TEXT PRIMARY KEY,
      dict_type TEXT NOT NULL,
      label TEXT NOT NULL,
      value TEXT NOT NULL,
      sort INTEGER DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE',
      color_type TEXT,
      css_class TEXT,
      tenant_id TEXT DEFAULT 'default',
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT DEFAULT 'system',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      remark TEXT
    );

    CREATE TABLE IF NOT EXISTS system_config (
      id TEXT PRIMARY KEY,
      category TEXT DEFAULT 'DEFAULT',
      name TEXT NOT NULL,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      type TEXT DEFAULT 'SYSTEM',
      visible INTEGER DEFAULT 1,
      tenant_id TEXT DEFAULT 'default',
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT DEFAULT 'system',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      remark TEXT
    );

    -- 🆕 C 端会员用户（app 端注册/登录主体，8 大审计底座字段）
    CREATE TABLE IF NOT EXISTS member_user (
      id TEXT PRIMARY KEY,
      account TEXT NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      nickname TEXT NOT NULL,
      avatar_url TEXT,
      status TEXT DEFAULT 'ACTIVE',
      member_level TEXT DEFAULT 'normal',
      extra_fields TEXT,
      tenant_id TEXT NOT NULL,
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT DEFAULT 'system',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      remark TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS member_user_tenant_account_key ON member_user(tenant_id, account);
    CREATE UNIQUE INDEX IF NOT EXISTS member_user_tenant_email_key ON member_user(tenant_id, email);
    CREATE INDEX IF NOT EXISTS member_user_tenant_id_idx ON member_user(tenant_id);
  `);

  // 🆕 预置演示 C 端会员（预览免输入登录：demo / demo123）
  const memberCount = db.prepare('SELECT count(*) as count FROM member_user').get() as { count: number };
  if (memberCount.count === 0) {
    console.log('[Bootstrap-SQLite] 注入演示 C 端会员账号 (demo / demo123)...');
    const mSalt = 'coolie_member_2026';
    const mPwd = passwordHash('demo123', mSalt);
    db.prepare(`
      INSERT INTO member_user (id, account, email, password_hash, password_salt, nickname, member_level, status, tenant_id, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'normal', 'ACTIVE', 'default', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run('member-demo-01', 'demo', 'demo@example.com', mPwd, mSalt, '演示用户');
  }

  // 检查/注入系统平台超级管理员账号 (换为 supervip，彻底废弃 admin / admin123 弱口令与运营商黑名单关键字)
  const bootstrapUsername = options?.username || process.env.ADMIN_BOOTSTRAP_USERNAME || 'supervip';
  const salt = process.env.ADMIN_BOOTSTRAP_SALT || randomBytes(8).toString('hex');
  const plainPassword = options?.password || process.env.ADMIN_BOOTSTRAP_PASSWORD || generateSecurePassword(16);
  const pwd = passwordHash(plainPassword, salt);

  // 如果指定了非 admin 账号，清除遗留的 admin 账号避免混淆
  if (bootstrapUsername !== 'admin') {
    db.prepare("DELETE FROM system_user WHERE username = 'admin'").run();
    db.prepare("DELETE FROM system_user_role WHERE user_id = 'user-admin-01'").run();
    db.prepare("DELETE FROM system_role WHERE code = 'admin'").run();
    db.prepare("DELETE FROM system_role_menu WHERE role_id = 'role-admin-01'").run();
  }

  const existingUser = db.prepare('SELECT id FROM system_user WHERE username = ? OR id = ?').get(bootstrapUsername, 'user-supervip-01') as { id: string } | undefined;
  if (!existingUser) {
    console.log(`[Bootstrap-SQLite] 注入系统平台超级管理员账号 (${bootstrapUsername})...`);

    const insertUser = db.prepare(`
      INSERT INTO system_user (id, username, nickname, password, salt, status, tenant_id, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE', 'default', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    insertUser.run('user-supervip-01', bootstrapUsername, '平台超级管理员', pwd, salt);

    const insertRole = db.prepare(`
      INSERT OR IGNORE INTO system_role (id, name, code, sort, status, data_scope, tenant_id, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'ACTIVE', 'ALL', 'default', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    insertRole.run('role-supervip-01', '超级管理员', 'supervip', 1);

    const insertUserRole = db.prepare(`
      INSERT OR REPLACE INTO system_user_role (id, user_id, role_id, tenant_id, created_by, created_at)
      VALUES (?, ?, ?, 'default', 'system', CURRENT_TIMESTAMP)
    `);
    insertUserRole.run('ur-supervip-01', 'user-supervip-01', 'role-supervip-01');
  } else {
    console.log(`[Bootstrap-SQLite] 同步更新系统平台超级管理员账号 (${bootstrapUsername}) 凭据...`);
    db.prepare(`
      UPDATE system_user
      SET username = ?, password = ?, salt = ?, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(bootstrapUsername, pwd, salt, existingUser.id);
  }

    // 注入核心系统菜单
    const insertMenu = db.prepare(`
      INSERT OR IGNORE INTO system_menu (id, name, parent_id, sort, path, component, icon, permission, type, tenant_id, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'default', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const menuIds = ['m-system', 'm-user', 'm-role', 'm-menu', 'm-dept', 'm-dict', 'm-config'];
    insertMenu.run('m-system', '系统管理', '0', 1, '/admin/system', 'Layout', 'system', null, 'DIR');
    insertMenu.run('m-user', '用户管理', 'm-system', 1, '/admin/system/users', 'system/user/index', 'user', 'system:user:list', 'MENU');
    insertMenu.run('m-role', '角色管理', 'm-system', 2, '/admin/system/roles', 'system/role/index', 'peoples', 'system:role:list', 'MENU');
    insertMenu.run('m-menu', '菜单管理', 'm-system', 3, '/admin/system/menus', 'system/menu/index', 'tree-table', 'system:menu:list', 'MENU');
    insertMenu.run('m-dept', '部门管理', 'm-system', 4, '/admin/system/depts', 'system/dept/index', 'tree', 'system:dept:list', 'MENU');
    insertMenu.run('m-dict', '字典管理', 'm-system', 5, '/admin/system/dicts', 'system/dict/index', 'dict', 'system:dict:list', 'MENU');
    insertMenu.run('m-config', '参数设置', 'm-system', 6, '/admin/system/config', 'system/config/index', 'edit', 'system:config:list', 'MENU');

    // 绑定角色菜单
    const insertRoleMenu = db.prepare(`
      INSERT OR IGNORE INTO system_role_menu (id, role_id, menu_id, tenant_id, created_by, created_at)
      VALUES (?, ?, ?, 'default', 'system', CURRENT_TIMESTAMP)
    `);
    for (const mid of menuIds) {
      insertRoleMenu.run(`rm-supervip-${mid}`, 'role-supervip-01', mid);
    }

    // 注入默认租户套餐
    db.prepare(`
      INSERT OR IGNORE INTO system_tenant_package (id, name, status, account_limit, tenant_id, created_by, created_at, updated_at)
      VALUES ('1', '基础运营套餐', 'ACTIVE', 9999, 'default', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run();

    const insertPkgMenu = db.prepare(`
      INSERT OR IGNORE INTO system_tenant_package_menu (id, package_id, menu_id)
      VALUES (?, '1', ?)
    `);
    for (const mid of menuIds) {
      insertPkgMenu.run(`pm-${mid}`, mid);
    }

    // 注入默认租户
    db.prepare(`
      INSERT OR IGNORE INTO system_tenant (id, tenant_code, name, package_id, status, account_limit, tenant_id, created_by, created_at, updated_at)
      VALUES ('default', 'default', '默认租户', '1', 'ACTIVE', 9999, 'default', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run();

    updateEnvLocalCredentials(bootstrapUsername, plainPassword, salt);

    console.log(`
================================================================
🔑 平台超级管理员账号已就绪 (随机安全密码，已持久化至 .env.local):
   平台账号: ${bootstrapUsername}
   随机密码: ${plainPassword}
================================================================
`);

  return { success: true, dbPath: targetPath, isNewDb };
}

// 支持直接命令行执行 ts-node
if (require.main === module) {
  bootstrapSqlite().then(() => {
    console.log('[Bootstrap-SQLite] 数据库启动自检完成！');
    process.exit(0);
  }).catch((err) => {
    console.error('[Bootstrap-SQLite] 初始化失败:', err);
    process.exit(1);
  });
}
