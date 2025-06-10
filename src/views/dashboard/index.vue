<template>
  <a-layout class="dashboard-wrapper">
    <a-layout-header class="dashboard-header">
      <div class="logo">短链接统计面板</div>
      <div class="user-actions">
        <a-button
          type="outline"
          shape="round"
          @click="logout"
          class="user-button"
          >退出登录</a-button
        >
      </div>
    </a-layout-header>

    <a-layout class="dashboard-content">
      <a-layout-sider class="sidebar" :width="240">
        <a-menu
          mode="vertical"
          :default-selected-keys="['stats']"
          class="sidebar-nav"
        >
          <a-menu-item key="stats" class="nav-item">
            <template #icon
              ><span class="nav-icon" v-html="statsIcon"></span
            ></template>
            链接统计
          </a-menu-item>
          <a-menu-item key="links" class="nav-item">
            <template #icon
              ><span class="nav-icon" v-html="linkIcon"></span
            ></template>
            我的链接
          </a-menu-item>
          <a-menu-item key="settings" class="nav-item">
            <template #icon
              ><span class="nav-icon" v-html="settingsIcon"></span
            ></template>
            账户设置
          </a-menu-item>
        </a-menu>
      </a-layout-sider>

      <a-layout-content class="main-content">
        <div class="page-header">
          <a-typography-title :heading="4">链接统计</a-typography-title>
          <a-typography-text type="secondary"
            >查看您的短链接使用情况</a-typography-text
          >
        </div>

        <a-row :gutter="20" class="stats-cards">
          <a-col :xs="24" :sm="12" :md="6">
            <a-card class="stats-card">
              <div class="stats-card-header">总链接数</div>
              <div class="stats-card-value">{{ stats.totalLinks }}</div>
              <div class="stats-card-trend positive">↑ 5.2%</div>
            </a-card>
          </a-col>

          <a-col :xs="24" :sm="12" :md="6">
            <a-card class="stats-card">
              <div class="stats-card-header">总点击数</div>
              <div class="stats-card-value">{{ stats.totalClicks }}</div>
              <div class="stats-card-trend positive">↑ 12.7%</div>
            </a-card>
          </a-col>

          <a-col :xs="24" :sm="12" :md="6">
            <a-card class="stats-card">
              <div class="stats-card-header">本周新增</div>
              <div class="stats-card-value">{{ stats.weeklyNew }}</div>
              <div class="stats-card-trend negative">↓ 2.3%</div>
            </a-card>
          </a-col>

          <a-col :xs="24" :sm="12" :md="6">
            <a-card class="stats-card">
              <div class="stats-card-header">平均点击率</div>
              <div class="stats-card-value">{{ stats.avgClickRate }}%</div>
              <div class="stats-card-trend positive">↑ 3.8%</div>
            </a-card>
          </a-col>
        </a-row>

        <div class="recent-links">
          <div class="section-header">
            <a-typography-title :heading="5">最近链接</a-typography-title>
            <a-button type="text" class="view-all-btn">查看全部</a-button>
          </div>

          <a-card class="links-table-container">
            <a-table :data="recentLinks" :pagination="false" :bordered="false">
              <template #columns>
                <a-table-column title="原始链接" data-index="originalUrl">
                  <template #cell="{ record }">
                    <a-tooltip :content="record.originalUrl">
                      <span class="original-link">{{
                        record.originalUrl
                      }}</span>
                    </a-tooltip>
                  </template>
                </a-table-column>
                <a-table-column title="短链接" data-index="shortUrl">
                  <template #cell="{ record }">
                    <a :href="record.shortUrl" target="_blank">{{
                      record.shortUrl
                    }}</a>
                  </template>
                </a-table-column>
                <a-table-column title="创建时间" data-index="createdAt" />
                <a-table-column title="点击次数" data-index="clicks" />
                <a-table-column title="操作">
                  <template #cell="{ record }">
                    <a-space>
                      <a-button
                        type="text"
                        size="small"
                        class="action-icon copy"
                        @click="copyLink(record.shortUrl)"
                      >
                        <template #icon
                          ><span v-html="copyIcon"></span
                        ></template>
                      </a-button>
                      <a-button
                        type="text"
                        size="small"
                        class="action-icon qr"
                        @click="showQRCode(record.shortUrl)"
                      >
                        <template #icon
                          ><span v-html="qrcodeIcon"></span
                        ></template>
                      </a-button>
                      <a-button
                        type="text"
                        size="small"
                        class="action-icon stats"
                        @click="showLinkStats(record.id)"
                      >
                        <template #icon
                          ><span v-html="chartIcon"></span
                        ></template>
                      </a-button>
                    </a-space>
                  </template>
                </a-table-column>
              </template>
            </a-table>
          </a-card>
        </div>

        <div class="dashboard-footer">
          <a-typography-text type="secondary"
            >统计数据更新于: {{ lastUpdated }}</a-typography-text
          >
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref } from 'vue';

