// unified-comments.js - 统一评论系统
// 重构版本：移除冗余代码，优化架构和错误处理

console.log('Unified Comments: Initializing...');

// 全局配置对象
window.CommentConfig = {
    giscus: null,
    initialized: false,
    currentThought: null,
    floatPanel: null,
    isMobile: window.innerWidth <= 768
};

// 工具函数
const Utils = {
    // 显示通知
    showNotification(message, type = 'info') {
        // 移除已存在的通知
        const existingNotifications = document.querySelectorAll('.comment-notification');
        existingNotifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `comment-notification comment-notification-${type}`;
        notification.textContent = message;
        
        // 设置样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 14px 22px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            max-width: 320px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-weight: 500;
        `;
        
        // 根据类型设置背景色
        const colors = {
            success: '#4CAF50',
            warning: '#FF9800',
            error: '#F44336',
            info: '#2196F3'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // 自动隐藏
        const hideDelay = type === 'error' ? 5000 : 3000;
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, hideDelay);
    },

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 检查元素是否在视口中
    isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
};

// Giscus管理器
const GiscusManager = {
    instances: new Map(),

    // 初始化Giscus配置
    init() {
        if (window.CommentConfig.giscus) {
            console.log('GiscusManager: Configuration already loaded');
            return;
        }

        // 从全局变量获取配置
        if (window.GISCUS_CONFIG) {
            window.CommentConfig.giscus = window.GISCUS_CONFIG;
            console.log('GiscusManager: Configuration loaded from global variable');
        } else {
            console.error('GiscusManager: No configuration found');
            Utils.showNotification('评论系统配置未找到', 'error');
            return;
        }
    },

    // 创建Giscus实例
    createInstance(container, thoughtId) {
        if (!window.CommentConfig.giscus) {
            console.error('GiscusManager: No configuration available');
            return null;
        }

        const config = window.CommentConfig.giscus;
        const uniqueId = this.generateUniqueId(thoughtId);
        
        // 清理现有实例
        if (this.instances.has(thoughtId)) {
            this.removeInstance(thoughtId);
        }

        // 清空容器
        container.innerHTML = '';

        // 显示加载状态
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'giscus-loading';
        loadingDiv.textContent = '加载评论中...';
        container.appendChild(loadingDiv);

        // 创建Giscus脚本
        const script = document.createElement('script');
        script.src = 'https://giscus.app/client.js';
        script.setAttribute('data-repo', config.repo);
        script.setAttribute('data-repo-id', config.repoId);
        script.setAttribute('data-category', config.category);
        script.setAttribute('data-category-id', config.categoryId);
        script.setAttribute('data-mapping', 'specific');
        script.setAttribute('data-term', uniqueId);
        script.setAttribute('data-title', uniqueId);
        script.setAttribute('data-strict', config.strict || '0');
        script.setAttribute('data-reactions-enabled', config.reactionsEnabled || '1');
        script.setAttribute('data-emit-metadata', '1');
        script.setAttribute('data-input-position', config.inputPosition || 'bottom');
        script.setAttribute('data-theme', this.getTheme());
        script.setAttribute('data-lang', config.lang || 'zh-CN');
        script.setAttribute('data-loading', 'eager');
        script.setAttribute('crossorigin', 'anonymous');
        script.setAttribute('async', '');

        // 设置加载超时
        const timeout = setTimeout(() => {
            console.error(`GiscusManager: Loading timeout for ${thoughtId}`);
            if (container.querySelector('.giscus-loading')) {
                container.innerHTML = '<div class="giscus-error">评论加载超时，请刷新页面重试</div>';
                Utils.showNotification('评论加载超时，请刷新页面重试', 'error');
            }
        }, 15000); // 15秒超时

        // 加载事件处理
        script.addEventListener('load', () => {
            clearTimeout(timeout);
            console.log(`GiscusManager: Instance for ${thoughtId} loaded successfully`);
            this.instances.set(thoughtId, { container, script, uniqueId, loaded: false });
            
            // 等待Giscus完全初始化
            this.waitForGiscusLoad(thoughtId, container);
        });

        script.addEventListener('error', () => {
            clearTimeout(timeout);
            console.error(`GiscusManager: Failed to load instance for ${thoughtId}`);
            container.innerHTML = '<div class="giscus-error">评论加载失败，请刷新页面重试</div>';
            Utils.showNotification('评论加载失败，请刷新页面重试', 'error');
        });

        // 监听Giscus消息事件
        this.setupGiscusMessageListener(thoughtId);
        
        // 添加脚本到容器
        container.appendChild(script);
        
        return script;
    },

    // 等待Giscus完全加载
    waitForGiscusLoad(thoughtId, container, retries = 0) {
        const maxRetries = 30; // 最多等待30秒
        const checkInterval = 1000; // 每秒检查一次

        const checkGiscus = () => {
            const giscusContainer = container.querySelector('.giscus-frame');
            
            if (giscusContainer) {
                // Giscus已加载完成
                console.log(`GiscusManager: Giscus frame found for ${thoughtId}`);
                
                // 清除加载状态
                const loadingElement = container.querySelector('.giscus-loading');
                if (loadingElement) {
                    loadingElement.remove();
                }
                
                // 标记为已加载
                const instance = this.instances.get(thoughtId);
                if (instance) {
                    instance.loaded = true;
                }
                
                // 更新评论计数
                this.updateCommentCount(thoughtId);
                
                // 尝试获取评论数量
                this.fetchCommentCount(thoughtId);
                
            } else if (retries < maxRetries) {
                // 继续等待
                setTimeout(() => {
                    this.waitForGiscusLoad(thoughtId, container, retries + 1);
                }, checkInterval);
            } else {
                // 超时
                console.error(`GiscusManager: Giscus frame not found for ${thoughtId} after ${maxRetries} seconds`);
                container.innerHTML = '<div class="giscus-error">评论初始化失败，请刷新页面重试</div>';
                Utils.showNotification('评论初始化失败，请刷新页面重试', 'error');
            }
        };

        setTimeout(checkGiscus, checkInterval);
    },

    // 设置Giscus消息监听器
    setupGiscusMessageListener(thoughtId) {
        const messageHandler = (event) => {
            if (event.origin !== 'https://giscus.app') return;
            
            console.log('GiscusManager: Received message:', event.data);
            
            if (event.data && event.data.giscus) {
                const giscusData = event.data.giscus;
                const { discussion, config } = giscusData;
                
                // 处理讨论数据更新
                if (discussion && this.instances.has(thoughtId)) {
                    const commentCount = discussion.totalCommentCount || 0;
                    
                    // 更新评论计数
                    this.updateCommentCount(thoughtId, commentCount);
                    console.log(`GiscusManager: Comment count updated for ${thoughtId}: ${commentCount}`);
                    
                    // 保存到本地存储以便持久化
                    this.saveCommentCount(thoughtId, commentCount);
                }
                
                // 处理配置更新事件
                if (config && config讨论) {
                    console.log('GiscusManager: Config updated:', config);
                }
                
                // 处理其他Giscus事件
                if (giscusData.error) {
                    console.error('GiscusManager: Giscus error:', giscusData.error);
                }
            }
        };

        window.addEventListener('message', messageHandler);
        
        // 保存事件处理器引用以便清理
        const instance = this.instances.get(thoughtId);
        if (instance) {
            instance.messageHandler = messageHandler;
        }
    },

    // 保存评论计数到本地存储
    saveCommentCount(thoughtId, count) {
        try {
            const storageKey = `giscus-comment-count-${thoughtId}`;
            localStorage.setItem(storageKey, count.toString());
        } catch (error) {
            console.warn('GiscusManager: Failed to save comment count to localStorage:', error);
        }
    },

    // 从本地存储加载评论计数
    loadCommentCount(thoughtId) {
        try {
            const storageKey = `giscus-comment-count-${thoughtId}`;
            const count = localStorage.getItem(storageKey);
            return count ? parseInt(count, 10) : null;
        } catch (error) {
            console.warn('GiscusManager: Failed to load comment count from localStorage:', error);
            return null;
        }
    },

    // 通过GitHub API获取评论数量
    async fetchCommentCount(thoughtId) {
        try {
            const config = window.CommentConfig.giscus;
            const uniqueId = this.generateUniqueId(thoughtId);
            
            // 构建API查询
            const query = `
                query {
                    repository(owner: "${config.repo.split('/')[0]}", name: "${config.repo.split('/')[1]}") {
                        discussions(first: 100, categoryId: "${config.categoryId}") {
                            nodes {
                                title
                                comments(first: 1) {
                                    totalCount
                                }
                            }
                        }
                    }
                }
            `;

            const response = await fetch('https://api.github.com/graphql', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getGitHubToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query })
            });

            if (response.ok) {
                const data = await response.json();
                const discussions = data.data?.repository?.discussions?.nodes || [];
                
                // 查找匹配的讨论
                const discussion = discussions.find(d => d.title === uniqueId);
                if (discussion) {
                    const count = discussion.comments?.totalCount || 0;
                    this.updateCommentCount(thoughtId, count);
                }
            }
        } catch (error) {
            console.warn(`GiscusManager: Failed to fetch comment count for ${thoughtId}:`, error);
        }
    },

    // 获取GitHub Token（如果有）
    getGitHubToken() {
        // 这里可以配置GitHub Token来提高API限制
        // 为了安全，建议通过环境变量或配置文件设置
        return ''; // 暂时不使用Token
    },

    // 移除Giscus实例
    removeInstance(thoughtId) {
        if (this.instances.has(thoughtId)) {
            const instance = this.instances.get(thoughtId);
            if (instance.container) {
                instance.container.innerHTML = '';
            }
            this.instances.delete(thoughtId);
            console.log(`GiscusManager: Instance for ${thoughtId} removed`);
        }
    },

    // 生成唯一ID
    generateUniqueId(thoughtId) {
        const pagePath = window.location.pathname;
        return `${pagePath}#${thoughtId}`;
    },

    // 获取主题
    getTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
                      (!document.documentElement.getAttribute('data-theme') && 
                       window.matchMedia('(prefers-color-scheme: dark)').matches);
        return isDark ? 'dark' : 'light';
    },

    // 更新评论计数
    updateCommentCount(thoughtId, count = null) {
        const countSpans = document.querySelectorAll(`.comment-count[data-thought-id="${thoughtId}"]`);
        
        countSpans.forEach(span => {
            if (count !== null && typeof count === 'number') {
                // 显示实际数量
                if (count === 0) {
                    span.textContent = '评论';
                } else if (count === 1) {
                    span.textContent = '1条评论';
                } else {
                    span.textContent = `${count}条评论`;
                }
                
                // 添加更新动画
                span.style.transition = 'all 0.3s ease';
                span.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    span.style.transform = 'scale(1)';
                }, 200);
            } else {
                // 尝试从本地存储加载
                const savedCount = this.loadCommentCount(thoughtId);
                if (savedCount !== null) {
                    this.updateCommentCount(thoughtId, savedCount);
                } else {
                    // 显示加载状态或默认状态
                    span.textContent = '💬';
                }
            }
        });

        // 更新浮窗面板的徽章
        this.updateFloatPanelBadge(thoughtId, count);
    },

    // 更新浮窗面板徽章
    updateFloatPanelBadge(thoughtId, count = null) {
        const badge = document.getElementById('comment-badge');
        if (badge) {
            if (count !== null && typeof count === 'number') {
                if (count === 0) {
                    badge.textContent = '0';
                } else {
                    badge.textContent = count.toString();
                }
            } else {
                badge.textContent = '💬';
            }
        }
    },
};

