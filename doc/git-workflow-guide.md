# Git 工作流程指南

## 🔄 如何重新开始（从GitHub拉取原始版本）

### 方法1：完全重新克隆（推荐）

如果你当前的本地目录很混乱，想要完全重新开始：

```bash
# 1. 备份当前工作（可选）
cd ..
cp -r blog blog-backup-$(date +%Y%m%d-%H%M%S)

# 2. 删除当前目录
rm -rf blog

# 3. 重新克隆仓库
git clone https://github.com/litianfugt/litianfugt.github.io.git blog

# 4. 进入项目目录
cd blog

# 5. 启动开发服务器
hugo server --port 1314 --bind 0.0.0.0
```

### 方法2：强制同步远程版本

如果你想保留当前目录，但完全同步远程版本：

```bash
# 1. 获取最新更新
git fetch origin

# 2. 强制重置到远程版本
git reset --hard origin/main

# 3. 清理未跟踪的文件（谨慎使用）
git clean -fd

# 4. 启动开发服务器
hugo server --port 1314 --bind 0.0.0.0
```

### 方法3：选择性重置

如果你只想重置特定文件或目录：

```bash
# 重置特定文件
git checkout origin/main -- path/to/file

# 重置整个目录
git checkout origin/main -- content/
git checkout origin/main -- layouts/
```

## 📤 如何推送更新到远程仓库

### 基本推送流程

```bash
# 1. 查看当前状态
git status

# 2. 添加修改的文件
git add .
# 或者添加特定文件
git add content/thoughts/new-thought.md
git add assets/css/extended/custom.css

# 3. 提交更改
git commit -m "描述你的更改"

# 4. 推送到远程仓库
git push origin main
```

### 推送不同类型的更改

#### 添加新内容
```bash
git add content/thoughts/2025-09-25-new-thought.md
git commit -m "添加新的随想：关于生活感悟"
git push origin main
```

#### 修改样式
```bash
git add assets/css/extended/custom.css
git commit -m "优化随想页面样式和响应式设计"
git push origin main
```

#### 更新配置文件
```bash
git add hugo.toml
git commit -m "更新网站配置和SEO设置"
git push origin main
```

### 首次推送设置

如果你是第一次推送，可能需要设置上游分支：

```bash
# 设置上游分支
git push --set-upstream origin main

# 或者简写
git push -u origin main
```

## 🔄 同步远程更新

在推送之前，建议先同步远程的更新：

```bash
# 1. 获取远程更新
git fetch origin

# 2. 查看差异
git log HEAD..origin/main

# 3. 合并远程更新
git merge origin/main

# 4. 解决冲突（如果有）
# 编辑冲突文件，然后
git add conflict-file.md
git commit -m "解决合并冲突"

# 5. 推送你的更改
git push origin main
```

## ⚠️ 常见问题和解决方案

### 推送被拒绝
```bash
# 错误：! [rejected] main -> main (fetch first)
# 解决方案：先拉取远程更新
git pull origin main

# 如果有冲突，解决冲突后
git add .
git commit -m "解决合并冲突"
git push origin main
```

### 忘记添加文件到提交
```bash
# 添加遗漏的文件
git add forgotten-file.md

# 修改最后一次提交
git commit --amend -m "添加遗漏的文件并更新提交"

# 推送到远程（如果已经推送过，需要强制推送）
git push origin main --force-with-lease
```

### 提交信息写错了
```bash
# 修改最后一次提交的描述
git commit --amend -m "新的提交描述"

# 推送到远程
git push origin main --force-with-lease
```

## 📋 最佳实践

### 1. 频繁提交
- 小步快跑，频繁提交
- 每个提交只包含相关的更改
- 写清晰的提交信息

### 2. 分支管理
```bash
# 创建功能分支（可选）
git checkout -b feature/new-thoughts-page

# 完成开发后合并到main
git checkout main
git merge feature/new-thoughts-page
git push origin main
```

### 3. 备份重要工作
```bash
# 创建标签备份重要版本
git tag -a v1.0.0 -m "发布版本1.0.0"
git push origin v1.0.0
```

### 4. 定期清理
```bash
# 清理已删除的远程分支引用
git remote prune origin

# 清理本地已合并的分支
git branch --merged | grep -v main | xargs -n 1 git branch -d
```

## 🎯 针对本项目的特殊说明

### Hugo项目的特殊考虑
1. **public目录**：这是生成的静态文件，通常不会提交到Git
2. **content目录**：你的内容文件，应该经常提交
3. **layouts目录**：模板文件，修改后需要提交
4. **assets目录**：CSS、JS等资源文件，修改后需要提交

### 推荐的提交频率
- **内容更新**：每次添加新内容后立即提交
- **样式修改**：完成一个功能或修复后提交
- **配置更改**：测试通过后提交

### 示例提交信息
```bash
# 内容相关
git commit -m "添加新随想：关于生活感悟的思考"
git commit -m "更新关于页面内容"

# 样式相关
git commit -m "优化随想页面移动端显示效果"
git commit -m "修复导航栏在小屏幕下的布局问题"

# 功能相关
git commit -m "添加随想点赞功能的前端交互"
git commit -m "实现随想内容的动态加载"

# 配置相关
git commit -m "更新Hugo配置，启用新的内容类型"
git commit -m "配置SEO优化参数"
```

## 🚀 快速参考命令

```bash
# 查看状态
git status

# 查看提交历史
git log --oneline

# 查看远程分支
git branch -r

# 查看本地和远程的差异
git diff origin/main

# 强制覆盖本地（谨慎使用）
git fetch origin
git reset --hard origin/main
git clean -fd
```

记住：**经常提交，经常推送，经常备份！** 🛡️

### 日常开发流程
```bash
# 1. 开始工作前同步
git pull origin main

# 2. 进行修改（添加内容、修改样式等）

# 3. 查看状态
git status

# 4. 添加更改
git add .

# 5. 提交更改
git commit -m "描述本次更改"

# 6. 推送到远程
git push origin main
```

### 发布新内容的标准流程
```bash
# 1. 确保在最新版本基础上工作
git pull origin main

# 2. 创建并编辑新内容
# 例如：创建新的随想文件 content/thoughts/2025-09-25-new.md

# 3. 预览效果（启动Hugo服务器）
hugo server --port 1314 --bind 0.0.0.0

# 4. 满意后提交
git add content/thoughts/2025-09-25-new.md
git commit -m "发布新随想：2025年9月25日的思考"

# 5. 推送到GitHub
git push origin main
```

## ⚠️ 常见问题和解决方案

### 推送被拒绝
```bash
# 错误：! [rejected] main -> main (fetch first)
# 