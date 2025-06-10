<template>
  <div class="dashboard-wrapper">
    <header class="dashboard-header">
      <div class="logo">短链接统计面板</div>
      <div class="user-actions">
        <button class="user-button" @click="logout">退出登录</button>
      </div>
    </header>

    <div class="dashboard-content">
      <div class="sidebar">
        <nav class="sidebar-nav">
          <a href="#" class="nav-item active">
            <span class="nav-icon" v-html="statsIcon"></span>
            链接统计
          </a>
          <a href="#" class="nav-item">
            <span class="nav-icon" v-html="linkIcon"></span>
            我的链接
          </a>
          <a href="#" class="nav-item">
            <span class="nav-icon" v-html="settingsIcon"></span>
            账户设置
          </a>
        </nav>
      </div>

      <main class="main-content">
        <div class="page-header">
          <h1>链接统计</h1>
          <p>查看您的短链接使用情况</p>
        </div>

        <div class="stats-cards">
          <div class="stats-card">
            <div class="stats-card-header">总链接数</div>
            <div class="stats-card-value">{{ stats.totalLinks }}</div>
            <div class="stats-card-trend positive">↑ 5.2%</div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">总点击数</div>
            <div class="stats-card-value">{{ stats.totalClicks }}</div>
            <div class="stats-card-trend positive">↑ 12.7%</div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">本周新增</div>
            <div class="stats-card-value">{{ stats.weeklyNew }}</div>
            <div class="stats-card-trend negative">↓ 2.3%</div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">平均点击率</div>
            <div class="stats-card-value">{{ stats.avgClickRate }}%</div>
            <div class="stats-card-trend positive">↑ 3.8%</div>
          </div>
        </div>

        <div class="recent-links">
          <div class="section-header">
            <h2>最近链接</h2>
            <button class="view-all-btn">查看全部</button>
          </div>

          <div class="links-table-container">
            <table class="links-table">
              <thead>
                <tr>
                  <th>原始链接</th>
                  <th>短链接</th>
                  <th>创建时间</th>
                  <th>点击次数</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(link, index) in recentLinks" :key="index">
                  <td class="original-link" :title="link.originalUrl">
                    {{ link.originalUrl }}
                  </td>
                  <td>
                    <a :href="link.shortUrl" target="_blank">{{
                      link.shortUrl
                    }}</a>
                  </td>
                  <td>{{ link.createdAt }}</td>
                  <td>{{ link.clicks }}</td>
                  <td>
                    <div class="link-actions">
                      <button
                        class="action-icon copy"
                        title="复制链接"
                        @click="copyLink(link.shortUrl)"
                      >
                        <span v-html="copyIcon"></span>
                      </button>
                      <button
                        class="action-icon qr"
                        title="查看二维码"
                        @click="showQRCode(link.shortUrl)"
                      >
                        <span v-html="qrcodeIcon"></span>
                      </button>
                      <button
                        class="action-icon stats"
                        title="详细统计"
                        @click="showLinkStats(link.id)"
                      >
                        <span v-html="chartIcon"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="dashboard-footer">
          <p>统计数据更新于: {{ lastUpdated }}</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

import { useRouter } from 'vue-router';

import copyIcon from '@/assets/images/copy.svg?raw';
import linkIcon from '@/assets/images/link.svg?raw';
import qrcodeIcon from '@/assets/images/qrcode.svg?raw';
import statsIcon from '@/assets/images/stats.svg?raw';

// 路由
const router = useRouter();

// 图标
const settingsIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`;
const chartIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.5,18.49l6-6.01l4,4L22,6.92l-1.41-1.41l-7.09,7.97l-4-4L2,16.99L3.5,18.49z"/></svg>`;

// 响应式状态
const stats = ref({
  totalLinks: 42,
  totalClicks: 1284,
  weeklyNew: 8,
  avgClickRate: 32.5,
});

const recentLinks = ref([
  {
    id: 1,
    originalUrl:
      'https://example.com/very/long/path/to/some/page/with/lots/of/parameters?param1=value1&param2=value2',
    shortUrl: 'https://s-link.com/abc123',
    createdAt: '2023-06-15 14:32',
    clicks: 245,
  },
  {
    id: 2,
    originalUrl:
      'https://another-example.org/blog/article/how-to-create-short-links',
    shortUrl: 'https://s-link.com/def456',
    createdAt: '2023-06-14 09:17',
    clicks: 189,
  },
  {
    id: 3,
    originalUrl: 'https://docs.example.com/api/reference/v2',
    shortUrl: 'https://s-link.com/ghi789',
    createdAt: '2023-06-12 16:45',
    clicks: 127,
  },
  {
    id: 4,
    originalUrl:
      'https://shop.example.com/products/category/electronics?sort=price-asc',
    shortUrl: 'https://s-link.com/jkl012',
    createdAt: '2023-06-10 11:23',
    clicks: 98,
  },
  {
    id: 5,
    originalUrl:
      'https://maps.example.com/directions?origin=New+York&destination=Boston',
    shortUrl: 'https://s-link.com/mno345',
    createdAt: '2023-06-08 13:51',
    clicks: 76,
  },
]);

