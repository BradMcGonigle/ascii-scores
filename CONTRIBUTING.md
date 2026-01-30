# Contributing to ASCII Scores

Thank you for your interest in contributing to ASCII Scores! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates.

When filing a bug report, include:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (browser, OS, Node.js version)

### Suggesting Features

Feature suggestions are welcome! Please include:
- A clear description of the feature
- The problem it solves
- Potential implementation approach (optional)

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `pnpm install`
3. **Make your changes** following our coding standards
4. **Test your changes**: `pnpm test`
5. **Lint your code**: `pnpm lint`
6. **Commit with a clear message** following conventional commits
7. **Push to your fork** and submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ascii-scores.git
cd ascii-scores

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types for API responses
- Avoid using `any` type

### Components

- Use functional components with hooks
- Keep components focused and reusable
- Place shared components in `src/components/`

### ASCII Art

When creating or modifying ASCII art:
- Use consistent box-drawing characters
- Test rendering at different terminal widths
- Ensure accessibility (screen reader friendly text alternatives)

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add NBA scoreboard component
fix: correct score calculation in overtime
docs: update API documentation
style: format ASCII box characters
refactor: extract common scoreboard logic
test: add ESPN API integration tests
```

## Project Structure

```
src/
├── app/           # Next.js pages and routes
├── components/    # React components
│   ├── ascii/     # ASCII rendering primitives
│   ├── scoreboards/  # Sport-specific scoreboards
│   └── layout/    # Layout components
└── lib/           # Utilities and API clients
    ├── api/       # ESPN & OpenF1 clients
    ├── ascii/     # ASCII rendering utilities
    └── utils/     # Helper functions
```

## Testing

- Write tests for new functionality
- Ensure existing tests pass before submitting PR
- Include both unit and integration tests where appropriate

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

## Questions?

Feel free to open an issue for any questions about contributing.
