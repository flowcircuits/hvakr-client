# Contributing to HVAKR Client

Thank you for your interest in contributing to the HVAKR Client SDK! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 22 or higher
- pnpm (package manager)

### Getting Started

1. Clone the repository:

    ```bash
    git clone https://github.com/flowcircuits/hvakr-client.git
    cd hvakr-client
    ```

2. Install dependencies:

    ```bash
    pnpm install
    ```

3. Build the project:

    ```bash
    pnpm build
    ```

## Development Workflow

### Running Tests

There are two test suites:

- **Offline tests** run fully offline (no API, no token). Client requests are routed
  to an internal mock prod implementation. These are what CI runs on every push
  and pull request:

    ```bash
    pnpm test
    ```

- **Production API tests** run the same client test file against a live HVAKR API
  and require a valid access token. They are intentionally kept off the
  build/publish path so SDK changes are never blocked by an API deploy:

    ```bash
    export HVAKR_ACCESS_TOKEN=your_token_here
    pnpm test:prod
    ```

    To run them against a local or staging API (for example, when validating SDK
    changes against not-yet-deployed server code), also set the base URL:

    ```bash
    export HVAKR_CLIENT_API_URL=http://localhost:8080
    pnpm test:prod
    ```

In CI, the production API suite is triggered manually via the "Test with Prod"
workflow.

### Code Formatting

This project uses Prettier for code formatting. Format your code before committing:

```bash
pnpm format
```

### Building

Build the project to generate both ESM and CommonJS outputs:

```bash
pnpm build
```

## Making Changes

### Branch Naming

Create a descriptive branch name for your changes:

- `feat/add-new-endpoint` - for new features
- `fix/error-handling` - for bug fixes
- `docs/update-readme` - for documentation changes
- `chore/update-deps` - for dependency updates

### Commit Messages

Follow conventional commit format:

- `feat:` - new features
- `fix:` - bug fixes
- `docs:` - documentation changes
- `chore:` - maintenance tasks
- `refactor:` - code refactoring
- `test:` - test additions or changes

Example: `feat: add support for new API endpoint`

### Pull Requests

1. Fork the repository and create your branch from `master`
2. Make your changes and ensure tests pass
3. Update documentation if needed
4. Submit a pull request with a clear description of the changes

## Code Guidelines

- Write TypeScript with strict type checking
- Add JSDoc comments for public methods
- Follow existing code patterns and naming conventions
- Include tests for new functionality
- Keep changes focused and minimal

## Reporting Issues

If you find a bug or have a feature request:

1. Check existing issues to avoid duplicates
2. Create a new issue with a clear title and description
3. Include steps to reproduce (for bugs)
4. Add relevant labels

## Questions?

For questions about the API or SDK, contact HVAKR support at [support@hvakr.com](mailto:support@hvakr.com).
