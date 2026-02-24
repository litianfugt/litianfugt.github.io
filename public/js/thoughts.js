// thoughts.js - 随想页面交互功能
// 简化版本，保留核心功能

document.addEventListener('DOMContentLoaded', function() {
    // 移动端优化
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

    // 窗口大小变化时重新优化
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(optimizeForMobile, 250);
    });

    // 初始化
    optimizeForMobile();
});
