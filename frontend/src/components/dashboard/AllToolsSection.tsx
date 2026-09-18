import React, { useState, useMemo } from 'react';
import { 
  Grid, 
  ArrowRight, 
  Layers, 
  FileText, 
  FileBox, 
  Check, 
  Sparkles,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Flame,
  X,
  Sliders,
  ScanLine,
  FileSpreadsheet
} from 'lucide-react';
import { ToolItem, ToolCategory } from '../../types';
import { CATEGORIES_LIST } from '../../data/toolsData';
import { IconHelper } from '../common/IconHelper';

interface AllToolsSectionProps {
  allTools: ToolItem[];
  onSelectTool: (tool: ToolItem) => void;
}

export const AllToolsSection: React.FC<AllToolsSectionProps> = ({
  allTools,
  onSelectTool
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = useMemo(() => {
    return allTools.filter(tool => {
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      const matchesQuery = searchQuery === '' || 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.fromFormat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.toFormat.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [allTools, selectedCategory, searchQuery]);

  // 3 spotlight category cards data
  const imageConverterItems = [
    { name: 'JPG to PNG', id: 'jpg-to-png', ext: 'PNG' },
    { name: 'PNG to JPG', id: 'png-to-jpg', ext: 'JPG' },
    { name: 'WEBP to JPG', id: 'webp-to-jpg', ext: 'JPG' },
    { name: 'HEIC to JPG', id: 'heic-to-jpg', ext: 'JPG' },
    { name: 'BMP to PNG', id: 'bmp-to-png', ext: 'PNG' },
    { name: 'Image to PDF', id: 'image-to-pdf', ext: 'PDF' }
  ];

  const docConverterItems = [
    { name: 'PDF to DOCX', id: 'pdf-to-word', ext: 'DOCX' },
    { name: 'PDF to PPTX', id: 'pdf-to-pptx', ext: 'PPTX' },
    { name: 'PDF to XLSX', id: 'pdf-to-xlsx', ext: 'XLSX' },
    { name: 'DOCX to PDF', id: 'docx-to-pdf', ext: 'PDF' },
    { name: 'PPTX to PDF', id: 'pptx-to-pdf', ext: 'PDF' },
    { name: 'TXT to PDF', id: 'txt-to-pdf', ext: 'PDF' }
  ];

  const pdfToolsItems = [
    { name: 'Merge PDF', id: 'merge-pdf', ext: 'MULTI' },
    { name: 'Split PDF', id: 'split-pdf', ext: 'PAGES' },
    { name: 'Compress PDF', id: 'compress-pdf', ext: 'REDUCE' },
    { name: 'Rotate PDF', id: 'rotate-pdf', ext: '360°' },
    { name: 'Add Watermark', id: 'add-watermark', ext: 'STAMP' },
    { name: 'Protect PDF', id: 'protect-pdf', ext: 'PASS' }
  ];

  const handleSpotlightClick = (toolId: string) => {
    const found = allTools.find(t => t.id === toolId);
    if (found) {
      onSelectTool(found);
    }
  };

  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return allTools.length;
    return allTools.filter(t => t.category === catId).length;
  };

  return (
    <section className="space-y-6">
      
      {/* Heading, Filter Search & Category Filter Pills */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  All File & Productivity Suite
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  {allTools.length} Tools Available
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                Instant conversions, deep PDF manipulations, neural OCR & document generators
              </p>
            </div>
          </div>

          {/* Search bar inside section */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by format or name..."
              className="w-full pl-10 pr-9 py-2 text-xs rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-medium text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES_LIST.map(cat => {
            const isSelected = selectedCategory === cat.id;
            const count = getCategoryCount(cat.id);

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id as ToolCategory);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  isSelected 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Large Category Spotlight Bento Cards (shown when "all" is active and not searching) */}
      {selectedCategory === 'all' && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1: IMAGE CONVERTER */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">IMAGE CONVERTERS</h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Lossless resolution formatting</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60">
                  Lossless
                </span>
              </div>

              <div className="space-y-1.5">
                {imageConverterItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSpotlightClick(item.id)}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-purple-50/70 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 group-hover:scale-150 transition-transform" />
                      {item.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded">{item.ext}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedCategory('image-converter')}
                className="w-full text-center text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center justify-center gap-1.5"
              >
                <span>View all Image tools</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: DOCUMENT CONVERTER */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">DOCUMENT CONVERTERS</h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">PDF, Word, Excel & Slides</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                  Exact Layout
                </span>
              </div>

              <div className="space-y-1.5">
                {docConverterItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSpotlightClick(item.id)}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:scale-150 transition-transform" />
                      {item.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded">{item.ext}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedCategory('document-converter')}
                className="w-full text-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1.5"
              >
                <span>View all Document tools</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: PDF TOOLS */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                    <FileBox className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">PDF UTILITIES</h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Merge, split, compress, watermark</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  Vector Engine
                </span>
              </div>

              <div className="space-y-1.5">
                {pdfToolsItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSpotlightClick(item.id)}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-hover:scale-150 transition-transform" />
                      {item.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded">{item.ext}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedCategory('pdf-tools')}
                className="w-full text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1.5"
              >
                <span>View all PDF tools</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Grid of Tools matching current selected category or active search query */}
      {(selectedCategory !== 'all' || searchQuery) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.length > 0 ? (
            filteredTools.map(tool => (
              <div
                key={tool.id}
                onClick={() => onSelectTool(tool)}
                className="group p-4.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-600 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-xs group-hover:scale-105">
                    <IconHelper name={tool.iconName} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate transition-colors">
                        {tool.name}
                      </h4>
                      {tool.isAi && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          AI
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {tool.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    {tool.toFormat}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-10 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No tools found matching "{searchQuery}"</p>
                <p className="text-xs text-slate-400 mt-1">Try searching for "PDF", "DOCX", "JPG", "OCR", "Compress", or "Presentation"</p>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 hover:bg-brand-700 transition-all"
              >
                Clear Search Filter
              </button>
            </div>
          )}
        </div>
      )}

    </section>
  );
};
