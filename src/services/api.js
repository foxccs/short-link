/*
 * @Author: zi.yang
 * @Date: 2025-06-09 19:50:44
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-06-09 21:02:29
 * @Description: 
 * @FilePath: /short-link/src/services/api.js
 */
/**
 * API 服务模块
 * 用于处理与后端的所有 API 交互
 */

// 存储认证令牌
let authToken = localStorage.getItem('auth_token');

// 设置认证令牌
export function setAuthToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

// 获取认证令牌
export function getAuthToken() {
  return authToken;
}

// 检查是否已登录
export function isAuthenticated() {
  return !!authToken;
}

/**
 * 通用 API 请求函数
 * @param {string} url - API 端点
 * @param {Object} options - 请求选项
 * @returns {Promise} - 返回请求结果的 Promise
 */
export async function fetchApi(url, { method = 'GET', body, params } = {}) {
  try {
    const headers = {
      'Content-Type': 'application/json;charset=utf-8'
    };
    
    // 如果有认证令牌，添加到请求头
    if (authToken) {
      headers['Authorization'] = authToken;
    }
    
    const response = await fetch(url, {
      method,
      credentials: 'omit',
      headers,
      params,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (data.code === 200) {
      return data;
    } else {
      throw new Error(data.msg || '请求失败');
    }
  } catch (error) {
    throw error;
  }
}

/**
 * 添加 URL 生成短链接
 * @param {string} url - 要缩短的 URL
 * @param {Object} options - 短链接选项
 * @param {Date} options.expiresAt - 过期时间
 * @param {boolean} options.isPublic - 是否公开
 * @returns {Promise} - 返回包含短链接的 Promise
 */
export async function addUrl(url, options = {}) {
  return fetchApi('/api/addUrl', {
    method: 'POST',
    body: { 
      url,
      expiresAt: options.expiresAt,
      isPublic: options.isPublic
    }
  });
}

/**
 * 获取 URL 信息
 * @param {string} shortCode - 短链接代码
 * @returns {Promise} - 返回包含原始 URL 的 Promise
 */
export async function getUrl(shortCode) {
  return fetchApi(`/api/getUrl/${shortCode}`);
}

/**
 * 获取有效期选项
 * @returns {Promise} - 返回有效期选项列表
 */
export async function getExpirationOptions() {
  return fetchApi('/api/expiration-options');
}

/**
 * 用户注册
 * @param {string} username - 用户名
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @returns {Promise} - 返回注册结果
 */
export async function register(username, email, password) {
  const response = await fetchApi('/api/register', {
    method: 'POST',
    body: { username, email, password }
  });
  
  if (response.token) {
    setAuthToken(response.token);
  }
  
  return response;
}

/**
 * 用户登录
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @returns {Promise} - 返回登录结果
 */
export async function login(email, password) {
  const response = await fetchApi('/api/login', {
    method: 'POST',
    body: { email, password }
  });
  
  if (response.token) {
    setAuthToken(response.token);
  }
  
  return response;
}

/**
 * 退出登录
 * @returns {Promise} - 返回退出结果
 */
export async function logout() {
  const response = await fetchApi('/api/logout', {
    method: 'POST'
  });
  
  setAuthToken(null);
  
  return response;
}

/**
 * 获取当前用户信息
 * @returns {Promise} - 返回用户信息
 */
export async function getCurrentUser() {
  return fetchApi('/api/user');
}

/**
 * 获取用户的短链接列表
 * @returns {Promise} - 返回用户的短链接列表
 */
export async function getUserLinks() {
  return fetchApi('/api/user/links');
}

/**
 * 获取公开的短链接列表
 * @returns {Promise} - 返回公开的短链接列表
 */
export async function getPublicLinks() {
  return fetchApi('/api/public/links');
}

/**
 * 获取短链接访问统计
 * @param {number} linkId - 短链接ID
 * @returns {Promise} - 返回短链接访问统计
 */
export async function getLinkStats(linkId) {
  return fetchApi(`/api/links/${linkId}/stats`);
}

/**
 * 获取OAuth登录URL
 * @param {string} provider - 提供商（如 'github', 'wx'）
 * @returns {string} - 返回OAuth登录URL
 */
export function getOAuthLoginUrl(provider) {
  const redirectUri = encodeURIComponent(`${window.location.origin}/api/oauth/callback/${provider}`);
  
  switch (provider) {
    case 'github':
      return `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email`;
    case 'wx':
      return `https://open.weixin.qq.com/connect/qrconnect?appid=${process.env.WX_APP_ID}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login#wechat_redirect`;
    default:
      throw new Error('不支持的登录方式');
  }
}

