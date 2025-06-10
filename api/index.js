/*
 * @Author: zi.yang
 * @Date: 2024-12-13 17:38:41
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-06-10 00:12:49
 * @Description: 
 * @FilePath: /short-link/api/index.js
 */
import Fastify from 'fastify';
import crypto from 'node:crypto';

import * as linkService from '../service/link.js';
import * as userService from '../service/user.js';

const app = Fastify({
  logger: true,
})

// 简单的会话管理
const sessions = {};

// 生成会话ID
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

// 验证会话中间件
const authenticate = async (req, reply) => {
  const sessionId = req.headers.authorization;
  if (!sessionId || !sessions[sessionId]) {
    reply.status(401).send({ code: 401, msg: '未登录或会话已过期' });
    return false;
  }
  req.user = sessions[sessionId];
  return true;
};

// 获取有效期选项
app.get('/api/expiration-options', async (req, reply) => {
  const result = await linkService.getExpirationOptions();
  if (result.error) {
    return reply.status(200).send({
      code: 500,
      msg: result.error.message || '获取有效期选项失败'
    });
  }
  return reply.status(200).send({
    code: 200,
    msg: 'success',
    data: result.data
  });
});

// 添加短链接
app.post('/api/addUrl', async (req, reply) => {
  const url = req.body?.url;
  if (!url) {
    return reply.status(200).send({
      code: 400,
      msg: 'URL 是必填参数'
    });
  }

  // 验证URL格式
  const urlPattern = /^(https?:\/\/|#小程序:\/\/).+/;
  if (!urlPattern.test(url)) {
    return reply.status(200).send({
      code: 400,
      msg: 'URL 格式不正确，必须以 http://、https:// 或 #小程序:// 开头'
    });
  }

  // 如果用户已登录，添加用户ID
  if (req.headers.authorization && sessions[req.headers.authorization]) {
    req.body.userId = sessions[req.headers.authorization].id;
  }

  const result = await linkService.addUrl(req);
  if (result.error) {
    return reply.status(200).send({
      code: 500,
      msg: result.error.message || '未知错误'
    });
  }
  return reply.status(200).send({
    code: 200,
    msg: 'success',
    url: `/u/${result.data.short}`,
    data: result.data
  });
});

// 访问短链接
app.get('/u/:hash', async (req, reply) => {
  if (req.params?.hash) {
    const result = await linkService.getUrl(req.params.hash);
    if (!result || !result.data?.length || result.error) {
      return reply.status(200).send({
        code: 404,
        msg: result.error?.message || '短链接不存在'
      });
    }
    
    const link = result.data[0];
    
    // 检查链接是否过期
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return reply.status(200).send({
        code: 410,
        msg: '短链接已过期'
      });
    }
    
    // 记录访问
    await linkService.recordAccess(link.id, req);
    
    return reply.status(302).redirect(link.link);
  }
  return reply.status(200).send({
    code: 404,
    msg: '短链接不存在'
  });
});

// 用户注册
app.post('/api/register', async (req, reply) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return reply.status(200).send({
      code: 400,
      msg: '用户名、邮箱和密码都是必填项'
    });
  }
  
  const result = await userService.registerUser(username, email, password);
  if (result.error) {
    return reply.status(200).send({
      code: 400,
      msg: result.error.message || '注册失败'
    });
  }
  
  // 创建会话
  const sessionId = generateSessionId();
  sessions[sessionId] = result.data;
  
  return reply.status(200).send({
    code: 200,
    msg: '注册成功',
    token: sessionId,
    user: {
      id: result.data.id,
      username: result.data.username,
      email: result.data.email
    }
  });
});

// 用户登录
app.post('/api/login', async (req, reply) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return reply.status(200).send({
      code: 400,
      msg: '邮箱和密码都是必填项'
    });
  }
  
  const result = await userService.loginUser(email, password);
  if (result.error) {
    return reply.status(200).send({
      code: 401,
      msg: result.error.message || '登录失败'
    });
  }
  
  // 创建会话
  const sessionId = generateSessionId();
  sessions[sessionId] = result.data;
  
  return reply.status(200).send({
    code: 200,
    msg: '登录成功',
    token: sessionId,
    user: {
      id: result.data.id,
      username: result.data.username,
      email: result.data.email
    }
  });
});

// OAuth登录回调
app.get('/api/oauth/callback/:provider', async (req, reply) => {
  const { provider } = req.params;
  const { code } = req.query;
  
  if (!code) {
    return reply.status(200).send({
      code: 400,
      msg: '授权码缺失'
    });
  }
  
  const result = await userService.handleOAuthCallback(provider, code);
  if (result.error) {
    return reply.status(200).send({
      code: 400,
      msg: result.error.message || '第三方登录失败'
    });
  }
  
  // 创建会话
  const sessionId = generateSessionId();
  sessions[sessionId] = result.data;
  
  // 重定向到前端，带上token
  return reply.redirect(`/?token=${sessionId}`);
});

// 获取用户信息
app.get('/api/user', async (req, reply) => {
  if (!await authenticate(req, reply)) return;
  
  return reply.status(200).send({
    code: 200,
    msg: 'success',
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email
    }
  });
});

// 退出登录
app.post('/api/logout', async (req, reply) => {
  const sessionId = req.headers.authorization;
  if (sessionId && sessions[sessionId]) {
    delete sessions[sessionId];
  }
  
  return reply.status(200).send({
    code: 200,
    msg: '退出成功'
  });
});

// 获取用户的短链接列表
app.get('/api/user/links', async (req, reply) => {
  if (!await authenticate(req, reply)) return;
  
  const result = await linkService.getUserLinks(req.user.id);
  if (result.error) {
    return reply.status(200).send({
      code: 500,
      msg: result.error.message || '获取链接列表失败'
    });
  }
  
  return reply.status(200).send({
    code: 200,
    msg: 'success',
    data: result.data
  });
});

// 获取公开的短链接列表
app.get('/api/public/links', async (req, reply) => {
  const result = await linkService.getPublicLinks();
  if (result.error) {
    return reply.status(200).send({
      code: 500,
      msg: result.error.message || '获取公开链接列表失败'
    });
  }
  
  return reply.status(200).send({
    code: 200,
    msg: 'success',
    data: result.data
  });
});

// 获取短链接访问统计
app.get('/api/links/:id/stats', async (req, reply) => {
  if (!await authenticate(req, reply)) return;
  
  const { id } = req.params;
  const result = await linkService.getLinkStats(id);
  if (result.error) {
    return reply.status(200).send({
      code: 500,
      msg: result.error.message || '获取访问统计失败'
    });
  }
  
  return reply.status(200).send({
    code: 200,
    msg: 'success',
    data: result.data
  });
});

export default async function handler(req, reply) {
  await app.ready();
  app.server.emit('request', req, reply);
}

// 本地开发启动
if (process.env.NODE_ENV !== 'production') {
  const start = async () => {
    try {
      await app.listen({ port: 3000, host: '0.0.0.0' });
      console.log(`Server listening on ${app.server.address().port}`);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  start();
}