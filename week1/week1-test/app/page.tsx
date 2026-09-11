import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden font-sans">
      {/* Background Glow Effects */}
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse"></div>
      <div 
        className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-600 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-pulse" 
        style={{ animationDelay: '2s' }}
      ></div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 text-center space-y-8 p-10 md:p-16 backdrop-blur-xl bg-white/5 border border-white/10 rounded-[2rem] shadow-2xl max-w-4xl w-full">
        
        {/* Badge */}
        <div className="inline-block px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm font-semibold tracking-wide mb-4">
          v2.0 Web Edition
        </div>

        {/* Gradient Typography */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 pb-2">
          
        </h1>

        <p className="text-slate-400 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
          
        </p>

        {/* Interactive Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center pt-8">
          <button className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-full transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] active:translate-y-0">
            Mulai Petualangan
          </button>
          <button className="px-8 py-4 bg-transparent border border-slate-600 hover:border-slate-300 text-slate-300 hover:text-white font-medium rounded-full transition-all duration-300 transform hover:-translate-y-1">
            Eksplorasi Source Code
          </button>
        </div>
        
      </div>
    </main>
  );
}