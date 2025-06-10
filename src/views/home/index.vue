<template>
  <div class="home-container">
    <div class="wrapper">
      <div class="header-actions">
        <a
          href="https://github.com/pangchun/short-link"
          class="github-link"
          target="_blank"
        >
          <GitHubIcon size="16" />
          GitHub
        </a>
        <div class="auth-actions">
          <a v-if="!isUserAuthenticated" class="login-link" @click="goToLogin">
            <LogIn size="16" />
            登录 / 注册
          </a>
          <a v-else class="dashboard-link" @click="goToDashboard">
            <LayoutDashboard size="16" />
            我的面板
          </a>
        </div>
      </div>

      <header>短链接生成器</header>
      <p class="subtitle">快速生成短链接，轻松分享和追踪</p>

      <UrlInput
        v-model="urlInput"
        placeholder="输入需要缩短的链接 (http://、https:// 或 #小程序://)"
        buttonText="生成短链接"
        @submit="generateShortLink"
      />

      <!-- 高级选项 -->
      <AdvancedOptions
        :expiration-options="expirationOptions"
        v-model:selected-expiration="selectedExpiration"
        v-model:custom-days="customDays"
        v-model:visibility="visibility"
        v-model:show-advanced-options="showAdvancedOptions"
        :is-authenticated="isUserAuthenticated"
        @expiration-change="handleExpirationChange"
        @login="goToLogin"
      />

      <ShortLinkCard
        :shortUrl="currentShortUrl"
        :visible="responseVisible"
        :isError="isError"
        :expiresAt="expiresAt"
      />

      <LoadingSpinner :active="isLoading">正在生成短链接...</LoadingSpinner>

      <!-- 操作按钮 -->
      <ActionButtons
        v-if="responseVisible && !isError"
        :short-url="currentShortUrl"
        @generate-qrcode="showQRCodeModal"
        @show-stats="showStats"
      />

      <!-- 二维码模态框 -->
      <QRCodeModal
        :visible="qrcodeModalVisible"
        :url="currentShortUrl"
        @close="closeQRCodeModal"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';

// 导入 Lucide 图标
import { LayoutDashboard, LogIn } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';
import { GitHubIcon } from 'vue3-simple-icons';

import ActionButtons from '@/components/ActionButtons.vue';
import AdvancedOptions from '@/components/AdvancedOptions.vue';
import LoadingSpinner from '@/components/base/LoadingSpinner.vue';
import UrlInput from '@/components/base/UrlInput.vue';
import QRCodeModal from '@/components/QRCodeModal.vue';
import ShortLinkCard from '@/components/ShortLinkCard.vue';
import {
  addUrl,
  getAuthToken,
  getExpirationOptions,
  isAuthenticated,
} from '@/services/api';
import { validateUrl } from '@/utils/validator.js';
import { Message } from '@arco-design/web-vue';

// 路由
const router = useRouter();
const route = useRoute();

// 响应式状态
const urlInput = ref('');
const currentShortUrl = ref('');
const isLoading = ref(false);
const responseVisible = ref(false);
const isError = ref(false);
const showAdvancedOptions = ref(false);
const expirationOptions = ref([]);
const selectedExpiration = ref(null);
const customDays = ref(7);
const visibility = ref('private'); // 默认私有
const expiresAt = ref(null);
const qrcodeModalVisible = ref(false);
const currentLinkId = ref(null);

// 计算属性
const isUserAuthenticated = computed(() => {
  return isAuthenticated();
});

// 生命周期钩子
onMounted(async () => {
  // 检查URL中是否有token参数（OAuth回调）
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token) {
    // 清除URL中的token参数
    window.history.replaceState({}, document.title, window.location.pathname);
    Message.success('登录成功');
  }

  // 获取有效期选项
  try {
    const response = await getExpirationOptions();
    expirationOptions.value = response.data;
    // 默认选择永久
    const permanentOption = expirationOptions.value.find(
      (option) => option.is_permanent
    );
    if (permanentOption) {
      selectedExpiration.value = permanentOption.id;
    }
  } catch (error) {
    console.error('获取有效期选项失败:', error);
  }
});

// 处理有效期选择变化
function handleExpirationChange(value) {
  // 根据选择的选项设置过期时间
  const option = expirationOptions.value.find((opt) => opt.id === value);
  if (option) {
    if (option.is_permanent) {
      expiresAt.value = null; // 永久有效
    } else if (option.days) {
      // 计算过期时间
      const date = new Date();
      date.setDate(date.getDate() + option.days);
      expiresAt.value = date.toISOString();
    }
  }
}

// 计算过期时间
function calculateExpiresAt() {
  if (
    selectedExpiration.value &&
    selectedExpiration.value.toString() === 'custom' &&
    customDays.value
  ) {
    // 自定义天数
    const date = new Date();
    date.setDate(date.getDate() + parseInt(customDays.value));
    return date.toISOString();
  } else if (
    selectedExpiration.value &&
    selectedExpiration.value.toString() !== 'custom'
  ) {
    // 预设选项
    return expiresAt.value;
  }
  return null; // 默认永久
}

