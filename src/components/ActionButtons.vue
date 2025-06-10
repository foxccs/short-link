<template>
  <div class="action-buttons" v-if="shortUrl">
    <ActionButton @click="copyLink">
      <ClipboardCopy size="16" />
      {{ copyBtnText }}
    </ActionButton>

    <ActionButton
      :icon="shareIcon"
      buttonClass="share"
      :animation="shareAnimation"
      :success="shareSuccess"
      @click="shareLink"
    >
      <Share size="16" />
      <span class="share-btn-text">{{ shareBtnText }}</span>
    </ActionButton>

    <ActionButton buttonClass="qrcode" @click="emit('generate-qrcode')">
      <QrCode size="16" />
      生成二维码
    </ActionButton>

    <ActionButton :icon="statsIcon" @click="emit('show-stats')">
      <BarChart size="16" />
      访问统计
    </ActionButton>
  </div>
</template>

<script setup>
import { ref } from 'vue';

import { BarChart, ClipboardCopy, QrCode, Share } from 'lucide-vue-next';

import { Message } from '@arco-design/web-vue';

import ActionButton from './base/ActionButton.vue';

// 定义props和emits
const props = defineProps({
  shortUrl: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['generate-qrcode', 'show-stats']);

// 响应式状态
const copyBtnText = ref('复制链接');
const shareBtnText = ref('分享链接');
const shareAnimation = ref(false);
const shareSuccess = ref(false);

// 复制链接
async function copyLink() {
  if (!props.shortUrl) {
    Message.error('没有可复制的短链接');
    return;
  }

  try {
    await navigator.clipboard.writeText(props.shortUrl);
    Message.success('复制成功');
    copyBtnText.value = '已复制';
    setTimeout(() => {
      copyBtnText.value = '复制链接';
    }, 2000);
  } catch (error) {
    fallbackLegacyCopy(props.shortUrl);
  }
}

// 分享链接
async function shareLink() {
  if (!props.shortUrl) {
    Message.error('没有可分享的短链接');
    return;
  }

  // 添加点击动画效果
  shareAnimation.value = true;
  setTimeout(() => {
    shareAnimation.value = false;
  }, 500);

  // 获取设备类型信息
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  // 准备分享内容
  const shareTitle = '短链接分享';
  const shareText = isMobile
    ? '我生成了一个短链接，点击访问：'
    : '我通过短链接服务生成了一个链接，点击访问：';

  // 检测是否支持Web Share API
  if (navigator.share) {
    try {
      shareBtnText.value = '分享中...';
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: props.shortUrl,
      });

      // 分享成功
      shareSuccess.value = true;
      Message.success('分享成功');
      shareBtnText.value = '已分享';

      // 恢复原始按钮状态
      setTimeout(() => {
        shareBtnText.value = '分享链接';
        shareSuccess.value = false;
      }, 2000);
    } catch (error) {
      console.error('分享失败:', error);
      if (error.name === 'AbortError') {
        Message.info('分享已取消');
      } else {
        // 根据设备类型提供不同的提示
        if (isMobile) {
          if (isIOS) {
            Message.info('分享失败，请尝试使用Safari浏览器');
          } else if (isAndroid) {
            Message.info('分享失败，请尝试使用Chrome浏览器');
          } else {
            Message.info('分享失败，已复制链接到剪贴板');
          }
        } else {
          Message.info('分享失败，已复制链接到剪贴板');
        }
        // 如果分享API失败，回退到剪贴板复制
        fallbackToCopy(props.shortUrl);
      }
      // 恢复原始按钮状态
      shareBtnText.value = '分享链接';
    }
  } else {
    // 如果浏览器不支持原生分享API
    if (isMobile) {
      Message.info('您的浏览器不支持直接分享，已复制链接');
    } else {
      Message.info('PC端不支持直接分享，已复制链接到剪贴板');
    }
    // 复制到剪贴板
    fallbackToCopy(props.shortUrl);
  }
}

// 复制到剪贴板的回退方案
async function fallbackToCopy(url) {
  try {
    // 尝试使用现代Clipboard API
    await navigator.clipboard.writeText(url);
    Message.success('链接已复制到剪贴板，请手动分享');
  } catch (err) {
    console.error('Clipboard API失败，尝试备用方法:', err);
    // 如果Clipboard API失败，使用传统方法
    fallbackLegacyCopy(url);
  }
}

// 使用传统方法复制到剪贴板
function fallbackLegacyCopy(url) {
  try {
    // 创建一个临时输入框来复制
    const tempInput = document.createElement('input');
    tempInput.value = url;
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.focus();
    tempInput.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(tempInput);

    if (successful) {
      Message.success('链接已复制，请手动分享');
    } else {
      Message.error('复制失败，请手动复制链接');
    }
  } catch (err) {
    console.error('传统复制方法失败:', err);
    Message.error('无法复制链接，请手动复制');
  }
}
</script>

<style scoped>
.action-buttons {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
