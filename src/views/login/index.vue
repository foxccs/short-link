<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h1 class="login-title">{{ isRegisterMode ? '注册' : '登录' }}</h1>
      <p class="login-subtitle">
        {{
          isRegisterMode ? '创建账号以管理您的短链接' : '登录以管理您的短链接'
        }}
      </p>

      <form
        class="login-form"
        @submit.prevent="isRegisterMode ? handleRegister : handleLogin"
      >
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            type="text"
            id="username"
            v-model="username"
            placeholder="请输入用户名"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            type="password"
            id="password"
            v-model="password"
            placeholder="请输入密码"
            required
          />
        </div>

        <div v-if="isRegisterMode" class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            placeholder="请再次输入密码"
            required
          />
        </div>

        <div class="form-actions">
          <button type="submit" class="login-button" :disabled="isLoading">
            <LoadingSpinner v-if="isLoading" :active="true" />
            <span v-else>{{ isRegisterMode ? '注册' : '登录' }}</span>
          </button>
        </div>
      </form>

      <div class="oauth-options">
        <p class="oauth-divider">或者使用以下方式</p>
        <div class="oauth-buttons">
          <button
            @click="handleOAuthLogin('github')"
            class="oauth-button github"
          >
            <GitHubIcon size="16" />
            GitHub
          </button>
          <button
            @click="handleOAuthLogin('wechat')"
            class="oauth-button wechat"
          >
            <WeChatIcon size="16" />
            微信
          </button>
        </div>
      </div>

      <div class="login-footer">
        <p v-if="isRegisterMode">
          已有账号？ <a href="#" @click.prevent="toggleMode">登录</a>
        </p>
        <p v-else>
          还没有账号？ <a href="#" @click.prevent="toggleMode">注册</a>
        </p>
        <p><a href="#" @click.prevent="goToHome">返回首页</a></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

import { useRouter } from 'vue-router';
import { GitHubIcon, WeChatIcon } from 'vue3-simple-icons';

import LoadingSpinner from '@/components/base/LoadingSpinner.vue';
import { getOAuthLoginUrl, login, register } from '@/services/api.js';
import { Message } from '@arco-design/web-vue';

// 响应式状态
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const isRegisterMode = ref(false);

// 路由
const router = useRouter();

// 切换登录/注册模式
function toggleMode() {
  isRegisterMode.value = !isRegisterMode.value;
  // 清空表单
  username.value = '';
  password.value = '';
  confirmPassword.value = '';
}

// 处理登录
async function handleLogin() {
  if (!username.value || !password.value) {
    Message.error('请输入用户名和密码');
    return;
  }

  isLoading.value = true;

  try {
    // 调用登录API
    await login(username.value, password.value);

    Message.success('登录成功');
    isLoading.value = false;

    // 登录成功后重定向到统计面板
    router.push('/dashboard');
  } catch (error) {
    isLoading.value = false;
    Message.error(error.message || '登录失败，请稍后再试');
  }
}

// 处理注册
async function handleRegister() {
  if (!username.value || !password.value) {
    Message.error('请输入用户名和密码');
    return;
  }

  if (password.value !== confirmPassword.value) {
    Message.error('两次输入的密码不一致');
    return;
  }

  isLoading.value = true;

  try {
    // 调用注册API
    await register(username.value, password.value);

    Message.success('注册成功，请登录');
    isLoading.value = false;

    // 切换到登录模式
    isRegisterMode.value = false;
  } catch (error) {
    isLoading.value = false;
    Message.error(error.message || '注册失败，请稍后再试');
  }
}

// 处理OAuth登录
async function handleOAuthLogin(provider) {
  try {
    // 获取OAuth登录URL
    const response = await getOAuthLoginUrl(provider);

    // 重定向到OAuth提供商的授权页面
    window.location.href = response.url;
  } catch (error) {
    Message.error(`${provider}登录失败: ${error.message || '未知错误'}`);
  }
}

// 跳转到首页
function goToHome() {
  router.push('/');
}
</script>

<style scoped>
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  padding: 20px;
}

.login-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 450px;
  padding: 40px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #4776e6, #8e54e9);
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: #2d3436;
  margin-bottom: 8px;
}

.login-subtitle {
  color: #636e72;
  margin-bottom: 30px;
  font-size: 14px;
}

.login-form {
  text-align: left;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #2d3436;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background-color: #f9f9f9;
}

.form-group input:focus {
  outline: none;
  border-color: #6c5ce7;
  box-shadow: 0 0 0 4px rgba(108, 92, 231, 0.15);
  background-color: #fff;
}

.form-actions {
  margin-top: 30px;
}

.login-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(90deg, #4776e6, #8e54e9);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(108, 92, 231, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-button:not(:disabled):hover {
  background: linear-gradient(90deg, #3d68d8, #7c48d5);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(108, 92, 231, 0.3);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* OAuth 登录部分 */
.oauth-options {
  margin-top: 30px;
}

.oauth-divider {
  position: relative;
  text-align: center;
  margin: 20px 0;
  color: #636e72;
  font-size: 14px;
}

.oauth-divider::before,
.oauth-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 35%;
  height: 1px;
  background-color: #e0e0e0;
}

.oauth-divider::before {
  left: 0;
}

.oauth-divider::after {
  right: 0;
}

.oauth-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

.oauth-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  color: #fff;
  width: 120px;
}

.oauth-button svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.oauth-button.github {
  background-color: #24292e;
}

.oauth-button.github:hover {
  background-color: #1a1e22;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.oauth-button.wechat {
  background-color: #07c160;
}

.oauth-button.wechat:hover {
  background-color: #06ad56;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(7, 193, 96, 0.3);
}

.login-footer {
  margin-top: 30px;
  font-size: 14px;
  color: #636e72;
}

.login-footer a {
  color: #6c5ce7;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
}

.login-footer a:hover {
  text-decoration: underline;
  color: #4834d4;
}

.login-footer p {
  margin: 8px 0;
}
</style>
