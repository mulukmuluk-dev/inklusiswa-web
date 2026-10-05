const fs = require('fs');
const filePath = 'd:\\INKLUSISWA\\web\\src\\app\\dashboard\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The "Pesan dari Guru" block
const oldCard1 = '<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">';
const newCard1 = '<div className="bg-[#5D3A1A]/40 p-6 rounded-3xl border-4 border-[#5D3A1A]/50 mb-6">';
content = content.replace(oldCard1, newCard1);

// Card title
content = content.replace('<h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">', '<h2 className="text-xl md:text-2xl font-black text-[#FFDF59] flex items-center gap-2">');

// Message author
content = content.replace('<h3 className="font-bold text-slate-900">Bu Sarah, S.Pd.</h3>', '<h3 className="font-black text-white text-lg">Bu Sarah, S.Pd.</h3>');
content = content.replace('<p className="text-slate-700 leading-relaxed text-sm md:text-base">', '<p className="text-white/90 leading-relaxed text-base md:text-lg font-bold">');
content = content.replace('<div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">', '<div className="bg-white/10 border-2 border-white/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">');
content = content.replace('<span className="text-xs text-slate-400 font-medium">Hari ini, 07:15</span>', '<span className="text-xs text-white/60 font-bold">Hari ini, 07:15</span>');

// "Obrolan Seru" block
const oldCard2 = '<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">';
const newCard2 = '<div className="bg-[#5D3A1A]/40 p-6 rounded-3xl border-4 border-[#5D3A1A]/50">';
content = content.replace(oldCard2, newCard2);
// The header was already changed by the previous h2 replacement because they might share the same class, let's just make sure.

// The "GURU" badge
content = content.replace('<span className="px-2 py-0.5 bg-[#0066CC] text-white text-[10px] font-bold rounded">GURU</span>', '<span className="px-3 py-1 bg-[#FFBA48] text-[#5D3A1A] text-xs font-black rounded-lg">GURU</span>');

// Obrolan bubble
content = content.replace('<div className="bg-[#F0FDF4] border border-[#DCFCE7] text-emerald-900 p-4 rounded-2xl rounded-tl-none max-w-3xl">', '<div className="bg-white/10 border-2 border-white/20 text-white p-5 rounded-2xl rounded-tl-none max-w-3xl font-bold">');
content = content.replace('<button className="text-xs font-bold text-[#0066CC] hover:underline flex items-center gap-1">', '<button className="text-sm font-black text-[#FFDF59] hover:underline flex items-center gap-2 mt-2">');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update inner cards in Kelas Impianku complete.');
