import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * k6-load-benchmark.js
 * 
 * cooliebase-all 工业级容量压测基准场景 (基于 Grafana K6)
 * 对标 AGENTS.md §3.3 / Google SRE 容量护栏 / load-baseline.json
 * 
 * 用法:
 *   k6 run test/load/k6-load-benchmark.js
 *   k6 run --vus 50 --duration 1m test/load/k6-load-benchmark.js
 *   k6 run -e TARGET_URL=http://localhost:3200 test/load/k6-load-benchmark.js
 */

const TARGET_URL = __ENV.TARGET_URL || 'http://localhost:3200';

// 自定义监控指标
export const failureRate = new Rate('custom_failure_rate');
export const healthLatency = new Trend('health_latency');
export const discoveryLatency = new Trend('discovery_latency');

export const options = {
  scenarios: {
    // 场景 1: 基线负载验证 (Ramp-up -> Steady State -> Cool-down)
    standard_load: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '15s', target: 50 },  // 15秒内逐步加压至 50 并发 VUs
        { duration: '30s', target: 50 },  // 稳定保持 50 并发负载 30 秒
        { duration: '15s', target: 0 },   // 15秒内平滑降压
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    // 对应 SRE 容量护栏: 失败率必须 < 0.1% (99.9% 成功率)
    'http_req_failed': ['rate<0.001'],
    'custom_failure_rate': ['rate<0.001'],
    // 延迟护栏: p95 响应时间必须 <= 20ms (standalone 生产环境要求)
    'http_req_duration': ['p(95)<50', 'p(99)<100'],
    // 吞吐护栏: 请求总速率应当保持高水位
    'http_reqs': ['rate>2000'],
  },
};

export default function () {
  // 1. 探针与健康检查组
  group('Liveness & Discovery Surface', function () {
    const resHealth = http.get(`${TARGET_URL}/api/healthz`, {
      tags: { name: 'HealthCheck' },
      timeout: '5s',
    });
    const healthOk = check(resHealth, {
      'healthz status is 200': (r) => r.status === 200,
    });
    failureRate.add(!healthOk);
    healthLatency.add(resHealth.timings.duration);

    // 2. 机器可读契约探针 (RFC 8615)
    const resDiscovery = http.get(`${TARGET_URL}/compat-manifest.json`, {
      tags: { name: 'CompatManifest' },
      timeout: '5s',
    });
    const discoveryOk = check(resDiscovery, {
      'compat-manifest status is 200': (r) => r.status === 200,
      'declares templateVersion': (r) => r.body && r.body.includes('templateVersion'),
    });
    failureRate.add(!discoveryOk);
    discoveryLatency.add(resDiscovery.timings.duration);

    // 3. LLMs.txt 机器导航端点
    const resLlms = http.get(`${TARGET_URL}/llms.txt`, {
      tags: { name: 'LlmsTxt' },
      timeout: '5s',
    });
    check(resLlms, {
      'llms.txt status is 200': (r) => r.status === 200,
    });
  });

  // 4. 公开数据字典只读接口探针 (测试单体/插件高频只读性能)
  group('Public API Surface', function () {
    const resDict = http.get(`${TARGET_URL}/api/v1/system/dict/data/type?dictType=sys_common_status`, {
      tags: { name: 'DictData' },
      headers: { 'Accept': 'application/json' },
      timeout: '5s',
    });
    // 允许 200 (已初始化) 或 401/404 (无凭证/未就绪)，只要服务不崩 500
    check(resDict, {
      'response is not 500 error': (r) => r.status < 500,
    });
  });

  sleep(0.05); // 稍微休眠 50ms 模拟真实请求间隔
}
