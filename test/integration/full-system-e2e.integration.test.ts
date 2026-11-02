/**
 * SpaceX 级全链路综合集成与 E2E 契约测试 (Full System Integration & RBAC E2E Test)
 *
 * 覆盖全流程闭环：
 * 1. 物理隔离 SQLite 动态实例初始化与 WAL 模式校验
 * 2. RBAC 超级管理员 admin / admin123 加盐认证与授权检验
 * 3. 系统菜单树全量节点关联与权限码透视
 * 4. MyBatis-Plus BaseMapper 增删改查、QueryWrapper 链式检索与逻辑删除
 *
 * 注: 原 [Step 5]「多用户并发项目孵化」已移除 —— 其依赖的
 * backend/modules/agent/services/native-engine/scaffolds/ProjectIncubator
 * 在本仓从未实现(导入路径指向仓库之外), 该导入导致本文件长期在收集阶段整体失败,
 * 连带 [Step 1]~[Step 4] 也从未真正执行过。孵化能力实际由 scripts/clone-project-base.cjs
 * 提供, 但它是纯 CLI 脚本(无 exports), 无法作为可测模块导入。
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestingKit } from '../../packages/domains/infra/testing/TestingKit';
import { bootstrapSqlite } from '../../scripts/bootstrap-sqlite.cjs';
import { QueryWrapper, BaseMapper } from '../../packages/shared/backend/lib/database/base-mapper';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createHash } from 'crypto';

function passwordHash(password: string, salt: string) {
  const md5 = (val: string) => createHash('md5').update(val).digest('hex');
  return md5(md5(password) + salt);
}

describe('SpaceX Grade: Full-Stack E2E & Lifecycle Matrix Verification', () => {
  let testDb: any;

  beforeAll(async () => {
    testDb = await TestingKit.createTestDatabase();
  });

  afterAll(async () => {
    if (testDb) {
      await testDb.cleanup();
    }
  });

  it('[Step 1] 真实 SQLite 实例创建并完成 WAL 模式与 8 大系统表加载', async () => {
    const tmpDbPath = path.join(os.tmpdir(), `spacex-test-db-${Date.now()}.db`);
    const initResult = await bootstrapSqlite(tmpDbPath);
    expect(initResult.success).toBe(true);
    expect(fs.existsSync(tmpDbPath)).toBe(true);

    const Database = require('better-sqlite3');
    const db = new Database(tmpDbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r: any) => r.name);
    
    expect(tables).toContain('system_user');
    expect(tables).toContain('system_role');
    expect(tables).toContain('system_menu');
    expect(tables).toContain('system_dept');
    expect(tables).toContain('system_dict_type');
    expect(tables).toContain('system_dict_data');
    db.close();
    fs.unlinkSync(tmpDbPath);
  });

  it('[Step 2] RBAC 鉴权引擎：supervip 凭据验证与角色绑定闭环', async () => {
    const user = await testDb.db
      .selectFrom('system_user')
      .selectAll()
      .where('username', '=', 'supervip')
      .executeTakeFirst();

    expect(user).toBeDefined();
    expect(user.status).toBe('ACTIVE');

    const inputHash = passwordHash('Sv1p-sR7b03IfJXqE#2026', user.salt);
    expect(inputHash).toBe(user.password);

    // 验证用户与角色的多对多绑定
    const userRole = await testDb.db
      .selectFrom('system_user_role')
      .selectAll()
      .where('user_id', '=', user.id)
      .executeTakeFirst();

    expect(userRole).toBeDefined();
    const role = await testDb.db
      .selectFrom('system_role')
      .selectAll()
      .where('id', '=', userRole.role_id)
      .executeTakeFirst();

    expect(role).toBeDefined();
    expect(role.code).toBe('supervip');
    expect(role.data_scope).toBe('ALL');
  });

  it('[Step 3] 系统菜单树全量路由与权限码透视', async () => {
    const menus = await testDb.db
      .selectFrom('system_menu')
      .selectAll()
      .where('deleted', '=', 0)
      .orderBy('sort', 'asc')
      .execute();

    expect(menus.length).toBeGreaterThanOrEqual(5);
    const paths = menus.map((m: any) => m.path);
    expect(paths).toContain('/admin/system');
    expect(paths).toContain('/admin/system/users');
    expect(paths).toContain('/admin/system/roles');
    expect(paths).toContain('/admin/system/menus');
    expect(paths).toContain('/admin/system/dicts');

    const perms = menus.map((m: any) => m.permission);
    expect(perms).toContain('system:user:list');
    expect(perms).toContain('system:role:list');
  });

  it('[Step 4] MyBatis-Plus BaseMapper 业务全生命周期 CRUD 闭环与逻辑删除', async () => {
    // 使用通用 BaseMapper 操作系统角色表
    const roleMapper = new BaseMapper<any>('system_role', 'id', testDb.db);

    // 1. Insert

    const newRole = await roleMapper.insert({
      name: 'WMS仓库操作员',
      code: 'role_wms_operator',
      sort: 10,
      status: 'ACTIVE',
      data_scope: 'DEPT'
    });
    expect(newRole.id).toBeDefined();

    // 2. SelectById
    const found = await roleMapper.selectById(newRole.id);
    expect(found).toBeDefined();
    expect(found.code).toBe('role_wms_operator');

    // 3. QueryWrapper 链式条件检索
    const qw = new QueryWrapper<any>()
      .like('name', '仓库')
      .eq('status', 'ACTIVE')
      .orderByDesc('sort');

    const list = await roleMapper.selectList(qw);
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.some(r => r.id === newRole.id)).toBe(true);

    // 4. UpdateById
    const updated = await roleMapper.updateById(newRole.id, { name: 'WMS高级调度员' });
    expect(updated).toBe(true);
    const updatedRole = await roleMapper.selectById(newRole.id);
    expect(updatedRole.name).toBe('WMS高级调度员');

    // 5. DeleteById (逻辑删除 deleted = 1)
    const deleted = await roleMapper.deleteById(newRole.id);
    expect(deleted).toBe(true);
    const afterDelete = await roleMapper.selectById(newRole.id);
    expect(afterDelete).toBeNull();
  });
});