// 浮窗评论管理器
const FloatPanelManager = {
    init() {
        this.panel = document.getElementById('comment-float-panel');
        this.expandedPanel = document.getElementById('comment-panel-expanded');
        this.minimizedPanel = document.getElementById('comment-panel-minimized');
        this.restoreBtn = document.getElementById('comment-panel-restore');
        this.closeBtn = document.getElementById('comment-panel-close');
        this.minimizeBtn = document.getElementById('comment-panel-minimize');
        
        if (!this.panel) {
            console.error('FloatPanelManager: Panel not found');
            return;
        }

        this.bindEvents();
        this.setupDragAndDrop();
    },

    bindEvents() {
        if (this.restoreBtn) {
            this.restoreBtn.addEventListener('click', () => this.expand());
        }
        
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        
        if (this.minimizeBtn) {
            this.minimizeBtn.addEventListener('click', () => this.minimize());
        }

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.close();
            }
        });
    },

    setupDragAndDrop() {
        const header = document.querySelector('.comment-panel-header');
        if (!header) return;

        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            if (window.CommentConfig.isMobile) return;
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === header || header.contains(e.target)) {
                isDragging = true;
                header.style.cursor = 'grabbing';
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                FloatPanelManager.panel.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        }

        function dragEnd() {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            if (header) {
                header.style.cursor = 'grab';
            }
        }
    },

    show(thoughtId, title) {
        if (!this.panel) return;

        this.currentThought = thoughtId;
        
        // 更新标题
        const titleElement = document.getElementById('comment-panel-title');
        if (titleElement) {
            titleElement.textContent = title || '评论';
        }

        // 加载评论
        this.loadComments(thoughtId);

        // 显示面板
        this.panel.style.display = 'block';
        this.expandedPanel.style.display = 'block';
        this.minimizedPanel.style.display = 'none';

        // 添加显示动画
        setTimeout(() => {
            this.panel.classList.add('visible');
        }, 10);
    },

    hide() {
        if (!this.panel) return;

        this.panel.classList.remove('visible');
        setTimeout(() => {
            this.panel.style.display = 'none';
            this.currentThought = null;
        }, 300);
    },

    expand() {
        if (this.expandedPanel && this.minimizedPanel) {
            this.expandedPanel.style.display = 'block';
            this.minimizedPanel.style.display = 'none';
        }
    },

    minimize() {
        if (this.expandedPanel && this.minimizedPanel) {
            this.expandedPanel.style.display = 'none';
            this.minimizedPanel.style.display = 'block';
            this.updateCommentBadge();
        }
    },

    close() {
        this.hide();
    },

    isVisible() {
        return this.panel && this.panel.style.display !== 'none';
    },

    loadComments(thoughtId) {
        const container = document.getElementById('float-giscus-comments');
        if (!container) return;

        GiscusManager.createInstance(container, thoughtId);
    },

    updateCommentBadge() {
        const badge = document.getElementById('comment-badge');
        if (badge && this.currentThought) {
            // 这里可以获取实际评论数量
            badge.textContent = '💬';
        }
    }
};

