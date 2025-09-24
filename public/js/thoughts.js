
// thoughts.js - 随想页面交互功能

document.addEventListener('DOMContentLoaded', function() {
    console.log('Thoughts.js: DOM loaded, initializing functionality...');
    
    // 初始化本地存储
    const storage = {
        getLikes: function() {
            const likes = localStorage.getItem('thoughts-likes');
            return likes ? JSON.parse(likes) : {};
        },
        setLikes: function(likes) {
            localStorage.setItem('thoughts-likes', JSON.stringify(likes));
        },
        getComments: function(thoughtId) {
            const comments = localStorage.getItem(`thoughts-comments-${thoughtId}`);
            return comments ? JSON.parse(comments) : [];
        },
        setComments: function(thoughtId, comments) {
            localStorage.setItem(`thoughts-comments-${thoughtId}`, JSON.stringify(comments));
        }
    };

    // 初始化点赞状态
    function initializeLikes() {
        try {
            const likes = storage.getLikes();
            const likeButtons = document.querySelectorAll('.like-btn');
            
            if (likeButtons.length === 0) {
                console.warn('Thoughts.js: No like buttons found');
                return;
            }
            
            likeButtons.forEach(button => {
                const thoughtId = button.dataset.thoughtId;
                const likeCount = button.querySelector('.like-count');
                
                if (!thoughtId) {
                    console.warn('Thoughts.js: Like button missing data-thought-id');
                    return;
                }
                
                if (!likeCount) {
                    console.warn('Thoughts.js: Like button missing like-count element');
                    return;
                }
                
                // 恢复点赞状态
                if (likes[thoughtId] !== undefined) {
                    // 检查是否已点赞
                    const userLikes = JSON.parse(localStorage.getItem('thoughts-user-likes') || '{}');
                    if (userLikes[thoughtId]) {
                        button.classList.add('liked');
                    }
                    likeCount.textContent = likes[thoughtId];
                } else {
                    // 初始化随机点赞数
                    const initialLikes = Math.floor(Math.random() * 10) + 1;
                    likes[thoughtId] = initialLikes;
                    likeCount.textContent = initialLikes;
                }
            });
            
            storage.setLikes(likes);
        } catch (error) {
            console.error('Thoughts.js: Error initializing likes:', error);
        }
    }

    // 点赞功能
    function initializeLikeButtons() {
        const likeButtons = document.querySelectorAll('.like-btn');
        
        likeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const thoughtId = this.dataset.thoughtId;
                const likeCount = this.querySelector('.like-count');
                const likes = storage.getLikes();
                const userLikes = JSON.parse(localStorage.getItem('thoughts-user-likes') || '{}');
                
                // 切换点赞状态
                if (this.classList.contains('liked')) {
                    this.classList.remove('liked');
                    likes[thoughtId] = Math.max(0, likes[thoughtId] - 1);
                    userLikes[thoughtId] = false;
                    likeCount.textContent = likes[thoughtId];
                } else {
                    this.classList.add('liked');
                    likes[thoughtId] = (likes[thoughtId] || 0) + 1;
                    userLikes[thoughtId] = true;
                    likeCount.textContent = likes[thoughtId];
                }
                
                // 保存到本地存储
                storage.setLikes(likes);
                localStorage.setItem('thoughts-user-likes', JSON.stringify(userLikes));
                
                // 添加动画效果
                this.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
                
                // 显示点赞反馈
                showNotification(this.classList.contains('liked') ? '已点赞！' : '已取消点赞', 'success');
            });
        });
    }

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
                    
                    // 切换评论区域显示状态
                    if (commentsSection.style.display === 'none' || commentsSection.style.display === '') {
                        commentsSection.style.display = 'block';
                        this.classList.add('active');
                        ensureCommentsStructure(thoughtId);
                        loadComments(thoughtId);
                        
                        // 滚动到评论区域
                        setTimeout(() => {
                            commentsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 100);
                    } else {
                        commentsSection.style.display = 'none';
                        this.classList.remove('active');
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
    function loadComments(thoughtId) {
        const comments = storage.getComments(thoughtId);
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
            button.addEventListener('click', function() {
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
                    const comments = storage.getComments(thoughtId);
                    comments.unshift(comment);
                    
                    // 保存到本地存储
                    storage.setComments(thoughtId, comments);
                    
                    // 清空输入框
                    input.value = '';
                    
                    // 重新加载评论
                    loadComments(thoughtId);
                    
                    // 更新评论计数
                    updateCommentCount(thoughtId);
                    
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
    function updateCommentCount(thoughtId) {
        const comments = storage.getComments(thoughtId);
        const commentButton = document.querySelector(`.comment-btn[data-thought-id="${thoughtId}"]`);
        const commentCount = commentButton.querySelector('.comment-count');
        commentCount.textContent = comments.length;
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
        const commentButtons = document.querySelectorAll('.comment-btn');
        commentButtons.forEach(button => {
            const thoughtId = button.dataset.thoughtId;
            updateCommentCount(thoughtId);
        });
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
            const touchElements = document.querySelectorAll('.like-btn, .comment-btn, .comment-submit');
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
            initializeLikes();
            console.log('Thoughts.js: Likes initialized');
            
            initializeLikeButtons();
            console.log('Thoughts.js: Like buttons initialized');
            
            initializeCommentButtons();
            console.log('Thoughts.js: Comment buttons initialized');
            
            initializeCommentSubmission();
            console.log('Thoughts.js: Comment submission initialized');
            
            initializeCommentCounts();
            console.log('Thoughts.js: Comment counts initialized');
            
            initializeCommentInputHandlers();
            console.log('Thoughts.js: Comment input handlers initialized');
            
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
