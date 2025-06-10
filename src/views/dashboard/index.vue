<template>
  <a-layout class="dashboard-wrapper">
    <!-- 顶部导航 -->
    <a-layout-header class="dashboard-header">
      <div class="logo">短链接管理系统</div>
      <a-button class="user-button" type="outline" @click="logout">
        退出登录
      </a-button>
    </a-layout-header>

    <a-layout>
      <!-- 侧边栏 -->
      <a-layout-sider breakpoint="lg" collapsible>
        <a-menu default-selected-keys="['1']">
          <a-menu-item key="1" class="nav-item">
            <span class="nav-icon">
              <BarChart2 size="18" />
            </span>
            <span>数据统计</span>
          </a-menu-item>
          <a-menu-item key="2" class="nav-item">
            <span class="nav-icon">
              <Link size="18" />
            </span>
            <span>我的链接</span>
          </a-menu-item>
          <a-menu-item key="3" class="nav-item">
            <span class="nav-icon">
              <Settings size="18" />
            </span>
            <span>账号设置</span>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>

      <!-- 主内容区 -->
      <a-layout-content class="main-content">
        <!-- 页面标题 -->
        <div class="page-header">
          <a-typography-title :heading="4">仪表盘</a-typography-title>
          <a-typography-text type="secondary">
            最后更新: {{ lastUpdated || '加载中...' }}
          </a-typography-text>
        </div>

        <!-- 统计卡片 -->
        <a-row :gutter="16" class="stats-cards">
          <a-col :span="6" :xs="12" :md="6">
            <a-card class="stats-card">
              <div class="stats-card-header">总链接数</div>
              <div class="stats-card-value">{{ stats.totalLinks }}</div>
              <div
                class="stats-card-trend positive"
                v-if="stats.totalLinks > 0"
              >
                <BarChart2 size="16" /> 活跃中
              </div>
            </a-card>
          </a-col>
          <a-col :span="6" :xs="12" :md="6">
            <a-card class="stats-card">
              <div class="stats-card-header">总点击数</div>
              <div class="stats-card-value">{{ stats.totalClicks }}</div>
              <div
                class="stats-card-trend positive"
                v-if="stats.totalClicks > 0"
              >
                <BarChart2 size="16" /> 持续增长
              </div>
            </a-card>
          </a-col>
          <a-col :span="6" :xs="12" :md="6">
            <a-card class="stats-card">
              <div class="stats-card-header">本周新增</div>
              <div class="stats-card-value">{{ stats.weeklyNew }}</div>
              <div class="stats-card-trend positive" v-if="stats.weeklyNew > 0">
                <BarChart2 size="16" /> 本周新增
              </div>
            </a-card>
          </a-col>
          <a-col :span="6" :xs="12" :md="6">
            <a-card class="stats-card">
              <div class="stats-card-header">平均点击率</div>
              <div class="stats-card-value">{{ stats.avgClickRate }}</div>
              <div
                class="stats-card-trend positive"
                v-if="stats.avgClickRate > 0"
              >
                <BarChart2 size="16" /> 每链接平均
              </div>
            </a-card>
          </a-col>
        </a-row>

        <!-- 最近链接 -->
        <div class="links-table-container">
          <div class="section-header">
            <a-typography-title :heading="5">我的链接</a-typography-title>
            <a-button
              type="primary"
              class="refresh-btn"
              @click="loadUserLinks"
              :loading="loading"
            >
              刷新数据
            </a-button>
          </div>

          <a-table
            :data="userLinks"
            :bordered="false"
            :pagination="{ pageSize: 10 }"
            :loading="loading"
          >
            <template #columns>
              <a-table-column title="原始链接" data-index="originalUrl">
                <template #cell="{ record }">
                  <div class="original-link" :title="record.originalUrl">
                    {{ record.originalUrl }}
                  </div>
                </template>
              </a-table-column>
              <a-table-column title="短链接" data-index="shortUrl">
                <template #cell="{ record }">
                  <a-link :href="record.shortUrl" target="_blank">
                    {{ record.shortUrl }}
                  </a-link>
                </template>
              </a-table-column>
              <a-table-column title="创建时间" data-index="createdAt" />
              <a-table-column title="点击数" data-index="clicks" />
              <a-table-column title="状态" align="center">
                <template #cell="{ record }">
                  <a-tag
                    color="green"
                    v-if="
                      !record.expiresAt ||
                      new Date(record.expiresAt) > new Date()
                    "
                  >
                    有效
                  </a-tag>
                  <a-tag color="red" v-else> 已过期 </a-tag>
                  <a-tag color="blue" v-if="record.isPublic"> 公开 </a-tag>
                  <a-tag color="orange" v-else> 私有 </a-tag>
                </template>
              </a-table-column>
              <a-table-column title="操作" align="center">
                <template #cell="{ record }">
                  <a-space>
                    <a-button
                      type="text"
                      size="small"
                      class="action-icon copy"
                      @click="copyLink(record.shortUrl)"
                      title="复制链接"
                    >
                      <ClipboardCopy size="16" />
                    </a-button>
                    <a-button
                      type="text"
                      size="small"
                      class="action-icon qr"
                      @click="showQRCode(record.shortUrl)"
                      title="显示二维码"
                    >
                      <QrCode size="16" />
                    </a-button>
                    <a-button
                      type="text"
                      size="small"
                      class="action-icon stats"
                      @click="showLinkStats(record.id)"
                      title="查看统计"
                    >
                      <BarChart2 size="16" />
                    </a-button>
                  </a-space>
                </template>
              </a-table-column>
            </template>
            <template #empty>
              <div class="empty-state">
                <p>暂无链接数据</p>
                <a-button type="primary" @click="router.push('/')">
                  创建短链接
                </a-button>
              </div>
            </template>
          </a-table>
        </div>

        <!-- 底部版权信息 -->
        <div class="dashboard-footer">
          <a-typography-text type="secondary">
            © {{ new Date().getFullYear() }} 短链接管理系统 - 保留所有权利
          </a-typography-text>
        </div>
      </a-layout-content>
    </a-layout>

    <!-- 二维码模态框 -->
    <a-modal
      v-model:visible="showQRModal"
      title="短链接二维码"
      :footer="false"
      :mask-closable="true"
      width="400px"
    >
      <div class="qr-code-container">
        <img
          :src="currentQRCode"
          alt="二维码"
          class="qr-code-image"
          v-if="currentQRCode"
        />
        <div class="qr-code-url">{{ currentQRUrl }}</div>
        <a-button
          type="primary"
          @click="copyLink(currentQRUrl)"
          class="copy-qr-link-btn"
        >
          复制链接
        </a-button>
      </div>
    </a-modal>

    <!-- 统计数据模态框 -->
    <a-modal
      v-model:visible="showStatsModal"
      title="访问统计详情"
      :footer="false"
      :mask-closable="true"
      width="800px"
    >
      <a-spin :loading="statsLoading">
        <a-table
          :data="currentLinkStats"
          :bordered="false"
          :pagination="{ pageSize: 10 }"
          :loading="statsLoading"
        >
          <template #columns>
            <a-table-column title="访问时间" data-index="accessedAt" />
            <a-table-column title="IP地址" data-index="ipAddress" />
            <a-table-column title="来源" data-index="referrer" />
            <a-table-column title="浏览器" data-index="userAgent">
              <template #cell="{ record }">
                <div class="user-agent-info" :title="record.userAgent">
                  {{
                    record.userAgent.length > 50
                      ? record.userAgent.substring(0, 50) + '...'
                      : record.userAgent
                  }}
                </div>
              </template>
            </a-table-column>
          </template>
          <template #empty>
            <div class="empty-state">
              <p>暂无访问记录</p>
            </div>
          </template>
        </a-table>
      </a-spin>
    </a-modal>
  </a-layout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';