// 内联评论管理器
const InlineCommentsManager = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        // 评论按钮点击事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('.comment-btn')) {
                const btn = e.target.closest('.comment-btn');
                const thoughtId = btn.dataset.thoughtId;
                this.toggleInlineComments(thoughtId);
            }

            // 关闭按钮点击事件
            if (e.target.closest('.close-comments-btn')) {
                const btn = e.target.closest('.close-comments-btn');
                const thoughtId = btn.dataset.thoughtId;
                this.hideInlineComments(thoughtId);
            }
        });
    },

    toggleInlineComments(thoughtId) {
        const container = document.getElementById(`comments-${thoughtId}`);
        if (!container) return;

        if (container.style.display === 'block') {
            this.hideInlineComments(thoughtId);
        } else {
            this.showInlineComments(thoughtId);
        }
    },

    showInlineComments(thoughtId) {
        const container = document.getElementById(`comments-${thoughtId}`);
        const giscusWrapper = document.getElementById(`giscus-${thoughtId}`);
        
        if (!container || !giscusWrapper) return;

        // 隐藏其他评论
        this.hideAllInlineComments();

        // 显示当前评论
        container.style.display = 'block';
        
        // 加载评论
        GiscusManager.createInstance(giscusWrapper, thoughtId);

        // 滚动到评论区域
        setTimeout(() => {
            if (Utils.isElementInViewport(container)) {
                container.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
    },

    hideInlineComments(thoughtId) {
        const container = document.getElementById(`comments-${thoughtId}`);
        if (container) {
            container.style.display = 'none';
        }
        GiscusManager.removeInstance(thoughtId);
    },

    hideAllInlineComments() {
        const allContainers = document.querySelectorAll('.thought-comments-container');
        allContainers.forEach(container => {
            container.style.display = 'none';
        });

        // 清理所有实例
        GiscusManager.instances.forEach((instance, thoughtId) => {
            GiscusManager.removeInstance(thoughtId);
        });
    }
};

// 评论计数管理器
const CommentCounter = {
    init() {
        this.updateAllCounts();
    },

    updateAllCounts() {
        const thoughtCards = document.querySelectorAll('.thought-card');
        thoughtCards.forEach(card => {
            const thoughtId = card.dataset.thoughtId;
            if (thoughtId) {
                this.updateCount(thoughtId);
            }
        });
    },

    updateCount(thoughtId) {
        // 尝试从本地存储加载评论计数
        const savedCount = GiscusManager.loadCommentCount(thoughtId);
        if (savedCount !== null) {
            GiscusManager.updateCommentCount(thoughtId, savedCount);
        } else {
            // 显示默认状态
            GiscusManager.updateCommentCount(thoughtId);
        }
    },

    // 手动刷新所有评论计数
    refreshAllCounts() {
        console.log('CommentCounter: Refreshing all comment counts...');
        
        const thoughtCards = document.querySelectorAll('.thought-card');
        thoughtCards.forEach(card => {
            const thoughtId = card.dataset.thoughtId;
            if (thoughtId) {
                // 尝试通过API获取最新计数
                GiscusManager.fetchCommentCount(thoughtId);
            }
        });
    }
};

// 主题切换监听
const ThemeManager = {
    init() {
        // 监听主题变化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    this.updateGiscusTheme();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            this.updateGiscusTheme();
        });
    },

    updateGiscusTheme() {
        const theme = GiscusManager.getTheme();
        const giscusFrames = document.querySelectorAll('iframe.giscus-frame');
        
        giscusFrames.forEach(frame => {
            try {
                frame.contentWindow.postMessage({
                    giscus: {
                        setConfig: {
                            theme: theme
                        }
                    }
                }, 'https://giscus.app');
            } catch (error) {
                console.warn('ThemeManager: Failed to update Giscus theme:', error);
            }
        });
    }
};

