const fs = require('fs');
const filePath = 'd:\\INKLUSISWA\\web\\src\\app\\dashboard\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update State
content = content.replace(
  /useState<"room" \| "materi" \| "ujian" \| "rekap">/g,
  'useState<"room" | "siswa" | "materi" | "ujian" | "rekap">'
);

// Update Guru Tabs Navigation
const tabNavRegex = /(onClick={\(\) => setGuruTab\("room"\)}[\s\S]*?<\/button>)/;
const match = content.match(tabNavRegex);
if (match) {
  const newTab = `
              <button
                onClick={() => setGuruTab("siswa")}
                className={\`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap \${
                  guruTab === "siswa"
                    ? "bg-[#FFBA48] text-[#3C632A] shadow-md border-2 border-[#3C632A]"
                    : "text-slate-600 hover:bg-[#FFE296] border-2 border-transparent"
                }\`}
              >
                Kelola Siswa
              </button>
  `;
  content = content.replace(match[0], match[0] + newTab);
}

// Update Guru Tabs Content
// We'll insert the "siswa" view right before `{guruTab === "materi" && hasCreatedRoom && (`
const contentTarget = '{guruTab === "materi" && hasCreatedRoom && (';
const siswaContent = `
        {guruTab === "siswa" && hasCreatedRoom && (
          <div className="bg-white rounded-[24px] border-4 border-[#3C632A] p-6 shadow-[8px_8px_0px_0px_#3C632A] animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-[#3C632A] mb-4">Kelola Murid & PIN Akses</h2>
            <p className="text-[#3C632A] font-bold mb-8">Tambahkan murid ke kelas ini. Sistem akan otomatis membuatkan PIN rahasia untuk login.</p>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const name = e.target.elements.studentName.value;
              const preset = e.target.elements.preset.value;
              const avatar = e.target.elements.avatar.value;
              
              // Generate Random 4 Digit PIN
              const pin = Math.floor(1000 + Math.random() * 9000).toString();
              
              // Create Supabase Profile for Student
              const pseudoId = crypto.randomUUID();
              const email = \`\${pseudoId}@pintara.local\`;
              
              try {
                // We're bypassing real auth for kids and just storing profile
                await supabase.from("profiles").upsert({
                  id: pseudoId,
                  email: email,
                  full_name: name,
                  role: "siswa",
                  current_room_code: teacherRoomCode,
                  avatar_url: avatar,
                  accessibility_config: { pin_code: pin, mainMode: preset }
                });
                
                alert(\`Siswa berhasil ditambah!\\nNama: \${name}\\nPIN: \${pin}\\nKode Kelas: \${teacherRoomCode}\`);
                e.target.reset();
              } catch(err) {
                console.error(err);
                alert("Gagal menyimpan siswa.");
              }
            }} className="flex flex-col gap-6 w-full max-w-xl">
              
              <div>
                <label className="block font-black text-[#3C632A] mb-2">Nama Murid</label>
                <input name="studentName" required className="w-full px-4 py-3 bg-[#F8F9FA] border-4 border-[#3C632A] rounded-xl font-bold" placeholder="Misal: Budi Santoso" />
              </div>
              
              <div>
                <label className="block font-black text-[#3C632A] mb-2">Kebutuhan Khusus / Preset</label>
                <select name="preset" className="w-full px-4 py-3 bg-[#F8F9FA] border-4 border-[#3C632A] rounded-xl font-bold">
                  <option value="sensorik">Sensorik (Tunanetra/Tunarungu)</option>
                  <option value="fisik">Fisik (Motorik)</option>
                  <option value="intelektual">Intelektual</option>
                  <option value="mental">Mental</option>
                </select>
              </div>

              <div>
                <label className="block font-black text-[#3C632A] mb-2">Pilih Avatar Karakter</label>
                <div className="flex gap-4">
                  <label className="cursor-pointer">
                    <input type="radio" name="avatar" value="/images/avatars/cat.png" className="hidden peer" defaultChecked />
                    <div className="w-16 h-16 bg-slate-100 rounded-full border-4 border-transparent peer-checked:border-[#0066CC] peer-checked:scale-110 transition-all bg-cover bg-center" style={{backgroundImage: "url('/images/default_avatar.png')"}}></div>
                  </label>
                  {/* Additional avatars can be added here */}
                </div>
              </div>
              
              <button type="submit" className="px-6 py-4 bg-[#73B14C] hover:bg-[#3C632A] text-white border-4 border-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A] font-black rounded-full text-xl transition-all w-full">
                Tambahkan Murid
              </button>
            </form>
          </div>
        )}
        
`;

content = content.replace(contentTarget, siswaContent + contentTarget);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Guru Siswa tab added successfully.");
