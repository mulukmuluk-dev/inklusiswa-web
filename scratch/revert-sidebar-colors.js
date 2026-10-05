const fs = require('fs');
const filePath = 'd:\\INKLUSISWA\\web\\src\\app\\dashboard\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '{/* ==================== 1. SIDEBAR ==================== */}';
const endMarker = '{/* ==================== 2. MAIN CONTENT ==================== */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newSidebar = `{/* ==================== 1. SIDEBAR ==================== */}
      <aside className="w-[300px] my-6 ml-6 bg-[#FFBA48] rounded-[40px] flex flex-col p-6 z-50 overflow-y-auto shadow-[12px_12px_0px_0px_#3C632A] shrink-0 border-4 border-[#3C632A]">
        
        {/* LOGO AREA */}
        <div className="flex flex-col items-center gap-2 mb-10 mt-4">
           <PintaraLogo size="md" />
           <span className="text-3xl font-black text-[#3C632A] drop-shadow-sm tracking-wider">PINTARA</span>
           <span className="text-xs font-bold text-[#3C632A]/80 text-center px-4">Web Pendidikan Inklusif untuk Siswa</span>
        </div>
        
        {/* NAVIGATION */}
        <nav className="flex-1 flex flex-col gap-3">
           
           {/* RUANG GURU (If Teacher) */}
           {userSession?.role === "guru" && (
              <button 
                onClick={() => setActiveTab("guru")} 
                className={\`flex items-center gap-4 px-5 py-4 rounded-[28px] font-black text-xl transition-all \${activeTab === "guru" ? "bg-[#3C632A] text-[#FFFFDB]" : "bg-transparent text-[#3C632A] hover:bg-[#3C632A]/10"}\`}
              >
                <div className="w-10 h-10 flex items-center justify-center bg-[#3C632A]/10 rounded-xl shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                Akses Guru
              </button>
           )}
           
           {/* PETUALANGAN BELAJAR */}
           <button 
             onClick={() => setActiveTab("katalog")} 
             className={\`flex items-center gap-4 px-5 py-4 rounded-[28px] font-black text-xl transition-all \${activeTab === "katalog" ? "bg-[#3C632A] text-[#FFFFDB]" : "bg-transparent text-[#3C632A] hover:bg-[#3C632A]/10"}\`}
           >
             <div className={\`w-12 h-12 flex items-center justify-center rounded-[18px] shrink-0 \${activeTab === "katalog" ? "bg-[#7FD13B] shadow-inner" : "bg-white/40"}\`}>
               <svg className={\`w-7 h-7 \${activeTab === "katalog" ? "text-white" : "text-[#3C632A]"}\`} fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
             </div>
             Petualangan Belajar
           </button>
           
           {/* KELAS IMPIANKU */}
           <button 
             onClick={() => setActiveTab("kelas")} 
             className={\`flex items-center gap-4 px-5 py-4 rounded-[28px] font-black text-xl transition-all \${activeTab === "kelas" ? "bg-[#3C632A] text-[#FFFFDB]" : "bg-transparent text-[#3C632A] hover:bg-[#3C632A]/10"}\`}
           >
             <div className={\`w-12 h-12 flex items-center justify-center rounded-[18px] shrink-0 \${activeTab === "kelas" ? "bg-[#5D9CFF] shadow-inner" : "bg-white/40"}\`}>
               <svg className={\`w-7 h-7 \${activeTab === "kelas" ? "text-white" : "text-[#3C632A]"}\`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
             </div>
             Kelas Impianku
           </button>

           {/* SUB-MENUS KELAS IMPIANKU */}
           {activeTab === "kelas" && (
             <div className="ml-8 mt-1 flex flex-col gap-2 relative">
               <div className="absolute left-[-16px] top-0 bottom-6 w-1 bg-[#3C632A]/20 rounded-full"></div>
               
               <button 
                 onClick={() => setActiveSidebarTab("materi")} 
                 className={\`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-lg transition-all \${activeSidebarTab === "materi" ? "bg-[#3C632A]/10 text-[#3C632A] translate-x-2" : "bg-transparent text-[#3C632A]/70 hover:text-[#3C632A]"}\`}
               >
                 <span className="text-xl">✨</span> Kartu Ajaib
               </button>
               
               <button 
                 onClick={() => setActiveSidebarTab("latihan")} 
                 className={\`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-lg transition-all \${activeSidebarTab === "latihan" ? "bg-[#3C632A]/10 text-[#3C632A] translate-x-2" : "bg-transparent text-[#3C632A]/70 hover:text-[#3C632A]"}\`}
               >
                 <span className="text-xl">🏆</span> Tantangan Harian
               </button>
               
               <button 
                 onClick={() => setActiveSidebarTab("ujian")} 
                 className={\`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-lg transition-all \${activeSidebarTab === "ujian" ? "bg-[#3C632A]/10 text-[#3C632A] translate-x-2" : "bg-transparent text-[#3C632A]/70 hover:text-[#3C632A]"}\`}
               >
                 <span className="text-xl">🚀</span> Misi Utama
               </button>
             </div>
           )}
        </nav>

        {/* BOTTOM AREA */}
        <div className="mt-8 flex flex-col gap-3 pt-6 border-t-2 border-[#3C632A]/20">
          <button 
            onClick={handleChangeMode} 
            className="w-full px-5 py-4 bg-white hover:bg-[#FFE296] text-[#3C632A] border-4 border-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A] font-black rounded-[24px] transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            {activeMode}
          </button>
          
          <button 
            onClick={() => { clearActiveSession(); router.push("/"); }} 
            className="w-full px-5 py-4 bg-[#FF5685] hover:bg-[#FF784E] border-4 border-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A] text-white font-black rounded-[24px] transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Keluar Akun
          </button>
        </div>
      </aside>

      `;
  
  content = content.substring(0, startIndex) + newSidebar + content.substring(endIndex);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Successfully reverted sidebar colors to Pintara style.");
} else {
  console.log("Could not find markers.");
}
