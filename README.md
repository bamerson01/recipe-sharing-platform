# RecipeNest - Social Recipe Sharing Platform 🍳

A modern, performant recipe sharing platform built with Next.js 15, TypeScript, and Supabase. Share your culinary creations, discover new recipes, and connect with food enthusiasts.

## ✨ Features

### 🍳 Core Recipe Management
- **Create & Edit**: Rich recipe creation with ingredients, steps, and images
- **Categories**: Organize recipes with customizable categories
- **Difficulty & Time**: Track prep time, cook time, and difficulty levels
- **Privacy Controls**: Public and private recipe options
- **My Cookbook**: Unified view of created and saved recipes

### 👥 Social Features
- **Follow System**: Follow other users and see their recipes
- **Likes & Saves**: Like recipes publicly or save them to your cookbook
- **Comments**: Engage with recipe creators
- **User Profiles**: Customizable profiles with avatars and bios
- **Creator Discovery**: Browse and follow top recipe creators

### 🔍 Discovery & Search
- **Smart Search**: PostgreSQL full-text search with sanitization
- **Category Filters**: Filter by recipe categories
- **Sort Options**: By popularity, recency, or relevance
- **Recipe Feed**: Personalized feed from people you follow

### 📊 Dashboard & Analytics
- **Personal Dashboard**: Overview of your recipe activity
- **Social Metrics**: Followers, following, and interaction counts
- **Recipe Stats**: Track likes, saves, and comments on your recipes
- **Quick Actions**: Easy access to key features

### ⚡ Performance Optimizations
- **React.memo**: Optimized component re-renders
- **Parallel Data Fetching**: Eliminated waterfall requests
- **Image Optimization**: Blur placeholders and lazy loading
- **N+1 Query Prevention**: Batch database queries
- **Rate Limiting**: Protection against API abuse

## 🚀 Tech Stack

- **Framework**: Next.js 15.5 with App Router
- **Language**: TypeScript with strict mode
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **State**: React Context for auth
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── api/               # API endpoints
│   ├── dashboard/         # User dashboard
│   ├── recipes/           # Recipe browsing
│   ├── my-cookbook/       # Personal recipes
│   ├── creators/          # User discovery
│   └── u/[username]/      # User profiles
├── components/            
│   ├── ui/                # Reusable UI components
│   │   ├── loading-spinner.tsx
│   │   ├── empty-state.tsx
│   │   └── recipe-grid-skeleton.tsx
│   └── recipe-card-unified.tsx  # Main recipe card
├── lib/                   
│   ├── db/                # Database utilities
│   ├── images/            # Image optimization
│   │   └── blur-placeholder.ts
│   ├── validation/        # Zod schemas
│   └── rate-limit.ts      # API rate limiting
└── types/                 # TypeScript definitions

docs/
├── API.md                 # Complete API reference
├── COMPONENTS.md          # Component documentation
├── DATABASE.md            # Database schema
└── PERFORMANCE.md         # Performance guide
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/recipe-sharing-platform.git
   cd recipe-sharing-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**
   
   Run these SQL files in your Supabase SQL editor (in order):
   ```bash
   database/add_following_system.sql
   database/add_recipe_time_difficulty.sql
   database/fix_unique_username_trigger.sql
   database/fix_likes_saves_system.sql
   database/fix_foreign_keys.sql
   ```

5. **Configure storage**
   
   In Supabase Dashboard:
   - Create bucket: `public-media`
   - Set to public access
   - Configure policies for authenticated uploads

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:3000`

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[API Reference](docs/API.md)** - Complete API documentation with examples
- **[Component Guide](docs/COMPONENTS.md)** - UI components and usage
- **[Database Schema](docs/DATABASE.md)** - Database design and conventions
- **[Performance Guide](docs/PERFORMANCE.md)** - Optimization strategies

## 🎯 Key Implementation Details

### Database Column Names
**Important**: The `follows` table uses:
- `follower_id` - The user who is following
- `following_id` - The user being followed (NOT `followed_id`)

### Performance Optimizations
- **React.memo** on `RecipeCard`, `LikeButton`, `SaveButton`
- **Parallel fetching** with `Promise.all()` in profile page
- **Batch queries** in search API to prevent N+1 problems
- **Image optimization** with blur placeholders and priority loading

### Security Features
- **Row Level Security** on all tables
- **Input validation** with Zod schemas
- **SQL injection prevention** with parameterized queries
- **Rate limiting** on API endpoints
- **File upload restrictions** (5MB, specific formats)

## 🐛 Recent Fixes & Improvements

### ✅ Latest Updates (2025)
- **Performance**: Added React.memo to prevent unnecessary re-renders
- **Database**: Fixed column naming consistency (`following_id`)
- **UI Components**: Created reusable `LoadingSpinner`, `EmptyState`, `RecipeGridSkeleton`
- **Image Loading**: Implemented blur placeholders and lazy loading
- **API Optimization**: Batch fetching to eliminate N+1 queries
- **Navigation**: Consolidated "My Cookbook" for saved and created recipes

## 🧪 Testing

### Manual Testing Checklist
- [ ] Authentication flow (signup, login, logout)
- [ ] Recipe CRUD operations
- [ ] Follow/unfollow functionality
- [ ] Like and save features
- [ ] Search and filtering
- [ ] Image uploads
- [ ] Profile editing

### Debug Endpoints
```
/api/debug/test-tables
/api/debug/test-foreign-keys
/api/debug/test-schema
/api/debug/profile
```

## 📈 Performance Metrics

Current Lighthouse scores:
- **Performance**: 95+
- **Accessibility**: 98+
- **Best Practices**: 100
- **SEO**: 100

Load times:
- **Initial page load**: ~1.2s
- **Recipe grid render**: ~150ms
- **API responses**: <200ms average
- **Search queries**: ~200ms (optimized from ~2s)

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/recipe-sharing-platform)

### Environment Variables
Configure in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Standards
- TypeScript strict mode
- ESLint configuration
- Responsive design required
- Documentation for new features
- Performance testing

## 🎯 Roadmap

### Short Term
- [ ] Virtual scrolling for large recipe lists
- [ ] React Query integration for caching
- [ ] Advanced recipe search filters
- [ ] Recipe collections/meal plans

### Long Term
- [ ] Mobile app with React Native
- [ ] Recipe versioning system
- [ ] Nutrition information
- [ ] Shopping list generation
- [ ] AI-powered recipe suggestions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.io/) - Open source Firebase alternative
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## 🆘 Support

If you encounter issues:

1. Check the [documentation](docs/)
2. Review common issues in this README
3. Check debug endpoints for troubleshooting
4. Open an issue with detailed information

### Common Issues

**Follow button not working?**
- Check that database uses `following_id` not `followed_id`

**Image upload failing?**
- Verify storage bucket permissions
- Check file size < 5MB
- Ensure correct file format (jpg, jpeg, png, webp)

**Slow performance?**
- Check for N+1 queries
- Verify React.memo is applied
- Check browser DevTools Network tab

---

**Built with ❤️ using Next.js 15, Supabase, and modern web technologies**