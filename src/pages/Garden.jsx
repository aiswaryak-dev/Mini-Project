import React, { useState } from 'react';
import { Search, Filter, Plus, Grid, List, Sprout, Droplets } from 'lucide-react';
import { usePlants } from '../context/PlantContext';
import { PlantCard } from '../components/PlantCard';
import { PlantModal } from '../components/PlantModal';

export const Garden = ({ onOpenAddPlant }) => {
  const { plants, waterAllPlants } = usePlants();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedPlant, setSelectedPlant] = useState(null);

  const categories = ['All', 'Indoor', 'Outdoor', 'Balcony', 'Greenhouse'];

  const filteredPlants = plants.filter(plant => {
    const matchesSearch = 
      plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plant.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plant.location && plant.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || plant.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Garden Collection</h2>
          <p className="text-xs text-slate-500">Manage and monitor all active plant sensor nodes</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={waterAllPlants}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md active:scale-95"
          >
            <Droplets className="w-4 h-4 fill-white" />
            <span>Water All Plants</span>
          </button>

          <button
            onClick={onOpenAddPlant}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plant</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plant name, species, zone..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-800' : 'text-slate-500'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-800' : 'text-slate-500'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Plant Grid or Empty State */}
      {filteredPlants.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
        }>
          {filteredPlants.map((plant) => (
            <PlantCard 
              key={plant.id} 
              plant={plant} 
              onSelectPlant={setSelectedPlant}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
            <Sprout className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">No plants found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No plants matched your search "{searchQuery}" in category "{selectedCategory}".
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Selected Plant Modal */}
      {selectedPlant && (
        <PlantModal 
          plant={selectedPlant} 
          onClose={() => setSelectedPlant(null)} 
        />
      )}

    </div>
  );
};