import { useRouter } from 'vue-router';

import chartIcon from '@/assets/images/chart.svg?raw';
import copyIcon from '@/assets/images/copy.svg?raw';
import linkIcon from '@/assets/images/link.svg?raw';
import qrcodeIcon from '@/assets/images/qrcode.svg?raw';
import settingsIcon from '@/assets/images/settings.svg?raw';
import statsIcon from '@/assets/images/stats.svg?raw';
import { Message } from '@arco-design/web-vue';

// 路由
const router = useRouter();

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
/* 自定义 Arco Design 组件样式，保持原有颜色和风格 */
:deep(.arco-layout) {
  background-color: #f8f9fa;
}

:deep(.arco-layout-header) {
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 16px 24px;
  height: auto;
  line-height: normal;
}

:deep(.arco-layout-sider) {
  background-color: #fff;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
}

:deep(.arco-menu) {
  background-color: transparent;
}

:deep(.arco-menu-inner) {
  padding: 24px 0;
}

:deep(.arco-menu-item) {
  height: auto;
  line-height: normal;
  padding: 12px 24px;
  margin: 0;
  border-radius: 0;
  border-left: 3px solid transparent;
}

:deep(.arco-menu-item:hover) {
  background-color: #f8f9fa;
  color: #6c5ce7;
}

:deep(.arco-menu-selected) {
  background-color: #f0f1fe !important;
  color: #6c5ce7 !important;
  border-left-color: #6c5ce7 !important;
  font-weight: 600;
}

:deep(.arco-menu-item .arco-icon) {
  margin-right: 12px;
}

:deep(.arco-btn-outline) {
  border-color: #6c5ce7;
  color: #6c5ce7;
}

:deep(.arco-btn-outline:hover) {
  background-color: #6c5ce7;
  color: #fff;
  border-color: #6c5ce7;
}

:deep(.arco-btn-text) {
  color: #6c5ce7;
}

:deep(.arco-btn-text:hover) {
  background-color: rgba(108, 92, 231, 0.1);
}

:deep(.arco-card) {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: none;
  transition: all 0.3s ease;
}

:deep(.arco-card:hover) {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

:deep(.arco-table-th) {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #2d3436;
}

:deep(.arco-table-td) {
  color: #636e72;
}

:deep(.arco-table-tr:hover) {
  background-color: #f8f9fa;
}

:deep(.arco-typography-title) {
  color: #2d3436;
}

:deep(.arco-typography-secondary) {
  color: #636e72;
}

.dashboard-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: #6c5ce7;
}

.user-button {
  padding: 8px 16px;
  font-size: 14px;
}

.dashboard-content {
  flex: 1;
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-content {
  padding: 24px;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 24px;
}

.stats-cards {
  margin-bottom: 32px;
}

.stats-card {
  padding: 20px;
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

.view-all-btn {
  font-size: 12px;
}

.links-table-container {
  margin-bottom: 32px;
}

.original-link {
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

.action-icon {
  transition: all 0.2s ease;
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

.action-icon.qr {
  color: #0984e3;
}

.action-icon.stats {
  color: #00b894;
}

.dashboard-footer {
  text-align: center;
  margin-top: 16px;
}

@media (max-width: 768px) {
  :deep(.arco-layout-sider) {
    width: 60px !important;
    min-width: 60px !important;
    max-width: 60px !important;
  }

  :deep(.arco-menu-item) {
    padding: 12px;
    justify-content: center;
  }

  .nav-item span:not(.nav-icon) {
    display: none;
  }

  .original-link {
    max-width: 150px;
  }
}

@media (max-width: 576px) {
  :deep(.arco-table-container) {
    overflow-x: auto;
  }
}
</style>
