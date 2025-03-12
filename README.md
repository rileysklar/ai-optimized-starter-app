
A modern, production-ready fullstack web application template engineered for AI-enhanced development workflows. This template is optimized for rapid development with AI assistants like Cursor and designed to showcase best practices for integrating AI tooling into your development process.


## 🌟 Features

- **AI-First Development**: Optimized for AI pair programming with Cursor
- **Production Ready**: Enterprise-grade architecture with scalable patterns
- **Full Authentication**: Secure multi-tenant user management with Clerk
- **Serverless Database**: Powerful Postgres backend with Supabase
- **Type-Safe ORM**: Strongly typed database operations with Drizzle
- **Beautiful UI**: Modern, responsive interfaces with Tailwind and Shadcn
- **Smooth Animations**: Polished user experience with Framer Motion
- **Server Components**: Next.js App Router with React Server Components

## 📚 Tech Stack

### Frontend
- [Next.js 14](https://nextjs.org/docs) - React framework with App Router
- [Tailwind CSS](https://tailwindcss.com/docs/guides/nextjs) - Utility-first CSS
- [Shadcn/ui](https://ui.shadcn.com/docs) - Accessible component system
- [Framer Motion](https://www.framer.com/motion) - Animation library

### Backend
- [PostgreSQL](https://www.postgresql.org) - Relational database
- [Supabase](https://supabase.com) - Managed Postgres service
- [Drizzle ORM](https://orm.drizzle.team) - Type-safe SQL toolkit
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) - Next.js API pattern

### Authentication
- [Clerk](https://clerk.com) - User management and authentication

### Development
- [Cursor](https://www.cursor.com) - AI-enhanced code editor
- [TypeScript](https://www.typescriptlang.org) - Typed JavaScript

## 🏗️ Project Structure

```
ai-optimized-starter-app/
├── .cursor/rules/          # AI assistant guidelines
├── actions/                # Server actions
│   └── db/                 # Database-related actions
├── app/                    # Next.js app router
│   ├── (auth)/             # Authentication routes
│   │   ├── login/          # Login page
│   │   └── signup/         # Signup page
│   ├── (landing)/          # Landing page route
│   ├── contacts/           # Contacts example route
│   └── layout.tsx          # Root layout
├── components/             # Shared components
│   ├── landing/            # Landing page components
│   ├── magicui/            # Magic UI animation components
│   ├── sidebar/            # Sidebar components
│   ├── ui/                 # Shadcn UI components
│   └── utilities/          # Utility components
├── db/                     # Database configuration
│   └── schema/             # Database schema definitions
├── lib/                    # Utility functions
│   └── hooks/              # Custom hooks
├── public/                 # Static assets
├── supabase/               # Supabase configuration
│   └── migrations/         # Database migrations
└── types/                  # TypeScript types
```

## 🔒 Authenticated Experience

The application provides a complete authenticated user experience with the following features:

### User Authentication Flow
- **Sign Up/Sign In**: Secure authentication powered by Clerk with pre-built routes at `/login` and `/signup`
- **User Profile**: Access and management of user information
- **Protected Routes**: Middleware-based route protection that redirects unauthenticated users
- **Role-Based Access**: Support for different user permission levels

### Authenticated View Structure
The authenticated application area follows a consistent layout pattern:
- **App Sidebar**: Navigation sidebar with collapsible menu for different sections
- **Content Area**: Main content display with dedicated header for each section
- **Responsive Design**: Fully responsive layout that works on mobile and desktop

The authenticated layout is automatically applied to protected routes like `/contacts` and provides a foundation for building additional authenticated features. The structure is designed to be easily extended with new routes while maintaining a consistent user experience.

## 📋 Contacts Feature (Template Example)

The Contacts feature is included as a comprehensive example of a full-stack feature implementation that demonstrates the template's patterns and capabilities:

### What's Included
- **Database Schema**: Complete `contacts` table with relationships to users
- **CRUD Operations**: Create, read, update, and delete contact records
- **Server Actions**: Type-safe database operations with proper error handling
- **UI Components**: 
  - Contact form with validation
  - Contact list with search and filtering
  - Inline editing and deletion of contacts
  - Responsive grid layout for contacts

### Purpose of the Contacts Feature
This feature serves as a reference implementation that demonstrates:
- How to structure full-stack features using the template
- Proper data flow between client and server
- Implementation of database operations with Drizzle ORM
- Form validation and error handling patterns
- UI component organization and reuse

The Contacts feature is intentionally simple but complete, providing a solid foundation for understanding how all parts of the tech stack work together. You can use this as a blueprint for your own features or replace it entirely with your application-specific functionality.

### Technical Implementation Details
- **Database**: Utilizes the `contacts` table with fields for name, email, phone, and notes
- **Actions**: Server actions in `actions/db/contacts-actions.ts` for CRUD operations
- **Components**: UI components in `app/contacts/_components/` for the contact list and navigation
- **Layout**: Authenticated layout in `app/contacts/layout.tsx` that includes the app sidebar
- **Page**: Main page component in `app/contacts/page.tsx` that fetches and displays contacts

This implementation follows best practices for Next.js App Router, React Server Components, and client-side state management while providing a seamless user experience.

## 🤖 Cursor Rules

This project includes AI assistant guidelines in the `.cursor/rules/` directory that help AI tools understand the codebase's patterns and conventions. These rules cover:

- **Frontend**: Component structure, naming, and data flow patterns
- **Backend**: Database schema design and server action implementations
- **Auth**: User authentication and authorization practices
- **Storage**: File upload and management guidelines

When using Cursor, these rules are automatically loaded to help the AI generate code that follows the project's conventions and best practices.

## 🚀 Getting Started

### Prerequisites

You'll need free accounts with these services:

- [Supabase](https://supabase.com/) - Database
- [Clerk](https://clerk.com/) - Authentication
- [Cursor](https://www.cursor.com/) - Recommended editor
- [Vercel](https://vercel.com/) - Deployment (optional)

### Setup Process

1. **Clone the repository**
   ```bash
   git clone https://github.com/materialize-labs/ai-optimized-starter-app.git
   cd ai-optimized-starter-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your service credentials:

   ```
   # Database (Supabase)
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

   # Authentication (Clerk)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
   ```

4. **Set up Supabase**
   Follow the Supabase setup instructions below.

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   The app will be running at [http://localhost:3000](http://localhost:3000)

## 🗃️ Supabase Setup

### 1. Create a Supabase Project

1. Sign in to [Supabase](https://supabase.com/)
2. Create a new project
3. Set a secure database password
4. Choose your preferred region
5. Wait for the project to initialize (about 2 minutes)

### 2. Configure Database Connection

1. Go to Project Settings → Database
2. Copy the connection string from the "URI" section
3. Replace `[YOUR-PASSWORD]` with your database password
4. Add this URL to your `.env.local` file as `DATABASE_URL`

### 3. Set Up Command Line Tools

```bash
# Install Supabase CLI
npm install -g supabase

# Login to your Supabase account
supabase login

# Link to your project (find project ref in the URL)
supabase link --project-ref your-project-ref
```

### 4. Apply Database Migrations

Apply the included database migrations to set up the required tables:

```bash
# For development environments
supabase db reset

# For production environments (only applies new migrations)
supabase db push
```

The migrations will create:
- `profiles` table - Stores user profile information
- `contacts` table - Stores contact information for the example app

### 5. Troubleshooting Database Issues

If you see errors like "relation does not exist":

1. Verify your DATABASE_URL is correct
2. Check migration status:
   ```bash
   supabase migration list
   ```
3. Manually push migrations:
   ```bash
   supabase db reset
   ```

## 🔐 Authentication Setup

1. Create a [Clerk](https://clerk.com/) account
2. Create a new application in Clerk dashboard
3. Navigate to API Keys in settings
4. Copy the Publishable Key and Secret Key
5. Add to your `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

## 🧠 Development Workflow

This template is optimized for AI-pair programming using Cursor:

1. **Explore with AI**: Use Cursor's AI assistant to understand the codebase
2. **Follow Conventions**: Cursor will follow the patterns defined in .cursor/rules
3. **Rapid Iteration**: Get AI-generated boilerplate for new features
4. **Type Safety**: TypeScript provides end-to-end type safety

When implementing new features:

1. Define database schema in `db/schema/`
2. Create server actions in `actions/db/`
3. Build UI components in `components/`
4. Create pages in `app/`

## 🚀 Deploying to Vercel

### 1. Create a Vercel Account

If you don't already have one, create a free account at [Vercel](https://vercel.com/).

### 2. Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 3. Connect Your Repository

#### Option 1: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub/GitLab/Bitbucket repository
3. Select the repository with your project

#### Option 2: Deploy via Vercel CLI

```bash
vercel
```

### 4. Configure Environment Variables

Add all the required environment variables from your `.env.local` file to the Vercel project:

1. Go to your project in the Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add all the variables from your `.env.local` file:
   - DATABASE_URL
   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   - CLERK_SECRET_KEY
   - NEXT_PUBLIC_CLERK_SIGN_IN_URL
   - NEXT_PUBLIC_CLERK_SIGN_UP_URL

### 5. Configure Build Settings

Ensure your build settings are correctly configured:

1. Framework Preset: Next.js
2. Build Command: `next build`
3. Output Directory: `.next`

### 6. Deploy

Click "Deploy" in the Vercel dashboard or run:

```bash
vercel --prod
```

### 7. Verify Your Deployment

After deployment completes:

1. Visit your new Vercel URL
2. Test authentication by signing up and logging in
3. Verify database connections by testing the Contacts feature

### 8. Set Up Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to Domains
3. Add your custom domain and follow the verification steps

## 📝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
