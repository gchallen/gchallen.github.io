# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal academic website for Geoffrey Challen built with Next.js, featuring a custom MDX-based content system with interactive code execution capabilities.

## Development Commands

### Core Development
```bash
yarn start          # Run dev server with MDX processing and Turbopack
yarn build          # Full production build (MDX → Next.js → static)
yarn checker        # Run all checks: depcheck, prettier, eslint, tsc
```

### Build Pipeline Steps
```bash
yarn build:mdx      # Process MDX files to React components
yarn build:rss      # Generate RSS/Atom feeds
yarn build:static   # Build static Next.js site
```

### Code Quality
```bash
yarn depcheck       # Check for unused dependencies
yarn prettier       # Format code
yarn eslint         # Lint code
yarn tsc            # TypeScript type checking
```

### Deployment
```bash
yarn publish:latest # Build and push Docker image (multi-arch)
yarn deploy:prod    # Deploy to production Kubernetes
yarn deploy:dev     # Deploy to development Kubernetes
```

## Architecture Overview

### Hybrid Content System
- **MDX Processing**: Custom build pipeline (`bin/build.ts`) transforms MDX essays into React pages
- **Page Generation**: Mix of static pages and dynamically generated content from MDX
- **Routing**: Uses Next.js Pages Router primarily, with App Router for health endpoint

### Key Components
- **Code Execution**: Interactive Java (via Jeed) and Python (via Pyodide) playgrounds
- **Content Pipeline**: MDX → JSX transformation with frontmatter parsing, image optimization, and SEO metadata
- **State Management**: React contexts for dark mode, authentication, subscriptions, and UI state

### Directory Structure
- `/mdx/`: Source content (essays, pages) in MDX format
- `/pages/`: Next.js pages (mix of generated from MDX and manual)
- `/components/`: Reusable React components
- `/bin/`: Build scripts and utilities
- `/output/`: Generated files from MDX processing
- `/public/`: Static assets and processed images

## MDX Content Development

When modifying MDX content:
1. Files in `/mdx/essays/` are blog posts with dates
2. Files in `/mdx/pages/` are static pages
3. Frontmatter required: `title`, `description`
4. Code blocks support `java` and `python` with execution
5. Changes require restart of dev server to see updates

## Environment Configuration

Key environment variables for local development:
- `GOOGLE_CLIENT_ID/SECRET`: OAuth authentication
- `JEED_SERVER`: Java code execution endpoint
- `PLAYGROUND_SERVER`: Additional code playground features
- `GOOGLE_ANALYTICS_ID`: Analytics tracking
- `RECAPTCHA_KEY`: Form protection

## Deployment Notes

- Docker image builds for AMD64 and ARM64
- Kubernetes deployments use ConfigMaps for environment
- Production runs on Node 22.15.0 Alpine
- Static export with custom server for health checks