const fs = require('fs');
const filePath = 'd:\\INKLUSISWA\\web\\src\\app\\dashboard\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Change the wrapper background from orange to yellow
const oldWrapper = 'className="flex-1 bg-[#C3631D] rounded-[32px] p-8 mt-24 mr-6 ml-6 mb-10 shadow-xl flex flex-col relative overflow-hidden animate-in fade-in duration-300"';
const newWrapper = 'className="flex-1 bg-[#FFBA48] rounded-[32px] p-8 mt-24 mr-6 ml-6 mb-10 shadow-xl flex flex-col relative overflow-hidden animate-in fade-in duration-300"';
content = content.replace(oldWrapper, newWrapper);

// 2. Change the text color in the main area from white to dark green for contrast
const oldMain = '<main className="flex-1 w-full overflow-y-auto custom-scrollbar pr-4 text-white">';
const newMain = '<main className="flex-1 w-full overflow-y-auto custom-scrollbar pr-4 text-[#3C632A]">';
content = content.replace(oldMain, newMain);

// 3. Since the inner cards (Pesan dari Guru, Obrolan) use #5D3A1A/40 and white text, 
// they might actually still look okay on a yellow background, maybe even better!
// Let's keep them as they are for now. They provide good contrast.

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update Kelas Impianku color complete.');
