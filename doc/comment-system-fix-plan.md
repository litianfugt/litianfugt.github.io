# 评论系统修复计划

## 问题分析

经过代码分析，发现博客评论系统存在以下问题：

1. **CommentManager 初始化问题**：`CommentManager` 在 `layouts/partials/comments.html` 中定义，但存在时序问题，导致在 `thoughts.js` 尝试访问时不可用。

2. **脚本加载顺序问题**：在 `layouts/thoughts/list.html` 中，`thoughts.js` 脚本在页面底部加载，但 `CommentManager` 在 `comments.html` 中定义，可能尚未加载完成。

3. **缺少错误处理**：当 `CommentManager` 不可用时，系统显示错误"评论系统未正确加载，请刷新页面重试"，但没有尝试恢复。

4. **评论系统实现不一致**：存在两种不同的评论系统实现：
   - `layouts/partials/comments.html` 中的基于 Giscus 的自定义系统
   - `themes/PaperMod/layouts/partials/comments.html` 中的基本评论表单

## 详细问题

1. 在 `static/js/thoughts.js` 中，有对 `window.commentManager` 的检查，但由于 `CommentManager` 尚未初始化，导致检查失败。

2. `layouts/thoughts/list.html` 中的调试脚本尝试在 `CommentManager` 类可用时创建实例，但 `comments.html` 中的实现不是定义为类，而是定义为对象字面量。

3. `layouts/partials/comments.html` 中的评论系统是为 Giscus 设计的，但实现在实例管理和清理方面存在问题。

## 修复方案

### 1. 重构 CommentManager

将 `layouts/partials/comments.html` 中的 `CommentManager` 从对象字面量转换为适当的类，提供更好的初始化和错误处理。

