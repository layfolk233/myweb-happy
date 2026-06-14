export default async function handler(req, res) {
  // 获取请求的完整路径
  // 例如：/api/tmdb/discover/movie?xxx  → 提取 /discover/movie?xxx
  const urlPath = req.url.replace('/api/tmdb', '');
  
  // 构造 TMDB API 的完整 URL
  const targetUrl = `https://api.themoviedb.org/3${urlPath}`;
  
  // 从 Vercel 环境变量读取 Token（安全！不在代码里写死）
  const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;
  
  // 如果没有设置环境变量，返回错误提示
  if (!TMDB_TOKEN) {
    console.error('错误: TMDB_ACCESS_TOKEN 环境变量未设置');
    return res.status(500).json({ 
      error: '服务器配置错误：未设置 TMDB_ACCESS_TOKEN 环境变量',
      solution: '请在 Vercel 项目 Settings → Environment Variables 中添加 TMDB_ACCESS_TOKEN'
    });
  }
  
  try {
    console.log(`代理请求: ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      headers: {
        'Authorization': `Bearer ${TMDB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    
    // 添加 CORS 头，允许前端访问
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 返回状态码和数据
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('代理错误:', error);
    res.status(500).json({ 
      error: '代理请求失败', 
      message: error.message 
    });
  }
}