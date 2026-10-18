/**
 * MyBatis-Plus 风格通用 BaseMapper 与 QueryWrapper
 * 
 * 为 cooliebase-all-base 提供 SpringBoot + MyBatis-Plus 级的开发体验：
 * 1. 链式条件构造器 QueryWrapper / LambdaQueryWrapper
 * 2. 泛型 BaseMapper：全套内置 selectById, selectList, selectPage, insert, updateById, deleteById
 * 3. 自动租户隔离、逻辑删除过滤、审计字段自填充
 * 4. 业务代码极简：新增业务领域仅需继承 BaseService，无需大模型逐行编写重复的 CRUD 代码！
 * 
 * @module modules/shared/backend/lib/database/base-mapper
 */

import { getKyselyDb } from './kysely-client';
import { getCurrentTenantId } from '../biz-tenant';
import type { DB } from './schema';
import type { Kysely } from 'kysely';

export type QueryOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'like' | 'in' | 'not in' | 'is null' | 'is not null' | 'between';

export interface QueryCondition {
  column: string;
  operator: QueryOperator;
  value?: any;
  value2?: any;
}

export interface OrderItem {
  column: string;
  order: 'asc' | 'desc';
}

/**
 * MyBatis-Plus 风格链式条件构造器
 */
export class QueryWrapper<T = any> {
  private conditions: QueryCondition[] = [];
  private orderList: OrderItem[] = [];

  eq(column: keyof T | string, value: any): this {
    if (value !== undefined && value !== null && value !== '') {
      this.conditions.push({ column: String(column), operator: '=', value });
    }
    return this;
  }

  ne(column: keyof T | string, value: any): this {
    if (value !== undefined && value !== null) {
      this.conditions.push({ column: String(column), operator: '!=', value });
    }
    return this;
  }

  like(column: keyof T | string, value: string | undefined): this {
    if (value !== undefined && value !== null && value !== '') {
      this.conditions.push({ column: String(column), operator: 'like', value: `%${value}%` });
    }
    return this;
  }

  gt(column: keyof T | string, value: any): this {
    if (value !== undefined && value !== null) {
      this.conditions.push({ column: String(column), operator: '>', value });
    }
    return this;
  }

  ge(column: keyof T | string, value: any): this {
    if (value !== undefined && value !== null) {
      this.conditions.push({ column: String(column), operator: '>=', value });
    }
    return this;
  }

  lt(column: keyof T | string, value: any): this {
    if (value !== undefined && value !== null) {
      this.conditions.push({ column: String(column), operator: '<', value });
    }
    return this;
  }

  le(column: keyof T | string, value: any): this {
    if (value !== undefined && value !== null) {
      this.conditions.push({ column: String(column), operator: '<=', value });
    }
    return this;
  }

  in(column: keyof T | string, values: any[]): this {
    if (Array.isArray(values) && values.length > 0) {
      this.conditions.push({ column: String(column), operator: 'in', value: values });
    }
    return this;
  }

  between(column: keyof T | string, val1: any, val2: any): this {
    if (val1 !== undefined && val2 !== undefined) {
      this.conditions.push({ column: String(column), operator: 'between', value: val1, value2: val2 });
    }
    return this;
  }

  orderByAsc(column: keyof T | string): this {
    this.orderList.push({ column: String(column), order: 'asc' });
    return this;
  }

  orderByDesc(column: keyof T | string): this {
    this.orderList.push({ column: String(column), order: 'desc' });
    return this;
  }

  getConditions(): QueryCondition[] {
    return this.conditions;
  }

  getOrders(): OrderItem[] {
    return this.orderList;
  }
}

/**
 * 表列能力探测缓存（模块级共享）
 *
 * 按表实际存在的列决定是否启用「逻辑删除过滤 / 租户过滤 / 审计字段自动填充」，
 * 彻底杜绝向不具备该列的表写入或过滤不存在列（历史缺陷：deleted 写 0/1 与
 * schema Boolean 类型冲突、引用全库不存在的 deleted_at 列）。
 */
const tableColumnCache = new Map<string, Set<string>>();

async function resolveTableColumns(db: Kysely<DB>, tableName: string): Promise<Set<string>> {
  const cached = tableColumnCache.get(tableName);
  if (cached) return cached;
  const tables = await db.introspection.getTables();
  const target = tables.find((t) => (t as any).name === tableName || (t as any).tableName === tableName);
  const cols = new Set<string>(((target as any)?.columns || []).map((c: any) => c.name || c.columnName));
  if (cols.size > 0) tableColumnCache.set(tableName, cols);
  return cols;
}

/**
 * 泛型 BaseMapper 底座
 */
