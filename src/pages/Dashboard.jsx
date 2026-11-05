import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, BookOpen, Clock, ArrowRight } from 'lucide-react';

export const Dashboard = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-4 transition-colors duration-300">

      {/* Header Greeting */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2">
          Welcome back! <span className="text-[#16883D] dark:text-[#22C55E] text-3xl">🌿</span>
        </h2>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Take care of your plants with the power of AI.
        </p>
      </div>

      {/* Main Features Section */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-[#063D24] dark:text-[#22C55E]">Main Features</h3>

        {/* 2x2 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Card 1: Plant Identification */}
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 border border-slate-100 dark:border-[#2A2E36] shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-56 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E]">
                <Search className="w-5 h-5 stroke-[2.5]" />
              </div>

              {/* Plant Vector Graphic */}
              <div className="w-16 h-20 text-[#16883D] dark:text-[#22C55E] flex items-center justify-center">
                <svg className="w-12 h-16" viewBox="0 0 48 64" fill="currentColor">
                  <path d="M24 35 C 15 25, 5 12, 18 2 C 26 10, 24 22, 24 35 Z" fill="#22C55E" />
                  <path d="M24 35 C 33 25, 43 12, 30 2 C 22 10, 24 22, 24 35 Z" fill="#16883D" />
                  <path d="M24 45 L24 15" stroke="#16883D" strokeWidth="2.5" />
                  <ellipse cx="24" cy="46" rx="10" ry="3" fill="#EAF6E8" />
                  <path d="M16 45 L32 45 L29 58 L19 58 Z" fill="#BBF7D0" stroke="#16883D" strokeWidth="1" />
                </svg>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Plant Identification</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Upload a leaf, flower, fruit or whole plant image to identify the plant.
              </p>
            </div>

            <div>
              <Link
                to="/category"
                state={{ feature: 'identification' }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#16883D] dark:bg-[#16883D] hover:bg-[#127132] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Health Analysis */}
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 border border-slate-100 dark:border-[#2A2E36] shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-56 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E]">
                <Shield className="w-5 h-5 stroke-[2.5]" />
              </div>

              {/* Plant Vector Graphic */}
              <div className="w-16 h-20 text-[#16883D] dark:text-[#22C55E] flex items-center justify-center">
                <svg className="w-12 h-16" viewBox="0 0 48 64" fill="currentColor">
                  <path d="M24 35 C 15 25, 5 12, 18 2 C 26 10, 24 22, 24 35 Z" fill="#22C55E" />
                  <path d="M24 35 C 33 25, 43 12, 30 2 C 22 10, 24 22, 24 35 Z" fill="#16883D" />
                  <path d="M24 45 L24 15" stroke="#16883D" strokeWidth="2.5" />
                  <ellipse cx="24" cy="46" rx="10" ry="3" fill="#EAF6E8" />
                  <path d="M16 45 L32 45 L29 58 L19 58 Z" fill="#BBF7D0" stroke="#16883D" strokeWidth="1" />
                </svg>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Health Analysis</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Detect plant diseases, nutrient deficiencies, or pests by uploading an image.
              </p>
            </div>

            <div>
              <Link
                to="/category"
                state={{ feature: 'health-analysis' }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#16883D] dark:bg-[#16883D] hover:bg-[#127132] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Plant Encyclopedia */}
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 border border-slate-100 dark:border-[#2A2E36] shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-56 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E]">
                <BookOpen className="w-5 h-5 stroke-[2.5]" />
              </div>

              {/* Plant Vector Graphic */}
              <div className="w-16 h-20 text-[#16883D] dark:text-[#22C55E] flex items-center justify-center">
                <svg className="w-12 h-16" viewBox="0 0 48 64" fill="currentColor">
                  <path d="M24 35 C 15 25, 5 12, 18 2 C 26 10, 24 22, 24 35 Z" fill="#22C55E" />
                  <path d="M24 35 C 33 25, 43 12, 30 2 C 22 10, 24 22, 24 35 Z" fill="#16883D" />
                  <path d="M24 45 L24 15" stroke="#16883D" strokeWidth="2.5" />
                  <ellipse cx="24" cy="46" rx="10" ry="3" fill="#EAF6E8" />
                  <path d="M16 45 L32 45 L29 58 L19 58 Z" fill="#BBF7D0" stroke="#16883D" strokeWidth="1" />
                </svg>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Plant Encyclopedia</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Explore comprehensive information on plant care, diseases, pests and treatments.
              </p>
            </div>

            <div>
              <Link
                to="/encyclopedia"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#16883D] dark:bg-[#16883D] hover:bg-[#127132] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 4: Analysis History */}
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 border border-slate-100 dark:border-[#2A2E36] shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-56 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E]">
                <Clock className="w-5 h-5 stroke-[2.5]" />
              </div>

              {/* Plant Vector Graphic */}
              <div className="w-16 h-20 text-[#16883D] dark:text-[#22C55E] flex items-center justify-center">
                <svg className="w-12 h-16" viewBox="0 0 48 64" fill="currentColor">
                  <path d="M24 35 C 15 25, 5 12, 18 2 C 26 10, 24 22, 24 35 Z" fill="#22C55E" />
                  <path d="M24 35 C 33 25, 43 12, 30 2 C 22 10, 24 22, 24 35 Z" fill="#16883D" />
                  <path d="M24 45 L24 15" stroke="#16883D" strokeWidth="2.5" />
                  <ellipse cx="24" cy="46" rx="10" ry="3" fill="#EAF6E8" />
                  <path d="M16 45 L32 45 L29 58 L19 58 Z" fill="#BBF7D0" stroke="#16883D" strokeWidth="1" />
                </svg>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Analysis History</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                View your previous plant identifications and health diagnostic records.
              </p>
            </div>

            <div>
              <Link
                to="/history"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#16883D] dark:bg-[#16883D] hover:bg-[#127132] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