// 主初始化函数
function initUnifiedComments() {
    console.log('Unified Comments: Starting initialization...');

    try {
        // 初始化配置
        GiscusManager.init();
        if (!window.CommentConfig.giscus) {
            console.error('Unified Comments: Initialization failed - no configuration');
            return;
        }

        // 初始化各个管理器
        FloatPanelManager.init();
        InlineCommentsManager.init();
        CommentCounter.init();
        ThemeManager.init();

        // 标记为已初始化
        window.CommentConfig.initialized = true;

        console.log('Unified Comments: Initialization completed successfully');

        // 显示成功通知
        Utils.showNotification('评论系统初始化成功', 'success');

    } catch (error) {
        console.error('Unified Comments: Initialization failed:', error);
        Utils.showNotification('评论系统初始化失败', 'error');
    }
}

// 响应式处理
function handleResize() {
    const wasMobile = window.CommentConfig.isMobile;
    window.CommentConfig.isMobile = window.innerWidth <= 768;
    
    if (wasMobile !== window.CommentConfig.isMobile) {
        console.log('Unified Comments: Mobile mode changed:', window.CommentConfig.isMobile);
        
        // 如果切换到移动端，关闭浮窗
        if (window.CommentConfig.isMobile && FloatPanelManager.isVisible()) {
            FloatPanelManager.close();
        }
    }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUnifiedComments);
} else {
    initUnifiedComments();
}

// 监听窗口大小变化
window.addEventListener('resize', Utils.debounce(handleResize, 250));

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    console.log('Unified Comments: Cleaning up...');
    GiscusManager.instances.forEach((instance, thoughtId) => {
        GiscusManager.removeInstance(thoughtId);
    });
});

// 导出到全局作用域（用于调试）
window.UnifiedComments = {
    GiscusManager,
    FloatPanelManager,
    InlineCommentsManager,
    CommentCounter,
    Utils
};

console.log('Unified Comments: Script loaded');
