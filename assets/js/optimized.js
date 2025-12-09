// 优化版JavaScript - 简洁高效的博客功能
// 设计原则：简洁、高效、可维护、紧凑

(function() {
    'use strict';
    
    // 配置常量
    const CONFIG = {
        STORAGE_PREFIX: 'blog-comments-',
        NOTIFICATION_DURATION: 3000
    };

    // 工具函数
    const utils = {
        // 安全获取本地存储数据
        getStorage: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.warn('读取存储失败:', key, error);
                return defaultValue;
            }
        },
        
        // 安全设置本地存储数据
        setStorage: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('写入存储失败:', key, error);
                return false;
            }
        },
        
        // 防抖函数
        debounce: (func, wait) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func(...args), wait);
            };
        }
    };

    // 通知系统
    const notification = {
        show: (message, type = 'info') => {
            // 移除已存在的通知
            document.querySelectorAll('.notification').forEach(n => n.remove());
            
            const element = document.createElement('div');
            element.className = `notification notification-${type}`;
            element.textContent = message;
            
            // 设置样式
            Object.assign(element.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '12px 20px',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px',
                zIndex: '1000',
                opacity: '0',
                transform: 'translateX(100%)',
                transition: 'all 0.3s ease',
                maxWidth: '300px',
                wordWrap: 'break-word',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                fontWeight: '500'
            });
            
            // 设置背景色
            const colors = {
                success: '#4CAF50',
                warning: '#FF9800',
                error: '#F44336',
                info: '#2196F3'
            };
            
            element.style.backgroundColor = colors[type] || colors.info;
            
            document.body.appendChild(element);
            
            // 显示动画
            requestAnimationFrame(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateX(0)';
            });
            
            // 自动隐藏
            setTimeout(() => {
                element.style.opacity = '0';
                element.style.transform = 'translateX(100%)';
                setTimeout(() => element.remove(), 300);
            }, CONFIG.NOTIFICATION_DURATION);
        }
    };

    // 评论功能
    class CommentSystem {
        constructor() {
            this.currentThoughtId = null;
            this.init();
        }
        
        init() {
            this.bindEvents();
            this.loadCommentCounts();
            this.optimizeForMobile();
        }
        
        bindEvents() {
            // 评论按钮点击事件
            document.addEventListener('click', (e) => {
                if (e.target.closest('.comment-btn')) {
                    const btn = e.target.closest('.comment-btn');
                    const thoughtId = btn.dataset.thoughtId;
                    this.toggleComments(thoughtId);
                }
                
                // 关闭按钮点击事件
                if (e.target.closest('.close-comments-btn')) {
                    const btn = e.target.closest('.close-comments-btn');
                    const thoughtId = btn.dataset.thoughtId;
                    this.hideComments(thoughtId);
                }
                
                // 评论提交按钮
                if (e.target.closest('.comment-submit')) {
                    const btn = e.target.closest('.comment-submit');
                    const thoughtId = btn.dataset.thoughtId;
                    this.submitComment(thoughtId);
                }
            });
            
            // 回车键提交评论
            document.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.classList.contains('comment-input') && !e.shiftKey) {
                    e.preventDefault();
                    const thoughtId = e.target.closest('.thought-comments-container')?.id?.replace('comments-', '');
                    if (thoughtId) {
                        this.submitComment(thoughtId);
                    }
                }
            });
        }
        
        toggleComments(thoughtId) {
            const container = document.getElementById(`comments-${thoughtId}`);
            if (!container) return;
            
            // 如果点击的是当前已打开的评论，直接关闭
            if (this.currentThoughtId === thoughtId && container.style.display === 'block') {
                this.hideComments(thoughtId);
                return;
            }
            
            // 隐藏所有评论容器
            this.hideAllComments();
            
            // 显示目标评论容器
            container.style.display = 'block';
            this.currentThoughtId = thoughtId;
            
            // 加载评论
            this.loadComments(thoughtId);
            
            // 滚动到评论区域
            setTimeout(() => {
                container.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
        
        hideComments(thoughtId) {
            const container = document.getElementById(`comments-${thoughtId}`);
            if (container) {
                container.style.display = 'none';
            }
            
            if (this.currentThoughtId === thoughtId) {
                this.currentThoughtId = null;
            }
        }
        
        hideAllComments() {
            const allContainers = document.querySelectorAll('.thought-comments-container');
            allContainers.forEach(container => {
                container.style.display = 'none';
            });
            
            this.currentThoughtId = null;
        }
        
        async loadComments(thoughtId) {
            const comments = utils.getStorage(CONFIG.STORAGE_PREFIX + thoughtId, []);
            const container = document.querySelector(`#comments-${thoughtId} .thought-comments-list`);
            
            if (!container) return;
            
            container.innerHTML = '';
            
            if (comments.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'no-comments';
                emptyMessage.textContent = '暂无评论，来做第一个评论的人吧！';
                emptyMessage.style.textAlign = 'center';
                emptyMessage.style.color = 'var(--secondary)';
                emptyMessage.style.padding = '20px';
                emptyMessage.style.fontSize = '14px';
                container.appendChild(emptyMessage);
            } else {
                comments.forEach(comment => {
                    const commentElement = this.createCommentElement(comment);
                    container.appendChild(commentElement);
                });
            }
        }
        
        createCommentElement(comment) {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'thought-comment';
            
            const avatar = document.createElement('div');
            avatar.className = 'comment-avatar';
            avatar.style.cssText = `
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                margin-right: 12px;
                flex-shrink: 0;
            `;
            avatar.textContent = comment.author?.charAt(0) || '访';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'comment-content';
            contentDiv.style.flex = '1';
            
            const authorDiv = document.createElement('div');
            authorDiv.className = 'comment-author';
            authorDiv.textContent = comment.author || '匿名用户';
            authorDiv.style.cssText = `
                font-weight: 600;
                color: var(--primary);
                margin-bottom: 4px;
                font-size: 0.9rem;
            `;
            
            const textDiv = document.createElement('div');
            textDiv.className = 'comment-text';
            textDiv.textContent = comment.text;
            textDiv.style.cssText = `
                color: var(--content);
                margin-bottom: 4px;
                font-size: 0.9rem;
                line-height: 1.4;
            `;
            
            const timeDiv = document.createElement('div');
            timeDiv.className = 'comment-time';
            timeDiv.textContent = this.formatTime(comment.timestamp);
            timeDiv.style.cssText = `
                font-size: 0.8rem;
                color: var(--tertiary);
            `;
            
            contentDiv.appendChild(authorDiv);
            contentDiv.appendChild(textDiv);
            contentDiv.appendChild(timeDiv);
            
            commentDiv.appendChild(avatar);
            commentDiv.appendChild(contentDiv);
            
            return commentDiv;
        }
        
        formatTime(timestamp) {
            const now = new Date();
            const commentTime = new Date(timestamp);
            const diff = now - commentTime;
            
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);
            
            if (minutes < 1) return '刚刚';
            if (minutes < 60) return `${minutes}分钟前`;
            if (hours < 24) return `${hours}小时前`;
            if (days < 7) return `${days}天前`;
            
            return commentTime.toLocaleDateString('zh-CN');
        }
        
        async submitComment(thoughtId) {
            const input = document.querySelector(`#comments-${thoughtId} .comment-input`);
            const submitBtn = document.querySelector(`.comment-submit[data-thought-id="${thoughtId}"]`);
            const commentText = input?.value.trim();
            
            // 输入验证
            if (!commentText) {
                notification.show('请输入评论内容', 'warning');
                input?.focus();
                return;
            }
            
            if (commentText.length > 200) {
                notification.show('评论内容不能超过200字', 'warning');
                input?.focus();
                return;
            }
            
            // 禁用提交按钮，防止重复提交
            const originalText = submitBtn?.textContent;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = '发送中...';
            }
            
            try {
                // 创建评论对象
                const comment = {
                    text: commentText,
                    author: '访客',
                    timestamp: new Date().toISOString(),
                    id: Date.now().toString()
                };
                
                // 获取现有评论并添加新评论
                const comments = utils.getStorage(CONFIG.STORAGE_PREFIX + thoughtId, []);
                comments.unshift(comment);
                
                // 保存到本地存储
                utils.setStorage(CONFIG.STORAGE_PREFIX + thoughtId, comments);
                
                // 清空输入框
                if (input) input.value = '';
                
                // 重新加载评论
                await this.loadComments(thoughtId);
                
                // 更新评论计数
                await this.updateCommentCount(thoughtId);
                
                // 显示成功通知
                notification.show('评论发表成功！', 'success');
                
                // 滚动到新评论
                setTimeout(() => {
                    const newComment = document.querySelector(`#comments-${thoughtId} .thought-comment:first-child`);
                    if (newComment) {
                        newComment.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        // 添加高亮效果
                        newComment.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
                        setTimeout(() => {
                            newComment.style.backgroundColor = '';
                        }, 2000);
                    }
                }, 100);
            } catch (error) {
                console.error('提交评论失败:', error);
                notification.show('评论发表失败，请重试', 'error');
            } finally {
                // 恢复提交按钮状态
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        }
        
        async loadCommentCounts() {
            const commentButtons = document.querySelectorAll('.comment-btn');
            for (const button of commentButtons) {
                const thoughtId = button.dataset.thoughtId;
                await this.updateCommentCount(thoughtId);
            }
        }
        
        async updateCommentCount(thoughtId) {
            const comments = utils.getStorage(CONFIG.STORAGE_PREFIX + thoughtId, []);
            const commentButtons = document.querySelectorAll(`.comment-btn[data-thought-id="${thoughtId}"]`);
            
            commentButtons.forEach(button => {
                const commentCount = button.querySelector('.comment-count');
                if (commentCount) {
                    const oldCount = parseInt(commentCount.textContent) || 0;
                    commentCount.textContent = comments.length;
                    
                    // 添加更新动画效果
                    if (comments.length > oldCount) {
                        commentCount.style.color = '#4CAF50';
                        setTimeout(() => {
                            commentCount.style.color = '';
                        }, 1000);
                    }
                }
            });
        }
        
        optimizeForMobile() {
            if (window.innerWidth <= 768) {
                // 优化触摸反馈
                const touchElements = document.querySelectorAll('.comment-btn, .comment-submit');
                touchElements.forEach(element => {
                    element.addEventListener('touchstart', function() {
                        this.style.transform = 'scale(0.95)';
                    });
                    
                    element.addEventListener('touchend', function() {
                        this.style.transform = 'scale(1)';
                    });
                });
                
                // 移动端输入框高度自适应
                const commentInputs = document.querySelectorAll('.comment-input');
                commentInputs.forEach(input => {
                    input.addEventListener('input', function() {
                        this.style.height = 'auto';
                        this.style.height = Math.min(this.scrollHeight, 100) + 'px';
                    });
                });
            }
        }
    }

    // 主题切换功能
    class ThemeManager {
        constructor() {
            this.init();
        }
        
        init() {
            this.bindEvents();
            this.loadTheme();
        }
        
        bindEvents() {
            const themeToggle = document.querySelector('.theme-toggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => this.toggleTheme());
            }
            
            // 监听系统主题变化
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
        
        toggleTheme() {
            const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        }
        
        setTheme(theme) {
            if (theme === 'dark') {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
            localStorage.setItem('theme', theme);
        }
        
        loadTheme() {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                this.setTheme(savedTheme);
            } else {
                // 使用系统偏好
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.setTheme(prefersDark ? 'dark' : 'light');
            }
        }
    }

    // 图片懒加载
    class LazyLoader {
        constructor() {
            this.init();
        }
        
        init() {
            if ('IntersectionObserver' in window) {
                this.initIntersectionObserver();
            } else {
                this.loadAllImages();
            }
        }
        
        initIntersectionObserver() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.1
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                observer.observe(img);
            });
        }
        
        loadImage(img) {
            const src = img.getAttribute('data-src');
            if (src) {
                img.src = src;
                img.removeAttribute('data-src');
            }
        }
        
        loadAllImages() {
            document.querySelectorAll('img[data-src]').forEach(img => {
                this.loadImage(img);
            });
        }
    }

    // 平滑滚动
    class SmoothScroller {
        constructor() {
            this.init();
        }
        
        init() {
            this.bindEvents();
        }
        
        bindEvents() {
            // 内部链接平滑滚动
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="#"]');
                if (link && link.hash) {
                    e.preventDefault();
                    this.scrollToElement(link.hash);
                }
            });
        }
        
        scrollToElement(selector) {
            const element = document.querySelector(selector);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    }

    // 初始化所有功能
    function initializeAll() {
        console.log('博客优化版：开始初始化...');
        
        try {
            // 初始化评论系统
            window.commentSystem = new CommentSystem();
            console.log('评论系统初始化完成');
            
            // 初始化主题管理器
            window.themeManager = new ThemeManager();
            console.log('主题管理器初始化完成');
            
            // 初始化图片懒加载
            window.lazyLoader = new LazyLoader();
            console.log('图片懒加载初始化完成');
            
            // 初始化平滑滚动
            window.smoothScroller = new SmoothScroller();
            console.log('平滑滚动初始化完成');
            
            console.log('所有功能初始化成功！');
        } catch (error) {
            console.error('初始化过程中出错:', error);
        }
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAll);
    } else {
        initializeAll();
    }

    // 窗口大小变化时重新优化移动端体验
    window.addEventListener('resize', utils.debounce(() => {
        if (window.commentSystem) {
            window.commentSystem.optimizeForMobile();
        }
    }, 250));
})();
