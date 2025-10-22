// thoughts.js - 随想页面交互功能（简化版本）
// 只保留必要的功能，其他由统一评论系统处理

document.addEventListener('DOMContentLoaded', function() {
    console.log('Thoughts.js: DOM loaded, initializing basic functionality...');

    // 显示通知函数（简化版本）
    function showNotification(message, type = 'info') {
        // 如果统一评论系统已加载，使用其通知功能
        if (window.UnifiedComments && window.UnifiedComments.Utils) {
            window.UnifiedComments.Utils.showNotification(message, type);
            return;
        }
        
        // 否则使用简化版本的通知
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
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
            transition: all 0.3s ease;
            max-width: 320px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        const colors = {
            success: '#4CAF50',
            warning: '#FF9800',
            error: '#F44336',
            info: '#2196F3'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 初始化评论计数（简化版本）
    function initializeCommentCounts() {
        console.log('Thoughts.js: Initializing comment counts');
        
        // 如果统一评论系统已加载，使用其计数功能
        if (window.UnifiedComments && window.UnifiedComments.CommentCounter) {
            window.UnifiedComments.CommentCounter.updateAllCounts();
            return;
        }
        
        // 否则使用简化版本
        const thoughtCards = document.querySelectorAll('.thought-card');
        thoughtCards.forEach(card => {
            const thoughtId = card.dataset.thoughtId;
            const countSpan = card.querySelector('.comment-count');
            
            if (thoughtId && countSpan) {
                // 暂时使用评论图标
                countSpan.textContent = '💬';
            }
        });
    }

    // 移动端优化（简化版本）
    function optimizeForMobile() {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // 优化触摸反馈
            const touchElements = document.querySelectorAll('.thought-action, .comment-btn');
            touchElements.forEach(element => {
                element.addEventListener('touchstart', function() {
                    this.style.transform = 'scale(0.95)';
                });
                
                element.addEventListener('touchend', function() {
                    this.style.transform = 'scale(1)';
                });
            });
        }
    }

    // 初始化所有功能
    function initializeAll() {
        try {
            console.log('Thoughts.js: Starting basic initialization...');
            
            // 基础功能初始化
            initializeCommentCounts();
            optimizeForMobile();
            
            console.log('Thoughts.js: Basic functionality initialized successfully');
            
            // 等待统一评论系统
            setTimeout(() => {
                if (window.UnifiedComments && window.UnifiedComments.CommentCounter) {
                    console.log('Thoughts.js: Unified comments system detected, syncing...');
                    window.UnifiedComments.CommentCounter.updateAllCounts();
                }
            }, 500);
            
        } catch (error) {
            console.error('Thoughts.js: Error during initialization:', error);
            showNotification('随想页面初始化失败', 'error');
        }
    }

    // 窗口大小变化时重新优化移动端体验
    window.addEventListener('resize', function() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            optimizeForMobile();
        }, 250);
    });

    // 页面加载完成后初始化
    initializeAll();
});
