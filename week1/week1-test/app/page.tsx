'use client';

import React, { useState } from 'react';

export default function Home() {
  const [coins, setCoins] = useState(99);
  const [soundActive, setSoundActive] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCoinCollect = () => {
    setCoins((prev) => prev + 1);
  };

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[#0d0f18] text-[#e0e8f6] flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden select-none">
      {/* Import Pixel Font & Custom Retro Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');

        .font-pixel {
          font-family: 'Press Start 2P', monospace;
        }
        .font-retro {
          font-family: 'VT323', monospace;
        }

        /* Pixel borders & hard shadow utilities */
        .pixel-box {
          border: 4px solid #1e293b;
          box-shadow: 
            0 0 0 4px #0f172a,
            6px 6px 0px 4px #000;
        }
        .pixel-btn {
          box-shadow: 
            0 4px 0 #000,
            0 0 0 3px #000;
        }
        .pixel-btn:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 6px 0 #000,
            0 0 0 3px #000;
        }
        .pixel-btn:active {
          transform: translateY(3px);
          box-shadow: 
            0 1px 0 #000,
            0 0 0 3px #000;
        }

        /* Scanline CRT effect */
        .scanlines {
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0),
            rgba(255,255,255,0) 50%,
            rgba(0, 0, 0, 0.25) 50%,
            rgba(0, 0, 0, 0.25)
          );
          background-size: 100% 4px;
        }

        /* Pixel grid background */
        .pixel-grid {
          background-image: 
            linear-gradient(to right, rgba(56, 189, 248, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.05) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        /* Floating sprite animation */
        @keyframes pixel-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-pixel-float {
          animation: pixel-float 2.4s ease-in-out infinite;
        }

        @keyframes blink-cursor {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink-cursor 0.9s infinite;
        }
      `}</style>

      {/* Retro Grid Background */}
      <div className="absolute inset-0 pixel-grid pointer-events-none"></div>

      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 scanlines pointer-events-none opacity-40"></div>

      {/* Ambient Pixel Lights */}
      <div className="absolute top-12 left-10 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-none pointer-events-none"></div>
      <div className="absolute bottom-12 right-10 w-40 h-40 bg-cyan-500/10 blur-2xl rounded-none pointer-events-none"></div>

      {/* Floating Pixel Stars */}
      <div className="absolute top-16 left-1/4 text-yellow-300 font-pixel text-xs animate-bounce">✦</div>
      <div className="absolute bottom-24 left-16 text-cyan-300 font-pixel text-sm animate-pulse">◆</div>
      <div className="absolute top-24 right-20 text-pink-400 font-pixel text-xs animate-ping" style={{ animationDuration: '3s' }}>★</div>
      <div className="absolute bottom-20 right-1/4 text-emerald-400 font-pixel text-xs animate-bounce" style={{ animationDelay: '1s' }}>✦</div>

      {/* Main Arcade Frame */}
      <div className="relative z-10 w-full max-w-2xl bg-[#141824] border-4 border-[#334155] p-6 sm:p-10 shadow-[8px_8px_0px_#000000] transition-all">

        {/* Top HUD / Status Bar */}
        <div className="flex flex-wrap items-center justify-between border-b-4 border-[#242d42] pb-4 mb-8 font-pixel text-[10px] sm:text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400">PLAYER 1: READY</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Coins Button */}
            <button
              onClick={handleCoinCollect}
              title="Klik untuk ambil coin!"
              className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer bg-[#1e2538] px-2.5 py-1 border-2 border-black active:scale-95"
            >
              <span>🪙</span>
              <span>{coins}</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundActive(!soundActive)}
              className="text-slate-300 hover:text-white bg-[#1e2538] px-2.5 py-1 border-2 border-black cursor-pointer"
            >
              {soundActive ? '🔊 ON' : '🔇 OFF'}
            </button>
          </div>
        </div>

        {/* Pixel Character Sprite Area */}
        <div className="flex flex-col items-center justify-center my-4">
          <div className="animate-pixel-float relative cursor-pointer group" onClick={handleCoinCollect}>
            {/* Pixel Character Box */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#1e2638] border-4 border-black p-2 flex items-center justify-center shadow-[4px_4px_0px_#000] relative">
              {/* Pixel Art Guy SVG */}
              <svg
                viewBox="0 0 16 16"
                className="w-full h-full [image-rendering:pixelated]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Hair */}
                <rect x="5" y="1" width="6" height="2" fill="#38bdf8" />
                <rect x="4" y="3" width="8" height="2" fill="#38bdf8" />
                <rect x="3" y="4" width="2" height="3" fill="#38bdf8" />
                {/* Face */}
                <rect x="5" y="4" width="6" height="5" fill="#fde047" />
                {/* Glasses / Eyes */}
                <rect x="5" y="5" width="2" height="2" fill="#0f172a" />
                <rect x="8" y="5" width="2" height="2" fill="#0f172a" />
                <rect x="7" y="5" width="1" height="1" fill="#38bdf8" />
                {/* Smile */}
                <rect x="6" y="8" width="4" height="1" fill="#991b1b" />
                {/* Shirt / Body */}
                <rect x="4" y="9" width="8" height="5" fill="#10b981" />
                <rect x="6" y="9" width="4" height="4" fill="#059669" />
                <rect x="7" y="10" width="2" height="2" fill="#ffffff" />
                {/* Hands */}
                <rect x="2" y="10" width="2" height="3" fill="#fde047" />
                <rect x="12" y="10" width="2" height="3" fill="#fde047" />
                {/* Pants */}
                <rect x="5" y="14" width="3" height="2" fill="#1e293b" />
                <rect x="8" y="14" width="3" height="2" fill="#1e293b" />
              </svg>

              {/* LVL Badge on Avatar */}
              <div className="absolute -bottom-2 -right-2 bg-pink-600 text-white font-pixel text-[8px] px-1.5 py-0.5 border border-black shadow-[2px_2px_0px_#000]">
                LV.99
              </div>
            </div>

            <div className="text-center mt-2 font-pixel text-[8px] text-emerald-400 group-hover:text-yellow-300">
              [ KLIK AVATAR ]
            </div>
          </div>
        </div>

        {/* Hero Title */}
        <div className="text-center space-y-3 mt-4">
          <div className="inline-block bg-[#242d42] border-2 border-black text-cyan-300 font-pixel text-[9px] sm:text-[11px] px-3 py-1.5 shadow-[2px_2px_0px_#000]">
            ⚡ GIAN&apos;S RETRO REALM ⚡
          </div>

          <h1 className="text-3xl sm:text-5xl font-pixel tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-yellow-300 drop-shadow-[4px_4px_0px_#000]">
            GIAN KAUSARI
          </h1>

          {/* RPG Dialogue Box */}
          <div className="bg-[#0b0e17] border-4 border-slate-700 p-4 sm:p-5 mt-4 text-left shadow-[4px_4px_0px_#000] relative">
            <div className="absolute -top-3 left-4 bg-yellow-400 text-black font-pixel text-[9px] px-2 py-0.5 border border-black font-bold">
              DIALOG
            </div>
            <p className="font-retro text-2xl sm:text-3xl text-emerald-300 leading-tight tracking-wide">
              &gt; Halo!
              <span className="inline-block w-2.5 h-5 bg-emerald-400 ml-1 animate-blink align-middle"></span>
            </p>
          </div>
        </div>

        {/* RPG Stat Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6 font-pixel text-[9px] sm:text-[10px]">
          <div className="bg-[#182032] p-2.5 border-2 border-black">
            <div className="flex justify-between text-rose-400 mb-1">
              <span>HP (CODING)</span>
              <span>100/100</span>
            </div>
            <div className="w-full bg-[#0a0d14] h-3 border border-black p-0.5">
              <div className="bg-rose-500 h-full w-full"></div>
            </div>
          </div>

          <div className="bg-[#182032] p-2.5 border-2 border-black">
            <div className="flex justify-between text-cyan-400 mb-1">
              <span>MP (CREATIVITY)</span>
              <span>MAX</span>
            </div>
            <div className="w-full bg-[#0a0d14] h-3 border border-black p-0.5">
              <div className="bg-cyan-400 h-full w-[94%]"></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2 font-pixel text-xs">
          <button
            onClick={handleCoinCollect}
            className="pixel-btn px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold border-2 border-black cursor-pointer flex items-center justify-center gap-2"
          >
            <span>⚔️</span>
            <span>MULAI QUEST</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="pixel-btn px-6 py-4 bg-[#263147] hover:bg-[#32405d] text-cyan-300 hover:text-white font-bold border-2 border-black cursor-pointer flex items-center justify-center gap-2"
          >
            <span>📜</span>
            <span>{copied ? 'BERHASIL DISALIN!' : 'PORTFOLIO GIAN'}</span>
          </button>
        </div>

        {/* Footer Credit */}
        <div className="mt-8 pt-4 border-t-2 border-[#242d42] text-center font-pixel text-[8px] sm:text-[9px] text-slate-500">
          PRESS START • 2026 GIAN KAUSARI • ALL RIGHTS RESERVED
        </div>

      </div>
    </main>
  );
}
