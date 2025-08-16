# AI Course Content Generation Platform

A comprehensive platform for educators to generate AI-powered course content with administrative management capabilities.

## Features

### For Lecturers
- 🤖 AI-powered content generation using OpenRouter
- 📚 Generate lesson plans, assignments, quizzes, and study notes
- 📊 Track generated content history
- 🎯 Course-specific content creation

### For Administrators
- 👥 User management (create lecturers, assign roles)
- 📋 Course management (create courses, assign to lecturers)
- 📈 Platform analytics and oversight
- 🔐 Role-based access control

### Technical Features
- 🔒 Secure authentication with Supabase
- 📱 Responsive design for all devices
- 🎨 Modern, professional UI with Tailwind CSS
- ⚡ Real-time content generation
- 🗄️ PostgreSQL database with RLS

## Getting Started

### 1. User Registration Options

#### Option A: Homepage Registration (Recommended)
1. Visit the homepage
2. Click "Create Admin Account" or "Create Lecturer Account"
3. Fill in your details and submit
4. Login with your new credentials

#### Option B: Supabase Dashboard
1. Go to your Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Enter email and password
4. In "User Metadata" field, add:
   ```json
   {
     "full_name": "Your Name",
     "role": "admin"
   }
   ```
5. Profile will be created automatically

#### Option C: Admin Dashboard
1. Access the admin dashboard
2. Click "Add User"
3. Fill in user details
4. Account created with credentials displayed

### 2. Sample Accounts
For testing purposes, you can use:
- **Admin**: admin@eduai.com / admin123
- **Lecturer**: lecturer@eduai.com / lecturer123

### 3. Platform Setup
1. **Admin Setup**:
   - Create courses using the admin dashboard
   - Add lecturers to the platform
   - Assign courses to lecturers

2. **Lecturer Usage**:
   - Login to access assigned courses
   - Generate AI content for courses
   - View and manage generated content

## API Configuration

### OpenRouter API
The platform uses OpenRouter's free AI models for content generation:
- Model: `meta-llama/llama-3.2-3b-instruct:free`
- Configured in `src/lib/openrouter.ts`

### Supabase Configuration
Database and authentication powered by Supabase:
- Real-time subscriptions
- Row Level Security (RLS)
- Automatic profile creation

## Database Schema

### Tables
- **profiles**: User information and roles
- **courses**: Course catalog
- **course_assignments**: Lecturer-course relationships
- **generated_content**: AI-generated materials

### Security
- Row Level Security enabled on all tables
- Role-based access policies
- Automatic profile creation triggers

## Development

### Prerequisites
- Node.js 18+
- Supabase account
- OpenRouter API key

### Installation
```bash
npm install
npm run dev
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

## Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons

### Backend
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security
- **OpenRouter** for AI content generation

### Key Components
- `AuthContext`: Authentication state management
- `Layout`: Consistent page structure
- `AdminDashboard`: Administrative interface
- `LecturerDashboard`: Content generation interface

## Deployment

The application is ready for deployment on platforms like:
- Vercel
- Netlify
- Supabase hosting

Ensure environment variables are configured in your deployment platform.

## Support

For issues or questions:
1. Check the admin setup instructions in the dashboard
2. Verify environment variables are correctly set
3. Ensure Supabase migrations have been applied
4. Test with sample accounts first

## License

MIT License - feel free to use this project for educational or commercial purposes.