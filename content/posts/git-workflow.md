---
title: "Git一些学习和使用记录"
date: 2025-09-10T00:00:00+08:00
draft: false
description: "本文详细介绍了Git的基本概念和一些基本使用方式，后续还在不断总结更新"
keywords: ["Git", "版本控制", "工作流程", "分支管理"]
tags: ["Git"]
categories: ["技术总结"]
author: "李石原"
showToc: true
hidemeta: false
disableShare: false
disableHLJS: false
hideSummary: false
searchHidden: false
ShowReadingTime: true
ShowBreadCrumbs: true
ShowPostNavLinks: true
ShowWordCount: true
ShowRssButtonInSectionTermList: true
UseHugoToc: true
comments: true
---

# Git工作流程：从入门到精通

Git是目前最流行的分布式版本控制系统，它不仅能够帮助开发者管理代码版本，还能促进团队协作。本文将详细介绍一下git的基础概念和在使用过程中的一些实用技巧。

## 1. Git基础概念

### 1.1 什么是Git？

Git是一个开源的分布式版本控制系统，由Linus Torvalds于2005年创建。要理解Git，首先要明白什么是"版本控制"。

**版本控制**：记录文件内容变化，以便将来查阅特定版本修订情况的系统。就像文档的"撤销"功能，但更强大。

**分布式**：每个开发者都拥有完整的代码仓库副本，不像集中式系统（如SVN）那样只有一个中央服务器。

**Git的优势**：
- **速度快**：大部分操作在本地完成
- **数据完整性**：每个文件都有校验和，防止数据损坏
- **支持离线工作**：不需要网络就能进行大部分操作
- **强大的分支功能**：分支创建和合并非常高效

### 1.2 Git的基本工作区

Git有四个主要的工作区，理解这四个区域是掌握Git的关键：

```
工作区(Working Directory)
    ↓ git add
暂存区(Staging Area/Index)
    ↓ git commit
本地仓库(Local Repository)
    ↓ git push
远程仓库(Remote Repository)
```

#### 1. 工作区(Working Directory)
- **定义**：你当前正在工作的目录，包含项目的所有文件
- **作用**：在这里编辑代码、修改文件
- **特点**：文件修改后，Git会检测到变化

#### 2. 暂存区(Staging Area)
- **定义**：也称为"索引(Index)"，是一个临时保存修改的地方
- **作用**：在提交前，可以在这里选择要包含的修改（git add后存储的区域）
- **比喻**：就像购物车，你可以把想买的东西先放进去，最后一起结账

#### 3. 本地仓库(Local Repository)
- **定义**：Git保存项目元数据和对象数据库的地方
- **作用**：存储提交历史和文件快照（git commit）
- **位置**：在项目目录的`.git`文件夹中

#### 4. 远程仓库(Remote Repository)
- **定义**：托管在GitHub、GitLab等平台上的仓库
- **作用**：团队协作和备份（git push的地方）
- **特点**：多个开发者可以共享同一个远程仓库

### 1.3 Git的基本工作流程

Git的基本工作流程很简单，只有四个核心步骤：

1. **在工作区修改文件** - 编辑代码、添加新文件等
2. **使用`git add`将修改添加到暂存区** - 选择要提交的修改
3. **使用`git commit`将暂存区的内容提交到本地仓库** - 创建一个版本快照
4. **使用`git push`将本地仓库的修改推送到远程仓库** - 与团队共享

**举个例子**：
```bash
# 1. 编辑文件（在工作区）
echo "Hello Git" > README.md

# 2. 添加到暂存区
git add README.md

# 3. 提交到本地仓库
git commit -m "添加README文件"

# 4. 推送到远程仓库
git push origin main
```

## 2. Git基本命令

### 2.1 初始化配置

#### 配置用户信息

在使用Git之前，需要配置你的身份信息：

```bash
# 配置全局用户名（所有仓库都使用这个名字）
git config --global user.name "Your Name"

# 配置全局邮箱（所有仓库都使用这个邮箱）
git config --global user.email "your.email@example.com"

# 查看当前配置
git config --list

# 查看特定配置
git config user.name
git config user.email
```

**为什么需要配置？**
Git需要知道是谁提交了代码，这样在查看历史时就能看到每个提交的作者信息。

#### 初始化仓库

```bash
# 在当前目录初始化Git仓库
git init

# 克隆远程仓库（推荐新手使用）
git clone https://github.com/username/repository.git
```

