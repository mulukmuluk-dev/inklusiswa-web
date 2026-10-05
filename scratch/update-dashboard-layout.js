const fs = require('fs');

const filePath = 'd:\\INKLUSISWA\\web\\src\\app\\dashboard\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '<div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-24 relative overflow-x-hidden">';
const endMarker = '</header>';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex) + endMarker.length;

if (startIndex !== -1 && endIndex !== -1) {
  const sidebarLayout = `
    <div className="min-h-screen bg-[#0D9488] bg-cover bg-center bg-no-repeat bg-fixed font-sans text-[#3C632A] relative flex overflow-x-hidden" style={{ backgroundImage: "url('/images/blackboard_bg.png')" }}>
      {/* ==================== 1. SIDEBAR ==================== */}
      <aside className="w-72 h-screen sticky top-0 bg-[#FFBA48] border-r-8 border-[#3C632A] flex flex-col p-6 z-50 overflow-y-auto">
        <Link href="/" className="flex flex-col items-center gap-3 mb-10 bg-white border-4 border-[#3C632A] rounded-2xl p-4 shadow-[4px_4px_0px_0px_#3C632A] group hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#3C632A] transition-all">
           <PintaraLogo size="sm" />
           <span className="text-3xl font-black text-[#3C632A] group-hover:text-[#0066CC] transition-colors">PINTARA</span>
        </Link>
        
        <nav className="flex-1 flex flex-col gap-4">
           {userSession?.role === "guru" && (
              <button onClick={() => setActiveTab("guru")} className={\`px-4 py-4 rounded-2xl font-black text-xl transition-all border-4 border-[#3C632A] \${activeTab === "guru" ? "bg-[#3C632A] text-[#FFFFDB] shadow-[6px_6px_0px_0px_#0D9488] translate-x-2" : "bg-white text-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A] hover:bg-[#FFE296]"}\`}>
                Ruang Guru
              </button>
           )}
           
           <button onClick={() => setActiveTab("katalog")} className={\`px-4 py-4 rounded-2xl font-black text-xl transition-all border-4 border-[#3C632A] \${activeTab === "katalog" ? "bg-[#3C632A] text-[#FFFFDB] shadow-[6px_6px_0px_0px_#0D9488] translate-x-2" : "bg-white text-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A] hover:bg-[#FFE296]"}\`}>
             Petualangan Belajar
           </button>
           
           <button onClick={() => setActiveTab("kelas")} className={\`px-4 py-4 rounded-2xl font-black text-xl transition-all border-4 border-[#3C632A] \${activeTab === "kelas" ? "bg-[#3C632A] text-[#FFFFDB] shadow-[6px_6px_0px_0px_#0D9488] translate-x-2" : "bg-white text-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A] hover:bg-[#FFE296]"}\`}>
             Kelas Impianku
           </button>

           {activeTab === "kelas" && (
             <div className="ml-4 mt-2 flex flex-col gap-3 border-l-4 border-[#3C632A] pl-4">
               <button onClick={() => setActiveSidebarTab("materi")} className={\`text-left px-4 py-3 rounded-2xl font-bold text-lg transition-all border-4 border-[#3C632A] \${activeSidebarTab === "materi" ? "bg-[#73B14C] text-white shadow-[4px_4px_0px_0px_#3C632A] translate-x-2" : "bg-white text-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A] hover:bg-[#FFE296]"}\`}>
                 Kartu Ajaib
               </button>
               <button onClick={() => setActiveSidebarTab("latihan")} className={\`text-left px-4 py-3 rounded-2xl font-bold text-lg transition-all border-4 border-[#3C632A] \${activeSidebarTab === "latihan" ? "bg-[#73B14C] text-white shadow-[4px_4px_0px_0px_#3C632A] translate-x-2" : "bg-white text-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A] hover:bg-[#FFE296]"}\`}>
                 Tantangan Harian
               </button>
               <button onClick={() => setActiveSidebarTab("ujian")} className={\`text-left px-4 py-3 rounded-2xl font-bold text-lg transition-all border-4 border-[#3C632A] \${activeSidebarTab === "ujian" ? "bg-[#FF5685] text-white shadow-[4px_4px_0px_0px_#3C632A] translate-x-2" : "bg-white text-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A] hover:bg-[#FFE296]"}\`}>
                 Misi Utama
               </button>
             </div>
           )}
        </nav>

        <div className="mt-8 flex flex-col gap-3">
          <button onClick={handleChangeMode} className="w-full px-4 py-3 bg-white border-4 border-[#3C632A] text-[#3C632A] font-black rounded-2xl shadow-[4px_4px_0px_0px_#3C632A] hover:bg-[#FFE296]">
            {activeMode}
          </button>
          
          <button onClick={() => { clearActiveSession(); router.push("/"); }} className="w-full px-4 py-3 bg-[#FF5685] border-4 border-[#3C632A] text-white font-black rounded-2xl shadow-[4px_4px_0px_0px_#3C632A] hover:bg-[#FF784E]">
            Keluar
          </button>
        </div>
      </aside>

      {/* ==================== 2. MAIN CONTENT ==================== */}
      <div className="flex-1 flex flex-col w-full min-h-screen">
`;
  content = content.substring(0, startIndex) + sidebarLayout + content.substring(endIndex);
  
  // also add closing div at the very end of return
  const endReturnMarker = '</div>\n    </div>\n  );\n}';
  if (content.indexOf(endReturnMarker) !== -1) {
     // Nothing needed if it matches
  } else {
     // Just append </div>
     content = content.replace(/(\s*)(\);\n})$/g, '$1  </div>$1$2');
  }

  // Find all "bg-white" in main content to add blackboard styling logic, wait let's just write file and see
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Successfully replaced layout");
} else {
  console.log("Markers not found");
}
