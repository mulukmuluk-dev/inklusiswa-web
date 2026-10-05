const fs = require('fs');
const filePath = 'd:\\INKLUSISWA\\web\\src\\app\\dashboard\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add back button before the aside
const sidebarMarker = '{/* ==================== 1. SIDEBAR ==================== */}';
const backButtonStr = `
      {/* Tombol Kembali ke Beranda */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 text-[#FFBA48] hover:scale-110 transition-transform flex items-center justify-center p-2 z-[60]"
        title="Kembali ke Halaman Utama"
      >
        <svg className="w-10 h-10 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      </button>

      `;

if (content.includes(sidebarMarker) && !content.includes('Tombol Kembali ke Beranda')) {
    content = content.replace(sidebarMarker, backButtonStr + sidebarMarker);
}

// 2. Modify aside class
// current: className="w-[300px] my-6 ml-6 bg-[#FFBA48] rounded-[40px] flex flex-col p-6 z-50 overflow-y-auto shadow-[12px_12px_0px_0px_#3C632A] shrink-0 border-4 border-[#3C632A]"
const asideClassRegex = /<aside className="w-\[300px\] my-6 ml-6 bg-\[#FFBA48\](.*?)">/;
const newAsideClass = '<aside className="w-[300px] mt-24 mb-10 ml-8 bg-[#FFBA48]$1 self-start">'; // added self-start and mt-24

if (content.match(asideClassRegex)) {
    content = content.replace(asideClassRegex, newAsideClass);
}

// 3. Remove flex-1 from nav so it doesn't stretch if aside is no longer stretched, actually self-start fixes the outer box, but removing flex-1 from nav helps pack it.
const navRegex = /<nav className="flex-1 flex flex-col gap-3">/;
if (content.match(navRegex)) {
    content = content.replace(navRegex, '<nav className="flex flex-col gap-3">');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Sidebar position updated.');
