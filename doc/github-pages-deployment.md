# GitHub Pages 部署指南

本指南将帮助您将博客部署到GitHub Pages，并确保所有功能（包括点赞和评论）都能正常工作。

## 准备工作

### 1. 创建GitHub仓库

1. 登录您的GitHub账号
2. 点击右上角的"+"号，选择"New repository"
3. 填写仓库名称（建议与您的用户名相同，如 `your-username.github.io`）
4. 选择"Public"（GitHub Pages免费账户只支持公开仓库）
5. 勾选"Add a README file"
6. 点击"Create repository"

### 2. 推送代码到GitHub

```bash
# 初始化Git仓库（如果尚未初始化）
git init

# 添加远程仓库
git remote add origin https://github.com/your-username/your-username.github.io.git

# 添加所有文件到Git
git add .

# 提交更改
git commit -m "Initial commit: Blog with thoughts and comments functionality"

# 推送到GitHub
git push -u origin main
```

### 3. 配置GitHub Pages

1. 进入您的GitHub仓库页面
2. 点击"Settings"
3. 在左侧菜单中找到"Pages"
4. 在"Source"部分，选择"Deploy from a branch"
5. 选择"main"分支
6. 点击"Save"

### 4. 配置GitHub Gist

由于GitHub Pages是静态的，我们需要使用GitHub Gist来存储点赞和评论数据。

#### 步骤1：创建GitHub个人访问令牌

1. 登录您的GitHub账号
2. 访问 [Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
3. 点击"Generate new token"
4. 确保勾选 `gist` 权限
5. 点击"Generate token"
6. **重要**：复制生成的令牌（只显示一次，请妥善保存）

#### 步骤2：创建Gist

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

#### 步骤3：获取Gist ID

创建Gist后，从浏览器地址栏复制Gist ID。例如，如果URL是 `https://gist.github.com/your-username/1234567890abcdef`，则Gist ID是 `1234567890abcdef`。

#### 步骤4：配置GitHub Secrets

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

#### 步骤5：使用GitHub Actions部署

1. 推送代码到GitHub后，GitHub Actions将自动触发
2. 或者手动触发部署：
   - 进入仓库的"Actions"标签页
   - 选择"Deploy to GitHub Pages with Gist Configuration"工作流
   - 点击"Run workflow"
3. 等待部署完成
4. 访问您的GitHub Pages URL
5. 尝试点赞或添加评论
6. 检查浏览器控制台是否有错误信息

## 注意事项

### 1. 敏感信息保护

- **GitHub令牌不应提交到代码仓库**。已将配置文件添加到.gitignore中。
- 如果您需要分享代码，请确保删除或注释掉配置文件中的敏感信息。

### 2. 数据同步

- 点赞和评论数据存储在GitHub Gist中，可以实现不同设备间的数据同步。
- 如果您修改了Gist内容，更改会自动反映在网站上。

### 3. 性能考虑

- GitHub Pages有构建时间限制（免费账户10分钟），如果您的网站很大，可能需要优化。
- 点赞和评论功能使用JavaScript实现，不会影响网站加载速度。

### 4. 自定义域名

如果您想使用自定义域名：

1. 在您的域名提供商处添加CNAME记录，指向您的GitHub Pages URL
2. 在仓库根目录创建`CNAME`文件，内容为您的自定义域名
3. 在GitHub Pages设置中启用自定义域名

## 故障排除

### 1. 点赞和评论功能不工作

- 检查浏览器控制台是否有错误信息
- 确保GitHub Gist配置正确
- 确保Gist是公开的（或私有但令牌有访问权限）

### 2. 网站构建失败

- 检查Hugo配置是否正确
- 确保所有依赖项都已安装
- 查看GitHub Actions的构建日志（如果使用）

### 3. 数据不同步

- 检查GitHub Gist是否可以访问
- 确保令牌有gist权限
- 尝试清除浏览器缓存

## 更新和维护

### 1. 添加新内容

1. 在`content`目录下创建新的Markdown文件
2. 运行`hugo`构建网站
3. 将更改推送到GitHub

### 2. 更新主题

1. 修改`themes`目录下的文件
2. 运行`hugo`构建网站
3. 将更改推送到GitHub

### 3. 备份数据

- 定期备份您的GitHub Gist数据
- 考虑导出评论数据作为备份

## 安全建议

1. **定期轮换令牌**：建议每3-6个月更换一次GitHub令牌
2. **限制令牌权限**：只授予必要的权限（gist）
3. **监控Gist活动**：定期检查Gist的访问记录
4. **使用私有Gist**：如果评论数据包含敏感信息，使用私有Gist

## 资源链接

- [GitHub Pages文档](https://docs.github.com/en/pages)
- [Hugo文档](https://gohugo.io/documentation/)
- [PaperMod主题文档](https://github.com/adityatelange/hugo-PaperMod)
- [GitHub Gist文档](https://docs.github.com/en/rest/gists)