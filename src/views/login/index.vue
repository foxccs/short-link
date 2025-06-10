<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h1 class="login-title">登录</h1>
      <p class="login-subtitle">登录以管理您的短链接</p>

      <form class="login-form" @submit.prevent="handleLogin">
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

        <div class="form-actions">
          <button type="submit" class="login-button" :disabled="isLoading">
            <LoadingSpinner v-if="isLoading" :active="true" />
            <span v-else>登录</span>
          </button>
        </div>
      </form>

      <div class="login-footer">
        <p>还没有账号？ <a href="#" @click.prevent="goToRegister">注册</a></p>
        <p><a href="#" @click.prevent="goToHome">返回首页</a></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

import { useRouter } from 'vue-router';

import LoadingSpinner from '@/components/base/LoadingSpinner.vue';
import { Message } from '@arco-design/web-vue';

// 响应式状态
const username = ref('');
const password = ref('');
const isLoading = ref(false);

// 路由
const router = useRouter();

// 处理登录
async function handleLogin() {
  if (!username.value || !password.value) {
    Message.error('请输入用户名和密码');
    return;
  }

  isLoading.value = true;

  try {
    // 这里将来会实现实际的登录逻辑
    // const response = await login(username.value, password.value);

    // 模拟登录延迟
    await new Promise((resolve) => setTimeout(resolve, 1500));

    Message.info('登录功能即将上线');
    isLoading.value = false;

    // 登录成功后重定向到统计面板
    // router.push('/dashboard');
  } catch (error) {
    isLoading.value = false;
    Message.error(error.message || '登录失败，请稍后再试');
  }
}

// 跳转到注册页面
function goToRegister() {
  Message.info('注册功能即将上线');
  // 将来会实现注册页面跳转
  // router.push('/register');
}

// 跳转到首页
function goToHome() {
  // 将来会实现首页跳转
  // router.push('/');
  window.location.href = '/';
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
