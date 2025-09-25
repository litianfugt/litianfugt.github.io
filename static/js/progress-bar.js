// 页面右侧滚动条功能
document.addEventListener('DOMContentLoaded', function() {
    // 创建滚动条容器
    const scrollbarContainer = document.createElement('div');
    scrollbarContainer.className = 'custom-scrollbar-container';
    
    // 创建滚动条滑块
    const scrollbarThumb = document.createElement('div');
    scrollbarThumb.className = 'custom-scrollbar-thumb';
    
    // 将滑块添加到容器中
    scrollbarContainer.appendChild(scrollbarThumb);
    
    // 将滚动条添加到页面
    document.body.appendChild(scrollbarContainer);
    
    // 获取页面元素
    const html = document.documentElement;
    const body = document.body;
    
    // 更新滚动条位置和大小
    function updateScrollbar() {
        const windowHeight = window.innerHeight;
        const documentHeight = Math.max(
            body.scrollHeight, 
            body.offsetHeight, 
            html.clientHeight, 
            html.scrollHeight, 
            html.offsetHeight
        );
        
        // 计算滚动比例
        const scrollRatio = windowHeight / documentHeight;
        
        // 计算滑块高度（最小30px）
        const thumbHeight = Math.max(30, windowHeight * scrollRatio);
        
        // 设置滑块高度
        scrollbarThumb.style.height = thumbHeight + 'px';
        
        // 更新滑块位置
        updateThumbPosition();
    }
    
    // 更新滑块位置
    function updateThumbPosition() {
        const scrolled = window.scrollY;
        const maxScroll = Math.max(
            body.scrollHeight - window.innerHeight, 
            body.offsetHeight - window.innerHeight, 
            html.scrollHeight - window.innerHeight, 
            html.offsetHeight - window.innerHeight
        );
        
        const scrollRatio = scrolled / maxScroll;
        const scrollbarHeight = scrollbarContainer.clientHeight - scrollbarThumb.clientHeight;
        const thumbPosition = scrollRatio * scrollbarHeight;
        
        scrollbarThumb.style.transform = `translateY(${thumbPosition}px)`;
    }
    
    // 滚动事件监听
    window.addEventListener('scroll', updateThumbPosition);
    
    // 窗口大小改变时更新滚动条
    window.addEventListener('resize', updateScrollbar);
    
    // 初始化滚动条
    updateScrollbar();
    
    // 拖拽功能
    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;
    
    // 鼠标按下事件
    scrollbarThumb.addEventListener('mousedown', function(e) {
        isDragging = true;
        startY = e.clientY;
        startScrollTop = window.scrollY;
        
        // 防止文本选中
        e.preventDefault();
        
        // 添加拖拽样式
        scrollbarThumb.classList.add('dragging');
    });
    
    // 鼠标移动事件
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const deltaY = e.clientY - startY;
        const scrollbarHeight = scrollbarContainer.clientHeight - scrollbarThumb.clientHeight;
        const scrollRatio = deltaY / scrollbarHeight;
        const maxScroll = Math.max(
            body.scrollHeight - window.innerHeight, 
            body.offsetHeight - window.innerHeight, 
            html.scrollHeight - window.innerHeight, 
            html.offsetHeight - window.innerHeight
        );
        
        const scrollTo = startScrollTop + (scrollRatio * maxScroll);
        
        window.scrollTo({
            top: scrollTo,
            behavior: 'auto' // 拖拽时不使用平滑滚动
        });
    });
    
    // 鼠标释放事件
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            scrollbarThumb.classList.remove('dragging');
        }
    });
    
    // 点击滚动条空白区域快速滚动
    scrollbarContainer.addEventListener('click', function(e) {
        // 如果点击的是滑块，不处理
        if (e.target === scrollbarThumb) return;
        
        const rect = scrollbarContainer.getBoundingClientRect();
        const clickPosition = e.clientY - rect.top;
        const thumbHeight = scrollbarThumb.clientHeight;
        const thumbPosition = parseFloat(scrollbarThumb.style.transform.replace('translateY(', '').replace('px)', '')) || 0;
        
        // 计算滚动方向和距离
        let scrollTo;
        if (clickPosition < thumbPosition + thumbHeight / 2) {
            // 点击滑块上方，向上滚动一屏
            scrollTo = window.scrollY - window.innerHeight * 0.8;
        } else {
            // 点击滑块下方，向下滚动一屏
            scrollTo = window.scrollY + window.innerHeight * 0.8;
        }
        
        window.scrollTo({
            top: scrollTo,
            behavior: 'smooth'
        });
    });
});