```javascript
// 新的 CommentManager 类实现
class CommentManager {
    constructor() {
        this.instances = new Map();
        this.activeInstance = null;
        this.initialized = true;
        console.log('CommentManager: Initialized successfully');
    }
    
    // 获取或创建评论实例
    getInstance(thoughtId) {
        if (!this.instances.has(thoughtId)) {
            console.log('CommentManager: Creating new instance for thought:', thoughtId);
            this.instances.set(thoughtId, {
                thoughtId: thoughtId,
                containerId: `comments-${thoughtId}`,
                container: null,
                isActive: false,
                isLoading: false,
                
                // 创建评论容器
                createContainer: function() {
                    const placeholder = document.getElementById(`comments-placeholder-${this.thoughtId}`);
                    if (!placeholder) {
                        console.error('CommentInstance: Placeholder not found for thought:', this.thoughtId);
                        return;
                    }
                    
                    this.container = document.createElement('div');
                    this.container.id = this.containerId;
                    this.container.className = 'thought-comments';
                    this.container.style.display = 'block';
                    
                    this.container.innerHTML = `
                        <div class="giscus-container">
                            <div class="giscus-loading">加载评论中...</div>
                        </div>
                    `;
                    
                    placeholder.parentNode.replaceChild(this.container, placeholder);
                    console.log('CommentInstance: Created container for thought:', this.thoughtId);
                },
                
                // 加载Giscus
                loadGiscus: function() {
                    const giscusContainer = this.container.querySelector('.giscus-container');
                    if (!giscusContainer) return;
                    
                    // 清理现有的Giscus实例
                    const existingFrame = giscusContainer.querySelector('iframe.giscus-frame');
                    if (existingFrame) {
                        existingFrame.remove();
                    }
                    
                    const existingScript = giscusContainer.querySelector('script[src="https://giscus.app/client.js"]');
                    if (existingScript) {
                        existingScript.remove();
                    }
                    
                    // 获取随想信息
                    const thoughtCard = document.querySelector(`.thought-card[data-thought-id="${this.thoughtId}"]`);
                    let thoughtContent = '';
                    let thoughtTitle = `随想 ${this.thoughtId}`;
                    
                    if (thoughtCard) {
                        const contentElement = thoughtCard.querySelector('.thought-content');
                        if (contentElement) {
                            const contentText = contentElement.textContent.trim();
                            thoughtContent = contentText;
                            thoughtTitle = contentText.substring(0, 50) + (contentText.length > 50 ? '...' : '');
                        }
                    }
                    
                    // 创建Giscus脚本
                    const script = document.createElement('script');
                    script.src = 'https://giscus.app/client.js';
                    
                    const pagePath = window.location.pathname;
                    const uniqueId = `${pagePath}#${this.thoughtId}`;
                    
                    script.setAttribute('data-repo', '{{ .Site.Params.comments.giscus.repo }}');
                    script.setAttribute('data-repo-id', '{{ .Site.Params.comments.giscus.repoId }}');
                    script.setAttribute('data-category', '{{ .Site.Params.comments.giscus.category }}');
                    script.setAttribute('data-category-id', '{{ .Site.Params.comments.giscus.categoryId }}');
                    script.setAttribute('data-mapping', 'specific');
                    script.setAttribute('data-term', uniqueId);
                    script.setAttribute('data-title', thoughtTitle);
                    if (thoughtContent) {
                        script.setAttribute('data-description', thoughtContent);
                    }
                    script.setAttribute('data-strict', '{{ .Site.Params.comments.giscus.strict | default "0" }}');
                    script.setAttribute('data-reactions-enabled', '{{ .Site.Params.comments.giscus.reactionsEnabled | default "1" }}');
                    script.setAttribute('data-emit-metadata', '{{ .Site.Params.comments.giscus.emitMetadata | default "0" }}');
                    script.setAttribute('data-input-position', '{{ .Site.Params.comments.giscus.inputPosition | default "bottom" }}');
                    script.setAttribute('data-theme', '{{ .Site.Params.comments.giscus.theme | default "preferred_color_scheme" }}');
                    script.setAttribute('data-lang', '{{ .Site.Params.comments.giscus.lang | default "zh-CN" }}');
                    script.setAttribute('data-loading', '{{ .Site.Params.comments.giscus.loading | default "eager" }}');
                    script.setAttribute('crossorigin', 'anonymous');
                    script.setAttribute('async', '');
                    
                    // 设置加载事件
                    script.addEventListener('load', () => {
                        console.log('CommentInstance: Giscus loaded for thought:', this.thoughtId);
                        const loading = giscusContainer.querySelector('.giscus-loading');
                        if (loading) {
                            loading.style.display = 'none';
                        }
                    });
                    
                    script.addEventListener('error', () => {
                        console.error('CommentInstance: Giscus load error for thought:', this.thoughtId);
                        const loading = giscusContainer.querySelector('.giscus-loading');
                        if (loading) {
                            loading.textContent = '评论加载失败，请刷新页面重试';
                            loading.style.color = '#F44336';
                        }
                    });
                    
                    giscusContainer.appendChild(script);
                    console.log('CommentInstance: Loading Giscus for thought:', this.thoughtId);
                },
                
                // 显示评论
                show: function() {
                    if (this.container) {
                        this.container.style.display = 'block';
                        console.log('CommentInstance: Showing comments for thought:', this.thoughtId);
                    }
                },
                
                // 隐藏评论
                hide: function() {
                    if (this.container) {
                        this.container.style.display = 'none';
                        console.log('CommentInstance: Hiding comments for thought:', this.thoughtId);
                    }
                },
                
                // 加载评论
                load: async function() {
                    if (this.isActive) return;
                    
                    this.isLoading = true;
                    this.createContainer();
                    this.loadGiscus();
                    this.isActive = true;
                    this.isLoading = false;
                },
                
                // 销毁评论实例
                destroy: function() {
                    console.log('CommentInstance: Destroying instance for thought:', this.thoughtId);
                    
                    if (this.container && this.container.parentNode) {
                        const placeholder = document.createElement('div');
                        placeholder.id = `comments-placeholder-${this.thoughtId}`;
                        placeholder.className = 'thought-comments-placeholder';
                        placeholder.setAttribute('data-thought-id', this.thoughtId);
                        
                        this.container.parentNode.replaceChild(placeholder, this.container);
                        this.container = null;
                    }
                    
                    this.isActive = false;
                    this.isLoading = false;
                }
            });
        }
        return this.instances.get(thoughtId);
    }
    
    // 激活评论实例
    async activateInstance(thoughtId) {
        console.log('CommentManager: Activating instance for thought:', thoughtId);
        
        // 如果有活动的实例且不同，先停用它
        if (this.activeInstance && this.activeInstance.thoughtId !== thoughtId) {
            console.log('CommentManager: Deactivating current instance for thought:', this.activeInstance.thoughtId);
            this.activeInstance.hide();
        }
        
        const instance = this.getInstance(thoughtId);
        this.activeInstance = instance;
        
        if (!instance.isActive) {
            console.log('CommentManager: Loading new instance for thought:', thoughtId);
            await instance.load();
        }
        
        instance.show();
        console.log('CommentManager: Instance activated for thought:', thoughtId);
    }
    
    // 停用当前实例
    deactivateCurrentInstance() {
        if (this.activeInstance) {
            console.log('CommentManager: Deactivating current instance for thought:', this.activeInstance.thoughtId);
            this.activeInstance.hide();
            this.activeInstance = null;
        }
    }
}

