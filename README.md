# geoffreychallen.com

Personal website and blog for Geoffrey Challen, featuring interactive code examples and computer science education content.

## Overview

This is a Next.js-based academic website with a custom MDX content management system. It features interactive code execution for Java and Python, making it ideal for computer science education content.

## Features

- 📝 MDX-based blog and content system
- 🚀 Interactive code execution (Java via Jeed, Python via Pyodide)
- 🌙 Dark mode support
- 📱 Mobile-responsive design
- 🔐 Google OAuth authentication
- 📊 Google Analytics integration
- 🐳 Docker containerization
- ☸️ Kubernetes deployment ready

## Prerequisites

- Node.js 22.15.0
- npm (comes with Node.js)
- Docker (for containerization)
- kubectl (for Kubernetes deployment)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/gchallen/geoffreychallen.com.git
cd geoffreychallen.com
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JEED_SERVER=your_jeed_server_url
PLAYGROUND_SERVER=your_playground_server_url
GOOGLE_ANALYTICS_ID=your_ga_id
RECAPTCHA_KEY=your_recaptcha_key
```

## Development

Start the development server:

```bash
npm start
```

This runs both the MDX processing pipeline and Next.js dev server with Turbopack.

## Building

Build for production:

```bash
npm run build
```

This will:

1. Process MDX files into React components
2. Generate RSS/Atom feeds
3. Build the Next.js static site

## Code Quality

Run all checks:

```bash
npm run checker
```

Individual checks:

```bash
npm run prettier   # Format code
npm run eslint     # Lint code
npm run tsc        # TypeScript checking
npm run depcheck   # Check dependencies
```

## Content Management

### Writing Content

1. Blog posts go in `/mdx/essays/` with frontmatter:

```mdx
---
title: "Your Post Title"
description: "Post description"
date: 2024-01-01
---

Your content here...
```

2. Static pages go in `/mdx/pages/`

### Interactive Code

Include executable code blocks:

````markdown
```java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```
````

## Deployment

### Docker

Build and push Docker image:

```bash
npm run publish:latest
```

### Kubernetes

Deploy to production:

```bash
npm run deploy:prod
```

Deploy to development:

```bash
npm run deploy:dev
```

Monitor logs:

```bash
npm run k8s:logs      # Production logs
npm run k8s:devLogs   # Development logs
```

## Project Structure

```
├── bin/              # Build scripts
├── components/       # React components
├── mdx/             # MDX content source
│   ├── essays/      # Blog posts
│   └── pages/       # Static pages
├── output/          # Generated files
├── pages/           # Next.js pages
├── public/          # Static assets
└── styles/          # SCSS styles
```

## Architecture

- **Framework**: Next.js with hybrid Pages/App Router
- **Content**: Custom MDX pipeline with frontmatter parsing
- **Styling**: SCSS modules and Styled Components
- **Code Execution**: Jeed (Java) and Pyodide (Python)
- **Authentication**: NextAuth.js with Google OAuth
- **Deployment**: Docker + Kubernetes

## Contributing

This is a personal website repository. For bug reports or suggestions, please open an issue.

## License

All content and code are copyright Geoffrey Challen unless otherwise noted.

## Contact

- Website: [geoffreychallen.com](https://geoffreychallen.com)
- Email: challen@illinois.edu
