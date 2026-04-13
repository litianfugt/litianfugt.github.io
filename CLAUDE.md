# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal blog built with **Hugo** and the **PaperMod** theme. It features technical articles (posts), personal thoughts (thoughts), and integrates with GitHub for comments (Giscus).

## Common Commands

```bash
# Start development server with live reload
hugo server

# Build for production (outputs to public/, minified)
hugo --minify

# Build including drafts
hugo -D
```

## Content Types

- **Posts** (`content/posts/`): Technical articles with categories and tags
- **Thoughts** (`content/thoughts/`): Short personal notes/entries

Both support comments via Giscus (GitHub Discussions).

## Key Directories

- `layouts/`: Custom templates overriding PaperMod theme
  - `layouts/_default/home.html`: Custom homepage with articles/thoughts grid
  - `layouts/partials/`: Reusable components (comments, etc.)
  - `layouts/thoughts/`: Thought-specific templates
- `static/js/`: JavaScript files (thoughts.js handles mobile touch optimization, progress-bar.js)
- `assets/css/extended/`: Custom CSS overrides
- `content/`: Blog content (posts, thoughts, about, etc.)

## Configuration

All config in `hugo.toml`:
- Menu items (main navigation)
- PaperMod theme parameters
- Giscus comments configuration
- Social links (GitHub, Email)

## Deployment

GitHub Actions workflow at `.github/workflows/deploy.yaml` auto-deploys to GitHub Pages on push to main branch.

## GitHub Gist Integration (Likes & Comments)

The blog uses GitHub Gist to store likes and comments data for thoughts, enabling cross-device synchronization:

- **Gist Token**: Stored in GitHub Secrets as `BLOG_GIST_TOKEN`
- **Gist ID**: Stored in GitHub Secrets as `BLOG_GIST_ID`
- **Config file**: `static/github-gist-config.js` (not committed, generated during deployment)

The Gist should contain a JSON file named `blog-likes-and-comments.json` with structure:
```json
{
  "likes": { "thought-id": count },
  "comments": { "thought-id": [] }
}
```

## Adding New Content

```bash
# Create new post
hugo new posts/my-new-article.md

# Create new thought
hugo new thoughts/my-thought.md
```

## Template Guidelines

### Links in Templates

**IMPORTANT**: Always use `.RelPermalink` for internal links in custom templates, NOT `.Permalink`.

- `.RelPermalink` - Returns relative path (e.g., `/posts/my-article/`)
- `.Permalink` - Returns absolute URL (e.g., `https://litianfugt.github.io/posts/my-article/`)

Use `.RelPermalink` for:
- Article/post links
- Pagination links
- Tag/category links
- Archive entries

Example:
```html
<!-- Correct (for local development) -->
<a href="{{ .RelPermalink }}">{{ .Title }}</a>

<!-- Avoid - generates absolute URLs -->
<a href="{{ .Permalink }}">{{ .Title }}</a>
```

Note: The PaperMod theme's default templates may use `.Permalink` for SEO purposes (canonical URLs), but custom templates for internal navigation should use `.RelPermalink`.
