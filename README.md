# 🧠 ProLearnAI - Your Interactive Learning Workspace

> **Read research papers, solve brain teasers, and compete on leaderboards — all in one beautiful, distraction-free environment.**

Link to the website - https://ProLearnAI-today.vercel.app/ 

## ✨ What Makes ProLearnAI Special?

### 🎯 **Focused PDF Reading**
- **Distraction-free workspace** for research papers and academic content
- **Smart tracking** of your reading patterns (scrolls, clicks, time spent)
- **Seamless upload** with drag & drop support
- **Built-in viewer** that works on any device

### 🧩 **Brainstellar Quizzes**
- **Three difficulty levels**: Easy, Medium, Hard
- **Instant feedback** with visual indicators
- **Progress tracking** and completion stats
- **Starter puzzles** included to get you thinking

### 🎮 **Click Speed Challenge**
- **10-second speed test** to measure your reflexes
- **Real-time leaderboards** with global rankings
- **Personal best tracking** and improvement metrics
- **Competitive gameplay** to keep you engaged

### 📊 **Analytics Dashboard**
- **Live insights** into your learning patterns
- **Interactive charts** showing your activity
- **Export capabilities** for your data
- **Performance metrics** to track progress

## 🚀 Try It Right Now!

### **Quick Start (No Account Required)**
1. **Visit the homepage** - See the beautiful interface
2. **Try the quizzes** - Test your problem-solving skills
3. **Play the game** - Challenge your click speed
4. **Explore the dashboard** - View sample analytics

### **Full Experience (With Account)**
1. **Sign up** - Quick email/password registration
2. **Upload a PDF** - Drag & drop your research papers
3. **Read & track** - Monitor your learning patterns
4. **Compete** - Climb the leaderboards

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
   # Optional if using the Python generator
   NEXT_PUBLIC_PYTHON_GENERATOR_URL=http://localhost:8000/generate
   ```
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

- **Students** - Organize research papers and track study habits
- **Researchers** - Focus on content without distractions
- **Problem solvers** - Challenge yourself with brain teasers
- **Competitive learners** - Compare progress with others
- **Anyone** who wants a beautiful, functional learning environment

## 📱 Features That Matter

### **Smart Tracking**
- Every interaction is captured and analyzed
- Understand your learning patterns
- Identify areas for improvement

### **Real-time Updates**
- Live leaderboards that update instantly
- Real-time analytics dashboard
- Instant feedback on all actions

### **Export & Share**
- Download your data as CSV
- Track progress over time
- Share achievements with others

## 🎯 Why Choose ProLearnAI?

1. **Beautiful Design** - Modern, professional interface
2. **Smart Features** - Intelligent tracking and analytics
3. **Engaging Content** - Quizzes and games to keep you motivated
4. **Real-time Data** - Live updates and instant feedback
5. **Mobile Friendly** - Works perfectly on all devices
6. **Privacy Focused** - Your data stays with you

## 🚀 Ready to Transform Your Learning?

**Start exploring now** - no setup required! Visit the homepage and try out the features that interest you most.

### **Quick Links**
- 🏠 **[Homepage](https://ProLearnAI-today.vercel.app/)** - See the full experience
- 📚 **[Reader](https://ProLearnAI-today.vercel.app/upload)** - Upload and read PDFs
- 📊 **[Dashboard](https://ProLearnAI-today.vercel.app/dashboard)** - View your analytics
- 🔐 **[Sign Up](https://ProLearnAI-today.vercel.app/login)** - Create your account

---

**Built with ❤️ for learners who want more than just another reading app.**

*Questions? Feedback? [Open an issue](https://github.com/AryanKshyp/ProLearnAI---ET617/issues) or [contribute](https://github.com/AryanKshyp/ProLearnAI---ET617) to make ProLearnAI even better!*
