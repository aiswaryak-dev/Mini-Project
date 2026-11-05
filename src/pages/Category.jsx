import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';
import { usePlants } from '../context/PlantContext';

export const Category = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSelectedCategory } = usePlants();
  const [activeSelected, setActiveSelected] = useState(null);
  const [exploreModal, setExploreModal] = useState(null); // 'Garden Plants' | 'Kitchen Garden' | null

  const targetFeature = location.state?.feature;

  const handleSelect = (catName) => {
    setActiveSelected(catName);
    setSelectedCategory(catName);
    setExploreModal(null);
    setTimeout(() => {
      if (targetFeature === 'health-analysis') {
        navigate('/health-analysis');
      } else {
        navigate('/identification');
      }
    }, 300);
  };


  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6 px-4">

      {/* Header Greeting */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
          Select Plant Category <span className="text-[#16883D] text-3xl">🌿</span>
        </h2>
        <p className="text-xs font-semibold text-slate-500">
          Choose the type of plants you want to work with.
        </p>
      </div>

      {/* 2 Main Category Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">

        {/* Card 1: Garden Plants */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-center flex flex-col items-center justify-between space-y-6">

          {/* Circular Green Icon Container */}
          <div className="w-28 h-28 rounded-full bg-[#EAF6E8] flex items-center justify-center">
            <svg className="w-16 h-16 text-[#16883D]" viewBox="0 0 64 64" fill="currentColor">
              <path d="M32 38 C 20 28, 10 13, 25 3 C 35 13, 33 26, 32 38 Z" fill="#22C55E" />
              <path d="M32 38 C 44 28, 54 13, 39 3 C 29 13, 31 26, 32 38 Z" fill="#16883D" />
              <path d="M32 46 L32 18" stroke="#16883D" strokeWidth="3" />
              <ellipse cx="32" cy="46" rx="12" ry="3.5" fill="#EAF6E8" />
              <path d="M22 46 L42 46 L38 60 L26 60 Z" fill="#BBF7D0" stroke="#16883D" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 text-lg">Garden Plants</h3>

            {/* Small Explore Option */}
            <button
              onClick={() => setExploreModal('Garden Plants')}
              className="group text-xs text-[#16883D] hover:text-[#127132] font-semibold flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
            >
              <span>Explore</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>

            <p className="text-xs text-slate-500 max-w-xs pt-1 leading-relaxed">
              Explore and analyze a variety of beautiful garden plants.
            </p>
          </div>

          <button
            onClick={() => handleSelect('Garden Plants')}
            className={`w-full max-w-[140px] py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${activeSelected === 'Garden Plants'
              ? 'bg-slate-900 text-white'
              : 'bg-[#16883D] hover:bg-[#127132] text-white'
              }`}
          >
            <span>{activeSelected === 'Garden Plants' ? 'Selected' : 'Select'}</span>
            {activeSelected === 'Garden Plants' ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>

        </div>

        {/* Card 2: Kitchen Garden */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-center flex flex-col items-center justify-between space-y-6">

          {/* Circular Green Icon Container */}
          <div className="w-28 h-28 rounded-full bg-[#EAF6E8] flex items-center justify-center">
            <svg className="w-16 h-16" viewBox="0 0 64 64" fill="currentColor">
              {/* Tomato / Vegetables Graphic */}
              <circle cx="25" cy="36" r="11" fill="#EF4444" />
              <path d="M25 25 C 22 21, 28 20, 25 17" stroke="#16883D" strokeWidth="2" />
              <circle cx="39" cy="33" r="10" fill="#9333EA" />
              <circle cx="21" cy="27" r="3" fill="#22C55E" />
              <circle cx="39" cy="23" r="2.5" fill="#16883D" />
            </svg>
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 text-lg">Kitchen Garden</h3>

            {/* Small Explore Option */}
            <button
              onClick={() => setExploreModal('Kitchen Garden')}
              className="group text-xs text-[#16883D] hover:text-[#127132] font-semibold flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
            >
              <span>Explore</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>

            <p className="text-xs text-slate-500 max-w-xs pt-1 leading-relaxed">
              Explore and analyze a variety of kitchen garden plants.
            </p>
          </div>

          <button
            onClick={() => handleSelect('Kitchen Garden')}
            className={`w-full max-w-[140px] py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${activeSelected === 'Kitchen Garden'
              ? 'bg-slate-900 text-white'
              : 'bg-[#16883D] hover:bg-[#127132] text-white'
              }`}
          >
            <span>{activeSelected === 'Kitchen Garden' ? 'Selected' : 'Select'}</span>
            {activeSelected === 'Kitchen Garden' ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>

        </div>

      </div>

      {/* Explore Category Details Modal */}
      {exploreModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setExploreModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200 text-center space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setExploreModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header & Icon */}
            {exploreModal === 'Garden Plants' ? (
              <>
                <div className="w-20 h-20 rounded-full bg-[#EAF6E8] flex items-center justify-center mx-auto">
                  <svg className="w-12 h-12 text-[#16883D]" viewBox="0 0 64 64" fill="currentColor">
                    <path d="M32 38 C 20 28, 10 13, 25 3 C 35 13, 33 26, 32 38 Z" fill="#22C55E" />
                    <path d="M32 38 C 44 28, 54 13, 39 3 C 29 13, 31 26, 32 38 Z" fill="#16883D" />
                    <path d="M32 46 L32 18" stroke="#16883D" strokeWidth="3" />
                    <ellipse cx="32" cy="46" rx="12" ry="3.5" fill="#EAF6E8" />
                    <path d="M22 46 L42 46 L38 60 L26 60 Z" fill="#BBF7D0" stroke="#16883D" strokeWidth="1.5" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-900">Garden Plants</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                    Garden plants are flowering and ornamental plants commonly grown to beautify outdoor spaces such as gardens, balconies, and yards. They require suitable sunlight, watering, soil, and regular care to grow healthy.
                  </p>
                </div>

                {/* Examples Section */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Examples
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {['Rose', 'Hibiscus', 'Jasmine', 'Marigold', 'Sunflower'].map((name) => (
                      <span
                        key={name}
                        className="px-3 py-1 rounded-full bg-[#EAF6E8] text-[#16883D] text-xs font-semibold border border-green-100"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleSelect('Garden Plants')}
                    className="w-full py-3 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>Select Garden Plants</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-[#EAF6E8] flex items-center justify-center mx-auto">
                  <svg className="w-12 h-12" viewBox="0 0 64 64" fill="currentColor">
                    <circle cx="25" cy="36" r="11" fill="#EF4444" />
                    <path d="M25 25 C 22 21, 28 20, 25 17" stroke="#16883D" strokeWidth="2" />
                    <circle cx="39" cy="33" r="10" fill="#9333EA" />
                    <circle cx="21" cy="27" r="3" fill="#22C55E" />
                    <circle cx="39" cy="23" r="2.5" fill="#16883D" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-900">Kitchen Garden</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                    Kitchen garden plants are vegetables and herbs grown mainly for household use. They provide fresh produce and require appropriate sunlight, watering, soil, nutrients, and regular monitoring.
                  </p>
                </div>

                {/* Examples Section */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Examples
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {['Tomato', 'Chilli', 'Brinjal', 'Spinach', 'Mint', 'Coriander'].map((name) => (
                      <span
                        key={name}
                        className="px-3 py-1 rounded-full bg-[#EAF6E8] text-[#16883D] text-xs font-semibold border border-green-100"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleSelect('Kitchen Garden')}
                    className="w-full py-3 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>Select Kitchen Garden</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
