
// thoughts.js - 随想页面交互功能

document.addEventListener('DOMContentLoaded', function() {
    console.log('Thoughts.js: DOM loaded, initializing functionality...');

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
                
                button.addEventListener('click', function(e) {
                    e.preventDefault(); // 阻止默认行为
                    e.stopPropagation(); // 阻止事件冒泡
                    
                    const commentsSection = document.getElementById(`comments-${thoughtId}`);
                    
                    if (!commentsSection) {
                        console.error('Thoughts.js: Comments section not found for thought:', thoughtId);
                        return;
                    }
                    
                    // 切换评论区域显示状态
                    if (commentsSection.style.display === 'none' || commentsSection.style.display === '') {
                        commentsSection.style.display = 'block';
                        this.classList.add('active');
                        
                        // 尝试加载Giscus评论系统
                        const giscusFrame = commentsSection.querySelector('iframe.giscus-frame');
                        if (!giscusFrame) {
                            // 如果Giscus尚未加载，调用loadGiscus函数
                            if (typeof loadGiscus === 'function') {
                                loadGiscus();
                            } else {
                                console.warn('Thoughts.js: loadGiscus function not available');
                            }
                        }
                        
                        // 滚动到评论区域
                        setTimeout(() => {
                            commentsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 100);
                    } else {
                        commentsSection.style.display = 'none';
                        this.classList.remove('active');
                    }
                    
                    console.log('Thoughts.js: Comment button clicked for thought:', thoughtId);
                });
            });
        } catch (error) {
            console.error('Thoughts.js: Error initializing comment buttons:', error);
        }
    }

    // 更新评论计数
    function updateCommentCount(thoughtId) {
        // 评论计数现在由Giscus处理，这里可以留空或添加自定义逻辑
        console.log('Thoughts.js: Comment count for', thoughtId, 'is handled by Giscus');
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

    // 初始化评论计数 - 现在由Giscus处理
    function initializeCommentCounts() {
        // 评论计数现在由Giscus处理，这里可以留空或添加自定义逻辑
        console.log('Thoughts.js: Comment counts are handled by Giscus');
    }

    // 添加回车键提交评论功能 - 现在由Giscus处理
    function initializeCommentInputHandlers() {
        // 评论输入处理现在由Giscus处理，这里可以留空或添加自定义逻辑
        console.log('Thoughts.js: Comment input handlers are handled by Giscus');
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
    function initializeAll() {
        console.log('Thoughts.js: Starting initialization...');
        try {
            initializeCommentButtons();
            console.log('Thoughts.js: Comment buttons initialized');
            
            initializeCommentCounts();
            console.log('Thoughts.js: Comment counts initialized');
            
            optimizeForMobile();
            console.log('Thoughts.js: Mobile optimization initialized');
            
            console.log('Thoughts.js: All functionality initialized successfully!');
        } catch (error) {
            console.error('Thoughts.js: Error during initialization:', error);
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