// 创建全局 CommentManager 实例
window.CommentManager = CommentManager;
window.commentManager = new CommentManager();
```

### 2. 更新 thoughts.js 中的 CommentManager 处理

修改 `static/js/thoughts.js` 中的代码，以正确处理 CommentManager 的可用性：

```javascript
// 在 initializeCommentButtons 函数中更新检查逻辑
button.addEventListener('click', async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const thoughtId = button.dataset.thoughtId;
    console.log('Thoughts.js: Comment button clicked for thought:', thoughtId);
    
    // 检查 CommentManager 是否可用
    let commentManager = window.commentManager;
    
    // 如果 CommentManager 不可用，尝试创建它
    if (!commentManager && window.CommentManager) {
        console.log('Thoughts.js: CommentManager class available but instance not found, creating instance...');
        commentManager = new window.CommentManager();
        window.commentManager = commentManager;
    }
    
    if (!commentManager) {
        console.error('Thoughts.js: CommentManager not available');
        showNotification('评论系统未正确加载，请刷新页面重试', 'error');
        return;
    }
    
    // 检查评论当前是否可见
    const isActive = button.classList.contains('active');
    
    try {
        if (isActive) {
            // 隐藏评论
            console.log('Thoughts.js: Hiding comments for thought:', thoughtId);
            button.classList.remove('active');
            
            // 使用 CommentManager 停用
            commentManager.deactivateCurrentInstance();
        } else {
            // 显示评论
            console.log('Thoughts.js: Showing comments for thought:', thoughtId);
            button.classList.add('active');
            
            // 使用 CommentManager 激活
            await commentManager.activateInstance(thoughtId);
            
            // 短暂延迟后滚动到评论
            setTimeout(() => {
                const commentsContainer = document.getElementById(`comments-${thoughtId}`);
                if (commentsContainer) {
                    commentsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 300);
        }
        
        console.log('Thoughts.js: Comment button click handler completed for thought:', thoughtId);
    } catch (error) {
        console.error('Thoughts.js: Error handling comment button click:', error);
        showNotification('评论加载失败，请刷新页面重试', 'error');
        
        // 重置按钮状态
        button.classList.remove('active');
    }
});
```

### 3. 修复脚本加载顺序

在 `layouts/thoughts/list.html` 中，确保 CommentManager 在 thoughts.js 之前加载：

```html
<!-- 确保 CommentManager 在 thoughts.js 之前加载 -->
{{ partial "comments.html" . }}

<!-- Include the thoughts JavaScript at the end of the page -->
<script src="/static/js/thoughts.js"></script>
```

### 4. 添加错误处理和回退机制

在 `layouts/partials/comments.html` 中添加更好的错误处理：

```javascript
// 添加全局错误处理
window.addEventListener('error', function(e) {
    if (e.message.includes('commentManager') || e.message.includes('CommentManager')) {
        console.error('Global error handler caught CommentManager error:', e);
        // 可以在这里添加恢复逻辑或显示用户友好的错误消息
    }
});

// 添加未处理的 Promise 拒绝处理
window.addEventListener('unhandledrejection', function(e) {
    if (e.reason && e.reason.message && e.reason.message.includes('commentManager')) {
        console.error('Unhandled promise rejection related to CommentManager:', e.reason);
    }
});
```

## 实施步骤

1. **重构 CommentManager**：将 `layouts/partials/comments.html` 中的 CommentManager 从对象字面量转换为类。

2. **更新 thoughts.js**：修改 `static/js/thoughts.js` 中的代码，以正确处理 CommentManager 的可用性。

3. **修复脚本加载顺序**：确保 CommentManager 在 thoughts.js 之前加载。

4. **添加错误处理**：实现更好的错误处理和回退机制。

5. **测试修复**：验证修复后的代码能够正常工作。

## 预期效果

修复后，用户应该能够：
1. 点击任何随想的评论按钮，评论系统能够正确加载
2. 在多个随想之间自由切换评论，不会出现加载卡住的问题
3. 即使出现错误，系统也能提供更好的错误处理和恢复机制
4. 评论系统能够在各种网络条件下稳定工作

这个解决方案将确保 CommentManager 被正确初始化和管理，脚本按正确的顺序加载，并且有健壮的错误处理机制。