const fs = require('fs');
const filePath = 'd:\\INKLUSISWA\\web\\src\\app\\dashboard\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the white wrapper
const oldWrapper = '<div className="w-full flex flex-col animate-in fade-in duration-300 min-h-[calc(100vh-70px)] bg-[#F8F9FA]">';
const newWrapper = '<div className="flex-1 bg-[#C3631D] rounded-[32px] p-8 mt-24 mr-6 mb-10 shadow-xl flex flex-col relative overflow-hidden animate-in fade-in duration-300">';
content = content.replace(oldWrapper, newWrapper);

// The sub-navbar has bg-white, let's change it to fit the orange box
const oldNav = '<div className="w-full bg-white border-b border-slate-200 sticky top-[73px] z-40 overflow-x-auto whitespace-nowrap scrollbar-hide shadow-[0_4px_12px_rgba(0,0,0,0.02)]">';
const newNav = '<div className="w-full bg-[#C3631D] border-b-4 border-[#FFDF59]/30 sticky top-0 z-40 overflow-x-auto whitespace-nowrap scrollbar-hide mb-6 rounded-t-2xl">';
content = content.replace(oldNav, newNav);

// Update nav buttons
content = content.replace(/border-\[#0066CC\] text-\[#0066CC\]/g, 'border-[#FFDF59] text-[#FFDF59] text-xl font-black');
content = content.replace(/border-transparent text-slate-500 hover:text-\[#0066CC\]/g, 'border-transparent text-white/70 hover:text-[#FFDF59] text-xl font-bold');

// Fix the "RIGHT CANVAS CONTENT" main tag
const oldMain = '<main className="flex-1 p-6 lg:p-10 w-full max-w-6xl mx-auto overflow-y-auto">';
const newMain = '<main className="flex-1 w-full overflow-y-auto custom-scrollbar pr-4 text-white">';
content = content.replace(oldMain, newMain);

// Fix the Room Aktif bar
const oldRoomBar = '<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">';
const newRoomBar = '<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-[#5D3A1A] p-5 md:p-6 rounded-3xl border-4 border-[#5D3A1A]/50 shadow-lg">';
content = content.replace(oldRoomBar, newRoomBar);

// Fix text color for Room Aktif label
content = content.replace('<span className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-wider shrink-0 whitespace-nowrap">ROOM AKTIF:</span>', '<span className="text-xs md:text-sm font-black text-[#FFDF59] uppercase tracking-wider shrink-0 whitespace-nowrap">ROOM AKTIF:</span>');

// Fix the Room dropdown button
const oldRoomBtn = 'className="px-4 py-3 bg-white border border-slate-300 hover:border-[#0066CC] text-slate-800 hover:text-[#0066CC] font-black text-sm md:text-base rounded-xl uppercase tracking-wider shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap max-w-[240px] sm:max-w-[380px] md:max-w-[520px]"';
const newRoomBtn = 'className="px-6 py-3 bg-[#FFDF59] hover:bg-[#FFE296] text-[#5D3A1A] font-black text-sm md:text-base rounded-2xl uppercase tracking-wider shadow-[4px_4px_0px_0px_#5D3A1A] flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap max-w-[240px] sm:max-w-[380px] md:max-w-[520px]"';
content = content.replace(oldRoomBtn, newRoomBtn);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update Kelas Impianku layout complete.');
