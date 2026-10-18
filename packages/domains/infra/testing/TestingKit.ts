/**
 * TestingKit — Infra 模块低代码测试底座与自动化 Agent 测试套件
 * 
 * 为所有业务领域提供：
 * 1. 【L1 内存/Mock 隔离底座】：零网络、零外部数据库的毫秒级 Service/Repo 单测基类；
 * 2. 【L2 嵌入式 SQLite 集成环境】：自动挂载内存 SQLite 与 Seed 数据的 RESTful API 测试客户端；
 * 3. 【L3 Playwright E2E 快速装配器】：标准化 Admin 登录凭证与会话状态复用；
 * 4. 【L4 Agent 自愈与 UI 探针】：供 Coding Agent 在生成应用后自动执行无头 DOM 断言、截图与错误提取。
 * 
 * @module modules/infra/testing/TestingKit
 */

import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import type { DB } from '../../shared/backend/lib/database/schema';
import { bootstrapSqlite } from '../../../../scripts/bootstrap-sqlite.cjs';
import os from 'os';
import path from 'path';
import fs from 'fs';

export interface TestUserContext {
  userId: string;
  username: string;
  tenantId?: string;
  roles: string[];
  permissions: string[];
}

export class TestingKit {
  /**
   * 创建一个隔离的临时 SQLite 数据库用于集成测试
   */
  static async createTestDatabase(): Promise<{ db: Kysely<DB>; dbPath: string; cleanup: () => void }> {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cooliebase-test-db-'));
    const dbPath = path.join(tmpDir, 'test.db');
    
    // 初始化表结构与种子数据
    await bootstrapSqlite(dbPath, { username: 'supervip', password: 'Test@SuperVip2026!' });

    const nativeDb = new Database(dbPath);
    nativeDb.pragma('journal_mode = WAL');
    nativeDb.pragma('foreign_keys = ON');

    const db = new Kysely<DB>({
      dialect: new SqliteDialect({ database: nativeDb })
    });

    const cleanup = () => {
      try {
        nativeDb.close();
        if (fs.existsSync(tmpDir)) {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
      } catch (err) {
        // ignore cleanup error in temp
      }
    };

    return { db, dbPath, cleanup };
  }

  /**
   * 构造标准测试用户上下文
   */
  static createMockUserContext(overrides: Partial<TestUserContext> = {}): TestUserContext {
    return {
      userId: 'user-test-01',
      username: 'admin',
      tenantId: 'tenant-001',
      roles: ['admin'],
      permissions: ['*:*:*'],
      ...overrides
    };
  }

  /**
   * 构造模拟 Next.js Request 对象
   */
  static createMockRequest(options: {
    method?: string;
    url?: string;
    body?: any;
    headers?: Record<string, string>;
    query?: Record<string, string>;
  } = {}) {
    const { method = 'GET', url = 'http://localhost:3200/api/v1/test', body, headers = {}, query = {} } = options;
    
    const urlObj = new URL(url);
    for (const [k, v] of Object.entries(query)) {
      urlObj.searchParams.set(k, v);
    }

    const reqHeaders = new Headers();
    reqHeaders.set('Content-Type', 'application/json');
    for (const [k, v] of Object.entries(headers)) {
      reqHeaders.set(k, v);
    }

    return new Request(urlObj.toString(), {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined
    });
  }

  /**
   * L4: Agent 自动化 UI 探针配置生成
   */
  static getAgentPlaywrightProbeConfig(baseUrl = 'http://localhost:3200') {
    return {
      baseUrl,
      authStorageState: 'test/.auth/admin.json',
      viewport: { width: 1280, height: 800 },
      defaultTimeout: 10000,
      adminCredentials: {
        username: 'supervip',
        password: process.env.ADMIN_BOOTSTRAP_PASSWORD || 'Test@SuperVip2026!'
      }
    };
  }
}
