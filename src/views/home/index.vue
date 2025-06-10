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
      <div class="advanced-options" :class="{ authenticated: isAuthenticated }">
        <div class="toggle" @click="toggleAdvancedOptions">
          <div class="toggle-content">
            <span class="toggle-icon">
              <Settings size="18" />
            </span>
            <span>高级选项</span>
          </div>
          <span class="arrow" :class="{ 'arrow-down': showAdvancedOptions }">
            <ChevronDown size="16" />
          </span>
        </div>

        <transition name="slide">
          <div class="options" v-if="showAdvancedOptions">
            <!-- 过期时间选项 -->
            <div class="option-group">
              <label style="display: flex">
                <span class="option-icon">
                  <Clock size="16" />
                </span>
                链接有效期
              </label>
              <div class="radio-group">
                <div
                  v-for="option in expirationOptions"
                  :key="option.id"
                  class="radio-item"
                  :class="{ active: selectedExpiration === option.id }"
                  @click="handleExpirationChange(option.id)"
                >
                  <div class="radio-circle"></div>
                  <div class="radio-text">
                    <span>{{ option.name }}</span>
                    <span v-if="option.is_permanent" class="badge">推荐</span>
                  </div>
                </div>
              </div>

              <!-- 自定义天数输入 -->
              <div v-if="selectedExpiration === 6" class="custom-days">
                <input
                  type="number"
                  v-model="customDays"
                  min="1"
                  max="365"
                  placeholder="天数"
                />
                <span>天</span>
              </div>
            </div>

            <!-- 链接可见性选项 (仅登录用户可见) -->
            <div v-if="isUserAuthenticated" class="option-group">
              <label>
                <span class="option-icon">
                  <Eye size="16" />
                </span>
                链接可见性
              </label>
              <div class="visibility-group">
                <div
                  class="radio-item"
                  :class="{ active: visibility === 'public' }"
                  @click="visibility = 'public'"
                  title="所有人都可以访问此链接"
                >
                  <div class="radio-circle"></div>
                  <div class="radio-text">
                    <span>公开</span>
                    <span class="badge">所有人可访问</span>
                  </div>
                </div>
                <div
                  class="radio-item"
                  :class="{ active: visibility === 'private' }"
                  @click="visibility = 'private'"
                  title="仅创建者可以访问此链接"
                >
                  <div class="radio-circle"></div>
                  <div class="radio-text">
                    <span>私有</span>
                    <span class="badge">仅创建者可访问</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="!isUserAuthenticated" class="login-prompt">
              <div class="login-prompt-content">
                <span class="login-prompt-icon">
                  <User size="16" />
                </span>
                <span>登录后可使用高级选项，包括自定义有效期和私有链接</span>
                <button class="login-prompt-button" @click="goToLogin">
                  立即登录
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <ShortLinkCard
        :shortUrl="currentShortUrl"
        :visible="responseVisible"
        :isError="isError"
        :expiresAt="expiresAt"
      />

      <LoadingSpinner :active="isLoading">正在生成短链接...</LoadingSpinner>

      <!-- 操作按钮 -->
      <div v-if="responseVisible && !isError" class="action-buttons">
        <button class="action-button copy" @click="copyToClipboard">
          <ClipboardCopy size="16" />
          复制链接
        </button>
        <button class="action-button qrcode" @click="showQRCodeModal">
          <QrCode size="16" />
          二维码
        </button>
        <button class="action-button stats" @click="showStats">
          <BarChart2 size="16" />
          统计
        </button>
      </div>

      <!-- 二维码模态框 -->
      <QRCodeModal
        :visible="qrcodeModalVisible"
        :url="currentShorturl"
        @close="closeQRCodeModal"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';

// 导入 Lucide 图标
import {
  BarChart2,
  ChevronDown,
  ClipboardCopy,
  Clock,
  Eye,
  LayoutDashboard,
  LogIn,
  QrCode,
  Settings,
  User,
} from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';
import { GitHubIcon } from 'vue3-simple-icons';

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
const copySuccess = ref(false);

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

// 切换高级选项显示
function toggleAdvancedOptions() {
  showAdvancedOptions.value = !showAdvancedOptions.value;
}

