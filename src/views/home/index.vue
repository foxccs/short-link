<template>
  <div class="home-container">
    <div class="wrapper">
      <a
        href="https://www.foxccs.cn"
        class="github-link"
        target="_blank"
        ><span v-html="githubIcon"></span> 狐狸导航
      </a>
      <header>短链接服务</header>

      <UrlInput
        v-model="urlInput"
        :icon="linkIcon"
        placeholder="输入需要缩短的链接 (http://、https:// 或 #小程序://)"
        buttonText="生成短链接"
        @submit="generateShortLink"
      />

      <ShortLinkCard
        :shortUrl="currentShortUrl"
        :visible="responseVisible"
        :isError="isError"
      />

      <LoadingSpinner :active="isLoading">正在生成短链接...</LoadingSpinner>

      <ActionButtons
        :shortUrl="currentShortUrl"
        @generate-qrcode="showQRCodeModal"
        @show-stats="showStats"
        @message="showMessage"
      />

      <QRCodeModal
        :visible="qrcodeModalVisible"
        :url="currentShortUrl"
        @close="closeQRCodeModal"
        @error="showMessage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

import githubIcon from '@/assets/images/github.svg?raw';
import linkIcon from '@/assets/images/link.svg?raw';
import ActionButtons from '@/components/ActionButtons.vue';
import LoadingSpinner from '@/components/base/LoadingSpinner.vue';
import UrlInput from '@/components/base/UrlInput.vue';
import QRCodeModal from '@/components/QRCodeModal.vue';
import ShortLinkCard from '@/components/ShortLinkCard.vue';
import { addUrl } from '@/services/api.js';
import { showMessage } from '@/utils/message.js';
import { validateUrl } from '@/utils/validator.js';

// 响应式状态
const urlInput = ref('');
const currentShortUrl = ref('');
const isLoading = ref(false);
const responseVisible = ref(false);
const isError = ref(false);
const qrcodeModalVisible = ref(false);

// 生成短链接
async function generateShortLink() {
  const inputUrl = urlInput.value.trim();
  if (!inputUrl) {
    showMessage('请输入链接', 'error');
    return;
  }

  if (!validateUrl(inputUrl)) {
    showMessage(
      '请输入有效的链接，必须以 http://、https:// 或 #小程序:// 开头',
      'error'
    );
    return;
  }

  // 显示加载状态
  isLoading.value = true;
  responseVisible.value = false;

  try {
    // 使用 API 服务模块
    const data = await addUrl(inputUrl);

    // 隐藏加载状态
    isLoading.value = false;

    // 设置当前短链接
    currentShortUrl.value = window.location.origin + data.url;
    showMessage('短链接生成成功', 'success');
    urlInput.value = '';
    responseVisible.value = true;
    isError.value = false;
  } catch (error) {
    isLoading.value = false;
    showMessage(`发生错误: ${error.message || '未知错误'}`, 'error');
    currentShortUrl.value = '';
    responseVisible.value = false;
  }
}

// 显示二维码模态框
function showQRCodeModal() {
  if (!currentShortUrl.value) {
    showMessage('没有可生成二维码的短链接', 'error');
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
    showMessage('没有可查看统计的短链接', 'error');
    return;
  }
  showMessage('访问统计功能即将上线', 'info');
}
</script>

<style scoped>
.home-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
.wrapper {
  background: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border-radius: 16px;
  padding: 40px;
  min-width: 580px;
  max-width: 680px;
  width: 100%;
  text-align: center;
  position: relative;
  overflow: hidden;
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

.github-link {
  position: absolute;
  top: 16px;
  right: 16px;
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
}

.github-link span {
  display: flex;
  align-items: center;
}

.github-link:hover {
  background: #6c5ce7;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(108, 92, 231, 0.2);
}

.github-link :deep(svg) {
  width: 16px;
  height: 16px;
}

header {
  font-size: 36px;
  margin-bottom: 30px;
  color: #2d3436;
  font-weight: 700;
  position: relative;
  display: inline-block;
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

@media screen and (max-width: 520px) {
  .wrapper {
    padding: 30px 20px;
    width: 100%;
    min-width: 0;
    border-radius: 12px;
  }

  header {
    font-size: 28px;
  }
}
</style>
