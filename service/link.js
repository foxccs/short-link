/*
 * @Author: zi.yang
 * @Date: 2024-12-11 19:47:42
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-06-10 21:54:09
 * @Description: 
 * @FilePath: /short-link/service/link.js
 */
import crypto from 'node:crypto';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

function generatorHash(url) {
  var md5 = crypto.createHash('md5');
  const hex = md5.update(url).digest('hex')
  return hex.slice(8, 24)
}

// 获取短链接信息
export async function getUrl(short) {
  return supabase.from('links').select('*').eq('short', short)
}

// 记录访问日志
export async function recordAccess(linkId, req) {
  const ipAddress = req.headers['x-forwarded-for'] || req.ip || '未知IP';
  const userAgent = req.headers['user-agent'] || '未知浏览器';
  const referrer = req.headers['referer'] || '';

  // 增加访问记录
  await supabase.from('link_access_logs').insert([
    {
      link_id: linkId,
      ip_address: ipAddress,
      user_agent: userAgent,
      referrer: referrer
    }
  ]);

  // 更新访问计数
  await supabase.rpc('increment_access_count', { link_id: linkId });
}

// 获取有效期选项
export async function getExpirationOptions() {
  return supabase.from('expiration_options').select('*').order('id', { ascending: true });
}

// 添加短链接
export async function addUrl(req) {
  const link = req.body.url;
  const short = generatorHash(link);
  const userId = req.body.userId || null;
  const expiresAt = req.body.expiresAt || null;
  const isPublic = req.body.isPublic || false;

  // 检查是否已存在
  const isExists = await getUrl(short);
  if (isExists.data.length) return { data: isExists.data[0] };

  // 创建新短链接
  return supabase.from('links').insert([{
    link,
    short,
    user_id: userId,
    expires_at: expiresAt,
    is_public: isPublic
  }]).select().single();
}

// 获取用户的短链接列表
export async function getUserLinks(userId) {
  return supabase
    .from('links')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

// 获取公开的短链接列表
export async function getPublicLinks() {
  return supabase
    .from('links')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });
}

// 获取短链接访问统计
export async function getLinkStats(linkId) {
  return supabase
    .from('link_access_logs')
    .select('*')
    .eq('link_id', linkId)
    .order('accessed_at', { ascending: false });
}