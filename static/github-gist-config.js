// GitHub Gist 配置文件
//
// 重要：此文件包含敏感信息，不应提交到代码仓库。
// 已将此文件添加到 .gitignore 中，确保不会被推送到GitHub。
//
// 要启用点赞和评论的网络存储功能（实现不同设备间的数据同步）：
//
// 1. 创建GitHub个人访问令牌：
//    - 访问 https://github.com/settings/tokens
//    - 点击 "Generate new token"
//    - 确保勾选 'gist' 权限
//    - 复制生成的令牌
//
// 2. 创建Gist：
//    - 访问 https://gist.github.com/
//    - 创建一个新的Gist，文件名为 'blog-likes-and-comments.json'
//    - 内容请参考 static/github-gist-example.json
//    - 复制Gist ID（URL中的最后一部分）
//
// 3. 配置此文件：
//    - 将 'your-github-token' 替换为您的令牌
//    - 将 'your-gist-id' 替换为您的Gist ID
//
// 4. 测试功能：
//    - 刷新浏览器页面
//    - 尝试点赞或添加评论
//    - 检查浏览器控制台是否有错误信息

// GitHub Gist 配置
// 如果环境变量存在，则使用环境变量，否则使用占位符
window.GITHUB_GIST_TOKEN = window.GITHUB_GIST_TOKEN || 'your-github-token';   // 替换为您的GitHub个人访问令牌
window.GITHUB_GIST_ID = window.GITHUB_GIST_ID || 'your-gist-id';           // 替换为您的Gist ID