export class BaseMapper<T extends Record<string, any>> {
  constructor(
    public readonly tableName: string,
    public readonly primaryKey: string = 'id',
    private injectedDb?: Kysely<DB>
  ) {}

  private async getDb(): Promise<Kysely<DB>> {
    if (this.injectedDb) return this.injectedDb;
    const db = await getKyselyDb();
    if (!db) {
      throw new Error(`数据库未初始化，无法访问表 [${this.tableName}]`);
    }
    return db;
  }

  /** 解析当前表实际存在的列集合（带缓存） */
  private async getColumns(db: Kysely<DB>): Promise<Set<string>> {
    return resolveTableColumns(db, this.tableName);
  }

  /** 表是否具备指定列 */
  private async hasColumn(db: Kysely<DB>, column: string): Promise<boolean> {
    return (await this.getColumns(db)).has(column);
  }

  /**
   * 根据 ID 查询单条记录（表存在 deleted/tenant_id 列时自动过滤）
   */
  async selectById(id: string | number): Promise<T | null> {
    const db = await this.getDb();
    const tenantId = getCurrentTenantId();
    const cols = await this.getColumns(db);

    let query = db.selectFrom(this.tableName as any).selectAll().where(this.primaryKey as any, '=', id);
    if (cols.has('deleted')) {
      query = (query as any).where('deleted', '=', 0);
    }

    if (tenantId && cols.has('tenant_id')) {
      query = (query as any).where('tenant_id', '=', tenantId);
    }

    const row = await (query as any).executeTakeFirst();
    return (row as T) || null;
  }

  /**
   * 根据条件查询单条记录
   */
  async selectOne(wrapper: QueryWrapper<T>): Promise<T | null> {
    const list = await this.selectList(wrapper);
    return list.length > 0 ? list[0] : null;
  }

  /**
   * 根据条件查询列表
   */
  async selectList(wrapper?: QueryWrapper<T>): Promise<T[]> {
    const db = await this.getDb();
    const tenantId = getCurrentTenantId();
    const cols = await this.getColumns(db);
    const query = this.buildListQuery(db, cols, tenantId, wrapper);
    const rows = await query.execute();
    return rows as T[];
  }

  /** 构建带能力探测的列表查询（同步构造 QueryBuilder，防止 async 返回 thenable 触发 Kysely preventAwait） */
  private buildListQuery(db: Kysely<DB>, cols: Set<string>, tenantId: string | undefined, wrapper?: QueryWrapper<T>): any {
    let query = db.selectFrom(this.tableName as any).selectAll();
    if (cols.has('deleted')) {
      query = (query as any).where('deleted', '=', 0);
    }

    if (tenantId && cols.has('tenant_id')) {
      query = (query as any).where('tenant_id', '=', tenantId);
    }

    if (wrapper) {
      for (const cond of wrapper.getConditions()) {
        if (cond.operator === '=') query = (query as any).where(cond.column, '=', cond.value);
        else if (cond.operator === '!=') query = (query as any).where(cond.column, '!=', cond.value);
        else if (cond.operator === 'like') query = (query as any).where(cond.column, 'like', cond.value);
        else if (cond.operator === '>') query = (query as any).where(cond.column, '>', cond.value);
        else if (cond.operator === '>=') query = (query as any).where(cond.column, '>=', cond.value);
        else if (cond.operator === '<') query = (query as any).where(cond.column, '<', cond.value);
        else if (cond.operator === '<=') query = (query as any).where(cond.column, '<=', cond.value);
        else if (cond.operator === 'in') query = (query as any).where(cond.column, 'in', cond.value);
      }

      for (const ord of wrapper.getOrders()) {
        query = (query as any).orderBy(ord.column, ord.order);
      }
    }

    return query;
  }

  /**
   * MyBatis-Plus 风格通用分页查询（SQL 级 count + limit/offset，杜绝全量拉取内存分页）
   */
  async selectPage(
    page: { pageNum: number; pageSize: number },
    wrapper?: QueryWrapper<T>
  ): Promise<{ list: T[]; total: number; pageNum: number; pageSize: number }> {
    const db = await this.getDb();
    const tenantId = getCurrentTenantId();
    const cols = await this.getColumns(db);
    const pageNum = Math.max(1, page.pageNum || 1);
    const pageSize = Math.max(1, page.pageSize || 10);
    const offset = (pageNum - 1) * pageSize;

    const listQuery = this.buildListQuery(db, cols, tenantId, wrapper);
    const list = await ((listQuery as any).offset(offset).limit(pageSize) as any).execute();

    // 总数走 SQL count（复用同一过滤条件）
    const countQuery = this.buildListQuery(db, cols, tenantId, wrapper);
    const countRow = await ((countQuery as any).clearSelect().select((eb: any) => eb.fn.countAll<number>('count')) as any).executeTakeFirst();
    const total = Number((countRow as any)?.count ?? 0);

    return { list: list as T[], total, pageNum, pageSize };
  }


