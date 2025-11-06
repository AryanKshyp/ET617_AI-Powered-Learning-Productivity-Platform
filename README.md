# 🧠 ProLearnAI - Your Complete AI-Powered Learning Platform

> **Transform your study materials into personalized learning experiences with AI-powered summaries, adaptive learning paths, focus tools, and wellness tracking — all in one intelligent platform.**

Link to the website - https://prolearn-ai.vercel.app/ 

## ✨ What Makes ProLearnAI Special?

### 🤖 **AI Study Suite**
Transform your learning materials into powerful study tools with cutting-edge AI:

- **Instant Content Transformation** - Upload PDFs, notes, or textbooks and get instant summaries, structured notes, flashcards, and quizzes
- **Adaptive Learning Paths** - AI-generated personalized study paths that focus on the right topics at the right time
- **Interactive Concept Maps** - Visualize knowledge dependencies and identify weak areas with dynamic concept mapping
- **AI Tutor** - Get personalized, conversational support with:
  - Step-by-step problem-solving guidance
  - Multiple teaching styles (Socratic, motivational, or ELI5) that adapt to your preference
  - Concept explanations tailored to your learning pace
  - Error correction with detailed feedback

### ⚡ **Productivity & Focus**
Stay on track and maximize your study efficiency:

- **Built-in Pomodoro Timers** - Structured study sessions with built-in breaks
- **Forest-style Focus Sessions** - Gamified focus tracking to keep you motivated
- **Task Boards** - Organize and manage your study tasks effectively
- **Distraction Detector** - Optional activity monitoring with timely nudges to maintain focus
- **Learning Efficiency Analytics** - Discover which study methods work best for you with actionable insights on retention and productivity

### 🎮 **Gamification & Breaks**
Make learning fun and engaging:

- **Brain Games & Micro-Challenges** - Mental refreshment during study breaks
- **Collaborative AI Challenges** - Team up with friends to solve AI-generated problem sets
- **Points, XP & Badges** - Earn rewards for your study progress and achievements
- **Global Leaderboards** - Compete with learners worldwide and track your rankings
- **Wellness Habit Rewards** - Gamified tracking for healthy study-life balance

### 🌿 **Wellness & Habits**
Recognizing that effective learning requires balance:

- **Personalized Wellness Companion** - AI-powered recommendations for:
  - Sleep optimization
  - Mindfulness practices
  - Hydration reminders
  - Movement and exercise
- **Habit Tracking & Streaks** - Build consistent routines with visual progress tracking
- **AI Coaches** - Integrated wellness routines seamlessly woven into your daily study plans
- **Long-term Wellbeing** - Holistic approach to sustainable learning success

## 🚀 Try It Right Now!

### **Quick Start (No Account Required)**
1. **Visit the homepage** - Explore the beautiful interface and see what ProLearnAI offers
2. **Try the AI features** - Experience instant content transformation and AI-powered study tools
3. **Test focus tools** - Try the Pomodoro timer and productivity features
4. **Explore gamification** - Check out brain games and leaderboards

### **Full Experience (With Account)**
1. **Sign up** - Quick email/password registration
2. **Upload your materials** - Drag & drop PDFs, notes, or textbooks
3. **Get AI-powered summaries** - Transform content into summaries, flashcards, and quizzes
4. **Start your learning path** - Follow personalized adaptive learning recommendations
5. **Track wellness** - Set up habit tracking and receive wellness recommendations
6. **Compete & collaborate** - Join leaderboards and team up for AI challenges

## 🎨 Beautiful, Modern Design

- **Glassmorphism UI** with subtle shadows and transparency
- **Responsive design** that works on all devices
- **Smooth animations** and micro-interactions
- **Professional color scheme** that's easy on the eyes
- **Intuitive navigation** - everything is just a click away

## 🔧 Built With Modern Tech

- **Next.js 14** - Fast, SEO-friendly React framework
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Real-time database and authentication
- **Chart.js** - Beautiful, interactive data visualizations
- **TypeScript** - Type-safe development
- **AI/ML Integration** - Advanced content generation and adaptive learning algorithms

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project (for auth and database)

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` in the project root:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`.

### Optional: Python Generator Service
For advanced content generation via FastAPI, use the helper in `python-generator/`:
1. Create a virtual environment and install deps:
   ```bash
   cd python-generator
   python -m venv .venv
   # Windows PowerShell
   .venv\\Scripts\\Activate.ps1
   pip install -r requirements.txt
   ```
2. Run the service:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```
3. Ensure `NEXT_PUBLIC_PYTHON_GENERATOR_URL` is set in `.env.local` as shown above.

## 🌟 Perfect For

- **Students** - Transform textbooks and notes into personalized study materials with AI
- **Lifelong Learners** - Adaptive learning paths that adjust to your pace and style
- **Busy Professionals** - Efficient study sessions with focus tools and productivity analytics
- **Study Groups** - Collaborative AI challenges to learn together
- **Wellness-Conscious Learners** - Balance study with integrated wellness tracking and habits
- **Anyone** who wants an intelligent, holistic learning platform that adapts to them

## 📱 Key Features

### **AI-Powered Intelligence**
- Instant transformation of study materials into multiple learning formats
- Personalized adaptive learning paths that evolve with your progress
- Conversational AI tutor with multiple teaching styles
- Interactive concept mapping to visualize knowledge relationships

### **Productivity & Analytics**
- Comprehensive learning efficiency analytics
- Distraction detection and focus optimization
- Task management and study session tracking
- Real-time insights into your study patterns

### **Engagement & Motivation**
- Gamified learning with points, XP, badges, and streaks
- Collaborative challenges with friends
- Global leaderboards for competitive motivation
- Wellness habit rewards integrated into learning goals

### **Holistic Wellness Integration**
- Personalized wellness recommendations
- Habit tracking with visual progress indicators
- AI coaches that integrate wellness into study plans
- Long-term wellbeing support for sustainable learning

## 🎯 Why Choose ProLearnAI?

1. **AI-Powered Learning** - Transform any study material into personalized learning tools instantly
2. **Adaptive Intelligence** - Learning paths that adjust to your pace and identify knowledge gaps
3. **Holistic Approach** - Combines study efficiency with wellness tracking for sustainable learning
4. **Multiple Learning Styles** - AI tutor adapts teaching methods (Socratic, motivational, ELI5) to your preference
5. **Productivity Focus** - Built-in Pomodoro timers, task boards, and distraction detection
6. **Gamified Engagement** - Points, badges, leaderboards, and collaborative challenges keep you motivated
7. **Beautiful Design** - Modern, professional interface with glassmorphism UI
8. **Mobile Friendly** - Works perfectly on all devices
9. **Privacy Focused** - Your data stays with you

## 🚀 Ready to Transform Your Learning?

**Start exploring now** - no setup required! Upload your materials and experience AI-powered learning transformation.

### **Quick Links**
- 🏠 **[Homepage](https://prolearn-ai.vercel.app/)** - See the full experience
- 📊 **[Dashboard](https://prolearn-ai.vercel.app/dashboard)** - View your analytics and learning insights
- 🔐 **[Sign Up](https://prolearn-ai.vercel.app/login)** - Create your account and start learning

---

**Built with ❤️ for learners who want an intelligent, holistic approach to education and personal growth.**

