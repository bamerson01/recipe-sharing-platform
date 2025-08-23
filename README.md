# RecipeNest - Social Recipe Sharing Platform

A modern, social recipe sharing platform built with Next.js 15, Supabase, and TypeScript. Share recipes, discover new dishes, and connect with fellow food enthusiasts.

## ✨ Features

### 🍳 Core Recipe Management
- **Create & Edit**: Rich recipe creation with ingredients, steps, and images
- **Categories**: Organize recipes with customizable categories
- **Search**: Full-text search across titles, summaries, and ingredients
- **Privacy**: Public and private recipe options

### 👥 Social Features
- **Likes & Saves**: Like recipes publicly or save them privately
- **Follow System**: Follow other users and see their recipes
- **Comments**: Engage with recipe creators
- **User Profiles**: Customizable profiles with avatars and bios

### 🔍 Discovery & Search
- **Explore Page**: Browse recipes with filtering and sorting
- **Advanced Search**: PostgreSQL full-text search with tsvector
- **Category Filters**: Filter by recipe categories
- **Sort Options**: Top recipes by likes or newest first

### 📊 Dashboard & Analytics
- **Personal Dashboard**: Overview of your recipe activity
- **Social Metrics**: Followers, following, and interaction counts
- **Recent Activity**: Track your recipe engagement
- **Quick Actions**: Easy access to key features

## 🚀 Tech Stack

- **Frontend**: Next.js 15.5 with App Router
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Vercel

## 🏗️ Architecture

### Database Design
- **PostgreSQL**: Robust relational database with RLS policies
- **Row Level Security**: Comprehensive data protection
- **Triggers & Functions**: Automatic count maintenance and search vectors
- **Manual Joins**: Reliable data fetching approach for complex relationships

### Component Architecture
- **Server Components**: Default for data fetching and static content
- **Client Components**: Only when interactivity is required
- **Server Actions**: Type-safe mutations and form handling
- **Optimistic Updates**: Immediate UI feedback with rollback

### Security
- **Authentication**: JWT-based auth with Supabase
- **Authorization**: RLS policies for all database operations
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive validation with Zod

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── api/               # API endpoints
│   ├── dashboard/         # User dashboard
│   ├── discover/          # Recipe exploration
│   ├── interactions/      # Social interactions
│   ├── connections/       # User relationships
│   ├── recipes/           # Recipe management
│   └── saved-recipes/     # Saved recipes page
├── components/            # Reusable UI components
├── lib/                   # Utility functions and configurations
└── types/                 # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd recipe-sharing-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase credentials
   ```

4. **Database setup**
   ```bash
   # Run the database setup scripts in database/ folder
   # Ensure all tables, RLS policies, and triggers are created
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[📖 README](docs/README.md)** - Documentation index and overview
- **[🏗️ Architecture](docs/architecture.md)** - System design and patterns
- **[📊 Database Schema](docs/database-schema.md)** - Complete database schema and relationships
- **[📝 Project History](docs/project-history.md)** - Development timeline and decisions
- **[🔄 Changelog](docs/changelog.md)** - Recent changes and updates
- **[🔒 Storage Policies](docs/storage-policies.md)** - File storage configuration
- **[🔐 RLS Policies](docs/rls-policies.md)** - Security policy details and testing
- **[⚡ Database Functions](docs/database-functions.md)** - Functions, triggers, and performance
- **[🔌 API Reference](docs/api-reference.md)** - Server actions and route handlers
- **[🧩 Component Interfaces](docs/component-interfaces.md)** - Component patterns and best practices

## 🐛 Recent Fixes & Improvements

### ✅ Resolved Issues (2025-01-22)
- **Foreign Key Constraint Issues**: Fixed data loading failures on interaction and connection pages
- **Column Naming Consistency**: Fixed API routes to use `followed_id` instead of `following_id`
- **Manual Joins Implementation**: Replaced problematic automatic foreign key relationships with reliable manual joins
- **Dashboard Navigation**: Made stat cards clickable and navigable
- **Page Functionality**: All interaction and connection pages now working properly

### 🔧 Technical Improvements
- **Data Fetching**: Implemented efficient two-step data fetching with Map-based lookups
- **Performance**: Maintained query efficiency with batch operations
- **Reliability**: Eliminated dependency on Supabase schema cache issues
- **Error Handling**: Comprehensive error handling and graceful degradation

## 🧪 Testing

### Manual Testing
- **Authentication Flow**: Sign up, login, logout, profile management
- **Recipe Operations**: Create, edit, delete, like, save
- **Social Features**: Follow, unfollow, view connections
- **Search & Discovery**: Keyword search, category filtering

### Debug Endpoints
The application includes comprehensive debug endpoints for troubleshooting:
- `/api/debug/test-tables` - Check table existence and data counts
- `/api/debug/test-server-actions` - Test server action functionality
- `/api/debug/test-foreign-keys` - Test foreign key relationships
- `/api/debug/test-fixed-actions` - Test the fixed server actions

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [documentation](docs/README.md)
2. Review the [changelog](docs/changelog.md) for recent fixes
3. Check the debug endpoints for troubleshooting
4. Open an issue with detailed information

## 🎯 Roadmap

### Short Term
- Enhanced search capabilities
- Recipe recommendations
- Social sharing improvements

### Long Term
- Mobile app optimization
- Advanced analytics
- Community features
- Recipe versioning

---

**Built with ❤️ using Next.js 15, Supabase, and modern web technologies**