import {
  BarChart2,
  ClipboardCopy,
  Link,
  QrCode,
  Settings,
} from 'lucide-vue-next';
import QRCode from 'qrcode';
import { useRouter } from 'vue-router';

import * as api from '@/services/api';
import { Message } from '@arco-design/web-vue';

// 路由
const router = useRouter();

// 统计数据
const stats = ref({
  totalLinks: 0,
  totalClicks: 0,
  weeklyNew: 0,
  avgClickRate: 0,
});

// 用户链接
const userLinks = ref([]);

// 加载状态
const loading = ref(false);

// 最后更新时间
const lastUpdated = ref('');

// 二维码相关
const showQRModal = ref(false);
const currentQRCode = ref('');
const currentQRUrl = ref('');

// 统计相关
const showStatsModal = ref(false);
const currentLinkStats = ref([]);
const currentLinkId = ref(null);
const statsLoading = ref(false);

// 最近链接
const recentLinks = computed(() => userLinks.value.slice(0, 5));

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 加载用户链接
async function loadUserLinks() {
  loading.value = true;
  try {
    const response = await api.getUserLinks();
    if (response && response.data) {
      userLinks.value = response.data.map((link) => ({
        id: link.id,
        originalUrl: link.link,
        shortUrl: `${window.location.origin}/u/${link.short}`,
        createdAt: formatDate(link.created_at),
        clicks: link.access_count || 0,
        expiresAt: link.expires_at ? formatDate(link.expires_at) : null,
        isPublic: link.is_public,
      }));

      // 更新统计数据
      updateStats();
    }
    lastUpdated.value = formatDate(new Date());
  } catch (error) {
    console.error('获取链接失败:', error);
    Message.error('获取链接失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

// 更新统计数据
function updateStats() {
  if (userLinks.value.length > 0) {
    // 计算总点击数
    const totalClicks = userLinks.value.reduce(
      (sum, link) => sum + link.clicks,
      0
    );

    // 计算一周内新增的链接数
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyNew = userLinks.value.filter((link) => {
      const createdDate = new Date(link.createdAt);
      return createdDate >= oneWeekAgo;
    }).length;

    // 计算平均点击率
    const avgClickRate =
      userLinks.value.length > 0
        ? (totalClicks / userLinks.value.length).toFixed(1)
        : 0;

    stats.value = {
      totalLinks: userLinks.value.length,
      totalClicks,
      weeklyNew,
      avgClickRate,
    };
  }
}

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
async function showQRCode(url) {
  try {
    currentQRUrl.value = url;
    currentQRCode.value = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#6c5ce7',
        light: '#ffffff',
      },
    });
    showQRModal.value = true;
  } catch (error) {
    console.error('生成二维码失败:', error);
    Message.error('生成二维码失败');
  }
}

