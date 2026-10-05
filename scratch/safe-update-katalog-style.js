const fs = require('fs');
const filePath = 'd:\\INKLUSISWA\\web\\src\\app\\dashboard\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const katalogStartStr = '{/* VIEW 1: KATALOG MAPEL */}';
const katalogEndStr = '{/* VIEW 2: BELAJAR DI KELAS */}';

const katalogStartIndex = content.indexOf(katalogStartStr);
const katalogEndIndex = content.indexOf(katalogEndStr);

if (katalogStartIndex !== -1 && katalogEndIndex !== -1 && katalogStartIndex < katalogEndIndex) {
  let katalogContent = content.substring(katalogStartIndex, katalogEndIndex);

  // 1. Header Banner
  katalogContent = katalogContent.replace(
    /className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-white p-6 md:p-8 rounded-xl border border-slate-200\/80 shadow-sm relative overflow-hidden"/g,
    'className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-[#FFBA48] border-4 border-[#3C632A] rounded-[32px] p-8 shadow-[8px_8px_0px_0px_#3C632A] relative overflow-hidden"'
  );
  
  // Header title text
  katalogContent = katalogContent.replace(
    /className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight"/g,
    'className="text-3xl md:text-5xl font-black text-[#3C632A] tracking-tight"'
  );
  katalogContent = katalogContent.replace(
    /className="text-slate-700 text-sm md:text-base mt-2 font-medium"/g,
    'className="text-[#3C632A] text-lg mt-2 font-bold"'
  );
  
  // Search input
  katalogContent = katalogContent.replace(
    /className="w-full pl-11 pr-4 py-3\.5 bg-\[#F8F9FA\] border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-\[#0066CC\]\/20 focus:border-\[#0066CC\] transition-all text-slate-900"/g,
    'className="w-full pl-12 pr-4 py-4 bg-white border-4 border-[#3C632A] rounded-2xl text-lg font-bold focus:outline-none focus:ring-4 focus:ring-[#73B14C] transition-all text-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A]"'
  );
  katalogContent = katalogContent.replace(/text-slate-600/g, 'text-[#3C632A]'); // Search icon

  // 2. Filter Pills
  // Active pill
  katalogContent = katalogContent.replace(
    /"bg-slate-900 text-white shadow-md"/g,
    '"bg-[#3C632A] text-[#FFFFDB] border-4 border-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A] translate-y-1"'
  );
  // Inactive pill
  katalogContent = katalogContent.replace(
    /"bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"/g,
    '"bg-white text-[#3C632A] border-4 border-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A] hover:bg-[#FFE296] hover:-translate-y-1"'
  );
  katalogContent = katalogContent.replace(
    /className=\{\`px-5 py-2\.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap/g,
    'className={`px-6 py-3 rounded-2xl text-lg font-black transition-all whitespace-nowrap'
  );

  // 3. Subject Cards
  katalogContent = katalogContent.replace(
    /className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full relative"/g,
    'className="group bg-white rounded-[32px] border-4 border-[#3C632A] shadow-[8px_8px_0px_0px_#3C632A] hover:shadow-[12px_12px_0px_0px_#3C632A] hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full relative"'
  );
  
  // Card Image bg
  katalogContent = katalogContent.replace(
    /className="w-full aspect-\[4\/3\] bg-slate-50 relative p-6"/g,
    'className="w-full aspect-[4/3] bg-[#E9F3E5] relative p-6 border-b-4 border-[#3C632A]"'
  );

  // Card Content
  katalogContent = katalogContent.replace(
    /className="p-5 md:p-6 flex flex-col flex-1"/g,
    'className="p-6 md:p-8 flex flex-col flex-1 bg-white"'
  );
  
  // Badge
  katalogContent = katalogContent.replace(
    /className="inline-flex items-center px-2\.5 py-1 rounded-md bg-slate-100 text-slate-600 text-\[10px\] font-bold uppercase tracking-wider mb-3 w-fit"/g,
    'className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#FFE296] text-[#3C632A] border-2 border-[#3C632A] text-xs font-black uppercase tracking-wider mb-4 w-fit shadow-[2px_2px_0px_0px_#3C632A]"'
  );

  // Title
  katalogContent = katalogContent.replace(
    /className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-\[#0066CC\] transition-colors line-clamp-1"/g,
    'className="text-2xl font-black text-[#3C632A] group-hover:text-[#FF5685] transition-colors line-clamp-1 mb-2"'
  );

  // Description
  katalogContent = katalogContent.replace(
    /className="text-xs md:text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed flex-1"/g,
    'className="text-sm font-bold text-[#3C632A]/70 mt-2 line-clamp-2 leading-relaxed flex-1"'
  );

  // Mulai Belajar Link
  katalogContent = katalogContent.replace(
    /className="flex items-center space-x-2 text-\[#0066CC\] font-semibold text-sm mt-6 group\/btn"/g,
    'className="flex items-center justify-between space-x-2 bg-[#73B14C] text-white font-black text-sm mt-6 group/btn border-4 border-[#3C632A] rounded-2xl px-4 py-3 shadow-[4px_4px_0px_0px_#3C632A] group-hover:bg-[#FFBA48]"'
  );
  // Arrow icon in link
  katalogContent = katalogContent.replace(
    /className="w-4 h-4 transform group-hover\/btn:translate-x-1 transition-transform"/g,
    'className="w-6 h-6 transform group-hover/btn:translate-x-2 transition-transform text-white"'
  );
  
  // Reconstruct file
  content = content.substring(0, katalogStartIndex) + katalogContent + content.substring(katalogEndIndex);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Successfully updated Petualangan Belajar styling safely.");
} else {
  console.log("Markers not found or invalid.");
}
