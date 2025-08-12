# 🤝 Contributing to Scout

Thank you for your interest in contributing to Scout! This document provides guidelines for contributing to our AI travel planning platform.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)
- [Security](#security)

## 📖 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18.0+** installed
- **npm** or **yarn** package manager
- **Git** for version control
- **VS Code** or similar editor with TypeScript support
- Basic knowledge of **React**, **Next.js**, and **TypeScript**

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/scout.git
   cd scout
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/Iammony/scout.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Copy environment file**:
   ```bash
   cp .env.local.example .env.local
   ```

6. **Start development server**:
   ```bash
   npm run dev
   ```

7. **Verify setup** by opening http://localhost:3000

## 🛠️ Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

- 🐛 **Bug fixes**
- ✨ **New features** 
- 📝 **Documentation improvements**
- 🎨 **UI/UX enhancements**
- ⚡ **Performance optimizations**
- 🧪 **Test coverage improvements**
- 🔧 **Build/tooling improvements**

### Before You Start

1. **Check existing issues** to see if your contribution is already being worked on
2. **Create an issue** for major changes to discuss the approach
3. **Start small** if you're a new contributor
4. **Focus on user experience** - Scout is designed for Indian travelers

## 🔄 Pull Request Process

### 1. Create a Branch

Create a descriptive branch name:

```bash
git checkout -b type/description

# Examples:
git checkout -b feature/altcha-integration
git checkout -b bugfix/form-validation-error
git checkout -b docs/api-documentation
git checkout -b ui/mobile-responsive-cards
```

### 2. Make Your Changes

- Follow our [coding standards](#coding-standards)
- Write clear, self-documenting code
- Add comments for complex logic
- Ensure mobile responsiveness
- Test your changes thoroughly

### 3. Commit Your Changes

Use conventional commit messages:

```bash
git commit -m "type: description"

# Examples:
git commit -m "feat: add ALTCHA captcha integration"
git commit -m "fix: resolve form validation error on mobile"
git commit -m "docs: update API endpoint documentation"
git commit -m "ui: improve travel card mobile layout"
```

**Commit Types:**
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation
- `ui:` - UI/UX improvements
- `perf:` - Performance improvements
- `test:` - Testing
- `chore:` - Build/tooling changes

### 4. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a pull request on GitHub with:

- **Clear title** describing the change
- **Detailed description** of what was changed and why
- **Screenshots** for UI changes
- **Testing notes** for reviewers
- **Links to related issues**

### 5. Review Process

- ✅ All CI checks must pass
- ✅ Code review by maintainers
- ✅ Testing verification
- ✅ Documentation updates (if needed)

## 📏 Coding Standards

### TypeScript

- **Use TypeScript** for all new code
- **Define interfaces** for all data structures
- **Use strict typing** - avoid `any` type
- **Export types** from appropriate modules

```typescript
// ✅ Good
interface TravelFormData {
  destination: string;
  budget: 'Tight' | 'Comfortable' | 'Luxury';
  travelers: number;
}

// ❌ Avoid
const formData: any = {...};
```

### React Components

- **Use functional components** with hooks
- **Props interfaces** for all components
- **Default exports** for page components
- **Named exports** for utility components

```typescript
// ✅ Good
interface TravelCardProps {
  destination: string;
  budget: number;
  onEdit?: () => void;
}

export default function TravelCard({ destination, budget, onEdit }: TravelCardProps) {
  // Component logic
}
```

### API Development

- **Input validation** with Zod schemas
- **Error handling** with appropriate HTTP codes
- **Rate limiting** for public endpoints
- **Security checks** for sensitive operations

```typescript
// ✅ Good
import { z } from 'zod';

const TravelInputSchema = z.object({
  destination: z.string().min(2).max(100),
  budget: z.enum(['Tight', 'Comfortable', 'Luxury']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = TravelInputSchema.parse(body);
    // Process validated data
  } catch (error) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
}
```

### Styling Guidelines

- **Use Tailwind CSS** for styling
- **Mobile-first** responsive design
- **shadcn/ui components** for consistency
- **Semantic HTML** elements

```tsx
// ✅ Good
<div className="flex flex-col space-y-4 p-4 md:flex-row md:space-y-0 md:space-x-4 md:p-6">
  <Card className="flex-1">
    <CardContent>
      {/* Content */}
    </CardContent>
  </Card>
</div>
```

## 🧪 Testing Guidelines

### Manual Testing Checklist

Before submitting a PR, test:

- ✅ **Desktop browsers** (Chrome, Firefox, Safari)
- ✅ **Mobile devices** (iOS Safari, Android Chrome)
- ✅ **Form validation** with invalid inputs
- ✅ **API error scenarios** 
- ✅ **Loading states** and edge cases

### Running Tests

```bash
# Lint checking
npm run lint

# Type checking
npm run type-check

# Build verification
npm run build

# Development server
npm run dev
```

### Test Areas

Focus testing on:

1. **Travel form workflow** (all 5 steps)
2. **API integrations** (with and without keys)
3. **Mobile responsiveness** 
4. **Error handling** and validation
5. **Performance** with large datasets

## 🐛 Issue Reporting

### Bug Reports

Include in your bug report:

- **Environment** (browser, device, OS)
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Screenshots** or error messages
- **Console errors** (if any)

### Bug Report Template

```markdown
## Bug Description
[Clear description of the bug]

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
[What you expected to happen]

## Screenshots
[If applicable, add screenshots]

## Environment
- OS: [e.g., macOS, Windows, Linux]
- Browser: [e.g., Chrome 91, Safari 14]
- Device: [e.g., iPhone 12, Desktop]
- Node.js version: [if relevant]
```

## 💡 Feature Requests

### Feature Request Template

```markdown
## Feature Description
[Clear description of the feature]

## Problem Statement
[What problem does this solve?]

## Proposed Solution
[How should this work?]

## Alternative Solutions
[Other approaches considered]

## Additional Context
[Screenshots, mockups, related issues]
```

### Feature Guidelines

Good features for Scout:
- ✅ **Enhance user experience** for travelers
- ✅ **Support Indian travelers** specifically
- ✅ **Integrate real travel data**
- ✅ **Improve mobile experience**
- ✅ **Add security/privacy features**

## 🔒 Security

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead:
- Email: security@scout-app.com
- Include detailed reproduction steps
- We'll respond within 24 hours

### Security Guidelines

When contributing code to Scout, security is our top priority. Follow these guidelines:

#### Critical Security Requirements

- **Never commit** API keys, secrets, or sensitive data
- **Use environment variables** for all configuration
- **Validate all inputs** using Zod schemas on the server side
- **Implement rate limiting** for new API endpoints
- **Use HTTPS** for all external requests
- **Follow OWASP guidelines** for web security
- **Test authentication** and authorization flows

#### Enhanced Security Features

Scout implements enterprise-grade security. When contributing:

1. **Request Signing**: Use HMAC signatures for sensitive operations
   ```typescript
   // For sensitive operations in production
   import { requireSignedRequest } from '@/lib/security/request-signing';
   
   const validator = requireSignedRequest();
   const result = await validator(request);
   ```

2. **Session Management**: Use enhanced session system
   ```typescript
   // Use enhanced sessions with device fingerprinting
   import { enhancedSessionManager } from '@/lib/auth/enhanced-session';
   
   const sessionId = await enhancedSessionManager.createSession(userId, request);
   ```

3. **Database Security**: Follow secure database patterns
   ```typescript
   // Use secure database manager
   import { dbManager } from '@/lib/db/db-config';
   
   const result = await dbManager.executeWithTimeout(operation);
   ```

4. **Input Validation**: Comprehensive validation required
   ```typescript
   // Always validate inputs with Zod
   import { z } from 'zod';
   
   const schema = z.object({
     username: z.string().regex(/^[a-zA-Z0-9]{3,20}$/),
     email: z.string().email()
   });
   ```

#### Security Testing Checklist

Before submitting security-related changes:

- [ ] **Rate limiting** tested and functional
- [ ] **Input validation** prevents injection attacks
- [ ] **Authentication** flows work correctly
- [ ] **Session security** properly implemented
- [ ] **CAPTCHA** integration tested
- [ ] **Error handling** doesn't leak sensitive data
- [ ] **Environment variables** properly configured
- [ ] **HTTPS** enforced in production
- [ ] **Security headers** set correctly
- [ ] **npm audit** shows zero vulnerabilities

#### Security Code Review

All security-related changes require:

1. **Security-focused code review**
2. **Testing against common attack vectors**
3. **Validation of rate limiting**
4. **Session security verification**
5. **Input sanitization testing**

## 📝 Documentation

### Documentation Standards

- **Clear, concise writing**
- **Code examples** for complex concepts
- **Screenshots** for UI changes
- **API documentation** for new endpoints
- **Update README** for significant changes

### Documentation Locations

- **README.md** - Main project documentation
- **CONTRIBUTING.md** - This file
- **API docs** - Inline JSDoc comments
- **Component docs** - PropTypes and examples

## 🎯 Priorities

Current development priorities:

1. **🔒 Security & Privacy** - ALTCHA, rate limiting, validation
2. **📱 Mobile Experience** - Touch interactions, responsive design
3. **🌍 Travel Data Quality** - API integrations, data validation
4. **⚡ Performance** - Loading times, caching, optimization
5. **🎨 User Experience** - Intuitive workflows, accessibility

## 🏆 Recognition

Contributors will be:
- **Listed in CONTRIBUTORS.md**
- **Mentioned in release notes** for significant contributions
- **Invited to maintainer team** for consistent contributors

## 📞 Getting Help

Need help with your contribution?

- **Discord**: [Scout Contributors](https://discord.gg/scout-dev) 
- **GitHub Discussions**: [Ask questions](https://github.com/Iammony/scout/discussions)
- **Email**: contributors@scout-app.com

## 📚 Resources

### Learning Resources

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Guide](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

### Scout-Specific Resources

- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Integration Guide](docs/API_INTEGRATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

---

## 🙏 Thank You!

Your contributions help make travel planning better for millions of travelers. Every bug fix, feature addition, and documentation improvement makes a difference.

**Happy Contributing! 🚀**

---

*This contributing guide is living document. Feel free to suggest improvements!*