**`git init` vs `git clone`**：
- `git init`：在现有项目中创建Git仓库
- `git clone`：复制现有的远程仓库到本地

### 2.2 基本操作

#### 查看状态

```bash
# 查看工作区状态（最常用的命令）
git status

# 查看简化状态
git status -s  # 简化输出，适合快速查看

# 输出示例：
# M modified.txt    # M表示已修改
# A new.txt         # A表示已添加到暂存区
# ?? untracked.txt  # ??表示未跟踪的文件
```

**`git status`会告诉你什么？**
- 哪些文件被修改了
- 哪些文件在暂存区
- 哪些文件还未被Git跟踪
- 当前在哪个分支上

#### 查看提交历史

```bash
# 查看详细提交历史
git log

# 查看简洁提交历史（推荐）
git log --oneline

# 查看图形化提交历史（很有用）
git log --graph --oneline --all

# 查看最近n次提交
git log --oneline -5

# 查看特定文件的修改历史
git log filename
```

**提交信息格式**：
```
commit a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0 (HEAD -> main, origin/main)
Author: Your Name <your.email@example.com>
Date:   Mon Oct 24 16:30:00 2025 +0800

    提交信息：添加了新功能
```

#### 添加和提交

```bash
# 添加指定文件到暂存区
git add filename

# 添加所有修改到暂存区
git add .

# 添加所有修改（包括删除的文件）
git add -A

# 提交暂存区内容
git commit -m "提交信息"

# 跳过暂存区直接提交（提交所有已跟踪文件的修改）
git commit -a -m "提交信息"

# 修改最后一次提交信息（如果信息写错了）
git commit --amend
```

**提交信息的重要性**：
- 好的提交信息应该简洁明了
- 说明这次提交做了什么
- 遵循团队的提交规范

**示例提交信息**：
```
feat: 添加用户登录功能

- 实现登录表单验证
- 添加JWT token处理
- 完善错误提示信息
```

#### 查看和比较

```bash
# 查看工作区与暂存区的差异（未暂存的修改）
git diff

# 查看暂存区与本地仓库的差异（已暂存但未提交的修改）
git diff --staged

# 查看工作区与本地仓库的差异（所有修改）
git diff HEAD

# 查看指定文件的差异
git diff filename

# 查看两个提交之间的差异
git diff commit1 commit2
```

**`git diff`输出解读**：
```
--- a/README.md
+++ b/README.md
@@ -1,3 +1,4 @@
 # 项目说明
 这是一个测试项目
+新增了一行内容
```
- `---`表示原始文件
- `+++`表示修改后的文件
- `@@`表示修改的位置
- `-`表示删除的行
- `+`表示新增的行

#### 撤销操作

```bash
# 1. 撤销工作区的修改（恢复到最近一次提交状态）
git checkout -- filename
git checkout -- .  # 撤销所有文件的修改

# 2. 撤销暂存区的修改（取消暂存，但保留工作区修改）
git reset HEAD filename
git reset HEAD .   # 取消所有文件的暂存

# 3. 撤销最后一次提交（保留修改在工作区）
git reset --soft HEAD~1

# 4. 撤销最后一次提交（丢弃修改）
git reset --hard HEAD~1

# 5. 撤销多次提交（保留修改在工作区）
git reset --soft HEAD~n

# 6. 撤销多次提交（丢弃修改）
git reset --hard HEAD~n
```

**撤销操作的详细说明**：

#### 1. `git checkout -- <file>` 

**作用**：恢复工作区文件到HEAD状态，撤销文件的修改

**用法**：
```bash
# 撤销单个文件的修改
git checkout -- README.md

# 撤销所有文件的修改  
git checkout -- .
```

**说明**：只影响工作区，不能恢复未跟踪的新文件

#### 2. `git reset HEAD <file>`

**作用**：取消文件的暂存，但保留工作区的修改

**用法**：
```bash
# 取消暂存特定文件
git reset HEAD src/index.js

# 取消所有文件的暂存
git reset HEAD .
```

**说明**：只影响暂存区，工作区和提交历史不变

#### 3. `git reset --soft HEAD~1`

**作用**：撤销最后一次提交，保留所有修改在工作区

**用法**：
```bash
# 撤销最后一次提交，保留修改
git reset --soft HEAD~1

# 重新编辑提交信息后提交
git commit -m "更正的提交信息"
```