// 处理有效期选择变化
function handleExpirationChange(value) {
  selectedExpiration.value = value;

  if (value === 'custom') {
    // 自定义天数，不做特殊处理
    return;
  }

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

// 复制链接到剪贴板
async function copyToClipboard() {
  if (!currentShortUrl.value) {
    Message.error('没有可复制的短链接');
    return;
  }

  try {
    await navigator.clipboard.writeText(currentShortUrl.value);
    Message.success('链接已复制到剪贴板');
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch (err) {
    Message.error('复制失败，请手动复制');
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

.advanced-options {
  margin-top: 24px;
  text-align: left;
}

.toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background-color: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
  margin-bottom: 0;
}

.toggle:hover {
  background-color: #f1f3f5;
  border-color: #d0d0d0;
}

.toggle-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c5ce7;
}

.arrow {
  transition: transform 0.3s ease;
  color: #6c5ce7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-down {
  transform: rotate(180deg);
}

.options {
  margin-top: 16px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
  opacity: 1;
  margin-top: 16px;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
  border-width: 0;
}

.option-group {
  margin-bottom: 24px;
  position: relative;
}

.option-group:last-child {
  margin-bottom: 0;
}

.option-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #2d3436;
  font-size: 15px;
}

.option-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c5ce7;
}

.visibility-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.login-prompt {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #e0e0e0;
}

.login-prompt-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background-color: rgba(108, 92, 231, 0.08);
  border-radius: 10px;
  color: #6c5ce7;
  font-size: 14px;
}

.login-prompt-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-prompt-button {
  margin-left: auto;
  padding: 8px 16px;
  background-color: #6c5ce7;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-prompt-button:hover {
  background-color: #5a4ad1;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(108, 92, 231, 0.2);
}

.option-group {
  margin-bottom: 16px;
}

.option-group:last-child {
  margin-bottom: 0;
}

.option-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2d3436;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.radio-item {
  padding: 10px 16px;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}

.radio-item:hover {
  border-color: #6c5ce7;
  background-color: rgba(108, 92, 231, 0.05);
}

.radio-item.active {
  background-color: rgba(108, 92, 231, 0.1);
  border-color: #6c5ce7;
}

.radio-item.active .radio-circle {
  border-color: #6c5ce7;
}

.radio-item.active .radio-circle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background-color: #6c5ce7;
  border-radius: 50%;
}

.radio-circle {
  width: 18px;
  height: 18px;
  border: 2px solid #ccc;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.radio-text {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge {
  font-size: 12px;
  padding: 2px 8px;
  background-color: rgba(108, 92, 231, 0.1);
  color: #6c5ce7;
  border-radius: 12px;
  margin-left: 8px;
}

.custom-days {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-days input {
  width: 80px;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.custom-days input:focus {
  outline: none;
  border-color: #6c5ce7;
  box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1);
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

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-button.copy {
  background-color: #6c5ce7;
  color: #fff;
}

.action-button.qrcode {
  background-color: #00b894;
  color: #fff;
}

.action-button.stats {
  background-color: #0984e3;
  color: #fff;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.action-button:active {
  transform: translateY(0);
}

.action-button :deep(svg) {
  width: 16px;
  height: 16px;
}

.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.qrcode-image {
  border: 1px solid #e0e0e0;
  padding: 16px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.qrcode-url {
  font-size: 14px;
  color: #2d3436;
  word-break: break-all;
  text-align: center;
  padding: 8px 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  width: 100%;
}

.copy-qr-link-btn,
.open-link-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.copy-qr-link-btn {
  background-color: #6c5ce7;
  color: #fff;
}

.open-link-btn {
  background-color: #00b894;
  color: #fff;
  text-decoration: none;
}

.copy-qr-link-btn:hover,
.open-link-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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

  .radio-group {
    flex-direction: column;
    gap: 8px;
  }

  .radio-item {
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .action-button {
    width: 100%;
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

  .radio-group {
    flex-direction: column;
    width: 100%;
  }

  .radio-item {
    width: 100%;
  }
}
</style>
