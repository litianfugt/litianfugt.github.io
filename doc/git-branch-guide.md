# Git分支查看指南

## 如何查看当前分支

### 方法一：使用git branch命令

```bash
# 查看本地分支列表，当前分支会以星号(*)标记
git branch
```

输出示例：
```
* main
  temp-restore
  feature/scrollbar
```

### 方法二：使用git status命令

```bash
# 查看Git状态，其中会包含当前分支信息
git status
```

输出示例：
```
On branch main
Your branch is up to date with 'blog/main'.

nothing to commit, working tree clean
```

### 方法三：使用git log命令

```bash
# 查看提交历史，HEAD会指向当前分支的最新提交
git log --oneline -1
```

输出示例：
```
3dfe363 (HEAD -> main, blog/main) 添加页面右侧滚动条和改进评论系统
```

## 查看远程分支

### 查看所有分支（包括远程分支）

```bash
# 查看所有分支，本地和远程
git branch -a
```

输出示例：
```
* main
  remotes/blog/main
  remotes/origin/HEAD -> origin/main
  remotes/origin/main
```

### 查看远程分支的详细信息

```bash
# 查看远程分支的详细信息
git remote -v
```

输出示例：
```
blog    https://github.com/litianfugt/litianfugt.github.io.git (fetch)
blog    https://github.com/litianfugt/litianfugt.github.io.git (push)
origin  https://github.com/litianfugt/litianfugt.github.io.git (fetch)
origin  https://github.com/litianfugt/litianfugt.github.io.git (push)
```

## 切换分支

如果您想切换到其他分支：

```bash
# 切换到已存在的分支
git checkout <分支名>

# 创建并切换到新分支
git checkout -b <新分支名>
```

例如：
```bash
# 切换到temp-restore分支
git checkout temp-restore

# 创建并切换到新分支feature/new-feature
git checkout -b feature/new-feature
```

## 查看分支的提交历史

```bash
# 查看当前分支的提交历史
git log --oneline

# 查看特定分支的提交历史
git log --oneline <分支名>

# 查看所有分支的提交历史图形
git log --oneline --graph --all
```

## 比较分支差异

```bash
# 比较当前分支与另一个分支的差异
git diff <分支名>

# 比较两个分支之间的差异
git diff <分支1> <分支2>

# 查看当前分支相对于另一个分支有哪些新提交
git log --oneline <另一个分支>..HEAD
```

## 总结

使用 `git branch` 是查看当前分支最简单直接的方法。星号(*)标记的分支就是您当前所在的分支。如果您想了解更多关于分支的信息，可以使用 `git status` 或 `git log` 命令。

如果您在切换分支时遇到问题，可能是因为您有未提交的更改。您可以选择先提交这些更改，或者使用 `git stash` 暂存它们。