// 显示链接统计
async function showLinkStats(id) {
  currentLinkId.value = id;
  statsLoading.value = true;
  showStatsModal.value = true;

  try {
    const response = await api.getLinkStats(id);
    if (response && response.data) {
      currentLinkStats.value = response.data.map((stat) => ({
        id: stat.id,
        ipAddress: stat.ip_address,
        userAgent: stat.user_agent,
        referrer: stat.referrer || '直接访问',
        accessedAt: formatDate(stat.accessed_at),
      }));
    }
  } catch (error) {
    console.error('获取统计数据失败:', error);
    Message.error('获取统计数据失败，请稍后重试');
  } finally {
    statsLoading.value = false;
  }
}

// 退出登录
async function logout() {
  try {
    await api.logout();
    Message.success('退出登录成功');
    router.push('/login');
  } catch (error) {
    console.error('退出登录失败:', error);
    Message.error('退出登录失败，请稍后重试');
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadUserLinks();
});
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

:deep(.arco-tag) {
  border-radius: 4px;
  padding: 0 8px;
  font-size: 12px;
  line-height: 20px;
}

:deep(.arco-modal-header) {
  border-bottom: 1px solid #edf2f7;
  padding-bottom: 16px;
}

:deep(.arco-modal-title) {
  font-weight: 600;
  color: #2d3436;
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

.refresh-btn {
  background-color: #6c5ce7;
  border-color: #6c5ce7;
}

.refresh-btn:hover {
  background-color: #5b4dc7;
  border-color: #5b4dc7;
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

/* 二维码模态框样式 */
.qr-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
}

.qr-code-image {
  width: 300px;
  height: 300px;
  margin-bottom: 16px;
  border: 1px solid #edf2f7;
  border-radius: 8px;
  padding: 8px;
}

.qr-code-url {
  font-size: 14px;
  color: #636e72;
  margin-bottom: 16px;
  word-break: break-all;
  text-align: center;
}

.copy-qr-link-btn {
  background-color: #6c5ce7;
  border-color: #6c5ce7;
}

.copy-qr-link-btn:hover {
  background-color: #5b4dc7;
  border-color: #5b4dc7;
}

/* 统计数据模态框样式 */
.user-agent-info {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
}

.empty-state p {
  font-size: 16px;
  color: #636e72;
  margin-bottom: 16px;
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

  .qr-code-image {
    width: 250px;
    height: 250px;
  }
}

@media (max-width: 576px) {
  :deep(.arco-table-container) {
    overflow-x: auto;
  }

  .stats-cards .arco-col {
    margin-bottom: 16px;
  }

  .qr-code-image {
    width: 200px;
    height: 200px;
  }
}
</style>
