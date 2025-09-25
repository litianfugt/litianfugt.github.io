# 检查和恢复更改的指南

## 检查当前状态

首先，让我们检查一下当前的Git状态，看看我们的更改是否还在：

```bash
# 检查Git状态
git status

# 查看最近的提交历史
git log --oneline -10

# 查看所有分支（包括远程分支）
git branch -a

# 查看远程仓库状态
git remote -v
```

## 如果更改被覆盖了怎么办？

如果您发现我们的更改被 `git pull` 覆盖了，不要担心，我们可以通过以下方法恢复：

### 方法一：使用Reflog恢复

Git的reflog记录了您在本地仓库中的所有操作。我们可以使用它来找回丢失的提交：

```bash
# 查看reflog
git reflog

# 找到包含我们更改的提交（例如：添加页面右侧滚动条和改进评论系统）
# 记下该提交的哈希值

# 创建一个新分支指向那个提交
git checkout -b temp-restore <提交哈希值>

# 切换回main分支
git checkout main

# 将我们的更改合并到main分支
git merge temp-restore

# 删除临时分支
git branch -d temp-restore
```

### 方法二：重新应用更改

如果reflog方法不起作用，我们可以手动重新应用我们的更改：

1. **页面右侧滚动条功能**：
   - 创建/修改 `static/js/progress-bar.js` 文件
   - 修改 `assets/css/extended/custom.css` 文件，添加滚动条样式

2. **评论系统改进**：
   - 修改 `layouts/partials/comments.html` 文件
   - 修改 `hugo.toml` 文件，更新Giscus配置
   - 修改 `static/js/thoughts.js` 文件，修复评论按钮功能和点赞初始化

### 方法三：使用Stash保存当前工作

如果您有一些未提交的更改，可以先保存它们：

```bash
# 保存当前工作
git stash push -m "临时保存当前工作"

# 拉取远程更改
git pull blog main

# 恢复保存的工作
git stash pop

# 解决任何冲突，然后提交
git add .
git commit -m "添加页面右侧滚动条和改进评论系统"
```

## 推荐的恢复步骤

基于您的情况，我推荐以下步骤：

1. **首先检查状态**：
   ```bash
   git status
   git log --oneline -5
   ```

2. **如果我们的更改丢失了**：
   ```bash
   # 查看reflog
   git reflog
   
   # 找到包含我们的更改的提交
   # 创建临时分支
   git checkout -b temp-restore <包含我们更改的提交哈希>
   
   # 切换回main
   git checkout main
   
   # 合并我们的更改
   git merge temp-restore
   ```

3. **如果reflog中没有找到**：
   ```bash
   # 手动重新应用我们的更改
   # 按照上面"方法二"中的步骤重新创建和修改文件
   ```

4. **提交并推送**：
   ```bash
   git add .
   git commit -m "添加页面右侧滚动条和改进评论系统"
   
   # 使用force-with-lease推送
   git push --force-with-lease blog main
   ```

## 预防措施

为了避免将来再次出现这个问题：

1. **在执行可能会覆盖本地更改的操作前，先创建备份**：
   ```bash
   git branch backup/my-work
   ```

2. **使用stash保存未完成的工作**：
   ```bash
   git stash push -m "工作进度保存"
   ```

3. **定期提交您的工作**：
   ```bash
   git add .
   git commit -m "工作进度：添加了XX功能"
   ```

4. **在拉取远程更改前，先检查状态**：
   ```bash
   git status
   git log --oneline -3
   ```

## 检查特定文件是否存在

如果您想检查我们创建或修改的特定文件是否还存在：

```bash
# 检查进度条文件
ls -la static/js/progress-bar.js

# 检查评论系统文件
ls -la layouts/partials/comments.html

# 检查CSS文件是否包含我们的样式
grep -n "reading-progress-bar\|custom-scrollbar" assets/css/extended/custom.css

# 检查thoughts.js是否包含我们的修改
grep -n "initializeCommentButtons\|initializeLikes" static/js/thoughts.js
```

## 总结

Git是一个强大的工具，但有时可能会让人感到困惑。重要的是要理解每个操作的后果，并在执行可能会覆盖本地更改的操作前先创建备份。

使用上述方法，您应该能够检查我们的更改是否还在，并在必要时恢复它们。如果遇到任何问题，请随时告诉我。