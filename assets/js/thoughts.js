
// thoughts.js - 简洁高效的评论功能
// 设计原则：简洁、高效、可维护、紧凑

(function() {
    'use strict';
    
    // 配置常量
    const CONFIG = {
        STORAGE_PREFIX: 'thoughts-comments-',
        NOTIFICATION_DURATION: {
            SUCCESS: 3000,
            WARNING: 3000,
            ERROR: 5000,
            INFO: 3000
        }
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
        
        // 格式化时间
        formatTime: (timestamp) => {
            const now = Date.now();
            const diff = now - new Date(timestamp).getTime();
            
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);
            
            if (minutes < 1) return '刚刚';
            if (minutes < 60) return `${minutes}分钟前`;
            if (hours < 24) return `${hours}小时前`;
            if (days < 7) return `${days}天前`;
            
            return new Date(timestamp).toLocaleDateString('zh-CN');
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

    // 存储管理器
    const storage = {
        getComments: (thoughtId) => utils.getStorage(CONFIG.STORAGE_PREFIX + thoughtId, []),
        setComments: (thoughtId, comments) => utils.setStorage(CONFIG.STORAGE_PREFIX + thoughtId, comments)
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
            }, CONFIG.NOTIFICATION_DURATION[type.toUpperCase()] || 3000);
        }
    };


    // 评论功能
    function initializeCommentButtons() {
        try {
            const commentButtons = document.querySelectorAll('.comment-btn');
            
            if (commentButtons.length === 0) {
                console.warn('Thoughts.js: No comment buttons found');
                return;
            }
            
            commentButtons.forEach(button => {
                const thoughtId = button.dataset.thoughtId;
                
                if (!thoughtId) {
                    console.warn('Thoughts.js: Comment button missing data-thought-id');
                    return;
                }
                
                button.addEventListener('click', function() {
                    const commentsSection = document.getElementById(`comments-${thoughtId}`);
                    
                    if (!commentsSection) {
                        console.error('Thoughts.js: Comments section not found for thought:', thoughtId);
                        return;
                    }
                    
                    // 检查当前评论区域是否可见
                    const isVisible = commentsSection.style.display === 'block';
                    
                    // 关闭所有评论区域
                    document.querySelectorAll('.thought-comments').forEach(section => {
                        section.style.display = 'none';
                        // 移除所有评论按钮的活跃状态
                        const otherThoughtId = section.id.replace('comments-', '');
                        const otherButton = document.querySelector(`.comment-btn[data-thought-id="${otherThoughtId}"]`);
                        if (otherButton) {
                            otherButton.classList.remove('active');
                        }
                    });
                    
                    // 如果之前是隐藏状态，现在显示
                    if (!isVisible) {
                        commentsSection.style.display = 'block';
                        this.classList.add('active');
                        ensureCommentsStructure(thoughtId);
                        loadComments(thoughtId);
                        
                        // 滚动到评论区域
                        setTimeout(() => {
                            commentsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 100);
                    }
                });
            });
        } catch (error) {
            console.error('Thoughts.js: Error initializing comment buttons:', error);
        }
    }

    // 确保评论结构存在
    function ensureCommentsStructure(thoughtId) {
        const commentsSection = document.getElementById(`comments-${thoughtId}`);
        if (!commentsSection.querySelector('.thought-comments-list')) {
            const commentsList = document.createElement('div');
            commentsList.className = 'thought-comments-list';
            commentsList.style.marginBottom = '15px';
            commentsSection.insertBefore(commentsList, commentsSection.querySelector('.thought-comment-form'));
        }
    }

    // 加载评论
    async function loadComments(thoughtId) {
        const comments = await storage.getComments(thoughtId);
        const commentsContainer = document.querySelector(`#comments-${thoughtId} .thought-comments-list`);
        
        if (!commentsContainer) return;
        
        commentsContainer.innerHTML = '';
        
        if (comments.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'no-comments';
            emptyMessage.textContent = '暂无评论，来做第一个评论的人吧！';


            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = 'var(--secondary)';
            emptyMessage.style.padding = '20px';
            emptyMessage.style.fontSize = '14px';
            commentsContainer.appendChild(emptyMessage);
        } else {
            comments.forEach(comment => {
                const commentElement = createCommentElement(comment);
                commentsContainer.appendChild(commentElement);
            });
        }
    }

    // 创建评论元素
    function createCommentElement(comment) {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'thought-comment';
        
        const avatar = document.createElement('img');
        avatar.className = 'comment-avatar';
        avatar.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author || 'visitor'}`;
        avatar.alt = comment.author || '访客';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'comment-content';
        
        const authorDiv = document.createElement('div');
        authorDiv.className = 'comment-author';
        authorDiv.textContent = comment.author || '匿名用户';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'comment-text';
        textDiv.textContent = comment.text;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'comment-time';
        timeDiv.textContent = formatTime(comment.timestamp);
        
        contentDiv.appendChild(authorDiv);
        contentDiv.appendChild(textDiv);
        contentDiv.appendChild(timeDiv);
        
        commentDiv.appendChild(avatar);
        commentDiv.appendChild(contentDiv);
        
        return commentDiv;
    }

    // 格式化时间
    function formatTime(timestamp) {
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

    // 初始化评论提交功能
    function initializeCommentSubmission() {
        const submitButtons = document.querySelectorAll('.comment-submit');
        
        submitButtons.forEach(button => {
            button.addEventListener('click', async function() {
                const thoughtId = this.dataset.thoughtId;
                const input = document.querySelector(`#comments-${thoughtId} .comment-input`);
                const commentText = input.value.trim();
                
                // 输入验证
                if (!commentText) {
                    showNotification('请输入评论内容', 'warning');
                    input.focus();
                    return;
                }
                
                if (commentText.length > 200) {
                    showNotification('评论内容不能超过200字', 'warning');
                    input.focus();
                    return;
                }
                
                // 禁用提交按钮，防止重复提交
                const originalText = this.textContent;
                this.disabled = true;
                this.textContent = '发送中...';
                
                try {
                    // 创建评论对象
                    const comment = {
                        text: commentText,
                        author: '访客',
                        timestamp: new Date().toISOString(),
                        id: Date.now().toString()
                    };
                    
                    // 获取现有评论并添加新评论
                    const comments = await storage.getComments(thoughtId);
                    comments.unshift(comment);
                    
                    // 保存到本地存储
                    storage.setComments(thoughtId, comments);
                    
                    // 清空输入框
                    input.value = '';
                    
                    // 重新加载评论
                    await loadComments(thoughtId);
                    
                    // 更新评论计数
                    await updateCommentCount(thoughtId);
                    
                    // 显示成功通知
                    showNotification('评论发表成功！', 'success');
                    
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
                    console.error('Thoughts.js: Error submitting comment:', error);
                    showNotification('评论发表失败，请重试', 'error');
                } finally {
                    // 恢复提交按钮状态
                    this.disabled = false;
                    this.textContent = originalText;
                }
            });
        });
    }

    // 更新评论计数
    async function updateCommentCount(thoughtId) {
        const comments = await storage.getComments(thoughtId);
        // 更新所有匹配的评论按钮
        const commentButtons = document.querySelectorAll(`.comment-btn[data-thought-id="${thoughtId}"]`);
        commentButtons.forEach(button => {
            const commentCount = button.querySelector('.comment-count');
            if (commentCount) {
                const oldCount = parseInt(commentCount.textContent) || 0;
                commentCount.textContent = comments.length;
                
                // 添加更新动画效果
                commentCount.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    commentCount.style.transform = 'scale(1)';
                }, 200);
                
                // 如果计数增加，显示特殊动画
                if (comments.length > oldCount) {
                    commentCount.style.color = '#4CAF50';
                    setTimeout(() => {
                        commentCount.style.color = '';
                    }, 1000);
                }
            }
        });
    }

    // 显示通知
    function showNotification(message, type = 'info') {
        // 移除已存在的通知
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
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
            z-index: 1000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            max-width: 320px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-weight: 500;
        `;
        
        // 根据类型设置背景色和图标
        const colors = {
            success: '#4CAF50',
            warning: '#FF9800',
            error: '#F44336',
            info: '#2196F3'
        };
        
        const icons = {
            success: '✓',
            warning: '⚠',
            error: '✗',
            info: 'ℹ'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.innerHTML = `${icons[type] || icons.info} ${message}`;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // 自动隐藏
        const hideDelay = type === 'error' ? 5000 : 3000; // 错误通知显示更长时间
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, hideDelay);
    }

    // 初始化评论计数
    async function initializeCommentCounts() {
        const commentButtons = document.querySelectorAll('.comment-btn');
        for (const button of commentButtons) {
            const thoughtId = button.dataset.thoughtId;
            await updateCommentCount(thoughtId);
        }
    }

    // 添加回车键提交评论功能
    function initializeCommentInputHandlers() {
        const commentInputs = document.querySelectorAll('.comment-input');
        commentInputs.forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const thoughtId = this.closest('.thought-comments').id.replace('comments-', '');
                    const submitButton = document.querySelector(`.comment-submit[data-thought-id="${thoughtId}"]`);
                    submitButton.click();
                }
            });
            
            // 移动端优化：自动调整输入框高度
            if (window.innerWidth <= 768) {
                input.addEventListener('input', function() {
                    this.style.height = 'auto';
                    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
                });
            }
        });
    }
    
    // 移动端优化
    function optimizeForMobile() {
        // 检测是否为移动设备
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
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
            
            // 优化评论区域显示
            const commentButtons = document.querySelectorAll('.comment-btn');
            commentButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const thoughtId = this.dataset.thoughtId;
                    const commentsSection = document.getElementById(`comments-${thoughtId}`);
                    
                    if (commentsSection && commentsSection.style.display === 'block') {
                        // 移动端显示评论时，确保输入框可见
                        setTimeout(() => {
                            const inputField = commentsSection.querySelector('.comment-input');
                            if (inputField) {
                                inputField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, 300);
                    }
                });
            });
        }
    }

    // 初始化所有功能
    async function initializeAll() {
        console.log('Thoughts.js: 开始初始化...');
        try {
            initializeCommentButtons();
            console.log('Thoughts.js: 评论按钮初始化完成');
            
            initializeCommentSubmission();
            console.log('Thoughts.js: 评论提交功能初始化完成');
            
            await initializeCommentCounts();
            console.log('Thoughts.js: 评论计数初始化完成');
            
            initializeCommentInputHandlers();
            console.log('Thoughts.js: 评论输入处理初始化完成');
            
            initializePostComments();
            console.log('Thoughts.js: 文章评论初始化完成');
            
            optimizeForMobile();
            console.log('Thoughts.js: 移动端优化完成');
            
            console.log('Thoughts.js: 所有功能初始化成功！');
        } catch (error) {
            console.error('Thoughts.js: 初始化过程中出错:', error);
        }
    }
    
    // 初始化博客文章评论
    async function initializePostComments() {
        // 检查是否在博客文章页面
        const postComments = document.querySelector('.post-comments');
        if (!postComments) return;
        
        // 获取文章ID
        const article = document.querySelector('article.post-single');
        if (!article) return;
        
        // 从URL获取文章ID
        const path = window.location.pathname;
        const pathParts = path.split('/');
        const fileName = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
        const thoughtId = fileName.replace('.html', '');
        
        if (!thoughtId) return;
        
        // 加载评论
        await loadComments(thoughtId);
        
        // 初始化评论提交
        const submitButton = postComments.querySelector('.comment-submit');
        if (submitButton) {
            submitButton.addEventListener('click', async function() {
                const input = postComments.querySelector('.comment-input');
                const commentText = input.value.trim();
                
                // 输入验证
                if (!commentText) {
                    showNotification('请输入评论内容', 'warning');
                    input.focus();
                    return;
                }
                
                if (commentText.length > 200) {
                    showNotification('评论内容不能超过200字', 'warning');
                    input.focus();
                    return;
                }
                
                // 禁用提交按钮，防止重复提交
                const originalText = this.textContent;
                this.disabled = true;
                this.textContent = '发送中...';
                
                try {
                    // 创建评论对象
                    const comment = {
                        text: commentText,
                        author: '访客',
                        timestamp: new Date().toISOString(),
                        id: Date.now().toString()
                    };
                    
                    // 获取现有评论并添加新评论
                    const comments = await storage.getComments(thoughtId);
                    comments.unshift(comment);
                    
                    // 保存到本地存储
                    await storage.setComments(thoughtId, comments);
                    
                    // 清空输入框
                    input.value = '';
                    
                    // 重新加载评论
                    await loadComments(thoughtId);
                    
                    // 显示成功通知
                    showNotification('评论发表成功！', 'success');
                    
                    // 滚动到新评论
                    setTimeout(() => {
                        const newComment = postComments.querySelector('.thought-comment:first-child');
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
                    console.error('Thoughts.js: Error submitting comment:', error);
                    showNotification('评论发表失败，请重试', 'error');
                } finally {
                    // 恢复提交按钮状态
                    this.disabled = false;
                    this.textContent = originalText;
                }
            });
        }
        
        // 添加回车键提交评论功能
        const commentInput = postComments.querySelector('.comment-input');
        if (commentInput) {
            commentInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const submitButton = postComments.querySelector('.comment-submit');
                    submitButton.click();
                }
            });
            
            // 移动端优化：自动调整输入框高度
            if (window.innerWidth <= 768) {
                commentInput.addEventListener('input', function() {
                    this.style.height = 'auto';
                    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
                });
            }
        }
    }
    
    // 窗口大小变化时重新优化移动端体验
    window.addEventListener('resize', function() {
        // 防抖处理
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            optimizeForMobile();
        }, 250);
    });

    // 页面加载完成后初始化
    initializeAll();
});