const lastUpdated = ref('2023-06-15 18:30:42');

// 复制链接
async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    Message.success('链接已复制到剪贴板');
  } catch (error) {
    console.error('复制失败:', error);
    Message.error('复制失败，请手动复制');
  }
}

// 显示二维码
function showQRCode(url) {
  Message.info('二维码功能即将上线');
}

// 显示链接统计
function showLinkStats(id) {
  Message.info('详细统计功能即将上线');
}

// 退出登录
function logout() {
  Message.info('退出登录功能即将上线');
  // 将来会实现退出登录逻辑
  // router.push('/login');
  setTimeout(() => {
    window.location.href = '/';
  }, 1500);
}
</script>

<style scoped>
.dashboard-wrapper {
  min-height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: #6c5ce7;
}

.user-button {
  background-color: transparent;
  border: 1px solid #6c5ce7;
  color: #6c5ce7;
  padding: 8px 16px;
  border-radius: 50px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-button:hover {
  background-color: #6c5ce7;
  color: #fff;
}

.dashboard-content {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 240px;
  background-color: #fff;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  padding: 24px 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
}

.nav-item {
  padding: 12px 24px;
  color: #636e72;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background-color: #f8f9fa;
  color: #6c5ce7;
}

.nav-item.active {
  background-color: #f0f1fe;
  color: #6c5ce7;
  border-left-color: #6c5ce7;
  font-weight: 600;
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #2d3436;
  margin-bottom: 8px;
}

.page-header p {
  color: #636e72;
  font-size: 14px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stats-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stats-card-header {
  font-size: 14px;
  color: #636e72;
  margin-bottom: 8px;
}

.stats-card-value {
  font-size: 28px;
  font-weight: 700;
  color: #2d3436;
  margin-bottom: 8px;
}

.stats-card-trend {
  font-size: 12px;
  font-weight: 600;
}

.stats-card-trend.positive {
  color: #00b894;
}

.stats-card-trend.negative {
  color: #e17055;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: #2d3436;
}

.view-all-btn {
  background-color: transparent;
  border: 1px solid #6c5ce7;
  color: #6c5ce7;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-all-btn:hover {
  background-color: #6c5ce7;
  color: #fff;
}

.links-table-container {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 32px;
}

.links-table {
  width: 100%;
  border-collapse: collapse;
}

.links-table th {
  background-color: #f8f9fa;
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #2d3436;
  border-bottom: 1px solid #e0e0e0;
}

.links-table td {
  padding: 12px 16px;
  font-size: 14px;
  color: #636e72;
  border-bottom: 1px solid #f0f0f0;
}

.links-table tr:last-child td {
  border-bottom: none;
}

.links-table tr:hover {
  background-color: #f8f9fa;
}

.original-link {
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.links-table a {
  color: #6c5ce7;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
}

.links-table a:hover {
  text-decoration: underline;
  color: #4834d4;
}

.link-actions {
  display: flex;
  gap: 8px;
}

.action-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #f0f0f0;
}

.action-icon:hover {
  transform: translateY(-2px);
}

.action-icon span {
  width: 16px;
  height: 16px;
  display: flex;
}

.action-icon.copy {
  color: #6c5ce7;
}

.action-icon.copy:hover {
  background-color: #6c5ce7;
  color: #fff;
}

.action-icon.qr {
  color: #0984e3;
}

.action-icon.qr:hover {
  background-color: #0984e3;
  color: #fff;
}

.action-icon.stats {
  color: #00b894;
}

.action-icon.stats:hover {
  background-color: #00b894;
  color: #fff;
}

.dashboard-footer {
  text-align: center;
  font-size: 12px;
  color: #b2bec3;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }

  .nav-item {
    padding: 12px;
    justify-content: center;
  }

  .nav-item span:not(.nav-icon) {
    display: none;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .original-link {
    max-width: 150px;
  }
}

@media (max-width: 576px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .links-table-container {
    overflow-x: auto;
  }

  .links-table {
    min-width: 600px;
  }
}
</style>
