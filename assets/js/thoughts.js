
// Thoughts page functionality - Like and Comment system
document.addEventListener('DOMContentLoaded', function() {
    // Initialize thoughts functionality
    initThoughts();
});

function initThoughts() {
    // Load saved data from localStorage
    loadThoughtData();
    
    // Setup event listeners
    setupThoughtEventListeners();
}

function setupThoughtEventListeners() {
    // Like buttons
    document.querySelectorAll('.thought-action.like-btn').forEach(btn => {
        btn.addEventListener('click', handleLike);
    });
    
    // Comment buttons
    document.querySelectorAll('.thought-action.comment-btn').forEach(btn => {
        btn.addEventListener('click', handleCommentToggle);
    });
    
    // Comment form submissions
    document.querySelectorAll('.comment-submit').forEach(btn => {
        btn.addEventListener('click', handleCommentSubmit);
    });
    
    // Comment input fields
    document.querySelectorAll('.comment-input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const submitBtn = this.closest('.thought-comment-form').querySelector('.comment-submit');
                handleCommentSubmit.call(submitBtn);
            }
        });
    });
}

function handleLike(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const thoughtId = btn.dataset.thoughtId;
    const likeCount = btn.querySelector('.like-count');
    
    // Toggle like state
    const isLiked = btn.classList.contains('liked');
    
    if (isLiked) {
        btn.classList.remove('liked');
        const currentCount = parseInt(likeCount.textContent) || 0;
        likeCount.textContent = Math.max(0, currentCount - 1);
    } else {
        btn.classList.add('liked');
        const currentCount = parseInt(likeCount.textContent) || 0;
        likeCount.textContent = currentCount + 1;
    }
    
    // Save to localStorage
    saveThoughtData(thoughtId, 'like', !isLiked);
}

function handleCommentToggle(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const thoughtId = btn.dataset.thoughtId;
    const commentsSection = document.querySelector(`#comments-${thoughtId}`);
    
    if (commentsSection) {
        const isVisible = commentsSection.style.display !== 'none';
        commentsSection.style.display = isVisible ? 'none' : 'block';
        
        // Update button text
        const commentCount = btn.querySelector('.comment-count');
        const count = parseInt(commentCount.textContent) || 0;
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            <span class="comment-count">${count}</span>
        `;
    }
}

function handleCommentSubmit(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const thoughtId = btn.dataset.thoughtId;
    const input = btn.closest('.thought-comment-form').querySelector('.comment-input');
    const commentText = input.value.trim();
    
    if (!commentText) return;
    
    // Create new comment
    const newComment = createCommentElement(commentText);
    const commentsContainer = document.querySelector(`#comments-${thoughtId} .thought-comments`);
    
    if (commentsContainer) {
        commentsContainer.appendChild(newComment);
        
        // Update comment count
        const commentBtn = document.querySelector(`[data-thought-id="${thoughtId}"].comment-btn`);
        const commentCount = commentBtn.querySelector('.comment-count');
        const currentCount = parseInt(commentCount.textContent) || 0;
        commentCount.textContent = currentCount + 1;
        
        // Clear input
        input.value = '';
        
        // Save to localStorage
        saveThoughtData(thoughtId, 'comment', commentText);
    }
}

function createCommentElement(text) {
    const comment = document.createElement('div');
    comment.className = 'thought-comment';
    
    const now = new Date();
    const timeString = now.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    comment.innerHTML = `
        <img src="/images/avatar-default.png" alt="Avatar" class="comment-avatar">
        <div class="comment-content">
            <div class="comment-author">访客</div>
            <div class="comment-text">${escapeHtml(text)}</div>
            <div class="comment-time">${timeString}</div>
        </div>
    `;
    
    return comment;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function saveThoughtData(thoughtId, type, data) {
    const storageKey = 'thoughts_data';
    let thoughtsData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    if (!thoughtsData[thoughtId]) {
        thoughtsData[thoughtId] = {
            liked: false,
            likeCount: 0,
            comments: []
        };
    }
    
    if (type === 'like') {
        thoughtsData[thoughtId].liked = data;
        thoughtsData[thoughtId].likeCount = data ?
            (thoughtsData[thoughtId].likeCount || 0) + 1 :
            Math.max(0, (thoughtsData[thoughtId].likeCount || 0) - 1);
    } else if (type === 'comment') {
        thoughtsData[thoughtId].comments.push({
            text: data,
            time: new Date().toISOString()
        });
    }
    
    localStorage.setItem(storageKey, JSON.stringify(thoughtsData));
}

function loadThoughtData() {
    const storageKey = 'thoughts_data';
    const thoughtsData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    Object.keys(thoughtsData).forEach(thoughtId => {
        const data = thoughtsData[thoughtId];
        const thoughtCard = document.querySelector(`[data-thought-id="${thoughtId}"]`)?.closest('.thought-card');
        
        if (thoughtCard && data) {
            // Restore like state
            if (data.liked) {
                const likeBtn = thoughtCard.querySelector('.like-btn');
                likeBtn.classList.add('liked');
            }
            
            // Restore like count
            if (data.likeCount > 0) {
                const likeCount = thoughtCard.querySelector('.like-count');
                likeCount.textContent = data.likeCount;
            }
            
            // Restore comments
            if (data.comments && data.comments.length > 0) {
                const commentsContainer = thoughtCard.querySelector('.thought-comments');
                const commentBtn = thoughtCard.querySelector('.comment-btn');
                const commentCount = commentBtn.querySelector('.comment-count');
                
                commentCount.textContent = data.comments.length;
                
                data.comments.forEach(comment => {
                    const commentEl = createCommentElement(comment.text);
                    commentsContainer.appendChild(commentEl);
                });
            }
        }
    });
}