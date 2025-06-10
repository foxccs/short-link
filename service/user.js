/*
 * @Author: Claude AI
 * @Date: 2025-06-10 14:33:57
 * @Description: 用户服务模块
 * @FilePath: /short-link/service/user.js
 */
import crypto from 'node:crypto';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 密码加密
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

// 验证密码
function verifyPassword(password, hash, salt) {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return verifyHash === hash;
}

// 用户注册
export async function registerUser(username, email, password) {
  // 检查邮箱是否已存在
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser) {
    return { error: { message: '该邮箱已被注册' } };
  }

  // 加密密码
  const salt = crypto.randomBytes(16).toString('hex');
  const { hash } = hashPassword(password, salt);
  const passwordHash = `${salt}:${hash}`;

  // 创建用户
  const { data, error } = await supabase
    .from('users')
    .insert([{
      username,
      email,
      password_hash: passwordHash,
      last_login: new Date()
    }])
    .select()
    .single();

  if (error) {
    return { error };
  }

  return { data };
}

// 用户登录
export async function loginUser(email, password) {
  // 查找用户
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    return { error: { message: '用户不存在' } };
  }

  // 验证密码
  if (user.password_hash) {
    const [salt, storedHash] = user.password_hash.split(':');
    const isValid = verifyPassword(password, storedHash, salt);

    if (!isValid) {
      return { error: { message: '密码错误' } };
    }
  } else {
    return { error: { message: '账户未设置密码，请使用第三方登录' } };
  }

  // 更新最后登录时间
  await supabase
    .from('users')
    .update({ last_login: new Date() })
    .eq('id', user.id);

  return { data: user };
}

// 处理OAuth回调
export async function handleOAuthCallback(provider, code) {
  let providerUserId, userInfo;

  // 根据不同的提供商处理OAuth认证
  switch (provider) {
    case 'github':
      // 这里需要实现GitHub OAuth认证逻辑
      // 1. 使用code换取access_token
      // 2. 使用access_token获取用户信息
      // 示例代码，实际实现需要根据GitHub API进行调整
      try {
        // 获取GitHub用户信息的逻辑
        // providerUserId = githubUserId;
        // userInfo = { username: githubUsername, email: githubEmail };
        return { error: { message: 'GitHub登录功能正在开发中' } };
      } catch (error) {
        return { error: { message: '获取GitHub用户信息失败' } };
      }

    case 'wx':
      // 这里需要实现微信OAuth认证逻辑
      // 示例代码，实际实现需要根据微信API进行调整
      try {
        // 获取微信用户信息的逻辑
        // providerUserId = wxOpenId;
        // userInfo = { username: wxNickname, email: null };
        return { error: { message: '微信登录功能正在开发中' } };
      } catch (error) {
        return { error: { message: '获取微信用户信息失败' } };
      }

    default:
      return { error: { message: '不支持的登录方式' } };
  }

  // 查找是否已有关联的用户
  const { data: oauthProvider } = await supabase
    .from('user_oauth_providers')
    .select('user_id')
    .eq('provider', provider)
    .eq('provider_user_id', providerUserId)
    .single();

  let userId;

  if (oauthProvider) {
    // 已有关联的用户，获取用户信息
    userId = oauthProvider.user_id;
  } else {
    // 没有关联的用户，创建新用户
    const { data: newUser, error: createUserError } = await supabase
      .from('users')
      .insert([{
        username: userInfo.username || `${provider}_user_${Date.now()}`,
        email: userInfo.email,
        last_login: new Date()
      }])
      .select()
      .single();

    if (createUserError) {
      return { error: createUserError };
    }

    userId = newUser.id;

    // 创建OAuth提供商关联
    await supabase
      .from('user_oauth_providers')
      .insert([{
        user_id: userId,
        provider,
        provider_user_id: providerUserId
      }]);
  }

  // 获取用户信息
  const { data: user, error: getUserError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (getUserError) {
    return { error: getUserError };
  }

  // 更新最后登录时间
  await supabase
    .from('users')
    .update({ last_login: new Date() })
    .eq('id', userId);

  return { data: user };
}