# 🧭 Scout - AI Travel Planning Assistant

> **Create comprehensive travel plans in 30 seconds with real-time data and AI-powered insights**

Scout is an intelligent travel planning platform designed specifically for Indian travelers. It generates complete travel decks with flight options, accommodations, attractions, budget breakdowns, visa requirements, and cultural insights using real APIs and advanced LLM technology.

[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![ALTCHA](https://img.shields.io/badge/ALTCHA-Secured-green.svg)](https://altcha.org/)

## ✨ Features

### 🎯 **Smart Travel Planning**
- **30-second travel cards** with comprehensive information
- **Multi-LLM architecture** using Claude 3.5 Sonnet, GPT-4o, and specialized models
- **Real-time data integration** with RapidAPI for flights, hotels, and attractions
- **Indian traveler focus** with visa requirements, vegetarian options, and cultural insights

### 🔒 **Security & Privacy**
- **ALTCHA captcha** integration for bot protection
- **Guest sessions** with 7-day temporary storage
- **Rate limiting** on all API endpoints
- **Environment-based security** configuration

### 📱 **Modern Experience**
- **Mobile-first design** with touch-optimized interactions
- **Progressive web app** capabilities
- **Offline-ready** with intelligent caching
- **Real-time updates** and live data processing

### 🌍 **Comprehensive Travel Data**
- ✈️ **Flight Options** - Best routes and pricing
- 🏨 **Accommodations** - Curated hotel recommendations  
- 🌤️ **Weather Forecasts** - 7-day weather planning
- 🎯 **Attractions** - Top destinations and hidden gems
- 🍛 **Dining Guide** - Indian food options and local cuisine
- 💰 **Budget Planning** - Complete cost breakdowns in INR
- 🛂 **Visa Information** - Requirements for Indian passport holders
- 📱 **Travel Essentials** - UPI, SIM, and practical tips

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0 or later
- npm or yarn package manager
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Iammony/scout.git
cd scout

# Install dependencies
npm install

# Copy environment configuration
cp .env.local.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Configuration

Create a `.env.local` file with the following variables:

```bash
# API Keys (Required for full functionality)
X_RapidAPI_Key=your_rapidapi_key_here
Openrouter_API=your_openrouter_key_here

# Security
SESSION_SECRET=your_random_32_char_string_here
ALTCHA_HMAC_KEY=your_random_32_char_hmac_key_here

# Database (Optional - uses AxioDB)
AXIODB_URL=your_axiodb_url_here
AXIODB_API_KEY=your_axiodb_key_here

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Feature Flags
ENABLE_GUEST_MODE=true
ENABLE_API_CACHING=true
API_CACHE_TTL_SECONDS=300

# Rate Limiting
RATE_LIMIT_GUEST_REQUESTS=50
RATE_LIMIT_USER_REQUESTS=100
RATE_LIMIT_WINDOW_MINUTES=1
```

## 🔧 Configuration

### API Keys Setup

1. **RapidAPI Key**: Get your key from [RapidAPI](https://rapidapi.com/hub)
   - Subscribe to travel APIs (Flight Data, Hotel Search, Travel Guide)
   - Add key as `X_RapidAPI_Key` in environment

2. **OpenRouter API**: Get your key from [OpenRouter](https://openrouter.ai/)
   - Provides access to Claude 3.5 Sonnet, GPT-4o, and other LLMs
   - Add key as `Openrouter_API` in environment

3. **ALTCHA HMAC Key**: Generate a random 32-character string
   - Used for captcha challenge generation and verification
   - Keep this secret and unique per deployment

### Development Mode

Scout works fully in development mode with mock data:

```bash
npm run dev
```

Features available without API keys:
- ✅ Complete travel form workflow
- ✅ Travel deck generation (with mock data)
- ✅ All UI components and interactions
- ✅ Guest session management
- ✅ Database operations
- ✅ Security features (captcha optional in dev)

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: AxioDB (Document-based)
- **Authentication**: Custom session management
- **APIs**: RapidAPI + OpenRouter LLM integration
- **Security**: ALTCHA captcha + rate limiting
- **Deployment**: Vercel-optimized

### Project Structure

```
scout/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── captcha/       # ALTCHA captcha
│   │   ├── scout/         # Travel planning APIs
│   │   └── rapidapi/      # External API integrations
│   ├── scout/             # Main travel planning page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── travel/            # Travel form components
│   ├── travel-deck/       # Travel deck display
│   └── ui/                # Reusable UI components
├── lib/                   # Shared utilities
│   ├── api/               # API clients and integrations
│   ├── captcha/           # ALTCHA integration
│   ├── db/                # Database operations
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Helper functions
│   └── validations/       # Zod validation schemas
├── hooks/                 # Custom React hooks
└── public/                # Static assets
```

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production  
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler

# Testing
npm run test         # Run test suite (when implemented)

# Deployment
npm run deploy       # Deploy to Vercel (if configured)
```

## 🌐 API Endpoints

### Travel Planning
- `POST /api/scout/deck` - Generate complete travel deck
- `GET /api/scout/travel` - Get travel recommendations
- `POST /api/scout` - Submit travel preferences

### Security
- `GET /api/captcha/challenge` - Get ALTCHA challenge
- `POST /api/captcha/verify` - Verify ALTCHA solution

### Status & Monitoring
- `GET /api/rapidapi/status` - Check API status and rate limits
- `GET /api/test-rapidapi` - Test API integrations

### Authentication (Future)
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user

## 🚢 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

```bash
# Manual deployment
npx vercel --prod
```

### Environment Variables for Production

Ensure these are set in your deployment platform:

```bash
X_RapidAPI_Key=prod_key_here
Openrouter_API=prod_key_here
SESSION_SECRET=prod_secret_here
ALTCHA_HMAC_KEY=prod_hmac_key_here
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🔒 Security Features

### ALTCHA Captcha Integration
- **Bot Protection**: Prevents automated abuse
- **Privacy-Focused**: No tracking or data collection
- **Lightweight**: Minimal impact on performance
- **Accessible**: Works with screen readers

### Data Protection
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Comprehensive Zod schema validation
- **Session Security**: Secure guest session management
- **Error Handling**: Safe error responses without data leakage

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Start development server**
   ```bash
   npm run dev
   ```
5. **Make your changes**
6. **Run tests and linting**
   ```bash
   npm run lint
   npm run type-check
   ```
7. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
8. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
9. **Create a Pull Request**

### Code Style
- Use TypeScript for all new code
- Follow the existing code style
- Use descriptive variable and function names
- Add comments for complex logic
- Ensure mobile responsiveness

### Testing
```bash
# Run linting
npm run lint

# Type checking
npm run type-check

# Build verification
npm run build
```

## 📋 Roadmap

### Version 1.1 (Q4 2024)
- [ ] User authentication and saved trips
- [ ] Social sharing enhancements
- [ ] Offline mode improvements
- [ ] Advanced filtering options

### Version 1.2 (Q1 2025)
- [ ] Collaborative trip planning
- [ ] Calendar integration
- [ ] Booking partner integrations
- [ ] Advanced analytics

### Version 2.0 (Q2 2025)
- [ ] Mobile app (React Native)
- [ ] Real-time collaboration
- [ ] AI travel assistant chat
- [ ] Multi-language support

## 🐛 Known Issues

- **Large API Responses**: Some travel deck generations may take 1-2 minutes with extensive data
- **Rate Limiting**: Free tier APIs have usage limits (1000 requests/hour)
- **Mobile Safari**: Minor touch interaction delays on older iOS versions

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Iammony/scout/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Iammony/scout/discussions)
- **Email**: scout-support@your-domain.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenRouter** for LLM API access
- **RapidAPI** for travel data integration  
- **ALTCHA** for privacy-focused captcha
- **Vercel** for hosting and deployment
- **shadcn/ui** for beautiful UI components
- **AxioDB** for document database solutions

---

**Made with ❤️ for Indian travelers**

*Scout helps you discover the world with confidence, comprehensive planning, and real travel data.*
