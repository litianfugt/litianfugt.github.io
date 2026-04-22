/**
 * thoughts.js - 随想页面评论系统
 * 包含 CommentCache, GitHubAPI, GiscusManager 模块
 */

// ============================================
// CommentCache - 智能评论缓存管理器
// ============================================
const CommentCache = {
    CACHE_KEY: 'thought-comments-cache-v2',
    CACHE_VERSION: '2.0',
    CACHE_DURATION: 3600000, // 1小时缓存

    get(thoughtId) {
        try {
            const cached = this.getAll();
            if (cached && cached[thoughtId]) {
                const now = Date.now();
                if (now - cached[thoughtId].timestamp < this.CACHE_DURATION) {
                    console.log(`CommentCache: Retrieved cached count for ${thoughtId}: ${cached[thoughtId].count} (${cached[thoughtId].source})`);
                    return cached[thoughtId].count;
                } else {
                    console.log(`CommentCache: Cache expired for ${thoughtId}`);
                }
            }
        } catch (error) {
            console.warn('CommentCache: Failed to get cached data:', error);
        }
        return null;
    },

    getAll() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                if (data.version !== this.CACHE_VERSION) {
                    console.log('CommentCache: Cache version mismatch, clearing cache');
                    this.clear();
                    return null;
                }
                const now = Date.now();
                if (now - data.globalTimestamp < this.CACHE_DURATION) {
                    return data.counts;
                } else {
                    console.log('CommentCache: Global cache expired');
                }
            }
        } catch (error) {
            console.warn('CommentCache: Failed to get all cached data:', error);
        }
        return null;
    },

    set(counts, source = 'api') {
        try {
            const data = {
                version: this.CACHE_VERSION,
                counts: {},
                globalTimestamp: Date.now()
            };
            Object.entries(counts).forEach(([thoughtId, count]) => {
                data.counts[thoughtId] = {
                    count,
                    timestamp: Date.now(),
                    source
                };
            });
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
            console.log(`CommentCache: Cached comment counts (${source}):`, counts);
            this.verifyWrite(counts);
        } catch (error) {
            console.error('CommentCache: Failed to cache data:', error);
        }
    },

    setSingle(thoughtId, count, source = 'giscus') {
        try {
            const cached = this.getAll() || {};
            const existing = cached[thoughtId];

            if (existing) {
                if (existing.count === count && existing.source === source) {
                    console.log(`CommentCache: No update needed for ${thoughtId}: ${count} (${source})`);
                    return;
                }
                if (source === 'giscus' && existing.source === 'api') {
                    console.log(`CommentCache: Giscus data newer than API for ${thoughtId}, keeping Giscus`);
                } else if (source === 'api' && existing.source === 'giscus') {
                    const timeDiff = Date.now() - existing.timestamp;
                    if (timeDiff < 5 * 60 * 1000) {
                        console.log(`CommentCache: API data older than recent Giscus for ${thoughtId}, keeping Giscus`);
                        return;
                    }
                }
            }

            cached[thoughtId] = {
                count,
                timestamp: Date.now(),
                source
            };

            const data = {
                version: this.CACHE_VERSION,
                counts: cached,
                globalTimestamp: Date.now()
            };

            localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
            console.log(`CommentCache: Updated ${thoughtId}: ${count} (${source})`);

            const verify = this.get(thoughtId);
            if (verify === count) {
                console.log(`CommentCache: Write verification successful for ${thoughtId}`);
            } else {
                console.error(`CommentCache: Write verification failed for ${thoughtId}`);
            }
        } catch (error) {
            console.error('CommentCache: Failed to update single count:', error);
        }
    },

    verifyWrite(expectedCounts) {
        try {
            const cached = this.getAll();
            const success = Object.entries(expectedCounts).every(([thoughtId, count]) => {
                return cached && cached[thoughtId] && cached[thoughtId].count === count;
            });
            if (success) {
                console.log('CommentCache: All write operations verified successfully');
            } else {
                console.error('CommentCache: Write verification failed');
            }
            return success;
        } catch (error) {
            console.error('CommentCache: Verification error:', error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.removeItem(this.CACHE_KEY);
            console.log('CommentCache: Cleared cache');
        } catch (error) {
            console.warn('CommentCache: Failed to clear cache:', error);
        }
    },

    debug() {
        console.group('CommentCache Debug Info');
        try {
            const raw = localStorage.getItem(this.CACHE_KEY);
            console.log('Raw cache data:', raw);
            if (raw) {
                const parsed = JSON.parse(raw);
                console.log('Parsed cache:', parsed);
                console.log('Cache age:', Date.now() - parsed.globalTimestamp, 'ms');
                console.log('Cache expired:', Date.now() - parsed.globalTimestamp > this.CACHE_DURATION);
                Object.entries(parsed.counts || {}).forEach(([thoughtId, data]) => {
                    const age = Date.now() - data.timestamp;
                    console.log(`  ${thoughtId}: ${data.count} (${data.source}, ${Math.round(age/1000)}s old)`);
                });
            }
        } catch (error) {
            console.error('Cache debug error:', error);
        }
        console.groupEnd();
    }
};

