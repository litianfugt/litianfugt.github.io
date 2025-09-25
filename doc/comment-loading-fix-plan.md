# 随想页面评论加载问题修复计划

## 问题分析

经过代码分析，发现随想页面中第一条随想的评论打开后，无法打开第二条随想评论的问题。具体表现为：评论区域出现，但Giscus评论一直显示加载中，无法正常加载。

### 根本原因

1. **Giscus实例管理不当**：当切换评论区域时，现有的Giscus实例没有被正确清理，导致冲突。
2. **事件监听器冲突**：Giscus的消息事件监听器被多次添加而没有正确清理，导致冲突。
3. **状态管理缺失**：没有适当的状态管理来跟踪当前哪个评论区域是活动的。

## 解决方案

### 1. 改进Giscus清理逻辑

在`layouts/partials/comments.html`中的`loadGiscus`函数需要改进：

```javascript
// 改进后的清理逻辑
function cleanupGiscusInstances(containerId) {
    console.log('Giscus: Cleaning up instances for', containerId);
    
    // 获取指定容器
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn('Giscus: Container not found for cleanup:', containerId);
        return;
    }
    
    const giscusContainer = container.querySelector('.giscus-container');
    if (!giscusContainer) {
        console.warn('Giscus: Giscus container not found for cleanup:', containerId);
        return;
    }
    
    // 移除现有的Giscus框架
    const existingFrame = giscusContainer.querySelector('iframe.giscus-frame');
    if (existingFrame) {
        console.log('Giscus: Removing existing frame in', containerId);
        existingFrame.remove();
    }
    
    // 移除现有的Giscus脚本
    const existingScript = giscusContainer.querySelector('script[src="https://giscus.app/client.js"]');
    if (existingScript) {
        console.log('Giscus: Removing existing script in', containerId);
        existingScript.remove();
    }
    
    // 重置加载提示
    const loading = giscusContainer.querySelector('.giscus-loading');
    if (loading) {
        loading.style.display = 'block';
        loading.textContent = '加载评论中...';
    }
}
```

### 2. 改进事件监听器管理

为了避免事件监听器冲突，需要实现一个事件监听器管理系统：

```javascript
// 事件监听器管理
const giscusEventListeners = {
    listeners: [],
    
    add: function(listener) {
        this.listeners.push(listener);
        window.addEventListener('message', listener);
    },
    
    remove: function(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
            window.removeEventListener('message', listener);
        }
    },
    
    clearAll: function() {
        this.listeners.forEach(listener => {
            window.removeEventListener('message', listener);
        });
        this.listeners = [];
    }
};

// 在loadGiscus函数中使用
function createGiscusMessageHandler(containerId, thoughtId) {
    return function(event) {
        if (event.origin !== 'https://giscus.app') return;
        
        if (event.data && event.data.giscus) {
            const giscusData = event.data.giscus;
            console.log('Giscus: Received message for', thoughtId, giscusData);
            
            // 处理评论数量更新等逻辑...
        }
    };
}
```

### 3. 实现状态管理系统

添加一个状态管理系统来跟踪当前活动的评论区域：

```javascript
// 评论状态管理
const commentState = {
    activeContainer: null,
    isLoading: false,
    
    setActive: function(containerId) {
        // 如果有活动的容器，先清理它
        if (this.activeContainer && this.activeContainer !== containerId) {
            this.cleanup(this.activeContainer);
        }
        
        this.activeContainer = containerId;
        console.log('CommentState: Set active container to', containerId);
    },
    
    cleanup: function(containerId) {
        console.log('CommentState: Cleaning up container', containerId);
        cleanupGiscusInstances(containerId);
        
        // 隐藏容器
        const container = document.getElementById(containerId);
        if (container) {
            container.style.display = 'none';
        }
        
        // 移除按钮的活跃状态
        const thoughtId = containerId.replace('comments-', '');
        const button = document.querySelector(`.comment-btn[data-thought-id="${thoughtId}"]`);
        if (button) {
            button.classList.remove('active');
        }
    },
    
    setLoading: function(loading) {
        this.isLoading = loading;
        console.log('CommentState: Loading state set to', loading);
    }
};
```

### 4. 改进thoughts.js中的评论按钮处理

在`static/js/thoughts.js`中改进评论按钮的点击处理逻辑：