  /**
   * 插入记录（按表实际列自动填充主键、租户ID、创建/更新人与时间等审计字段）
   */
  async insert(entity: Partial<T>): Promise<T> {
    const db = await this.getDb();
    const tenantId = getCurrentTenantId();
    const cols = await this.getColumns(db);
    const now = new Date().toISOString();

    const record: any = {
      [this.primaryKey]: entity[this.primaryKey] || `id-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...entity
    };
    // 仅当表实际具备对应列时才自动填充（能力探测，防引用不存在列导致写入报错）
    if (cols.has('tenant_id') && record.tenant_id === undefined) record.tenant_id = tenantId || 'default';
    if (cols.has('created_by') && record.created_by === undefined) record.created_by = 'system';
    if (cols.has('created_at') && record.created_at === undefined) record.created_at = now;
    if (cols.has('updated_by') && record.updated_by === undefined) record.updated_by = 'system';
    if (cols.has('updated_at') && record.updated_at === undefined) record.updated_at = now;
    if (cols.has('deleted') && record.deleted === undefined) record.deleted = 0;
    if (cols.has('deleted_at') && record.deleted_at === undefined) record.deleted_at = null;

    await (db.insertInto(this.tableName as any) as any).values(record).execute();
    return record as T;
  }

  /**
   * 根据 ID 更新记录（自动更新 updated_at 与 updated_by）
   */
  async updateById(id: string | number, entity: Partial<T>): Promise<boolean> {
    const db = await this.getDb();
    const tenantId = getCurrentTenantId();
    const cols = await this.getColumns(db);

    const updates: any = { ...entity };
    if (cols.has('updated_by') && updates.updated_by === undefined) updates.updated_by = 'system';
    if (cols.has('updated_at') && updates.updated_at === undefined) updates.updated_at = new Date().toISOString();
    delete updates[this.primaryKey];

    let query = (db.updateTable(this.tableName as any) as any).set(updates).where(this.primaryKey, '=', id);

    if (cols.has('deleted')) {
      query = (query as any).where('deleted', '=', 0);
    }

    if (tenantId && cols.has('tenant_id')) {
      query = (query as any).where('tenant_id', '=', tenantId);
    }

    const res = await query.execute();
    return res.length > 0;
  }

  /**
   * 根据 ID 逻辑删除（表具备 deleted 列时置 deleted=1，兼容 deleted_at）
   */
  async deleteById(id: string | number): Promise<boolean> {
    const db = await this.getDb();
    const tenantId = getCurrentTenantId();
    const cols = await this.getColumns(db);
    const now = new Date().toISOString();

    if (!cols.has('deleted')) {
      // 无逻辑删除列的表降级为物理删除
      let delQuery = (db.deleteFrom(this.tableName as any) as any).where(this.primaryKey, '=', id);
      if (tenantId && cols.has('tenant_id')) {
        delQuery = (delQuery as any).where('tenant_id', '=', tenantId);
      }
      const delRes = await delQuery.execute();
      return delRes.length > 0;
    }

    const updates: any = { deleted: 1 };
    if (cols.has('deleted_at')) updates.deleted_at = now;
    if (cols.has('updated_at')) updates.updated_at = now;

    let query = (db.updateTable(this.tableName as any) as any)
      .set(updates)
      .where(this.primaryKey, '=', id);

    if (tenantId && cols.has('tenant_id')) {
      query = (query as any).where('tenant_id', '=', tenantId);
    }

    const res = await query.execute();
    return res.length > 0;
  }

}

/**
 * 通用 BaseService 业务底座
 */
export class BaseService<T extends Record<string, any>> {
  constructor(protected readonly mapper: BaseMapper<T>) {}

  async getById(id: string | number): Promise<T | null> {
    return this.mapper.selectById(id);
  }

  async list(wrapper?: QueryWrapper<T>): Promise<T[]> {
    return this.mapper.selectList(wrapper);
  }

  async page(pageNum: number, pageSize: number, wrapper?: QueryWrapper<T>) {
    return this.mapper.selectPage({ pageNum, pageSize }, wrapper);
  }

  async save(entity: Partial<T>): Promise<T> {
    return this.mapper.insert(entity);
  }

  async updateById(id: string | number, entity: Partial<T>): Promise<boolean> {
    return this.mapper.updateById(id, entity);
  }

  async removeById(id: string | number): Promise<boolean> {
    return this.mapper.deleteById(id);
  }
}