**说明**：安全撤销提交，修改和暂存状态都保留

#### 4. `git reset --hard HEAD~1`

**作用**：彻底回到上一个提交，丢弃所有修改

**用法**：
```bash
# 彻底回到上一个提交（危险操作）
git reset --hard HEAD~1

# 回到特定提交
git reset --hard abc1234
```

**⚠️ 警告**：会丢失所有修改，执行前建议备份：
```bash
git stash  # 备份修改
```

#### 5. `git reset --soft/--hard HEAD~n`

**作用**：撤销多个提交

**用法**：
```bash
# 撤销最近3次提交，保留修改
git reset --soft HEAD~3

# 撤销最近5次提交，丢弃修改
git reset --hard HEAD~5
```

**说明**：n是要回退的提交数量

### 撤销操作选择指南

| 需求 | 命令 | 安全性 |
|------|------|---------|
| 撤销文件修改 | `git checkout -- <file>` | 安全 |
| 取消文件暂存 | `git reset HEAD <file>` | 安全 |
| 撤销提交但保留修改 | `git reset --soft HEAD~1` | 安全 |
| 完全回到某状态 | `git reset --hard <commit>` | 危险 |

**记忆技巧**：
- `checkout` → 工作区
- `reset HEAD` → 暂存区  
- `reset --soft` → 提交历史（安全）
- `reset --hard` → 全部重置（危险）

### 2.3 远程仓库操作

#### 添加和管理远程仓库

```bash
# 查看远程仓库
git remote -v

# 添加远程仓库
git remote add origin https://github.com/username/repository.git

# 删除远程仓库
git remote remove origin

# 修改远程仓库URL
git remote set-url origin https://github.com/username/new-repository.git

# 查看远程仓库详细信息
git remote show origin
```

**远程仓库的命名**：
- `origin`：默认的远程仓库名称
- 可以有多个远程仓库，如`origin`、`upstream`等

#### 推送和拉取

```bash
# 推送到远程仓库
git push origin main

# 推送并设置上游分支（第一次推送时使用）
git push -u origin main

# 拉取远程仓库的修改（获取并合并）
git pull origin main

# 获取远程仓库的修改（不合并）
git fetch origin

# 合并远程分支到当前分支
git merge origin/main
```

**`git pull` vs `git fetch`**：
- `git pull` = `git fetch` + `git merge`
- `git fetch`：只获取远程更新，不合并
- `git pull`：获取更新并自动合并

## 3. 分支管理

### 3.1 Git分支的基本定义

#### 什么是分支？

分支是Git最强大的功能之一。可以把分支想象成游戏的"存档点"，你可以在不同的分支上开发不同的功能，互不干扰。

**分支的比喻**：
- **树干**：主分支（main/master）
- **树枝**：功能分支、修复分支
- **树梢**：最新的提交

#### 本地分支 vs 远程分支

Git中有两种主要的分支类型：

**本地分支**：存在于你本地仓库中的分支
- `main` - 本地主分支
- `feature-branch` - 本地功能分支
- `develop` - 本地开发分支

**远程分支**：远程仓库（如GitHub）中的分支的本地引用
- `origin/main` - 远程仓库的main分支
- `origin/feature-branch` - 远程仓库的功能分支

**重要概念**：
- 本地分支是你可以直接操作的分支
- 远程分支是只读的，代表远程仓库的状态
- `origin/main`不是真正的分支，而是对远程main分支的引用

#### 远程仓库名的含义

**`origin`**：
- 这是**远程仓库的名称**，不是分支
- `origin` 是Git给默认远程仓库起的名字
- 它指向一个完整的远程仓库URL，比如：`https://github.com/litianfugt/litianfugt.github.io.git`

**`blog`**：
- 自定义的远程仓库名称
- 同样指向完整的远程仓库URL
- 可以根据项目需求自定义命名

#### `git push origin main` 详细解析

```bash
git push origin main
│    │    │    │
│    │    │    └── 目标：远程仓库的main分支
│    │    └─────── 远程仓库名称
│    └─────────── Git命令：推送
└─────────────── Git工具
```

**完整含义**：将当前本地分支的内容推送到名为`origin`的远程仓库的`main`分支。

**等价写法**：
```bash
git push origin main:main  # 完整语法：本地分支:远程分支
```

