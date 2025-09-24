# 我的博客

这是一个使用Hugo和PaperMod主题构建的个人博客。

## 功能特性

- 随想页面（Thoughts）：记录日常思考和感悟
- 点赞功能：可以对随想内容进行点赞
- 评论功能：可以在随想和博客文章下发表评论
- 响应式设计：适配桌面和移动设备
- GitHub Gist数据存储：实现不同设备间的数据同步

## 本地开发

### 环境要求

- Hugo (建议使用Extended版本)
- Git

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/your-username/your-blog.git
cd your-blog
```

2. 安装Hugo（如果尚未安装）
```bash
# macOS
brew install hugo

# Windows (使用scoop)
scoop install hugo-extended

# Linux (Ubuntu)
sudo apt install hugo
```

3. 启动开发服务器
```bash
hugo server
```

4. 访问 http://localhost:1314 查看博客

## GitHub Gist 配置

要启用点赞和评论的网络存储功能（实现不同设备间的数据同步），需要配置GitHub Gist：

### 步骤1：创建GitHub个人访问令牌

1. 登录您的GitHub账号
2. 访问 [Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
3. 点击"Generate new token"
4. 确保勾选 `gist` 权限
5. 点击"Generate token"
6. **重要**：复制生成的令牌（只显示一次，请妥善保存）

### 步骤2：创建Gist

1. 访问 [Gist主页](https://gist.github.com/)
2. 创建一个新的Gist，包含以下内容：
   - Gist description: `Blog likes and comments data`
   - Filename: `blog-likes-and-comments.json`
   - 内容：
```json
{
  "likes": {
    "2025-09-23-meditation": 0,
    "2025-09-24-first-thought": 0
  },
  "comments": {
    "2025-09-23-meditation": [],
    "2025-09-24-first-thought": []
  }
}
```
3. 点击"Create public gist"（公开Gist）或"Create secret gist"（私有Gist）

### 步骤3：获取Gist ID

创建Gist后，从浏览器地址栏复制Gist ID。例如，如果URL是 `https://gist.github.com/your-username/1234567890abcdef`，则Gist ID是 `1234567890abcdef`。

### 步骤4：配置GitHub Secrets

GitHub的界面可能有所变化，以下是几种可能的路径：

**方法1：通过Settings菜单**
1. 进入您的GitHub仓库页面
2. 点击"Settings"
3. 在左侧菜单中找到"Secrets and variables"（可能在"Security"部分下）
4. 点击"Actions"
5. 点击"New repository secret"
6. 创建两个secret：
   - 名称：`BLOG_GIST_TOKEN`，值：您的GitHub令牌
   - 名称：`BLOG_GIST_ID`，值：您的Gist ID
7. 点击"Add secret"保存

**方法2：通过Actions菜单**
1. 进入您的GitHub仓库页面
2. 点击"Actions"标签页
3. 在左侧菜单中点击"Secrets"（可能在"General"或"Workflow"部分下）
4. 点击"New repository secret"
5. 创建两个secret：
   - 名称：`BLOG_GIST_TOKEN`，值：您的GitHub令牌
   - 名称：`BLOG_GIST_ID`，值：您的Gist ID
6. 点击"Add secret"保存

**方法3：通过仓库设置的安全部分**
1. 进入您的GitHub仓库页面
2. 点击"Settings"
3. 滚动到"Security"部分
4. 点击"Secrets and variables"
5. 选择"Actions"
6. 点击"New repository secret"
7. 创建两个secret：
   - 名称：`BLOG_GIST_TOKEN`，值：您的GitHub令牌
   - 名称：`BLOG_GIST_ID`，值：您的Gist ID
8. 点击"Add secret"保存

如果以上方法都找不到，请参考GitHub的最新文档：[GitHub Secrets文档](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)

### 步骤5：使用GitHub Actions部署

1. 推送代码到GitHub后，GitHub Actions将自动触发
2. 或者手动触发部署：
   - 进入仓库的"Actions"标签页
   - 选择"Deploy to GitHub Pages with Gist Configuration"工作流
   - 点击"Run workflow"
3. 等待部署完成
4. 访问您的GitHub Pages URL
5. 尝试点赞或添加评论
6. 检查浏览器控制台是否有错误信息

## 安全说明

- **敏感信息保护**：GitHub令牌存储在GitHub Secrets中，不会暴露在代码中
- **自动配置**：GitHub Actions会在部署时自动生成配置文件，无需手动编辑
- **本地开发**：在本地开发时，可以创建`static/github-gist-config.js`文件进行测试
- **部署安全**：部署过程完全自动化，确保敏感信息不会泄露

## 注意事项

- **敏感信息保护**：GitHub令牌不应提交到代码仓库。已将配置文件添加到.gitignore中。
- **数据安全**：如果评论数据包含敏感信息，建议创建私有Gist。
- **定期备份**：虽然GitHub Gist非常可靠，但建议定期备份您的数据。

## 文件结构

```
├── content/          # 博客内容
├── static/           # 静态文件
│   ├── github-gist-config.js  # GitHub Gist配置（不提交到仓库）
│   └── data/        # 初始数据
├── assets/           # 资源文件
├── layouts/          # 布局模板
├── public/           # 构建输出
├── themes/           # 主题文件
└── doc/              # 文档
```

## 许可证

本项目采用MIT许可证。详情请参阅 [LICENSE](LICENSE) 文件。