// 优化版页面右侧滚动条功能
(function() {
    'use strict';
    
    // 性能优化：使用requestAnimationFrame减少重绘
    let rafId = null;
    let lastScrollTime = 0;
    const SCROLL_THROTTLE = 16; // 约60fps
    
    // 创建滚动条元素
    function createScrollbar() {
        // 检查是否在移动设备上
        if (window.innerWidth <= 768) return null;
        
        const container = document.createElement('div');
        container.className = 'custom-scrollbar-container';
        container.setAttribute('aria-hidden', 'true');
        
        const thumb = document.createElement('div');
        thumb.className = 'custom-scrollbar-thumb';
        thumb.setAttribute('role', 'scrollbar');
        thumb.setAttribute('aria-valuemin', '0');
        thumb.setAttribute('aria-valuemax', '100');
        thumb.setAttribute('aria-valuenow', '0');
        thumb.setAttribute('aria-label', '页面滚动条');
        
        container.appendChild(thumb);
        document.body.appendChild(container);
        
        return { container, thumb };
    }
    
    // 计算文档高度（优化版）
    function getDocumentHeight() {
        return Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        );
    }
    
    // 计算最大滚动距离
    function getMaxScroll() {
        const docHeight = getDocumentHeight();
        return Math.max(0, docHeight - window.innerHeight);
    }
    
    // 更新滚动条滑块
    function updateScrollbar(scrollbar) {
        if (!scrollbar) return;
        
        const { container, thumb } = scrollbar;
        const windowHeight = window.innerHeight;
        const docHeight = getDocumentHeight();
        
        // 计算滑块高度（最小20px，最大不超过窗口高度的一半）
        const scrollRatio = windowHeight / docHeight;
        const thumbHeight = Math.max(20, Math.min(windowHeight * 0.5, windowHeight * scrollRatio));
        
        thumb.style.height = `${thumbHeight}px`;
        
        // 更新滑块位置
        updateThumbPosition(scrollbar);
    }
    
    // 更新滑块位置（节流版）
    function updateThumbPosition(scrollbar) {
        if (!scrollbar || rafId !== null) return;
        
        const now = Date.now();
        if (now - lastScrollTime < SCROLL_THROTTLE) {
            rafId = requestAnimationFrame(() => {
                rafId = null;
                updateThumbPosition(scrollbar);
            });
            return;
        }
        
        lastScrollTime = now;
        
        const { container, thumb } = scrollbar;
        const scrolled = window.scrollY;
        const maxScroll = getMaxScroll();
        
        if (maxScroll <= 0) {
            thumb.style.transform = 'translateY(0px)';
            thumb.setAttribute('aria-valuenow', '0');
            return;
        }
        
        const scrollRatio = scrolled / maxScroll;
        const scrollbarHeight = container.clientHeight - thumb.clientHeight;
        const thumbPosition = scrollRatio * scrollbarHeight;
        
        thumb.style.transform = `translateY(${thumbPosition}px)`;
        thumb.setAttribute('aria-valuenow', Math.round(scrollRatio * 100));
    }
    
    // 拖拽功能
    function setupDrag(scrollbar) {
        if (!scrollbar) return;
        
        const { thumb } = scrollbar;
        let isDragging = false;
        let startY = 0;
        let startScrollTop = 0;
        
        // 鼠标按下事件
        thumb.addEventListener('mousedown', function(e) {
            isDragging = true;
            startY = e.clientY;
            startScrollTop = window.scrollY;
            
            e.preventDefault();
            e.stopPropagation();
            
            thumb.classList.add('dragging');
            document.body.style.userSelect = 'none';
        });
        
        // 鼠标移动事件
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            const deltaY = e.clientY - startY;
            const scrollbarHeight = scrollbar.container.clientHeight - thumb.clientHeight;
            
            if (scrollbarHeight <= 0) return;
            
            const scrollRatio = deltaY / scrollbarHeight;
            const maxScroll = getMaxScroll();
            const scrollTo = startScrollTop + (scrollRatio * maxScroll);
            
            window.scrollTo({
                top: Math.max(0, Math.min(scrollTo, maxScroll)),
                behavior: 'auto'
            });
        });
        
        // 鼠标释放事件
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                thumb.classList.remove('dragging');
                document.body.style.userSelect = '';
            }
        });
        
        // 触摸屏支持
        thumb.addEventListener('touchstart', function(e) {
            if (e.touches.length !== 1) return;
            
            isDragging = true;
            startY = e.touches[0].clientY;
            startScrollTop = window.scrollY;
            
            e.preventDefault();
            thumb.classList.add('dragging');
        }, { passive: false });
        
        document.addEventListener('touchmove', function(e) {
            if (!isDragging || e.touches.length !== 1) return;
            
            const deltaY = e.touches[0].clientY - startY;
            const scrollbarHeight = scrollbar.container.clientHeight - thumb.clientHeight;
            
            if (scrollbarHeight <= 0) return;
            
            const scrollRatio = deltaY / scrollbarHeight;
            const maxScroll = getMaxScroll();
            const scrollTo = startScrollTop + (scrollRatio * maxScroll);
            
            window.scrollTo({
                top: Math.max(0, Math.min(scrollTo, maxScroll)),
                behavior: 'auto'
            });
        }, { passive: false });
        
        document.addEventListener('touchend', function() {
            if (isDragging) {
                isDragging = false;
                thumb.classList.remove('dragging');
            }
        });
    }
    
    // 点击滚动条空白区域快速滚动
    function setupClickScroll(scrollbar) {
        if (!scrollbar) return;
        
        const { container, thumb } = scrollbar;
        
        container.addEventListener('click', function(e) {
            if (e.target === thumb) return;
            
            const rect = container.getBoundingClientRect();
            const clickPosition = e.clientY - rect.top;
            const thumbHeight = thumb.clientHeight;
            const thumbTransform = thumb.style.transform;
            const thumbPosition = thumbTransform ? 
                parseFloat(thumbTransform.match(/translateY\(([^)]+)px\)/)?.[1] || 0) : 0;
            
            // 计算滚动方向
            let scrollTo;
            if (clickPosition < thumbPosition + thumbHeight / 2) {
                // 向上滚动一屏
                scrollTo = window.scrollY - window.innerHeight * 0.9;
            } else {
                // 向下滚动一屏
                scrollTo = window.scrollY + window.innerHeight * 0.9;
            }
            
            const maxScroll = getMaxScroll();
            scrollTo = Math.max(0, Math.min(scrollTo, maxScroll));
            
            window.scrollTo({
                top: scrollTo,
                behavior: 'smooth'
            });
        });
    }
    
    // 初始化
    document.addEventListener('DOMContentLoaded', function() {
        const scrollbar = createScrollbar();
        if (!scrollbar) return;
        
        // 初始更新
        updateScrollbar(scrollbar);
        
        // 设置事件监听
        setupDrag(scrollbar);
        setupClickScroll(scrollbar);
        
        // 优化的事件监听
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                updateScrollbar(scrollbar);
            }, 100);
        });
        
        // 使用passive事件提高滚动性能
        window.addEventListener('scroll', function() {
            updateThumbPosition(scrollbar);
        }, { passive: true });
        
        // 监听内容变化（如图片懒加载）
        const observer = new MutationObserver(function() {
            updateScrollbar(scrollbar);
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });
        
        // 清理函数
        window.addEventListener('beforeunload', function() {
            observer.disconnect();
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        });
    });
})();