**其他推送示例**：
```bash
# 推送本地分支到远程不同名称的分支
git push origin local-branch:remote-branch

# 推送所有分支
git push --all origin

# 推送并删除远程分支
git push origin --delete feature-branch
```

#### `remotes/blog/HEAD -> blog/main` 的含义

**符号引用解释**：
```
remotes/blog/HEAD -> blog/main
│        │      │    │
│        │      │    └── 指向blog/main分支
│        │      └────── 符号引用指向
│        └─────────── 远程仓库blog的HEAD
└─────────────────── 远程分支引用
```

**实际意义**：
- **`remotes/blog/HEAD`**：远程仓库`blog`的HEAD引用
- **`-> blog/main`**：指向`blog/main`分支
- **作用**：标识远程仓库的默认分支，简化某些Git操作
- 类似于桌面快捷方式，是一个符号引用

**HEAD的概念**：
- HEAD是一个指针，指向当前分支的最新提交
- 每个分支都有自己的HEAD
- 远程仓库的HEAD指向默认分支（通常是main）

### 3.2 分支的基本操作

#### 创建和切换分支

```bash
# 创建新分支
git branch feature-branch

# 切换到指定分支
git checkout feature-branch

# 创建并切换到新分支（常用）
git checkout -b feature-branch

# 查看所有分支
git branch -a

# 查看本地分支
git branch

# 查看远程分支
git branch -r
```

**分支命名规范**：
```
feature/user-authentication  # 功能分支
fix/login-bug               # 修复分支
docs/api-documentation      # 文档分支
refactor/user-service       # 重构分支
hotfix/security-patch       # 紧急修复分支
```

#### 合并分支

```bash
# 切换到目标分支
git checkout main

# 合并指定分支到当前分支
git merge feature-branch

# 删除已合并的分支
git branch -d feature-branch

# 强制删除分支（即使未合并）
git branch -D feature-branch
```

**合并的类型**：
- **Fast-forward**：快进合并，历史是线性的
- **Recursive**：递归合并，创建合并提交
- **Squash**：压缩合并，将多个提交合并为一个

#### 解决合并冲突

当合并分支时，如果两个分支对同一文件的同一部分进行了不同的修改，就会产生合并冲突。

**冲突产生的原因**：
- 两个分支修改了同一文件的同一行
- 一个分支修改了文件，另一个分支删除了文件
- 文件重命名冲突

**解决合并冲突的步骤**：

1. **执行合并命令**
```bash
git merge feature-branch
```

2. **查看冲突状态**
```bash
git status
# 会显示 "both modified" 的文件
```

3. **打开冲突文件，查看冲突标记**
```bash
<<<<<<< HEAD
你的代码
=======
别人的代码
>>>>>>> feature-branch
```

4. **手动编辑文件，解决冲突**
```bash
# 保留需要的代码，删除冲突标记
最终的结果代码
```

5. **使用`git add`标记冲突已解决**
```bash
git add conflicted-file
```

6. **完成合并**
```bash
git commit
```

**冲突解决技巧**：
- 使用`git diff`查看具体冲突
- 与团队成员沟通确认保留哪些修改
- 使用IDE的合并工具辅助解决

### 3.3 变基(Rebase)

变基是将一系列提交应用到另一个分支上的操作，它可以使提交历史更加线性。

```bash
# 变基当前分支到目标分支
git rebase main

# 变基指定分支到目标分支
git rebase main feature-branch

# 交互式变基（可以编辑、删除、合并提交）
git rebase -i HEAD~3

# 继续变基（解决冲突后）
git rebase --continue

# 取消变基
git rebase --abort
```

**变基 vs 合并**：
- **合并**：保留完整的历史，包括分支信息
- **变基**：创建线性的历史，更整洁
- **建议**：个人分支使用变基，公共分支使用合并

## 4. 常见问题解决

### 4.1 推送被拒绝（Push Rejected）

**问题描述**：
```bash
git push origin main
# 错误信息：! [rejected] main -> main (non-fast-forward)
# error: failed to push some refs to 'https://github.com/user/repo.git'
# hint: Updates were rejected because the remote contains work that you do
# hint: not have locally. You may want to first integrate the remote changes
# hint: (e.g., 'git pull ...') before pushing again.
```

**产生原因**：
远程仓库有本地没有的提交，通常是其他团队成员推送了新的代码。

**解决方案**：

