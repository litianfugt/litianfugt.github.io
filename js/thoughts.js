
// thoughts.js - 随想页面交互功能

document.addEventListener('DOMContentLoaded', function() {
    console.log('Thoughts.js: DOM loaded, initializing functionality...');

    // 评论功能
    function initializeCommentButtons() {
        try {
            // 使用更精确的选择器来查找评论按钮
            const commentButtons = document.querySelectorAll('.thought-action.comment-btn');
            
            console.log('Thoughts.js: Looking for comment buttons with selector: .thought-action.comment-btn');
            console.log('Thoughts.js: DOM fully loaded, document.readyState:', document.readyState);
            console.log('Thoughts.js: CommentManager availability check:', {
                commentManager: typeof window.commentManager,
                CommentManager: typeof window.CommentManager
            });
            
            if (commentButtons.length === 0) {
                console.warn('Thoughts.js: No comment buttons found');
                // 添加更多调试信息
                console.log('Thoughts.js: Available thought-action elements:', document.querySelectorAll('.thought-action'));
                console.log('Thoughts.js: Available comment-btn elements:', document.querySelectorAll('.comment-btn'));
                return;
            }
            
            console.log('Thoughts.js: Found', commentButtons.length, 'comment buttons');
            
            commentButtons.forEach(button => {
                const thoughtId = button.dataset.thoughtId;
                
                if (!thoughtId) {
                    console.warn('Thoughts.js: Comment button missing data-thought-id');
                    return;
                }
                
                button.addEventListener('click', async function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const thoughtId = button.dataset.thoughtId;
                    console.log('Thoughts.js: Comment button clicked for thought:', thoughtId);
                    console.log('Thoughts.js: Button current active state:', button.classList.contains('active'));
                    
                    // Check if CommentManager is available
                    let commentManager = window.commentManager;
                    
                    // If CommentManager is not available, try to create it
                    if (!commentManager && window.CommentManager) {
                        console.log('Thoughts.js: CommentManager class available but instance not found, creating instance...');
                        commentManager = new window.CommentManager();
                        window.commentManager = commentManager;
                    }
                    
                    if (!commentManager) {
                        console.error('Thoughts.js: CommentManager not available');
                        console.log('Thoughts.js: window.commentManager type:', typeof window.commentManager);
                        console.log('Thoughts.js: window.CommentManager type:', typeof window.CommentManager);
                        showNotification('评论系统未正确加载，请刷新页面重试', 'error');
                        return;
                    }
                    
                    console.log('Thoughts.js: CommentManager available, instances count:', commentManager.instances.size);
                    console.log('Thoughts.js: CommentManager active instance:', commentManager.activeInstance ? commentManager.activeInstance.thoughtId : 'none');
                    
                    // Check if comments are currently visible
                    const isActive = button.classList.contains('active');
                    
                    try {
                        if (isActive) {
                            // Hide comments
                            console.log('Thoughts.js: Hiding comments for thought:', thoughtId);
                            button.classList.remove('active');
                            
                            // Use CommentManager to deactivate
                            commentManager.deactivateCurrentInstance();
                            console.log('Thoughts.js: CommentManager deactivated for thought:', thoughtId);
                        } else {
                            // Show comments
                            console.log('Thoughts.js: Showing comments for thought:', thoughtId);
                            button.classList.add('active');
                            
                            // Check if comments placeholder exists
                            const placeholderId = `comments-placeholder-${thoughtId}`;
                            const placeholder = document.getElementById(placeholderId);
                            console.log('Thoughts.js: Comments placeholder exists:', !!placeholder, 'ID:', placeholderId);
                            
                            // Use CommentManager to activate
                            console.log('Thoughts.js: Calling activateInstance for thought:', thoughtId);
                            await commentManager.activateInstance(thoughtId);
                            console.log('Thoughts.js: activateInstance completed for thought:', thoughtId);
                            
                            // Scroll to comments after a short delay
                            setTimeout(() => {
                                const commentsContainer = document.getElementById(`comments-${thoughtId}`);
                                console.log('Thoughts.js: Comments container exists:', !!commentsContainer);
                                if (commentsContainer) {
                                    commentsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                }
                            }, 300);
                        }
                        
                        console.log('Thoughts.js: Comment button click handler completed for thought:', thoughtId);
                    } catch (error) {
                        console.error('Thoughts.js: Error handling comment button click:', error);
                        console.error('Thoughts.js: Error details:', error.message, error.stack);
                        showNotification('评论加载失败，请刷新页面重试', 'error');
                        
                        // Reset button state
                        button.classList.remove('active');
                    }
                });
            });
        } catch (error) {
            console.error('Thoughts.js: Error initializing comment buttons:', error);
        }
    }

    // 更新评论计数
    function updateCommentCount(thoughtId, count) {
        // 查找对应的评论按钮
        const commentButtons = document.querySelectorAll('.thought-action.comment-btn[data-thought-id="' + thoughtId + '"]');
        commentButtons.forEach(button => {
            const countSpan = button.querySelector('.comment-count');
            if (countSpan) {
                countSpan.textContent = count;
                console.log('Thoughts.js: Updated comment count for', thoughtId, 'to', count);
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
    function initializeCommentCounts() {
        console.log('Thoughts.js: Initializing comment counts');
        
        // 为每个随想获取评论数量
        const thoughtCards = document.querySelectorAll('.thought-card');
        thoughtCards.forEach(card => {
            const thoughtId = card.dataset.thoughtId;
            const countSpan = card.querySelector('.comment-count');
            
            if (thoughtId && countSpan) {
                // 首先尝试从本地存储获取评论数量
                const storedCount = localStorage.getItem(`comment-count-${thoughtId}`);
                if (storedCount !== null) {
                    countSpan.textContent = storedCount;
                    console.log('Thoughts.js: Loaded comment count from localStorage for', thoughtId, ':', storedCount);
                }
                // 否则保持为0，等待Giscus加载后更新
            }
        });
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
