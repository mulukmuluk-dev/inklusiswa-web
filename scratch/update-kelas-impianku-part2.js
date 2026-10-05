const fs = require('fs');
const filePath = 'd:\\INKLUSISWA\\web\\src\\app\\dashboard\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace the SUB-MENUS KELAS IMPIANKU block
const oldSubMenuRegex = /\{\/\* SUB-MENUS KELAS IMPIANKU \*\/\}[\s\S]*?(?=\<\/nav\>)/;
const newSubMenu = `{/* SUB-MENUS KELAS IMPIANKU */}
           {activeTab === "kelas" && (
             <div className="ml-8 mt-1 flex flex-col gap-2 relative">
               <div className="absolute left-[-16px] top-0 bottom-6 w-1 bg-[#3C632A]/20 rounded-full"></div>
               
               <button 
                 onClick={() => setActiveSidebarTab("kelas")} 
                 className={\`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-lg transition-all \${activeSidebarTab === "kelas" ? "bg-[#3C632A]/10 text-[#3C632A] translate-x-2" : "bg-transparent text-[#3C632A]/70 hover:text-[#3C632A]"}\`}
               >
                 <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2"/></svg>
                 Kelas
               </button>

               <button 
                 onClick={() => setActiveSidebarTab("materi")} 
                 className={\`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-lg transition-all \${activeSidebarTab === "materi" ? "bg-[#3C632A]/10 text-[#3C632A] translate-x-2" : "bg-transparent text-[#3C632A]/70 hover:text-[#3C632A]"}\`}
               >
                 <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                 Buku Pintar
               </button>
               
               <button 
                 onClick={() => setActiveSidebarTab("latihan")} 
                 className={\`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-lg transition-all \${activeSidebarTab === "latihan" ? "bg-[#3C632A]/10 text-[#3C632A] translate-x-2" : "bg-transparent text-[#3C632A]/70 hover:text-[#3C632A]"}\`}
               >
                 <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                 Tantangan
               </button>
               
               <button 
                 onClick={() => setActiveSidebarTab("ujian")} 
                 className={\`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-lg transition-all \${activeSidebarTab === "ujian" ? "bg-[#3C632A]/10 text-[#3C632A] translate-x-2" : "bg-transparent text-[#3C632A]/70 hover:text-[#3C632A]"}\`}
               >
                 <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                 Misi Akhir
               </button>
             </div>
           )}
        `;

content = content.replace(oldSubMenuRegex, newSubMenu);

// 2. Add ml-6 to the Kelas Impianku wrapper to give it margin left from sidebar
const oldKelasWrapper = 'className="flex-1 bg-[#C3631D] rounded-[32px] p-8 mt-24 mr-6 mb-10 shadow-xl flex flex-col relative overflow-hidden animate-in fade-in duration-300"';
const newKelasWrapper = 'className="flex-1 bg-[#C3631D] rounded-[32px] p-8 mt-24 mr-6 ml-6 mb-10 shadow-xl flex flex-col relative overflow-hidden animate-in fade-in duration-300"';
content = content.replace(oldKelasWrapper, newKelasWrapper);

// 3. Delete the horizontal sub-navbar in "Kelas Impianku"
const horizontalNavRegex = /<div className="w-full bg-\[#C3631D\] border-b-4 border-\[#FFDF59\]\/30 sticky top-0 z-40 overflow-x-auto whitespace-nowrap scrollbar-hide mb-6 rounded-t-2xl">[\s\S]*?<\/div>\s*<\/div>/;
content = content.replace(horizontalNavRegex, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update Kelas Impianku layout part 2 complete.');
