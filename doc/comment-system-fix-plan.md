# 评论系统修复计划

## 问题分析

### 1. 博客页面评论区显示"加载评论中..."但不加载的问题

**原因分析：**
- 在 `layouts/partials/post-comments.html` 中，Giscus 评论系统通过 `DOMContentLoaded` 事件自动加载
- 可能存在脚本加载时序问题，导致 Giscus 无法正确初始化
- 缺少错误处理和重试机制

**修复方案：**
1. 增加更可靠的加载机制，使用 `window.onload` 事件替代或补充 `DOMContentLoaded`
2. 添加错误处理和重试逻辑
3. 增加调试日志，便于排查问题
4. 确保 Giscus 配置参数正确传递

### 2. 随想页面评论按钮旁边评论个数显示为0的问题

**原因分析：**
- 在 `static/js/thoughts.js` 中，评论计数初始化函数 `initializeCommentCounts` 可能没有正确获取到评论数量
- 评论数据可能存储在本地存储中，但没有正确读取
- Giscus 评论加载后没有更新评论计数

**修复方案：**
1. 修复 `initializeCommentCounts` 函数，确保正确获取评论数量
2. 在 Giscus 评论加载完成后，更新评论计数
3. 添加从 Giscus 获取评论数量的机制
4. 增加调试日志，便于排查问题

### 3. 随想页面评论切换时需要多次点击才能加载的问题

**原因分析：**
- 在 `layouts/partials/comments.html` 中的 `CommentManager` 类，切换评论时可能存在状态管理问题
- 异步操作处理不当，导致需要多次点击才能正确加载评论
- 评论实例的激活和停用逻辑可能存在竞态条件

**修复方案：**
1. 优化 `CommentManager` 类中的 `activateInstance` 方法
2. 改进异步操作处理，确保评论切换的流畅性
3. 修复评论实例的状态管理问题
4. 添加加载状态指示，提升用户体验

## 修复步骤

### 第一步：修复博客页面评论区加载问题

1. 修改 `layouts/partials/post-comments.html`：
   - 增加更可靠的加载机制
   - 添加错误处理和重试逻辑
   - 增加调试日志

2. 确保 Giscus 配置正确：
   - 检查 `hugo.toml` 中的 Giscus 配置
   - 确保仓库 ID 和类别 ID 正确

### 第二步：修复随想页面评论计数问题

1. 修改 `static/js/thoughts.js`：
   - 修复 `initializeCommentCounts` 函数
   - 添加从 Giscus 获取评论数量的机制
   - 在 Giscus 评论加载完成后更新评论计数

2. 修改 `layouts/partials/comments.html`：
   - 在 Giscus 加载完成后触发评论计数更新事件

### 第三步：修复随想页面评论切换问题

1. 修改 `layouts/partials/comments.html`：
   - 优化 `CommentManager` 类的 `activateInstance` 方法
   - 改进异步操作处理
   - 修复评论实例的状态管理问题

2. 修改 `static/js/thoughts.js`：
   - 优化评论按钮点击事件处理
   - 添加加载状态指示

## 测试计划

1. 测试博客页面评论区是否正常加载
2. 测试随想页面评论计数是否正确显示
3. 测试随想页面评论切换是否流畅
4. 测试评论功能是否正常工作

## 预期效果

1. 博客页面评论区能够正常加载和显示
2. 随想页面评论按钮旁边能够正确显示评论数量
3. 随想页面评论切换流畅，不需要多次点击
4. 整体评论系统稳定可靠