```javascript
// 改进后的评论按钮点击处理
button.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const thoughtId = button.dataset.thoughtId;
    const commentsSection = document.getElementById(`comments-${thoughtId}`);
    
    if (!commentsSection) {
        console.error('Thoughts.js: Comments section not found for thought:', thoughtId);
        return;
    }
    
    // 检查当前评论区域是否可见
    const isVisible = commentsSection.style.display === 'block';
    
    if (isVisible) {
        // 如果评论区域已经可见，则隐藏它
        console.log('Thoughts.js: Hiding comments section:', commentsSection.id);
        commentsSection.style.display = 'none';
        this.classList.remove('active');
        commentState.setActive(null);
    } else {
        // 如果评论区域不可见，则设置当前容器为活动状态
        commentState.setActive(commentsSection.id);
        
        // 显示当前评论区域
        commentsSection.style.display = 'block';
        this.classList.add('active');
        console.log('Thoughts.js: Comments section now visible');
        
        // 加载Giscus
        if (typeof loadGiscus === 'function') {
            commentState.setLoading(true);
            
            // 延迟一点时间确保DOM已经更新
            setTimeout(() => {
                console.log('Thoughts.js: Loading Giscus for', commentsSection.id);
                loadGiscus(commentsSection.id);
                
                // 滚动到评论区域
                setTimeout(() => {
                    commentsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    commentState.setLoading(false);
                }, 300);
            }, 150);
        } else {
            console.error('Thoughts.js: loadGiscus function not available');
            showNotification('评论系统加载失败，请刷新页面重试', 'error');
            commentState.setLoading(false);
        }
    }
    
    console.log('Thoughts.js: Comment button clicked for thought:', thoughtId);
});
```

### 5. 改进loadGiscus函数

在`layouts/partials/comments.html`中改进`loadGiscus`函数：

```javascript
window.loadGiscus = function(targetContainerId = null) {
    console.log('Giscus: loadGiscus function called', targetContainerId ? 'for container: ' + targetContainerId : '');
    
    // 确定要处理的容器
    let commentContainers;
    if (targetContainerId) {
        // 如果指定了容器ID，只处理该容器
        const container = document.getElementById(targetContainerId);
        commentContainers = container ? [container] : [];
    } else {
        // 否则查找所有可见的评论容器
        commentContainers = document.querySelectorAll('.thought-comments[style*="display: block"], .thought-comments:not([style])');
    }
    
    console.log('Giscus: Found', commentContainers.length, 'comment containers to process');
    
    // 清理所有现有的事件监听器
    giscusEventListeners.clearAll();
    
    commentContainers.forEach(container => {
        console.log('Giscus: Processing container:', container.id);
        
        const giscusContainer = container.querySelector('.giscus-container');
        if (!giscusContainer) {
            console.warn('Giscus: No giscus-container found in', container.id);
            return;
        }
        
        // 清理现有的Giscus实例
        cleanupGiscusInstances(container.id);
        
        // 从容器ID中提取thought ID
        const thoughtId = container.id.replace('comments-', '');
        
        // 创建Giscus脚本
        const script = document.createElement('script');
        script.src = 'https://giscus.app/client.js';
        // ... 设置其他属性 ...
        
        // 创建并添加消息事件监听器
        const messageHandler = createGiscusMessageHandler(container.id, thoughtId);
        giscusEventListeners.add(messageHandler);
        
        // 监听Giscus脚本加载事件
        script.addEventListener('load', function() {
            console.log('Giscus: Script loaded for', container.id);
            
            // 隐藏加载提示
            const loading = giscusContainer.querySelector('.giscus-loading');
            if (loading) {
                loading.style.display = 'none';
            }
            
            // 其他处理逻辑...
        });
        
        // 添加错误处理
        script.addEventListener('error', function() {
            console.error('Giscus: Failed to load script for', container.id);
            const loading = giscusContainer.querySelector('.giscus-loading');
            if (loading) {
                loading.textContent = '评论加载失败，请刷新页面重试';
                loading.style.color = '#F44336';
            }
        });
        
        giscusContainer.appendChild(script);
    });
};
```

## 实施步骤

1. **添加详细的日志记录**：在关键函数中添加console.log语句，以便跟踪评论加载过程。
2. **实现Giscus实例清理逻辑**：确保在加载新实例之前正确清理现有实例。
3. **改进事件监听器管理**：实现事件监听器管理系统，避免冲突。
4. **实现状态管理系统**：添加状态管理来跟踪当前活动的评论区域。
5. **改进评论按钮处理逻辑**：更新thoughts.js中的评论按钮点击处理逻辑。
6. **测试解决方案**：确保修复后的代码能够正常工作。

## 预期效果

修复后，用户应该能够：
1. 打开第一条随想的评论
2. 关闭第一条随想的评论
3. 打开第二条随想的评论，且Giscus评论能够正常加载
4. 在多个随想之间自由切换评论，不会出现加载卡住的问题

这个解决方案将确保Giscus实例被正确管理，事件监听器不会冲突，并且有一个清晰的状态管理系统来跟踪当前活动的评论区域。