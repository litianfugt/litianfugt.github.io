// unified-comments.js - 随想卡片内嵌评论系统

document.addEventListener('DOMContentLoaded', function() {
    console.log('Thought Comments: Initializing...');
    
    // 随想评论管理器
    class ThoughtCommentManager {
        constructor() {
            this.currentOpenThoughtId = null;
            this.giscusInstances = new Map(); // 存储每个随想的Giscus实例
            this.isLoading = new Map(); // 存储加载状态
            this.mutationObservers = new Map(); // 存储DOM变化监听器
            this.commentCountCache = new Map(); // 缓存评论计数
            this.isProcessingComment = false; // 防止重复处理评论提交
            this.lastCommentCounts = new Map(); // 存储上一次的评论计数
            
            this.initializeEventListeners();
            this.initializeCommentCounts();
            this.setupVisibilityChangeHandler();
        }
        
        initializeEventListeners() {
            // 初始化评论按钮点击事件
            const commentButtons = document.querySelectorAll('.thought-action.comment-btn');
            console.log('Thought Comments: Found comment buttons:', commentButtons.length);
            
            commentButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const thoughtId = button.dataset.thoughtId;
                    console.log('Thought Comments: Comment button clicked for thought:', thoughtId);
                    
                    // 验证thoughtId是否存在
                    if (!thoughtId) {
                        console.error('Thought Comments: No thoughtId found on button');
                        return;
                    }
                    
                    // 验证对应的评论容器是否存在
                    const commentsContainer = document.getElementById(`comments-${thoughtId}`);
                    if (!commentsContainer) {
                        console.error('Thought Comments: Comments container not found for thought:', thoughtId);
                        return;
                    }
                    
                    this.toggleComments(thoughtId);
                });
            });
            
            // 初始化关闭按钮事件
            const closeButtons = document.querySelectorAll('.close-comments-btn');
            closeButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const thoughtId = button.dataset.thoughtId;
                    console.log('Thought Comments: Close button clicked for thought:', thoughtId);
                    
                    this.hideComments(thoughtId);
                });
            });
            
            // ESC键关闭当前评论
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.currentOpenThoughtId) {
                    this.hideComments(this.currentOpenThoughtId);
                }
            });
        }
        
        initializeCommentCounts() {
            console.log('Thought Comments: Initializing comment counts');
            
            const thoughtCards = document.querySelectorAll('.thought-card');
            
            for (const card of thoughtCards) {
                const thoughtId = card.dataset.thoughtId;
                const countSpan = card.querySelector('.comment-count');
                
                if (thoughtId && countSpan) {
                    // 首先尝试从本地存储获取评论数量
                    const storedCount = localStorage.getItem(`comment-count-${thoughtId}`);
                    if (storedCount !== null) {
                        countSpan.textContent = storedCount;
                        this.lastCommentCounts.set(thoughtId, parseInt(storedCount));
                    } else {
                        // 如果本地存储没有，设置为0
                        countSpan.textContent = '0';
                        this.lastCommentCounts.set(thoughtId, 0);
                    }
                }
            }
            
            // 延迟获取实际的评论计数
            setTimeout(() => {
                this.updateAllCommentCounts();
            }, 2000);
            
            // 再次延迟获取，确保Giscus完全加载后获取准确计数
            setTimeout(() => {
                this.updateAllCommentCountsFromGitHub();
            }, 5000);
        }
        
        toggleComments(thoughtId) {
            if (this.currentOpenThoughtId === thoughtId) {
                // 如果当前评论已显示，则隐藏
                this.hideComments(thoughtId);
            } else {
                // 关闭其他评论，然后显示当前评论
                this.showComments(thoughtId);
            }
        }
        
        showComments(thoughtId) {
            console.log('Thought Comments: Showing comments for thought:', thoughtId);
            
            // 关闭当前打开的评论
            if (this.currentOpenThoughtId && this.currentOpenThoughtId !== thoughtId) {
                this.hideComments(this.currentOpenThoughtId);
            }
            
            // 更新当前打开的随想ID
            this.currentOpenThoughtId = thoughtId;
            
            // 显示评论容器
            const commentsContainer = document.getElementById(`comments-${thoughtId}`);
            if (commentsContainer) {
                commentsContainer.style.display = 'block';
                
                // 滚动到评论区域
                setTimeout(() => {
                    commentsContainer.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'nearest' 
                    });
                }, 100);
            }
            
            // 更新按钮状态
            this.updateButtonStates(thoughtId);
            
            // 加载Giscus评论
            this.loadGiscusComments(thoughtId);
        }
        
        hideComments(thoughtId) {
            console.log('Thought Comments: Hiding comments for thought:', thoughtId);
            
            // 隐藏评论容器
            const commentsContainer = document.getElementById(`comments-${thoughtId}`);
            if (commentsContainer) {
                commentsContainer.style.display = 'none';
            }
            
            // 清理Giscus实例
            this.cleanupGiscus(thoughtId);
            
            // 停止定期同步
            this.stopPeriodicSync(thoughtId);
            
            // 重置当前打开的随想ID
            if (this.currentOpenThoughtId === thoughtId) {
                this.currentOpenThoughtId = null;
            }
            
            // 更新按钮状态
            this.updateButtonStates(null);
        }
        
        updateButtonStates(activeThoughtId) {
            const commentButtons = document.querySelectorAll('.thought-action.comment-btn');
            
            commentButtons.forEach(button => {
                const thoughtId = button.dataset.thoughtId;
                if (thoughtId === activeThoughtId) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        }
        
        loadGiscusComments(thoughtId, retryCount = 0) {
            console.log('Thought Comments: Loading Giscus for thought:', thoughtId, 'Retry:', retryCount);
            
            // 检查是否已经在加载
            if (this.isLoading.get(thoughtId)) {
                console.log('Thought Comments: Already loading for thought:', thoughtId);
                return;
            }
            
            // 检查是否已经加载了Giscus
            if (this.giscusInstances.has(thoughtId)) {
                console.log('Thought Comments: Giscus already loaded for thought:', thoughtId);
                return;
            }
            
            // 设置加载状态
            this.isLoading.set(thoughtId, true);
            
            const giscusWrapper = document.getElementById(`giscus-${thoughtId}`);
            if (!giscusWrapper) {
                console.error('Thought Comments: Giscus wrapper not found for thought:', thoughtId);
                this.isLoading.set(thoughtId, false);
                return;
            }
            
            // 显示加载状态
            giscusWrapper.innerHTML = '<div class="giscus-loading">加载评论中...</div>';
            
            // 获取随想信息
            const thoughtCard = document.querySelector(`.thought-card[data-thought-id="${thoughtId}"]`);
            let thoughtContent = '';
            let thoughtTitle = `随想 ${thoughtId}`;
            
            if (thoughtCard) {
                const contentElement = thoughtCard.querySelector('.thought-content');
                if (contentElement) {
                    const contentText = contentElement.textContent.trim();
                    thoughtContent = contentText;
                    thoughtTitle = contentText.substring(0, 50) + (contentText.length > 50 ? '...' : '');
                }
            }
            
            // 构建Giscus配置
            const pagePath = window.location.pathname;
            const uniqueId = `${pagePath}#${thoughtId}`;
            
            // 创建Giscus脚本
            const script = document.createElement('script');
            script.src = 'https://giscus.app/client.js';
            script.setAttribute('data-repo', 'litianfugt/litianfugt.github.io');
            script.setAttribute('data-repo-id', 'R_kgDOPkZVNQ');
            script.setAttribute('data-category', 'General');
            script.setAttribute('data-category-id', 'DIC_kwDOPkZVNc4Cv3cN');
            script.setAttribute('data-mapping', 'specific');
            script.setAttribute('data-term', uniqueId);
            script.setAttribute('data-title', thoughtTitle);
            if (thoughtContent) {
                script.setAttribute('data-description', thoughtContent);
            }
            script.setAttribute('data-strict', '0');
            script.setAttribute('data-reactions-enabled', '1');
            script.setAttribute('data-emit-metadata', '0');
            script.setAttribute('data-input-position', 'bottom');
            script.setAttribute('data-theme', 'preferred_color_scheme');
            script.setAttribute('data-lang', 'zh-CN');
            script.setAttribute('data-loading', 'lazy');
            script.setAttribute('crossorigin', 'anonymous');
            script.setAttribute('async', '');
            
            // 设置超时处理
            const timeout = setTimeout(() => {
                console.error('Thought Comments: Giscus load timeout for thought:', thoughtId);
                this.isLoading.set(thoughtId, false);
                
                if (retryCount < 3) {
                    console.log('Thought Comments: Retrying Giscus load, attempt:', retryCount + 1);
                    giscusWrapper.innerHTML = '<div class="giscus-loading">连接超时，正在重试...</div>';
                    setTimeout(() => {
                        this.loadGiscusComments(thoughtId, retryCount + 1);
                    }, 2000 * (retryCount + 1));
                } else {
                    this.showGiscusError(giscusWrapper, thoughtId, true);
                }
            }, 10000);
            
            // 设置加载事件
            script.addEventListener('load', () => {
                clearTimeout(timeout);
                console.log('Thought Comments: Giscus loaded for thought:', thoughtId);
                
                // 标记为已加载
                this.giscusInstances.set(thoughtId, true);
                this.isLoading.set(thoughtId, false);
                
                // 隐藏加载提示
                const loading = giscusWrapper.querySelector('.giscus-loading');
                if (loading) {
                    loading.style.display = 'none';
                }
                
                // 更新评论计数
                setTimeout(() => {
                    this.syncCommentCountFromGiscusUI(thoughtId);
                }, 1000);
                
                // 延迟更长时间再次更新，确保获取到准确的计数
                setTimeout(() => {
                    this.updateCommentCount(thoughtId);
                }, 3000);
                
                // 监听Giscus事件
                this.setupGiscusEventListener(thoughtId);
                
                // 设置 iframe 加载完成后的监听
                this.setupIframeLoadListener(thoughtId);
                
                // 设置增强的评论提交监听
                this.setupEnhancedCommentSubmissionListener(thoughtId);
            });
            
            // 设置错误事件
            script.addEventListener('error', (e) => {
                clearTimeout(timeout);
                console.error('Thought Comments: Giscus load error for thought:', thoughtId, e);
                this.isLoading.set(thoughtId, false);
                
                if (retryCount < 3) {
                    console.log('Thought Comments: Retrying Giscus load due to error, attempt:', retryCount + 1);
                    giscusWrapper.innerHTML = '<div class="giscus-loading">加载失败，正在重试...</div>';
                    setTimeout(() => {
                        this.loadGiscusComments(thoughtId, retryCount + 1);
                    }, 2000 * (retryCount + 1));
                } else {
                    this.showGiscusError(giscusWrapper, thoughtId, false);
                }
            });
            
            // 添加脚本到页面
            giscusWrapper.appendChild(script);
        }
        
        showGiscusError(wrapper, thoughtId, isTimeout) {
            const errorMessage = isTimeout ? 
                '评论加载超时，可能是网络连接问题' : 
                '评论服务暂时不可用，请稍后重试';
            
            wrapper.innerHTML = `
                <div style="padding: 20px; text-align: center; border-radius: 12px; background: rgba(244, 67, 54, 0.1); border: 1px solid rgba(244, 67, 54, 0.2);">
                    <div style="color: #F44336; margin-bottom: 15px; font-size: 16px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 8px;">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        ${errorMessage}
                    </div>
                    <div style="color: var(--secondary); font-size: 14px; margin-bottom: 15px;">
                        随想ID: ${thoughtId}
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="thoughtCommentManager.loadGiscusComments('${thoughtId}', 0)" 
                                style="background: var(--primary); color: var(--theme); border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            重新加载
                        </button>
                        <button onclick="thoughtCommentManager.hideComments('${thoughtId}')" 
                                style="background: transparent; color: var(--secondary); border: 1px solid var(--border); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            关闭
                        </button>
                    </div>
                </div>
            `;
        }
        
        setupGiscusEventListener(thoughtId) {
            console.log('Thought Comments: Setting up enhanced Giscus event listener for thought:', thoughtId);
            
            // 设置MutationObserver监听DOM变化
            this.setupMutationObserver(thoughtId);
            
            // 设置DOM事件监听器（监听评论表单提交）
            this.setupFormSubmissionListener(thoughtId);
            
            // 监听Giscus的自定义事件和消息
            const handleGiscusMessage = (event) => {
                try {
                    const data = event.data;
                    
                    // 处理Giscus消息事件
                    if (data && data.giscus) {
                        console.log('Thought Comments: Giscus event received:', data.giscus);
                        this.processGiscusEvent(data.giscus, thoughtId);
                    }
                    
                    // 处理自定义事件类型
                    if (data && (data.type === 'giscus:comment' || data.type === 'giscus:commentPosted')) {
                        console.log('Thought Comments: Custom comment event received:', data);
                        this.handleCommentSubmission(thoughtId);
                    }
                    
                    // 处理评论提交确认
                    if (data && data.action === 'comment submitted') {
                        console.log('Thought Comments: Comment submission confirmed:', data);
                        this.handleCommentSubmission(thoughtId);
                    }
                    
                    // 处理更多可能的Giscus事件
                    if (data && data.subject === 'giscus' && data.payload) {
                        console.log('Thought Comments: Giscus payload event received:', data.payload);
                        if (data.payload.event === 'comment' || data.payload.event === 'reply') {
                            this.handleCommentSubmission(thoughtId);
                        }
                    }
                    
                } catch (error) {
                    console.warn('Thought Comments: Error handling Giscus message:', error);
                }
            };
            
            // 监听Giscus自定义事件（通过document）
            const handleCustomEvent = (event) => {
                console.log('Thought Comments: Custom event detected:', event.type, event.detail);
                
                if (event.type === 'giscus:comment' || event.type === 'giscus:commentPosted') {
                    this.handleCommentSubmission(thoughtId);
                }
            };
            
            // 添加事件监听器
            window.addEventListener('message', handleGiscusMessage);
            document.addEventListener('giscus:comment', handleCustomEvent);
            document.addEventListener('giscus:commentPosted', handleCustomEvent);
            
            // 添加全局Giscus事件监听器
            window.addEventListener('message', (event) => {
                // 检查是否是Giscus发来的消息
                if (event.origin !== 'https://giscus.app') return;
                
                try {
                    const data = event.data;
                    if (!data) return;
                    
                    // 处理Giscus的各种消息类型
                    if (data.giscus || data.subject === 'giscus') {
                        console.log('Thought Comments: Global Giscus message received:', data);
                        
                        // 检查是否是评论提交事件
                        if (
                            data.giscus?.discussion?.commentCount !== undefined ||
                            data.giscus?.comment !== undefined ||
                            data.giscus?.reply !== undefined ||
                            data.payload?.event === 'comment' ||
                            data.payload?.event === 'reply'
                        ) {
                            // 获取当前打开的随想ID
                            const currentThoughtId = this.currentOpenThoughtId;
                            if (currentThoughtId) {
                                console.log('Thought Comments: Comment submission detected for current thought:', currentThoughtId);
                                this.handleCommentSubmission(currentThoughtId);
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Thought Comments: Error handling global Giscus message:', error);
                }
            });
            
            // 添加全局评论提交事件监听器
            document.addEventListener('giscus:comment', (event) => {
                console.log('Thought Comments: Global giscus:comment event detected:', event);
                const currentThoughtId = this.currentOpenThoughtId;
                if (currentThoughtId) {
                    this.handleCommentSubmission(currentThoughtId);
                }
            });
            
            document.addEventListener('giscus:commentPosted', (event) => {
                console.log('Thought Comments: Global giscus:commentPosted event detected:', event);
                const currentThoughtId = this.currentOpenThoughtId;
                if (currentThoughtId) {
                    this.handleCommentSubmission(currentThoughtId);
                }
            });
            
            // 存储事件监听器以便清理
            if (!this.eventListeners) {
                this.eventListeners = new Map();
            }
            this.eventListeners.set(thoughtId, {
                messageHandler: handleGiscusMessage,
                customEventHandler: handleCustomEvent
            });
            
            // 添加定期同步机制作为备用
            this.startPeriodicSync(thoughtId);
            
            // 设置评论提交检测
            this.setupCommentSubmissionDetection(thoughtId);
            
            // 设置 postMessage 响应处理器
            this.setupPostMessageHandler(thoughtId);
        }
        
        setupPostMessageHandler(thoughtId) {
            console.log('Thought Comments: Setting up postMessage handler for thought:', thoughtId);
            
            // 存储处理器以便清理
            if (!this.postMessageHandlers) {
                this.postMessageHandlers = new Map();
            }
            
            const handler = (event) => {
                // 检查消息来源是否是 Giscus
                if (event.origin !== 'https://giscus.app') return;
                
                try {
                    const data = event.data;
                    if (!data) return;
                    
                    // 处理评论计数响应
                    if (data.type === 'giscus:commentCount' && data.thoughtId === thoughtId) {
                        console.log('Thought Comments: Received comment count from iframe:', data.count);
                        if (data.count !== undefined && !isNaN(data.count)) {
                            this.setCommentCount(thoughtId, data.count);
                            this.commentCountCache.set(thoughtId, data.count);
                        }
                    }
                    
                    // 处理其他可能的 Giscus 消息
                    if (data.giscus && data.giscus.discussion && data.giscus.discussion.commentCount !== undefined) {
                        console.log('Thought Comments: Received comment count via Giscus message:', data.giscus.discussion.commentCount);
                        this.setCommentCount(thoughtId, data.giscus.discussion.commentCount);
                        this.commentCountCache.set(thoughtId, data.giscus.discussion.commentCount);
                    }
                } catch (error) {
                    console.warn('Thought Comments: Error handling postMessage:', error);
                }
            };
            
            // 添加事件监听器
            window.addEventListener('message', handler);
            
            // 存储处理器以便清理
            this.postMessageHandlers.set(thoughtId, handler);
        }
        
        setupIframeLoadListener(thoughtId) {
            console.log('Thought Comments: Setting up iframe load listener for thought:', thoughtId);
            
            // 等待 iframe 加载完成
            const checkForIframe = () => {
                const giscusWrapper = document.getElementById(`giscus-${thoughtId}`);
                if (!giscusWrapper) return;
                
                const iframe = giscusWrapper.querySelector('iframe.giscus-frame');
                if (iframe) {
                    console.log('Thought Comments: Found Giscus iframe for thought:', thoughtId);
                    
                    // 监听 iframe 的加载事件
                    iframe.addEventListener('load', () => {
                        console.log('Thought Comments: Giscus iframe loaded for thought:', thoughtId);
                        // 延迟一下确保内容完全加载
                        setTimeout(() => {
                            this.syncCommentCountFromGiscusUI(thoughtId);
                        }, 1000);
                    });
                    
                    // 如果已经加载完成，立即同步
                    if (iframe.complete || iframe.readyState === 'complete') {
                        console.log('Thought Comments: Giscus iframe already loaded for thought:', thoughtId);
                        setTimeout(() => {
                            this.syncCommentCountFromGiscusUI(thoughtId);
                        }, 1000);
                    }
                } else {
                    // 如果还没找到 iframe，继续等待
                    setTimeout(checkForIframe, 500);
                }
            };
            
            // 开始检查
            setTimeout(checkForIframe, 1000);
        }
        
        setupCommentSubmissionDetection(thoughtId) {
            console.log('Thought Comments: Setting up comment submission detection for thought:', thoughtId);
            
            // 监听 Giscus 容器内的变化，检测评论提交
            const giscusWrapper = document.getElementById(`giscus-${thoughtId}`);
            if (!giscusWrapper) return;
            
            // 创建 MutationObserver 来监听 DOM 变化
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    // 检查是否有新评论被添加
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // 检查是否是评论元素
                                if (node.classList && node.classList.contains('giscus-comment')) {
                                    console.log('Thought Comments: New comment detected for thought:', thoughtId);
                                    setTimeout(() => {
                                        this.syncCommentCountFromGiscusUI(thoughtId);
                                    }, 500);
                                }
                                
                                // 检查子元素中是否有评论
                                const comments = node.querySelectorAll && node.querySelectorAll('.giscus-comment');
                                if (comments && comments.length > 0) {
                                    console.log('Thought Comments: New comments detected in container for thought:', thoughtId);
                                    setTimeout(() => {
                                        this.syncCommentCountFromGiscusUI(thoughtId);
                                    }, 500);
                                }
                            }
                        });
                    }
                });
            });
            
            // 存储观察器以便清理
            if (!this.commentSubmissionObservers) {
                this.commentSubmissionObservers = new Map();
            }
            this.commentSubmissionObservers.set(thoughtId, observer);
            
            // 开始观察
            observer.observe(giscusWrapper, {
                childList: true,
                subtree: true
            });
            
            // 监听 iframe 内部的消息
            window.addEventListener('message', (event) => {
                // 检查消息来源是否是 Giscus
                if (event.origin !== 'https://giscus.app') return;
                
                // 检查是否是评论相关的消息
                if (event.data && event.data.giscus) {
                    console.log('Thought Comments: Received Giscus message:', event.data);
                    
                    // 检查是否是评论提交成功的消息
                    if (event.data.giscus.discussion && event.data.giscus.comment) {
                        console.log('Thought Comments: Comment submission detected for thought:', thoughtId);
                        setTimeout(() => {
                            this.syncCommentCountFromGiscusUI(thoughtId);
                        }, 1000);
                    }
                }
            });
        }
        
        processGiscusEvent(giscusData, thoughtId) {
            // 更全面的评论活动检测
            const hasCommentActivity = (
                giscusData.error === undefined && (
                    giscusData.discussion?.commentCount !== undefined ||
                    giscusData.comment?.id !== undefined ||
                    giscusData.comment !== undefined ||
                    giscusData.reply !== undefined ||
                    giscusData.reaction?.emoji !== undefined ||
                    giscusData.discussion?.totalCommentCount !== undefined
                )
            );
            
            // 检测评论提交事件（更精确的检测）
            const isCommentSubmission = (
                giscusData.comment?.id !== undefined ||
                giscusData.reply?.id !== undefined ||
                giscusData.comment?.body !== undefined ||
                giscusData.reply?.body !== undefined ||
                giscusData.action === 'comment submitted' ||
                giscusData.type === 'comment' ||
                giscusData.type === 'reply'
            );
            
            // 检测评论计数更新
            const hasCountUpdate = (
                giscusData.discussion?.commentCount !== undefined ||
                giscusData.discussion?.totalCommentCount !== undefined
            );
            
            if (hasCommentActivity) {
                console.log('Thought Comments: Comment activity detected');
                
                if (isCommentSubmission) {
                    console.log('Thought Comments: Comment submission detected, performing optimistic update');
                    this.handleOptimisticUpdate(thoughtId);
                } else if (hasCountUpdate) {
                    console.log('Thought Comments: Count update detected');
                    const newCount = giscusData.discussion?.commentCount || 
                                   giscusData.discussion?.totalCommentCount || 
                                   giscusData.commentCount;
                    if (newCount !== undefined) {
                        this.setCommentCount(thoughtId, newCount);
                    }
                } else {
                    // 其他评论活动，更新计数
                    this.updateCommentCount(thoughtId);
                }
            }
        }
        
        setupFormSubmissionListener(thoughtId) {
            // 监听评论表单的提交事件
            const giscusWrapper = document.getElementById(`giscus-${thoughtId}`);
            if (!giscusWrapper) return;
            
            // 使用MutationObserver监听表单的出现
            const formObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 查找评论表单
                            const forms = node.querySelectorAll ?
                                node.querySelectorAll('form') : [];
                            
                            forms.forEach(form => {
                                // 监听表单提交
                                form.addEventListener('submit', (e) => {
                                    console.log('Thought Comments: Comment form submitted');
                                    this.handleOptimisticUpdate(thoughtId);
                                });
                                
                                // 监听提交按钮点击
                                const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"]');
                                submitButtons.forEach(button => {
                                    button.addEventListener('click', (e) => {
                                        console.log('Thought Comments: Submit button clicked');
                                        this.handleOptimisticUpdate(thoughtId);
                                    });
                                });
                                
                                // 监听输入框的按键事件（特别是Ctrl+Enter）
                                const textareas = form.querySelectorAll('textarea');
                                textareas.forEach(textarea => {
                                    textarea.addEventListener('keydown', (e) => {
                                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                            console.log('Thought Comments: Ctrl+Enter pressed in textarea');
                                            this.handleOptimisticUpdate(thoughtId);
                                        }
                                    });
                                });
                            });
                            
                            // 递归检查子节点
                            if (node.querySelectorAll) {
                                const nestedForms = node.querySelectorAll('form');
                                nestedForms.forEach(form => {
                                    form.addEventListener('submit', (e) => {
                                        console.log('Thought Comments: Nested comment form submitted');
                                        this.handleOptimisticUpdate(thoughtId);
                                    });
                                    
                                    // 监听嵌套表单的提交按钮
                                    const nestedSubmitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"]');
                                    nestedSubmitButtons.forEach(button => {
                                        button.addEventListener('click', (e) => {
                                            console.log('Thought Comments: Nested submit button clicked');
                                            this.handleOptimisticUpdate(thoughtId);
                                        });
                                    });
                                    
                                    // 监听嵌套表单的输入框
                                    const nestedTextareas = form.querySelectorAll('textarea');
                                    nestedTextareas.forEach(textarea => {
                                        textarea.addEventListener('keydown', (e) => {
                                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                                console.log('Thought Comments: Ctrl+Enter pressed in nested textarea');
                                                this.handleOptimisticUpdate(thoughtId);
                                            }
                                        });
                                    });
                                });
                            }
                        }
                    });
                });
            });
            
            // 开始观察
            formObserver.observe(giscusWrapper, {
                childList: true,
                subtree: true
            });
            
            // 存储观察器
            if (!this.formObservers) {
                this.formObservers = new Map();
            }
            this.formObservers.set(thoughtId, formObserver);
            
            console.log('Thought Comments: Enhanced form submission listener set up for thought:', thoughtId);
        }
        
        handleOptimisticUpdate(thoughtId) {
            console.log('Thought Comments: Performing optimistic update for thought:', thoughtId);
            
            // 获取当前计数
            const commentButton = document.querySelector(`.thought-action.comment-btn[data-thought-id="${thoughtId}"]`);
            if (commentButton) {
                const countSpan = commentButton.querySelector('.comment-count');
                if (countSpan) {
                    const currentCount = parseInt(countSpan.textContent) || 0;
                    const newCount = currentCount + 1;
                    
                    // 使用 setCommentCount 方法确保一致的更新逻辑
                    this.setCommentCount(thoughtId, newCount);
                    
                    // 显示乐观更新反馈
                    this.showOptimisticUpdateFeedback(thoughtId, newCount);
                }
            }
        }
        
        showOptimisticUpdateFeedback(thoughtId, newCount) {
            const commentButton = document.querySelector(`.thought-action.comment-btn[data-thought-id="${thoughtId}"]`);
            if (commentButton) {
                const countSpan = commentButton.querySelector('.comment-count');
                if (countSpan) {
                    // 添加成功动画和样式
                    countSpan.style.background = '#4CAF50';
                    countSpan.style.color = 'white';
                    countSpan.style.transform = 'scale(1.3)';
                    countSpan.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.4)';
                    
                    // 添加脉冲动画
                    countSpan.style.animation = 'pulse 0.6s ease-in-out';
                    
                    // 恢复原始样式
                    setTimeout(() => {
                        countSpan.style.background = '';
                        countSpan.style.color = '';
                        countSpan.style.transform = 'scale(1)';
                        countSpan.style.boxShadow = '';
                        countSpan.style.animation = '';
                    }, 1500);
                }
            }
        }
        
        async validateCommentCount(thoughtId, expectedCount) {
            try {
                console.log('Thought Comments: Validating comment count for thought:', thoughtId, 'expected:', expectedCount);
                
                // 尝试从Giscus UI获取实际计数
                const actualCount = await this.getCommentCountFromGiscusUI(thoughtId);
                
                if (actualCount !== null && actualCount !== expectedCount) {
                    console.log('Thought Comments: Count mismatch detected, correcting:', actualCount, 'vs', expectedCount);
                    this.setCommentCount(thoughtId, actualCount);
                    this.showCountCorrectionFeedback(thoughtId, actualCount);
                } else if (actualCount === null) {
                    // 如果无法从UI获取，尝试API
                    await this.updateCommentCount(thoughtId);
                }
            } catch (error) {
                console.warn('Thought Comments: Error validating comment count:', error);
            }
        }
        
        showCountCorrectionFeedback(thoughtId, correctedCount) {
            const commentButton = document.querySelector(`.thought-action.comment-btn[data-thought-id="${thoughtId}"]`);
            if (commentButton) {
                const countSpan = commentButton.querySelector('.comment-count');
                if (countSpan) {
                    // 显示修正动画
                    countSpan.style.background = '#FF9800';
                    countSpan.style.color = 'white';
                    countSpan.style.transform = 'scale(1.2)';
                    
                    setTimeout(() => {
                        countSpan.style.background = '';
                        countSpan.style.color = '';
                        countSpan.style.transform = 'scale(1)';
                    }, 1000);
                }
            }
        }
        
        setupMutationObserver(thoughtId) {
            const giscusWrapper = document.getElementById(`giscus-${thoughtId}`);
            if (!giscusWrapper) return;
            
            // 创建MutationObserver监听DOM变化
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    // 检查是否有新节点添加（可能是新评论）
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        const hasNewComment = this.checkForNewComments(mutation.addedNodes);
                        if (hasNewComment) {
                            console.log('Thought Comments: New comment detected via MutationObserver');
                            this.handleCommentSubmission(thoughtId);
                        }
                    }
                    
                    // 检查属性变化（可能是评论计数更新）
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const target = mutation.target;
                        if (target.classList && target.classList.contains('giscus-frame')) {
                            console.log('Thought Comments: Giscus frame attribute changed');
                            this.updateCommentCount(thoughtId);
                        }
                    }
                    
                    // 检查文本内容变化（可能是评论计数更新）
                    if (mutation.type === 'childList' && mutation.target) {
                        // 检查是否有评论计数相关的文本变化
                        const countElements = mutation.target.querySelectorAll ?
                            mutation.target.querySelectorAll('[data-comment-count], .comment-count, [class*="comment-count"]') : [];
                        
                        if (countElements.length > 0) {
                            console.log('Thought Comments: Comment count element text changed detected');
                            // 延迟一下确保计数完全更新
                            setTimeout(() => {
                                this.syncCommentCountFromGiscusUI(thoughtId);
                            }, 500);
                        }
                    }
                });
            });
            
            // 配置观察选项
            const config = {
                childList: true,    // 观察子节点的添加或删除
                subtree: true,      // 观察所有后代节点
                attributes: true,   // 观察属性变化
                attributeFilter: ['class', 'style', 'data-comment-count'],
                characterData: true // 观察文本内容变化
            };
            
            // 开始观察
            observer.observe(giscusWrapper, config);
            
            // 存储观察器以便清理
            this.mutationObservers.set(thoughtId, observer);
            
            console.log('Thought Comments: Enhanced MutationObserver set up for thought:', thoughtId);
        }
        
        checkForNewComments(nodes) {
            for (const node of nodes) {
                // 检查是否是评论元素
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // 检查常见的评论相关类名和属性
                    const commentSelectors = [
                        '[class*="comment"]',
                        '[class*="reply"]',
                        '[data-comment-id]',
                        '[class*="giscus-comment"]',
                        '[class*="discussion"]'
                    ];
                    
                    for (const selector of commentSelectors) {
                        if (node.matches && node.matches(selector)) {
                            return true;
                        }
                        
                        // 检查子元素
                        if (node.querySelector && node.querySelector(selector)) {
                            return true;
                        }
                    }
                    
                    // 递归检查子节点
                    if (node.children && node.children.length > 0) {
                        if (this.checkForNewComments(node.children)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        
        async handleCommentSubmission(thoughtId) {
            console.log('Thought Comments: Handling comment submission for thought:', thoughtId);
            
            // 防止重复处理同一个提交
            if (this.isProcessingComment) {
                console.log('Thought Comments: Already processing comment submission, skipping');
                return;
            }
            
            this.isProcessingComment = true;
            
            // 获取当前计数作为基准
            const currentCount = this.getCurrentCommentCount(thoughtId) || 0;
            
            // 立即执行乐观更新
            this.handleOptimisticUpdate(thoughtId);
            
            // 快速同步计数 - 减少延迟
            setTimeout(() => {
                this.syncCommentCountFromGiscusUI(thoughtId);
            }, 300); // 减少延迟时间到300ms
            
            // 主要的延迟更新，使用API确保获取准确计数 - 加快速度
            setTimeout(async () => {
                try {
                    // 直接从GitHub API获取计数
                    const githubCount = await this.fetchCommentCountFromGitHub(thoughtId);
                    if (githubCount !== null) {
                        // 确保计数至少比提交前多1
                        const expectedCount = Math.max(currentCount + 1, githubCount);
                        this.setCommentCount(thoughtId, expectedCount);
                        console.log(`Thought Comments: Updated count to ${expectedCount} for ${thoughtId}`);
                    } else {
                        // 如果GitHub API失败，尝试其他方法
                        await this.updateCommentCount(thoughtId);
                    }
                } catch (error) {
                    console.warn('Thought Comments: Error in comment count update:', error);
                    // 确保至少显示乐观更新的计数
                    const optimisticCount = this.getCurrentCommentCount(thoughtId);
                    if (optimisticCount <= currentCount) {
                        this.setCommentCount(thoughtId, currentCount + 1);
                    }
                } finally {
                    this.isProcessingComment = false; // 重置处理状态
                }
            }, 800); // 减少延迟时间到800ms
            
            // 显示视觉反馈
            this.showCommentSubmissionFeedback(thoughtId);
        }
        
        showCommentSubmissionFeedback(thoughtId) {
            const commentButton = document.querySelector(`.thought-action.comment-btn[data-thought-id="${thoughtId}"]`);
            if (commentButton) {
                const countSpan = commentButton.querySelector('.comment-count');
                if (countSpan) {
                    // 添加成功动画
                    countSpan.style.background = '#4CAF50';
                    countSpan.style.color = 'white';
                    countSpan.style.transform = 'scale(1.3)';
                    
                    // 恢复原始样式
                    setTimeout(() => {
                        countSpan.style.background = '';
                        countSpan.style.color = '';
                        countSpan.style.transform = 'scale(1)';
                    }, 1500);
                }
            }
        }
        
        startPeriodicSync(thoughtId) {
            // 为每个thoughtId启动定期同步
            if (this.syncIntervals && this.syncIntervals.has(thoughtId)) {
                return; // 避免重复启动
            }
            
            if (!this.syncIntervals) {
                this.syncIntervals = new Map();
            }
            
            const intervalId = setInterval(() => {
                // 只在评论容器可见时进行同步
                const commentsContainer = document.getElementById(`comments-${thoughtId}`);
                if (commentsContainer && commentsContainer.style.display !== 'none') {
                    // 首先尝试从 Giscus UI 同步计数
                    this.syncCommentCountFromGiscusUI(thoughtId);
                    
                    // 获取当前计数
                    const currentCount = this.getCurrentCommentCount(thoughtId);
                    
                    // 只有在计数确实有变化时才更新
                    if (currentCount !== null && currentCount !== this.lastCommentCounts.get(thoughtId)) {
                        console.log('Thought Comments: Comment count changed from', this.lastCommentCounts.get(thoughtId), 'to', currentCount);
                        this.lastCommentCounts.set(thoughtId, currentCount);
                        this.setCommentCount(thoughtId, currentCount);
                    }
                }
            }, 2000); // 提高同步频率到2秒，加快评论计数更新速度
            
            this.syncIntervals.set(thoughtId, intervalId);
            
            console.log('Thought Comments: Started periodic sync for thought:', thoughtId);
        }
        
        stopPeriodicSync(thoughtId) {
            if (this.syncIntervals && this.syncIntervals.has(thoughtId)) {
                clearInterval(this.syncIntervals.get(thoughtId));
                this.syncIntervals.delete(thoughtId);
                console.log('Thought Comments: Stopped periodic sync for thought:', thoughtId);
            }
        }
        
        async updateCommentCount(thoughtId) {
            console.log('Thought Comments: Updating comment count for thought:', thoughtId);
            
            try {
                // 首先尝试直接从Giscus界面获取计数
                const directCount = await this.getCommentCountFromGiscusUI(thoughtId);
                if (directCount !== null) {
                    this.setCommentCount(thoughtId, directCount);
                    console.log('Thought Comments: Updated comment count from Giscus UI for', thoughtId, 'to', directCount);
                    return;
                }
                
                // 如果直接获取失败，尝试GitHub API
                const pagePath = window.location.pathname;
                const uniqueId = `${pagePath}#${thoughtId}`;
                const repo = 'litianfugt/litianfugt.github.io';
                const categoryId = 'DIC_kwDOPkZVNc4Cv3cN';
                
                // 首先尝试从giscus获取评论计数
                const giscusSuccess = await this.updateCommentCountFromGiscus(thoughtId, uniqueId, repo, categoryId);
                
                // 如果giscus方法失败，使用GitHub API作为备用
                if (!giscusSuccess || !this.hasValidCommentCount(thoughtId)) {
                    await this.updateCommentCountFromGitHub(thoughtId, uniqueId, repo, categoryId);
                }
                
                // 如果API方法都失败，尝试从localStorage获取缓存的计数
                if (!this.hasValidCommentCount(thoughtId)) {
                    const cachedCount = localStorage.getItem(`comment-count-${thoughtId}`);
                    if (cachedCount !== null) {
                        const count = parseInt(cachedCount) || 0;
                        this.setCommentCount(thoughtId, count);
                        console.log('Thought Comments: Using cached count for', thoughtId, 'to', count);
                    } else {
                        // 最后的备用方案：设置为0
                        this.setCommentCount(thoughtId, 0);
                        console.log('Thought Comments: Setting default count to 0 for', thoughtId);
                    }
                }
            } catch (error) {
                console.error('Thought Comments: Error updating comment count:', error);
                // 设置默认值为0
                this.setCommentCount(thoughtId, 0);
            }
        }
        
        // 添加一个直接从GitHub API获取评论计数的简化方法
        async fetchCommentCountFromGitHub(thoughtId) {
            try {
                const pagePath = window.location.pathname;
                const uniqueId = `${pagePath}#${thoughtId}`;
                const repo = 'litianfugt/litianfugt.github.io';
                const categoryId = 'DIC_kwDOPkZVNc4Cv3cN';
                
                // 使用GitHub REST API获取讨论信息
                const apiUrl = `https://api.github.com/repos/${repo}/discussions?category_id=${categoryId}&per_page=100`;
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`GitHub API request failed: ${response.status}`);
                }
                
                const discussions = await response.json();
                
                // 查找匹配的讨论
                const discussion = discussions.find(d => {
                    if (d.title === uniqueId) return true;
                    if (d.title.includes(thoughtId)) return true;
                    if (d.url && d.url.includes(uniqueId)) return true;
                    if (d.body && d.body.includes(thoughtId)) return true;
                    return false;
                });
                
                if (discussion) {
                    const count = discussion.comments || 0;
                    console.log('Thought Comments: Fetched comment count from GitHub API for', thoughtId, 'to', count);
                    return count;
                } else {
                    console.log('Thought Comments: No discussion found for thought:', thoughtId);
                    return 0;
                }
            } catch (error) {
                console.warn('Thought Comments: Error fetching comment count from GitHub API:', error);
                return null;
            }
        }
        
        async getCommentCountFromGiscusUI(thoughtId) {
            try {
                const giscusWrapper = document.getElementById(`giscus-${thoughtId}`);
                if (!giscusWrapper) return null;
                
                // 等待一小段时间确保Giscus完全加载
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // 方法1: 尝试通过 postMessage 从 iframe 获取计数（避免跨域问题）
                const iframe = giscusWrapper.querySelector('iframe.giscus-frame');
                if (iframe) {
                    try {
                        // 通过 postMessage 请求计数，而不是直接访问 iframe 内容
                        iframe.contentWindow.postMessage({
                            type: 'giscus:getCommentCount',
                            thoughtId: thoughtId
                        }, 'https://giscus.app');
                        
                        console.log('Thought Comments: Sent postMessage request for comment count');
                    } catch (error) {
                        console.warn('Thought Comments: Cannot send postMessage to iframe:', error);
                    }
                }
                
                // 方法2: 尝试从主页面中的Giscus相关元素获取
                const mainPageSelectors = [
                    `#giscus-${thoughtId} [data-comment-count]`,
                    `#giscus-${thoughtId} .comment-count`,
                    `#giscus-${thoughtId} [class*="comment-count"]`,
                    `#giscus-${thoughtId} [class*="comment"] [class*="count"]`
                ];
                
                for (const selector of mainPageSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        const text = element.textContent || element.getAttribute('data-comment-count') || '';
                        const count = parseInt(text.replace(/[^\d]/g, ''));
                        if (!isNaN(count) && count >= 0) {
                            console.log('Thought Comments: Found count from main page:', count);
                            return count;
                        }
                    }
                }
                
                // 方法3: 尝试通过postMessage从iframe获取计数
                if (iframe) {
                    try {
                        // 发送消息请求计数
                        iframe.contentWindow.postMessage({
                            type: 'giscus:getCommentCount',
                            thoughtId: thoughtId
                        }, '*');
                        
                        // 等待响应
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // 检查是否有缓存的结果
                        if (this.commentCountCache.has(thoughtId)) {
                            return this.commentCountCache.get(thoughtId);
                        }
                    } catch (error) {
                        console.warn('Thought Comments: PostMessage approach failed:', error);
                    }
                }
                
                // 方法4: 尝试从localStorage中获取Giscus缓存的数据
                try {
                    const giscusData = localStorage.getItem('giscus-discussion');
                    if (giscusData) {
                        const parsed = JSON.parse(giscusData);
                        const pagePath = window.location.pathname;
                        const uniqueId = `${pagePath}#${thoughtId}`;
                        
                        if (parsed[uniqueId] && parsed[uniqueId].commentCount !== undefined) {
                            return parsed[uniqueId].commentCount;
                        }
                    }
                } catch (error) {
                    console.warn('Thought Comments: localStorage approach failed:', error);
                }
                
                return null;
            } catch (error) {
                console.warn('Thought Comments: Error getting count from Giscus UI:', error);
                return null;
            }
        }
        
        async updateCommentCountFromGiscus(thoughtId, uniqueId, repo, categoryId) {
            try {
                // 使用GitHub REST API获取讨论信息
                const apiUrl = `https://api.github.com/repos/${repo}/discussions?category_id=${categoryId}&per_page=100`;
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`GitHub API request failed: ${response.status}`);
                }
                
                const discussions = await response.json();
                
                // 查找匹配的讨论
                const discussion = discussions.find(d => {
                    if (d.title === uniqueId) return true;
                    if (d.title.includes(thoughtId)) return true;
                    if (d.url && d.url.includes(uniqueId)) return true;
                    if (d.body && d.body.includes(thoughtId)) return true;
                    return false;
                });
                
                if (discussion) {
                    const count = discussion.comments || 0;
                    this.setCommentCount(thoughtId, count);
                    console.log('Thought Comments: Updated comment count from GitHub for', thoughtId, 'to', count);
                    return true;
                } else {
                    this.setCommentCount(thoughtId, 0);
                    console.log('Thought Comments: No discussion found for thought:', thoughtId, 'setting count to 0');
                    return true;
                }
            } catch (error) {
                console.warn('Thought Comments: GitHub API failed, falling back to GraphQL:', error);
                return false;
            }
        }
        
        async updateCommentCountFromGitHub(thoughtId, uniqueId, repo, categoryId) {
            try {
                // 构建GraphQL查询
                const query = `
                    query {
                        repository(owner: "${repo.split('/')[0]}", name: "${repo.split('/')[1]}") {
                            discussions(categoryId: "${categoryId}", first: 100) {
                                nodes {
                                    title
                                    url
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
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ query })
                });
                
                if (!response.ok) {
                    throw new Error(`GitHub API request failed: ${response.status}`);
                }
                
                const data = await response.json();
                const discussions = data.data.repository.discussions.nodes;
                
                // 查找匹配的讨论
                const discussion = discussions.find(d =>
                    d.title === uniqueId ||
                    d.title.includes(thoughtId) ||
                    d.url.includes(uniqueId)
                );
                
                if (discussion) {
                    const count = discussion.comments.totalCount;
                    this.setCommentCount(thoughtId, count);
                    console.log('Thought Comments: Updated comment count from GraphQL for', thoughtId, 'to', count);
                } else {
                    this.setCommentCount(thoughtId, 0);
                    console.log('Thought Comments: No discussion found for thought:', thoughtId);
                }
            } catch (error) {
                console.error('Thought Comments: GraphQL API failed:', error);
                this.setCommentCount(thoughtId, 0);
            }
        }
        
        getCurrentCommentCount(thoughtId) {
            const commentButton = document.querySelector(`.thought-action.comment-btn[data-thought-id="${thoughtId}"]`);
            if (commentButton) {
                const countSpan = commentButton.querySelector('.comment-count');
                if (countSpan) {
                    const count = parseInt(countSpan.textContent);
                    return !isNaN(count) ? count : null;
                }
            }
            return null;
        }
        
        syncCommentCountFromGiscusUI(thoughtId) {
            console.log('Thought Comments: Syncing comment count from Giscus UI for thought:', thoughtId);
            
            // 尝试从 Giscus 容器直接获取计数
            const giscusWrapper = document.getElementById(`giscus-${thoughtId}`);
            if (!giscusWrapper) return;
            
            // 方法1: 查找 Giscus 容器内的计数元素
            const giscusCountSelectors = [
                '[data-comment-count]',
                '.comment-count',
                '[class*="comment-count"]',
                '[class*="comment"] [class*="count"]',
                '.giscus-comments-count',
                '[aria-label*="comment"]',
                '[class*="giscus"] [class*="count"]',
                // 添加更多可能的计数元素选择器
                '.main-content .pagination-info',
                '.Box-header .d-flex .f6',
                '.discussion-sidebar-item .Counter'
            ];
            
            // 首先尝试从 Giscus 容器内查找
            for (const selector of giscusCountSelectors) {
                const elements = giscusWrapper.querySelectorAll(selector);
                for (const element of elements) {
                    const text = element.textContent || element.getAttribute('data-comment-count') || '';
                    const count = parseInt(text.replace(/[^\d]/g, ''));
                    if (!isNaN(count) && count >= 0) {
                        console.log('Thought Comments: Found Giscus count:', count);
                        this.setCommentCount(thoughtId, count);
                        return;
                    }
                }
            }
            
            // 方法2: 尝试从iframe中获取计数
            const iframe = giscusWrapper.querySelector('iframe.giscus-frame');
            if (iframe) {
                try {
                    // 尝试访问iframe内容（可能会因为跨域限制而失败）
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc) {
                        const iframeSelectors = [
                            '.comment-count',
                            '[data-comment-count]',
                            '.pagination-info',
                            '.Counter'
                        ];
                        
                        for (const selector of iframeSelectors) {
                            const element = iframeDoc.querySelector(selector);
                            if (element) {
                                const text = element.textContent || '';
                                const count = parseInt(text.replace(/[^\d]/g, ''));
                                if (!isNaN(count) && count >= 0) {
                                    console.log('Thought Comments: Found count in iframe:', count);
                                    this.setCommentCount(thoughtId, count);
                                    return;
                                }
                            }
                        }
                    }
                    
                    // 通过 postMessage 请求计数
                    iframe.contentWindow.postMessage({
                        type: 'giscus:getCommentCount',
                        thoughtId: thoughtId
                    }, 'https://giscus.app');
                    
                    console.log('Thought Comments: Sent postMessage request for comment count');
                } catch (error) {
                    console.warn('Thought Comments: Cannot access iframe content:', error);
                }
            }
            
            // 方法3: 如果以上方法都失败，尝试通过 API 获取
            console.log('Thought Comments: Direct Giscus UI sync failed, falling back to API');
            this.updateCommentCount(thoughtId);
        }
        
        hasValidCommentCount(thoughtId) {
            const commentButton = document.querySelector(`.thought-action.comment-btn[data-thought-id="${thoughtId}"]`);
            if (commentButton) {
                const countSpan = commentButton.querySelector('.comment-count');
                if (countSpan) {
                    const count = parseInt(countSpan.textContent);
                    return !isNaN(count) && count >= 0;
                }
            }
            return false;
        }
        
        setCommentCount(thoughtId, count) {
            // 确保count是数字
            const numericCount = parseInt(count) || 0;
            
            // 更新所有匹配的评论按钮（可能有多个）
            const commentButtons = document.querySelectorAll(`.thought-action.comment-btn[data-thought-id="${thoughtId}"]`);
            let updated = false;
            
            commentButtons.forEach(button => {
                const countSpan = button.querySelector('.comment-count');
                if (countSpan) {
                    const oldCount = parseInt(countSpan.textContent) || 0;
                    
                    // 强制更新计数，确保DOM更新
                    console.log(`Thought Comments: Updating count for ${thoughtId} from ${oldCount} to ${numericCount}`);
                    
                    // 强制DOM更新
                    countSpan.textContent = numericCount;
                    
                    // 只有当计数确实变化时才添加动画和保存
                    if (oldCount !== numericCount) {
                        // 只有当计数增加时才添加简单动画
                        if (numericCount > oldCount) {
                            countSpan.style.color = '#4CAF50';
                            countSpan.style.transform = 'scale(1.1)';
                            
                            setTimeout(() => {
                                countSpan.style.color = '';
                                countSpan.style.transform = 'scale(1)';
                            }, 500); // 缩短动画时间
                        }
                        
                        updated = true;
                    }
                }
            });
            
            // 总是保存到本地存储，确保数据持久化
            localStorage.setItem(`comment-count-${thoughtId}`, numericCount);
            this.lastCommentCounts.set(thoughtId, numericCount);
            
            return updated;
        }
        
        async updateAllCommentCounts() {
            console.log('Thought Comments: Updating all comment counts');
            
            const thoughtCards = document.querySelectorAll('.thought-card');
            
            // 串行更新所有评论计数，避免API限制
            for (const card of thoughtCards) {
                const thoughtId = card.dataset.thoughtId;
                if (thoughtId) {
                    try {
                        await this.updateCommentCount(thoughtId);
                        // 添加小延迟避免API限制
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                        console.warn('Thought Comments: Failed to update count for', thoughtId, error);
                    }
                }
            }
            
            console.log('Thought Comments: All comment counts updated');
        }
        
        // 添加从GitHub API更新所有评论计数的方法
        async updateAllCommentCountsFromGitHub() {
            console.log('Thought Comments: Updating all comment counts from GitHub API');
            
            const thoughtCards = document.querySelectorAll('.thought-card');
            
            // 串行更新所有评论计数，避免API限制
            for (const card of thoughtCards) {
                const thoughtId = card.dataset.thoughtId;
                if (thoughtId) {
                    try {
                        const count = await this.fetchCommentCountFromGitHub(thoughtId);
                        if (count !== null) {
                            this.setCommentCount(thoughtId, count);
                        }
                        // 添加小延迟避免API限制
                        await new Promise(resolve => setTimeout(resolve, 200));
                    } catch (error) {
                        console.warn('Thought Comments: Failed to update count from GitHub for', thoughtId, error);
                    }
                }
            }
            
            console.log('Thought Comments: All comment counts updated from GitHub API');
        }
        
        // 添加页面可见性变化监听，当页面重新获得焦点时更新计数
        setupVisibilityChangeHandler() {
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    console.log('Thought Comments: Page became visible, checking comment state');
                    
                    // 检查是否有之前打开的评论容器
                    if (this.currentOpenThoughtId) {
                        const commentsContainer = document.getElementById(`comments-${this.currentOpenThoughtId}`);
                        if (commentsContainer) {
                            // 确保评论容器保持打开状态
                            commentsContainer.style.display = 'block';
                            console.log('Thought Comments: Ensuring comment container stays open after visibility change');
                            
                            // 重新初始化Giscus，确保在OAuth重定向后正常工作
                            this.reinitializeComments(this.currentOpenThoughtId);
                        }
                    }
                    
                    // 页面重新可见时，更新所有评论计数
                    setTimeout(() => {
                        this.updateAllCommentCounts();
                    }, 1000);
                }
            });
            
            // 监听窗口获得焦点事件
            window.addEventListener('focus', () => {
                console.log('Thought Comments: Window gained focus, checking comment state');
                
                // 检查是否有之前打开的评论容器
                if (this.currentOpenThoughtId) {
                    const commentsContainer = document.getElementById(`comments-${this.currentOpenThoughtId}`);
                    if (commentsContainer) {
                        // 确保评论容器保持打开状态
                        commentsContainer.style.display = 'block';
                        console.log('Thought Comments: Ensuring comment container stays open after focus gain');
                        
                        // 重新初始化Giscus，确保在OAuth重定向后正常工作
                        this.reinitializeComments(this.currentOpenThoughtId);
                    }
                }
                
                setTimeout(() => {
                    this.updateAllCommentCounts();
                }, 1000);
            });
            
            // 监听存储变化，检测来自其他标签页的登录状态变化
            window.addEventListener('storage', (e) => {
                if (e.key === 'giscus-session' || e.key === 'giscus-login') {
                    console.log('Thought Comments: Detected Giscus session change, re-initializing comments');
                    if (this.currentOpenThoughtId) {
                        const commentsContainer = document.getElementById(`comments-${this.currentOpenThoughtId}`);
                        if (commentsContainer) {
                            // 确保评论容器保持打开状态
                            commentsContainer.style.display = 'block';
                            console.log('Thought Comments: Ensuring comment container stays open after login');
                        }
                        this.reinitializeComments(this.currentOpenThoughtId);
                    }
                }
            });
            
            // 监听URL变化，检测OAuth重定向
            let lastUrl = location.href;
            new MutationObserver(() => {
                const url = location.href;
                if (url !== lastUrl) {
                    lastUrl = url;
                    console.log('Thought Comments: URL changed, checking if OAuth redirect occurred');
                    
                    // 检查URL中是否包含GitHub OAuth相关的参数
                    if (url.includes('code=') || url.includes('state=')) {
                        console.log('Thought Comments: OAuth redirect detected, ensuring comment container stays open');
                        
                        if (this.currentOpenThoughtId) {
                            const commentsContainer = document.getElementById(`comments-${this.currentOpenThoughtId}`);
                            if (commentsContainer) {
                                // 确保评论容器保持打开状态
                                commentsContainer.style.display = 'block';
                                console.log('Thought Comments: Ensuring comment container stays open after OAuth redirect');
                                
                                // 延迟重新初始化Giscus，确保OAuth流程完成
                                setTimeout(() => {
                                    this.reinitializeComments(this.currentOpenThoughtId);
                                }, 1000);
                            }
                        }
                    }
                }
            }).observe(document, { subtree: true, childList: true });
        }
        
        // 重新初始化评论系统
        reinitializeComments(thoughtId) {
            console.log('Thought Comments: Re-initializing comments for thought:', thoughtId);
            
            // 检查评论容器是否存在且可见
            const commentsContainer = document.getElementById(`comments-${thoughtId}`);
            if (!commentsContainer || commentsContainer.style.display === 'none') {
                console.log('Thought Comments: Comments container not visible, skipping re-initialization');
                return;
            }
            
            // 检查Giscus是否已经加载
            const giscusWrapper = document.getElementById(`giscus-${thoughtId}`);
            if (!giscusWrapper) {
                console.log('Thought Comments: Giscus wrapper not found, skipping re-initialization');
                return;
            }
            
            // 检查是否有Giscus iframe
            const existingFrame = giscusWrapper.querySelector('iframe.giscus-frame');
            
            if (existingFrame) {
                console.log('Thought Comments: Giscus iframe already exists, checking if it needs refresh');
                
                // 检查iframe是否正常工作（可能需要更复杂的检测）
                try {
                    // 尝试检查iframe的src或其他属性
                    const iframeSrc = existingFrame.src;
                    if (iframeSrc && iframeSrc.includes('giscus.app')) {
                        console.log('Thought Comments: Giscus iframe appears to be working');
                        return; // 如果iframe看起来正常，不需要重新初始化
                    }
                } catch (error) {
                    console.warn('Thought Comments: Error checking Giscus iframe:', error);
                }
            }
            
            // 如果没有iframe或iframe有问题，重新加载Giscus
            console.log('Thought Comments: Re-loading Giscus for thought:', thoughtId);
            
            // 清理现有的Giscus实例
            this.cleanupGiscus(thoughtId);
            
            // 重置加载状态
            this.giscusInstances.delete(thoughtId);
            this.isLoading.delete(thoughtId);
            
            // 延迟一下再重新加载，确保清理完成
            setTimeout(() => {
                this.loadGiscusComments(thoughtId);
            }, 500);
        }
        
        // 添加增强的评论提交监听方法
        setupEnhancedCommentSubmissionListener(thoughtId) {
            console.log('Thought Comments: Setting up enhanced comment submission listener for thought:', thoughtId);
            
            // 监听全局的 Giscus 消息事件
            const globalMessageHandler = (event) => {
                // 检查消息来源是否是 Giscus
                if (event.origin !== 'https://giscus.app') return;
                
                try {
                    const data = event.data;
                    if (!data) return;
                    
                    // 检查是否是评论相关的消息
                    const isCommentEvent = (
                        data.giscus?.discussion?.commentCount !== undefined ||
                        data.giscus?.comment !== undefined ||
                        data.giscus?.reply !== undefined ||
                        data.type === 'giscus:comment' ||
                        data.type === 'giscus:commentPosted' ||
                        data.action === 'comment submitted' ||
                        (data.subject === 'giscus' && data.payload?.event === 'comment') ||
                        (data.subject === 'giscus' && data.payload?.event === 'reply')
                    );
                    
                    if (isCommentEvent) {
                        console.log('Thought Comments: Enhanced comment event detected:', data);
                        
                        // 获取当前打开的随想ID
                        const currentThoughtId = this.currentOpenThoughtId;
                        if (currentThoughtId) {
                            console.log('Thought Comments: Updating count for current thought:', currentThoughtId);
                            
                            // 立即更新计数
                            this.handleCommentSubmission(currentThoughtId);
                            
                            // 如果消息中包含计数信息，直接使用
                            if (data.giscus?.discussion?.commentCount !== undefined) {
                                this.setCommentCount(currentThoughtId, data.giscus.discussion.commentCount);
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Thought Comments: Error in enhanced message handler:', error);
                }
            };
            
            // 添加全局事件监听器
            window.addEventListener('message', globalMessageHandler);
            
            // 存储处理器以便清理
            if (!this.enhancedMessageHandlers) {
                this.enhancedMessageHandlers = new Map();
            }
            this.enhancedMessageHandlers.set(thoughtId, globalMessageHandler);
            
            // 监听 DOM 变化，检测新评论的添加
            const giscusWrapper = document.getElementById(`giscus-${thoughtId}`);
            if (giscusWrapper) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            // 检查是否有新评论元素
                            const hasNewComment = Array.from(mutation.addedNodes).some(node => {
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                    return (
                                        node.classList?.contains('giscus-comment') ||
                                        node.classList?.contains('comment') ||
                                        node.querySelector?.('.giscus-comment') ||
                                        node.querySelector?.('.comment')
                                    );
                                }
                                return false;
                            });
                            
                            if (hasNewComment) {
                                console.log('Thought Comments: New comment detected via DOM mutation');
                                this.handleCommentSubmission(thoughtId);
                            }
                        }
                    });
                });
                
                observer.observe(giscusWrapper, {
                    childList: true,
                    subtree: true
                });
                
                // 存储观察器以便清理
                if (!this.enhancedObservers) {
                    this.enhancedObservers = new Map();
                }
                this.enhancedObservers.set(thoughtId, observer);
            }
        }
        
        // 重写 cleanupGiscus 方法，添加增强监听器的清理
        cleanupGiscus(thoughtId) {
            console.log('Thought Comments: Cleaning up Giscus for thought:', thoughtId);
            
            const giscusWrapper = document.getElementById(`giscus-${thoughtId}`);
            if (!giscusWrapper) return;
            
            // 移除所有Giscus相关元素
            const frames = giscusWrapper.querySelectorAll('iframe.giscus-frame');
            const scripts = giscusWrapper.querySelectorAll('script[src="https://giscus.app/client.js"]');
            
            frames.forEach(frame => frame.remove());
            scripts.forEach(script => script.remove());
            
            // 清理其他Giscus元素
            const giscusElements = giscusWrapper.querySelectorAll('[class*="giscus"]');
            giscusElements.forEach(element => {
                if (element.tagName !== 'SCRIPT' && element.tagName !== 'IFRAME') {
                    element.remove();
                }
            });
            
            // 清理MutationObserver
            if (this.mutationObservers.has(thoughtId)) {
                const observer = this.mutationObservers.get(thoughtId);
                observer.disconnect();
                this.mutationObservers.delete(thoughtId);
                console.log('Thought Comments: MutationObserver cleaned up for thought:', thoughtId);
            }
            
            // 清理增强的观察器
            if (this.enhancedObservers && this.enhancedObservers.has(thoughtId)) {
                const observer = this.enhancedObservers.get(thoughtId);
                observer.disconnect();
                this.enhancedObservers.delete(thoughtId);
                console.log('Thought Comments: Enhanced observer cleaned up for thought:', thoughtId);
            }
            
            // 清理增强的消息处理器
            if (this.enhancedMessageHandlers && this.enhancedMessageHandlers.has(thoughtId)) {
                const handler = this.enhancedMessageHandlers.get(thoughtId);
                window.removeEventListener('message', handler);
                this.enhancedMessageHandlers.delete(thoughtId);
                console.log('Thought Comments: Enhanced message handler cleaned up for thought:', thoughtId);
            }
            
            // 清理事件监听器
            if (this.eventListeners && this.eventListeners.has(thoughtId)) {
                const listeners = this.eventListeners.get(thoughtId);
                if (listeners.messageHandler) {
                    window.removeEventListener('message', listeners.messageHandler);
                }
                if (listeners.customEventHandler) {
                    document.removeEventListener('giscus:comment', listeners.customEventHandler);
                    document.removeEventListener('giscus:commentPosted', listeners.customEventHandler);
                }
                this.eventListeners.delete(thoughtId);
                console.log('Thought Comments: Event listeners cleaned up for thought:', thoughtId);
            }
            
            // 清理表单观察器
            if (this.formObservers && this.formObservers.has(thoughtId)) {
                const formObserver = this.formObservers.get(thoughtId);
                formObserver.disconnect();
                this.formObservers.delete(thoughtId);
                console.log('Thought Comments: Form observer cleaned up for thought:', thoughtId);
            }
            
            // 清理评论提交检测观察器
            if (this.commentSubmissionObservers && this.commentSubmissionObservers.has(thoughtId)) {
                const commentObserver = this.commentSubmissionObservers.get(thoughtId);
                commentObserver.disconnect();
                this.commentSubmissionObservers.delete(thoughtId);
                console.log('Thought Comments: Comment submission observer cleaned up for thought:', thoughtId);
            }
            
            // 清理 postMessage 处理器
            if (this.postMessageHandlers && this.postMessageHandlers.has(thoughtId)) {
                const handler = this.postMessageHandlers.get(thoughtId);
                window.removeEventListener('message', handler);
                this.postMessageHandlers.delete(thoughtId);
                console.log('Thought Comments: PostMessage handler cleaned up for thought:', thoughtId);
            }
            
            // 重置状态
            this.giscusInstances.delete(thoughtId);
            this.isLoading.delete(thoughtId);
        }
    }
    
    // 初始化随想评论管理器
    window.thoughtCommentManager = new ThoughtCommentManager();
    
    console.log('Thought Comments: Initialization complete');
});