// ============================================
// GitHubAPI - GitHub Discussions API 调用器
// ============================================
const GitHubAPI = {
    repo: '',  // Will be set from Hugo config
    categoryId: '',  // Will be set from Hugo config

    async fetchAllCommentCounts() {
        const thoughts = document.querySelectorAll('.thought-card');
        const counts = {};
        const uniqueIds = [];

        thoughts.forEach(thought => {
            const thoughtId = thought.dataset.thoughtId;
            const uniqueId = `${window.location.pathname}#${thoughtId}`;
            uniqueIds.push({ thoughtId, uniqueId });
        });

        console.log(`GitHubAPI: Fetching comment counts for ${uniqueIds.length} thoughts`);

        try {
            const discussions = await this.fetchDiscussions();
            uniqueIds.forEach(({ thoughtId, uniqueId }) => {
                const discussion = discussions.find(d => d.title === uniqueId);
                counts[thoughtId] = discussion ? discussion.comments : 0;
            });
            console.log('GitHubAPI: Fetched comment counts:', counts);
            return counts;
        } catch (error) {
            console.error('GitHubAPI: Failed to fetch comment counts:', error);
            uniqueIds.forEach(({ thoughtId }) => {
                counts[thoughtId] = 0;
            });
            return counts;
        }
    },

    async fetchSpecificCommentCounts(thoughtIds) {
        const counts = {};
        const uniqueIds = thoughtIds.map(thoughtId => ({
            thoughtId,
            uniqueId: `${window.location.pathname}#${thoughtId}`
        }));

        console.log(`GitHubAPI: Fetching specific comment counts for ${thoughtIds.length} thoughts`);

        try {
            const discussions = await this.fetchDiscussions();
            uniqueIds.forEach(({ thoughtId, uniqueId }) => {
                const discussion = discussions.find(d => d.title === uniqueId);
                counts[thoughtId] = discussion ? discussion.comments : 0;
            });
            console.log(`GitHubAPI: Fetched specific comment counts:`, counts);
            return counts;
        } catch (error) {
            console.error('GitHubAPI: Failed to fetch specific comment counts:', error);
            thoughtIds.forEach(thoughtId => {
                counts[thoughtId] = 0;
            });
            return counts;
        }
    },

    async fetchDiscussions() {
        const url = `https://api.github.com/repos/${this.repo}/discussions?category_id=${this.categoryId}&per_page=100`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API request failed: ${response.status}`);
            }

            const discussions = await response.json();
            return discussions;
        } catch (error) {
            console.error('GitHubAPI: API request failed:', error);
            throw error;
        }
    }
};

// ============================================
// GiscusManager - 随想评论管理器
// ============================================
const GiscusManager = {
    currentInstance: null,
    currentThoughtId: null,

    init() {
        console.log('GiscusManager: Initializing...');
        this.bindEvents();
        this.initThemeWatcher();
        this.loadInitialCommentCounts();
    },

    async loadInitialCommentCounts() {
        console.log('GiscusManager: Loading initial comment counts...');

        const cachedCounts = CommentCache.getAll();
        if (cachedCounts) {
            console.log(`GiscusManager: Using cached comment counts (${Object.keys(cachedCounts).length} items)`);
            Object.entries(cachedCounts).forEach(([thoughtId, data]) => {
                this.setCommentCount(thoughtId, data.count);
            });
        }

        setTimeout(() => {
            this.preloadAPIData(cachedCounts);
        }, 100);
    },

    async preloadAPIData(cachedCounts) {
        try {
            console.log('GiscusManager: Starting parallel API preload...');

            const visibleThoughts = this.getVisibleThoughts();
            const priorityIds = visibleThoughts.map(t => t.dataset.thoughtId);

            console.log(`GiscusManager: Priority loading ${priorityIds.length} visible thoughts`);

            if (priorityIds.length > 0) {
                const priorityCounts = await GitHubAPI.fetchSpecificCommentCounts(priorityIds);
                this.updateUIWithAPIData(priorityCounts, cachedCounts, 'priority');
            }

            const allCounts = await GitHubAPI.fetchAllCommentCounts();
            this.updateUIWithAPIData(allCounts, cachedCounts, 'all');

            console.log('GiscusManager: API preload completed');
        } catch (error) {
            console.warn('GiscusManager: API preload failed, keeping cache:', error);
        }
    },

    getVisibleThoughts() {
        const thoughts = document.querySelectorAll('.thought-card');
        const visible = [];
        const viewportHeight = window.innerHeight;

        thoughts.forEach(thought => {
            const rect = thought.getBoundingClientRect();
            if (rect.top < viewportHeight + 200 && rect.bottom > -200) {
                visible.push(thought);
            }
        });

        return visible;
    },

    updateUIWithAPIData(apiCounts, cachedCounts, batch) {
        let updatedCount = 0;

        Object.entries(apiCounts).forEach(([thoughtId, apiCount]) => {
            const cachedData = cachedCounts?.[thoughtId];
            let shouldUpdate = false;

            if (!cachedData) {
                shouldUpdate = true;
                CommentCache.setSingle(thoughtId, apiCount, 'api');
                console.log(`GiscusManager: Set initial count for ${thoughtId}: ${apiCount} (API, ${batch})`);
            } else {
                const timeDiff = Date.now() - cachedData.timestamp;

                if (cachedData.source === 'giscus' && timeDiff < 5 * 60 * 1000) {
                    console.log(`GiscusManager: Keeping recent Giscus data for ${thoughtId}: ${cachedData.count}`);
                    return;
                }

                if (cachedData.count !== apiCount && timeDiff > 10 * 60 * 1000) {
                    shouldUpdate = true;
                    CommentCache.setSingle(thoughtId, apiCount, 'api');
                    console.log(`GiscusManager: Updated stale cache for ${thoughtId}: ${cachedData.count} to ${apiCount} (API, ${batch})`);
                } else {
                    console.log(`GiscusManager: Keeping cached data for ${thoughtId}: ${cachedData.count} (${cachedData.source})`);
                }
            }

            if (shouldUpdate) {
                this.setCommentCount(thoughtId, apiCount);
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            console.log(`GiscusManager: Updated ${updatedCount} comment counts (${batch} batch)`);
        }
    },

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.comment-btn')) {
                const btn = e.target.closest('.comment-btn');
                const thoughtId = btn.dataset.thoughtId;
                this.toggleComments(thoughtId);
            }

            if (e.target.closest('.close-comments-btn')) {
                const btn = e.target.closest('.close-comments-btn');
                const thoughtId = btn.dataset.thoughtId;
                this.hideComments(thoughtId);
            }
        });
    },

    toggleComments(thoughtId) {
        const container = document.getElementById(`comments-${thoughtId}`);
        if (!container) return;

        if (this.currentThoughtId === thoughtId && container.style.display === 'block') {
            this.hideComments(thoughtId);
            return;
        }

        this.hideAllComments();
        container.style.display = 'block';
        this.createGiscusInstance(thoughtId);

        setTimeout(() => {
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    },

    hideComments(thoughtId) {
        const container = document.getElementById(`comments-${thoughtId}`);
        if (container) {
            container.style.display = 'none';
        }

        if (this.currentThoughtId === thoughtId) {
            this.destroyCurrentInstance();
        }
    },

    hideAllComments() {
        const allContainers = document.querySelectorAll('.thought-comments-container');
        allContainers.forEach(container => {
            container.style.display = 'none';
        });
        this.destroyCurrentInstance();
    },

    destroyCurrentInstance() {
        if (this.currentInstance && this.currentThoughtId) {
            console.log(`GiscusManager: Destroying instance for ${this.currentThoughtId}`);

            const giscusWrapper = document.getElementById(`giscus-${this.currentThoughtId}`);
            if (giscusWrapper) {
                giscusWrapper.innerHTML = '<div class="giscus-loading">加载评论中...</div>';
            }

            this.currentInstance = null;
            this.currentThoughtId = null;
        }
    },

    createGiscusInstance(thoughtId) {
        this.destroyCurrentInstance();

        console.log(`GiscusManager: Creating instance for ${thoughtId}`);

        const giscusWrapper = document.getElementById(`giscus-${thoughtId}`);
        if (!giscusWrapper) return;

        this.currentThoughtId = thoughtId;
        this.currentInstance = true;

        this.loadGiscus(giscusWrapper, thoughtId);
    },

    loadGiscus(container, thoughtId) {
        const uniqueId = `${window.location.pathname}#${thoughtId}`;

        container.innerHTML = '<div class="giscus-loading">加载评论中...</div>';

        const giscusContainer = document.createElement('div');
        container.innerHTML = '';
        container.appendChild(giscusContainer);

        const script = document.createElement('script');
        script.src = 'https://giscus.app/client.js';
        script.setAttribute('data-repo', GitHubAPI.repo);
        script.setAttribute('data-repo-id', giscusConfig.repoId);
        script.setAttribute('data-category', giscusConfig.category);
        script.setAttribute('data-category-id', giscusConfig.categoryId);
        script.setAttribute('data-mapping', 'specific');
        script.setAttribute('data-term', uniqueId);
        script.setAttribute('data-title', uniqueId);
        script.setAttribute('data-strict', '0');
        script.setAttribute('data-reactions-enabled', '1');
        script.setAttribute('data-emit-metadata', '1');
        script.setAttribute('data-input-position', 'bottom');
        script.setAttribute('data-theme', this.getCurrentTheme());
        script.setAttribute('data-lang', 'zh-CN');
        script.setAttribute('data-loading', 'eager');
        script.setAttribute('crossorigin', 'anonymous');
        script.async = true;

        script.addEventListener('load', () => {
            console.log(`GiscusManager: Giscus loaded for ${thoughtId}`);
        });

        script.addEventListener('error', () => {
            container.innerHTML = '<div class="giscus-error">评论加载失败，请刷新页面重试</div>';
        });

        giscusContainer.appendChild(script);
    },

    getCurrentTheme() {
        const isDark = document.body.classList.contains('dark');
        return isDark ? 'dark' : 'light';
    },

    initThemeWatcher() {
        window.addEventListener('message', (event) => {
            if (event.origin === 'https://giscus.app' && event.data.giscus) {
                const data = event.data.giscus;

                if (data.discussion && this.currentThoughtId) {
                    const commentCount = data.discussion.totalCommentCount || 0;
                    const replyCount = data.discussion.totalReplyCount || 0;
                    const totalCount = commentCount + replyCount;

                    CommentCache.setSingle(this.currentThoughtId, totalCount);
                    this.setCommentCount(this.currentThoughtId, totalCount);
                }
            }
        });

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    this.updateGiscusTheme();
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            this.updateGiscusTheme();
        });

        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                setTimeout(() => {
                    this.updateGiscusTheme();
                }, 200);
            });
        }
    },

    updateGiscusTheme() {
        const theme = this.getCurrentTheme();

        if (this.currentThoughtId) {
            const giscusFrame = document.querySelector(`#giscus-${this.currentThoughtId} iframe.giscus-frame`);
            if (giscusFrame) {
                try {
                    giscusFrame.contentWindow.postMessage({
                        giscus: {
                            setConfig: {
                                theme: theme
                            }
                        }
                    }, 'https://giscus.app');
                } catch (error) {
                    console.warn('GiscusManager: Failed to update Giscus theme:', error);
                }
            }
        }
    },

    setCommentCount(thoughtId, count) {
        const countElement = document.querySelector(`.comment-count[data-thought-id="${thoughtId}"]`);
        if (countElement) {
            countElement.textContent = count > 0 ? count : '0';
            console.log(`GiscusManager: Updated comment count for ${thoughtId}: ${count}`);
        }
    }
};

