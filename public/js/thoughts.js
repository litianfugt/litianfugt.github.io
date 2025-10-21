
// thoughts.js - 随想页面交互功能

document.addEventListener('DOMContentLoaded', function() {
    console.log('Thoughts.js: DOM loaded, initializing functionality...');


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
        console.log('Thoughts.js: Initializing comment counts');
        
        // 为每个随想获取评论数量
        const thoughtCards = document.querySelectorAll('.thought-card');
        
        for (const card of thoughtCards) {
            const thoughtId = card.dataset.thoughtId;
            const countSpan = card.querySelector('.comment-count');
            
            if (thoughtId && countSpan) {
                // 首先尝试从本地存储获取评论数量
                const storedCount = localStorage.getItem(`comment-count-${thoughtId}`);
                if (storedCount !== null) {
                    countSpan.textContent = storedCount;
                    console.log('Thoughts.js: Loaded comment count from localStorage for', thoughtId, ':', storedCount);
                } else {
                    // 如果本地存储没有，尝试从Giscus获取评论数量
                    try {
                        const count = await fetchCommentCountFromGiscus(thoughtId);
                        countSpan.textContent = count;
                        // 保存到本地存储
                        localStorage.setItem(`comment-count-${thoughtId}`, count);
                        console.log('Thoughts.js: Fetched comment count from Giscus for', thoughtId, ':', count);
                    } catch (error) {
                        console.warn('Thoughts.js: Failed to fetch comment count from Giscus for', thoughtId, ':', error);
                        // 保持为0，等待Giscus加载后更新
                        countSpan.textContent = '0';
                    }
                }
            }
        }
    }
    
    // 从Giscus获取评论数量
    async function fetchCommentCountFromGiscus(thoughtId) {
        console.log('Thoughts.js: Fetching comment count from Giscus for thought:', thoughtId);
        
        // 构建Giscus API请求URL
        const pagePath = window.location.pathname;
        const uniqueId = `${pagePath}#${thoughtId}`;
        
        // 使用GitHub API获取讨论数量
        const repo = '{{ .Site.Params.comments.giscus.repo }}';
        const categoryId = '{{ .Site.Params.comments.giscus.categoryId }}';
        
        if (!repo || !categoryId) {
            console.warn('Thoughts.js: Giscus configuration not found');
            return 0;
        }
        
        try {
            // 构建GraphQL查询
            const query = `
                query {
                    repository(owner: "${repo.split('/')[0]}", name: "${repo.split('/')[1]}") {
                        discussions(categoryId: "${categoryId}", first: 100) {
                            nodes {
                                title
                                comments {
                                    totalCount
                                }
                            }
                        }
                    }
                }
            `;
            
            // 发送GraphQL请求
            const response = await fetch('https://api.github.com/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'bearer {{ .Site.Params.comments.giscus.token | default "" }}'
                },
                body: JSON.stringify({ query })
            });
            
            if (!response.ok) {
                throw new Error(`GitHub API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            const discussions = data.data.repository.discussions.nodes;
            
            // 查找匹配的讨论
            const discussion = discussions.find(d => d.title === uniqueId || d.title.includes(thoughtId));
            
            if (discussion) {
                return discussion.comments.totalCount;
            }
            
            return 0;
        } catch (error) {
            console.error('Thoughts.js: Error fetching comment count from GitHub API:', error);
            throw error;
        }
    }
    
    // 更新评论计数
    function updateThoughtCommentCount(thoughtId, count) {
        // 查找对应的评论按钮
        const commentButtons = document.querySelectorAll('.thought-action.comment-btn[data-thought-id="' + thoughtId + '"]');
        commentButtons.forEach(button => {
            const countSpan = button.querySelector('.comment-count');
            if (countSpan) {
                countSpan.textContent = count;
                // 保存到本地存储
                localStorage.setItem(`comment-count-${thoughtId}`, count);
                console.log('Thoughts.js: Updated comment count for', thoughtId, 'to', count);
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
            // 评论功能现在由 unified-comments.js 处理
            console.log('Thoughts.js: Comment functionality handled by unified-comments.js');
            
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