// 生成短链接
async function generateShortLink() {
  const inputUrl = urlInput.value.trim();
  if (!inputUrl) {
    Message.error('请输入链接');
    return;
  }

  if (!validateUrl(inputUrl)) {
    Message.error(
      '请输入有效的链接，必须以 http://、https:// 或 #小程序:// 开头'
    );
    return;
  }

  // 显示加载状态
  isLoading.value = true;
  responseVisible.value = false;

  try {
    // 准备选项
    const options = {
      expiresAt: calculateExpiresAt(),
      isPublic: visibility.value === 'public',
    };

    // 使用 API 服务模块
    const data = await addUrl(inputUrl, options);

    // 隐藏加载状态
    isLoading.value = false;

    // 设置当前短链接
    currentShortUrl.value = window.location.origin + data.url;
    currentLinkId.value = data.data.id;
    expiresAt.value = data.data.expires_at;

    Message.success('短链接生成成功');
    urlInput.value = '';
    responseVisible.value = true;
    isError.value = false;
  } catch (error) {
    isLoading.value = false;
    Message.error(`发生错误: ${error.message || '未知错误'}`);
    currentShortUrl.value = '';
    responseVisible.value = false;
  }
}

// 显示二维码模态框
function showQRCodeModal() {
  if (!currentShortUrl.value) {
    Message.error('没有可生成二维码的短链接');
    return;
  }
  qrcodeModalVisible.value = true;
}

// 关闭二维码模态框
function closeQRCodeModal() {
  qrcodeModalVisible.value = false;
}

// 显示统计信息
function showStats() {
  if (!currentShortUrl.value) {
    Message.error('没有可查看统计的短链接');
    return;
  }

  if (!isAuthenticated()) {
    Message.info('请先登录后查看访问统计');
    return;
  }

  if (currentLinkId.value) {
    router.push(`/dashboard?linkId=${currentLinkId.value}`);
  } else {
    Message.info('无法获取链接ID，请在控制面板中查看');
  }
}

// 跳转到登录页面
function goToLogin() {
  router.push('/login');
}

// 跳转到控制面板
function goToDashboard() {
  router.push('/dashboard');
}
</script>

<style scoped>
.home-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f8f9fa;
}

.wrapper {
  background: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  padding: 40px;
  min-width: 580px;
  max-width: 680px;
  width: 100%;
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.wrapper:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

.wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #4776e6, #8e54e9);
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 30px;
}

.auth-actions {
  display: flex;
  gap: 10px;
}

.github-link,
.login-link,
.dashboard-link {
  text-decoration: none;
  font-size: 14px;
  color: #6c5ce7;
  border: 1px solid #6c5ce7;
  padding: 8px 16px;
  border-radius: 50px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  z-index: 10;
}

.login-link,
.dashboard-link {
  background-color: #6c5ce7;
  color: #fff;
  border: 1px solid #6c5ce7;
}

.github-link span,
.login-link span,
.dashboard-link span {
  display: flex;
  align-items: center;
}

.github-link:hover {
  background: #6c5ce7;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(108, 92, 231, 0.2);
}

.login-link:hover,
.dashboard-link:hover {
  background: #5a4ad1;
  border-color: #5a4ad1;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(108, 92, 231, 0.2);
}

.github-link :deep(svg),
.login-link svg,
.dashboard-link svg {
  width: 16px;
  height: 16px;
}

header {
  font-size: 36px;
  margin-bottom: 10px;
  color: #2d3436;
  font-weight: 700;
  position: relative;
  display: inline-block;
}

.subtitle {
  font-size: 16px;
  color: #636e72;
  margin-bottom: 30px;
}

header::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, #4776e6, #8e54e9);
  border-radius: 2px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.loading :deep(svg) {
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.tooltip {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(45, 52, 54, 0.9);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.radio-item:hover .tooltip {
  opacity: 1;
  visibility: visible;
}

@media screen and (max-width: 768px) {
  .wrapper {
    min-width: 0;
    width: 100%;
    padding: 30px 20px;
  }

  header {
    font-size: 28px;
  }

  .subtitle {
    font-size: 14px;
  }
}

@media screen and (max-width: 520px) {
  .home-container {
    padding: 10px;
  }

  .wrapper {
    padding: 20px 15px;
    border-radius: 12px;
  }

  .header-actions {
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .auth-actions {
    width: 100%;
  }

  .github-link,
  .login-link,
  .dashboard-link {
    width: 100%;
    justify-content: center;
  }

  header {
    font-size: 24px;
    margin-top: 10px;
  }

  .subtitle {
    font-size: 13px;
    margin-bottom: 20px;
  }
}
</style>