// ============================================
// Anchor Scroll Handler
// ============================================
function handleAnchorScroll() {
    const hash = window.location.hash;
    if (hash) {
        const thoughtId = hash.substring(1);
        const targetElement = document.querySelector(`[data-thought-id="${thoughtId}"]`);

        if (targetElement) {
            setTimeout(() => {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                targetElement.classList.add('highlighted');
                setTimeout(() => {
                    targetElement.classList.remove('highlighted');
                }, 2000);
            }, 500);
        }
    }
}

// ============================================
// Mobile Touch Optimization
// ============================================
function optimizeForMobile() {
    if (window.innerWidth <= 768) {
        const touchElements = document.querySelectorAll('.thought-action, .comment-btn');
        touchElements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            }, { passive: true });
            element.addEventListener('touchend', function() {
                this.style.transform = 'scale(1)';
            }, { passive: true });
        });
    }
}

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize GiscusManager if giscusConfig is available
    if (typeof giscusConfig !== 'undefined') {
        GitHubAPI.repo = giscusConfig.repo;
        GitHubAPI.categoryId = giscusConfig.categoryId;
        GiscusManager.init();
    }

    handleAnchorScroll();
    optimizeForMobile();

    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(optimizeForMobile, 250);
    });
});

window.addEventListener('popstate', function() {
    handleAnchorScroll();
});
