import React, { useState } from 'react';
import { UserProfile, AnalysisResult, AppState } from './types';
import { analyzeProfile } from './services/geminiService';
import SkillsChart from './components/SkillsChart';
import CareerCard from './components/CareerCard';
import InterviewModal from './components/InterviewModal';

function App() {
  const [state, setState] = useState<AppState>(AppState.LANDING);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    gradeLevel: '11th Grade',
    favoriteSubjects: '',
    hobbies: '',
    skills: '',
    dream: ''
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAnalyze = async () => {
    if (!profile.name || !profile.hobbies) return; // Basic validation
    setState(AppState.ANALYZING);
    try {
      const analysis = await analyzeProfile(profile);
      setResult(analysis);
      setState(AppState.DASHBOARD);
    } catch (error) {
      console.error(error);
      alert("Something went wrong with the AI analysis. Please check your API key and try again.");
      setState(AppState.INPUT);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-brand-100 selection:text-brand-900">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center cursor-pointer" onClick={() => setState(AppState.LANDING)}>
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-brand-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight">FutureCompass</span>
            </div>
            {state === AppState.DASHBOARD && (
              <button 
                onClick={() => setState(AppState.INPUT)}
                className="text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors"
              >
                New Analysis
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* LANDING */}
        {state === AppState.LANDING && (
          <div className="flex flex-col items-center justify-center pt-10 pb-20 text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-brand-50 text-brand-700 text-sm font-medium mb-8 animate-fade-in-up">
              🚀 Discover your potential with AI
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight max-w-4xl">
              Turn your hobbies into <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-500">career superpowers</span>.
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Don't just guess your future. Let FutureCompass analyze your unique skills and interests to build a personalized "Skills Report Card" and career roadmap.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setState(AppState.INPUT)}
                className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white text-lg font-semibold rounded-xl shadow-lg shadow-brand-500/30 transition-all hover:scale-105"
              >
                Start My Analysis
              </button>
              <a 
                href="#features" 
                className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-lg font-semibold rounded-xl transition-all"
              >
                How it works
              </a>
            </div>

            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
              {[
                { title: "Skills Report Card", icon: "📊", desc: "Get a quantitative breakdown of your soft & hard skills." },
                { title: "Career Matching", icon: "🎯", desc: "Find jobs that fit your personality, not just your grades." },
                { title: "AI Interview Prep", icon: "💬", desc: "Practice real interview questions for your dream job." }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-left hover:border-brand-200 transition-colors">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INPUT FORM */}
        {state === AppState.INPUT && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
              <div className="bg-slate-900 p-8 text-white">
                <h2 className="text-2xl font-bold mb-2">Tell us about yourself</h2>
                <p className="text-slate-300">The more details you provide, the better we can map your future.</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none"
                      placeholder="Your First Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Grade Level</label>
                    <select
                      name="gradeLevel"
                      value={profile.gradeLevel}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none bg-white"
                    >
                      <option>9th Grade</option>
                      <option>10th Grade</option>
                      <option>11th Grade</option>
                      <option>12th Grade</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Favorite Subjects</label>
                  <input
                    type="text"
                    name="favoriteSubjects"
                    value={profile.favoriteSubjects}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none"
                    placeholder="e.g. Physics, Art, History, Computer Science"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Hobbies & Extracurriculars
                    <span className="block text-xs font-normal text-slate-500 mt-0.5">What do you do for fun? Clubs? Sports? Gaming? Coding?</span>
                  </label>
                  <textarea
                    name="hobbies"
                    value={profile.hobbies}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none resize-none"
                    placeholder="e.g. I play basketball, I run a Minecraft server, I love drawing anime..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    What are you good at?
                    <span className="block text-xs font-normal text-slate-500 mt-0.5">Don't be shy! e.g. solving puzzles, talking to people, organizing events.</span>
                  </label>
                  <textarea
                    name="skills"
                    value={profile.skills}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none resize-none"
                    placeholder="e.g. I'm the one my friends come to for advice..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Big Dream (Optional)</label>
                  <input
                    type="text"
                    name="dream"
                    value={profile.dream}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none"
                    placeholder="e.g. Start a business, Travel the world, Invent something"
                  />
                </div>

                <button
                  onClick={handleAnalyze}
                  className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-brand-500/30 transition-all mt-4"
                >
                  Generate My Future Map
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {state === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-brand-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 animate-pulse">Analyzing your profile...</h2>
            <p className="text-slate-500 mt-2 text-center max-w-md">
              Our AI is reviewing your skills, matching career paths, and building your personalized roadmap.
            </p>
          </div>
        )}

        {/* DASHBOARD */}
        {state === AppState.DASHBOARD && result && (
          <div className="space-y-8 animate-fade-in">
            {/* Header Summary */}
            <div className="bg-gradient-to-r from-brand-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
              <h2 className="text-3xl font-bold mb-3">Hello, {profile.name}! 👋</h2>
              <p className="text-brand-100 text-lg leading-relaxed max-w-3xl">
                {result.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Skills Chart */}
              <div className="lg:col-span-1">
                <SkillsChart data={result.skillsReport} />
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                  <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                    💡 Quick Tip
                  </h4>
                  <p className="text-sm text-yellow-700">
                    Use this "Skills Report Card" to update your resume or college applications. Highlighting soft skills like '{result.skillsReport[0].category}' makes you stand out!
                  </p>
                </div>
              </div>

              {/* Right Column: Careers */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-800">Recommended Career Paths</h3>
                  <span className="text-sm text-slate-500">Based on your unique profile</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {result.careers.map((career, idx) => (
                    <CareerCard 
                      key={idx} 
                      career={career} 
                      onStartInterview={(careerTitle) => setSelectedCareer(careerTitle)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INTERVIEW MODAL */}
        {selectedCareer && (
          <InterviewModal 
            career={selectedCareer} 
            onClose={() => setSelectedCareer(null)} 
          />
        )}

      </main>
      
      <footer className="bg-white border-t border-slate-200 mt-20 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} FutureCompass. Powered by Gemini AI.</p>
          <p className="mt-2">Designed to empower the next generation of innovators.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
