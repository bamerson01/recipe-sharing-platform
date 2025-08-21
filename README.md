# RecipeNest 🍳

A minimalist, social recipe app where people create, browse, and share recipes. Think "Notion-simple recipes" with likes and search.

## 🚀 Features

- **Auth** via Supabase (email+password)
- **Recipe CRUD** with structured ingredients & steps
- **Image upload** to Supabase Storage
- **Likes** system (1/user/recipe)
- **Search & filtering** by keywords and categories
- **Public/private** recipe visibility
- **Mobile-first** responsive design

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, React Server Components
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Postgres, RLS, Storage)
- **Forms**: react-hook-form + zod validation
- **Search**: Postgres full-text search (tsvector + GIN)

## 📋 Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account and project

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd recipe-sharing-platform
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Supabase Setup

1. Create a new Supabase project
2. Run the SQL schema from `src/scripts/sql/schema.sql`
3. Seed categories with `src/scripts/sql/seed-categories.sql`
4. Create Storage bucket `recipe-images` with public read access
5. Configure Auth redirect URLs for your domains

### 4. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/       # Landing/public pages
│   ├── (app)/            # Auth'd app routes (protected)
│   ├── explore/          # Public archive & search
│   ├── r/[slug]/         # Public recipe detail
│   └── api/              # Route handlers
├── components/            # UI components (shadcn-based)
├── lib/                   # Utilities and database
│   ├── db/               # Supabase server client
│   └── validation/       # Zod schemas
├── types/                 # TypeScript interfaces
└── scripts/              # SQL migrations and seeds
```

## 🗄️ Database Schema

The app uses the following main tables:
- `profiles` - User profiles (mirrors auth.users)
- `recipes` - Recipe metadata and content
- `recipe_ingredients` - Structured ingredient lists
- `recipe_steps` - Step-by-step instructions
- `categories` - Recipe categories
- `likes` - User recipe likes

## 🔐 Security Features

- Row Level Security (RLS) enabled on all tables
- Service role key never exposed to client
- Input validation with Zod schemas
- Authenticated image uploads only

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Ensure these are set in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

## 🧪 Testing

```bash
# Run tests
npm test

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

## 📱 Mobile Support

- Responsive design with mobile-first approach
- Touch-friendly interactions
- Optimized for mobile performance

## 🔍 Search & Performance

- Full-text search using Postgres tsvector
- GIN indexes for fast queries
- Optimized images with next/image
- Server-side rendering for SEO

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

Built with ❤️ using Next.js, Supabase, and Tailwind CSS