**方法1：先拉取再推送（推荐）**
```bash
# 拉取远程更新
git pull origin main

# 如果有冲突，解决冲突
# 然后推送
git push origin main
```

**方法2：使用rebase保持历史整洁**
```bash
# 使用rebase拉取更新
git pull --rebase origin main

# 如果有冲突，解决冲突
git rebase --continue

# 推送
git push origin main
```

**方法3：强制推送（谨慎使用）**
```bash
# 只有在你确定要覆盖远程历史时才使用
git push --force origin main
```

### 4.2 合并冲突（Merge Conflicts）

**问题描述**：
```bash
git merge feature-branch
# Auto-merging README.md
# CONFLICT (content): Merge conflict in README.md
# Automatic merge failed; fix conflicts and then commit the result.
```

**详细解决步骤**：

1. **查看冲突文件**
```bash
git status
# 输出：both modified: README.md
```

2. **打开冲突文件，查看冲突标记**
```bash
<<<<<<< HEAD
当前分支的内容
=======
要合并分支的内容
>>>>>>> feature-branch
```

3. **手动编辑文件解决冲突**
```bash
# 删除冲突标记，保留需要的内容
最终合并后的内容
```

4. **标记冲突已解决**
```bash
git add README.md
```

5. **完成合并**
```bash
git commit
# Git会自动生成合并提交信息
```

**冲突解决技巧**：
- 使用`git diff`查看具体冲突内容
- 使用IDE的可视化合并工具
- 与团队成员沟通确认修改内容

### 4.3 远程仓库配置问题

**修改远程仓库URL**：
```bash
# 查看当前远程仓库
git remote -v

# 修改远程仓库URL
git remote set-url origin https://github.com/user/new-repo.git

# 验证修改
git remote -v
```

### 4.4 完全恢复工作区到初始状态

**场景描述**：
刚刚 `git clone` 下来的仓库，进行了修改后想要完全恢复到最初状态，但运行 `git checkout -- .` 后发现有些文件没有被恢复。

**问题原因**：
`git checkout -- .` 只能恢复**已跟踪文件**的修改，但无法删除**新创建的文件和目录**。这些新文件仍然存在于工作区中，可能导致项目运行异常。

**解决方案**：
```bash
# 步骤1：恢复已跟踪文件的修改
git checkout -- .

# 步骤2：清理所有未跟踪的文件和目录
git clean -fd
```

**完整流程示例**：
```bash
# 查看当前状态
git status
# 输出：Untracked files: (use "git add <file>..." to include in what will be committed)
#         layouts/_default/

# 第一步：恢复已跟踪文件
git checkout -- .

# 第二步：清理未跟踪文件
git clean -fd

# 验证结果
git status
# 输出：On branch main
#       Your branch is up to date with 'origin/main'.
#       nothing to commit, working tree clean
```

**命令参数说明**：
- `git checkout -- .`：恢复所有已跟踪文件的修改到最近一次提交状态
- `git clean -f`：强制删除所有未跟踪的文件（`-f` = force）
- `git clean -fd`：删除所有未跟踪的文件和目录（`-d` = directory）

**其他相关命令**：
```bash
# 查看将要删除的文件（不实际删除）
git clean -n

# 只删除忽略的文件
git clean -fx

# 删除忽略和非忽略的文件，但不删除目录
git clean -fX

# 手动删除特定目录
rm -rf layouts/_default/
```

**注意事项**：
- `git clean` 是一个**破坏性操作**，删除的文件无法通过Git恢复
- 建议先使用 `git clean -n` 预览将要删除的文件
- 确保新创建的文件确实不需要了再执行清理

**记忆口诀**：
> "先 checkout，再 clean，恢复完美如初见"


### 4.5 提交信息写错了

**修改最后一次提交信息**：
```bash
# 修改最后一次提交信息
git commit --amend

# 如果已经推送，需要强制推送
git push --force origin main
```

**修改更早的提交信息**：
```bash
# 交互式变基
git rebase -i HEAD~3

# 在编辑器中将要修改的提交前的pick改为edit
# 保存退出后，Git会停在那个提交上

# 修改提交信息
git commit --amend

# 继续变基
git rebase --continue

# 如果需要强制推送
git push --force origin main
```

### 持续学习
目前只是了解部分git的基础概念和使用方式，后续在实践中还会继续总结一些使用方式，持续更新。
