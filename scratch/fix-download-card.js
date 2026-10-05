const fs = require('fs');
const filePath = 'd:\\INKLUSISWA\\web\\src\\app\\dashboard\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The exact string to replace is inside scratch/add-guru-siswa.js
// We can use a regex to replace the alert block
const targetRegex = /alert\(`Siswa berhasil ditambah!\\nNama: \${name}\\nPIN: \${pin}\\nKode Kelas: \${teacherRoomCode}`\);\s*e\.target\.reset\(\);/;

const replacement = `
                // Download Card
                const cardHtml = \`
                  <html><body style="font-family:sans-serif; text-align:center; padding: 40px; background: #FFBA48; border: 10px solid #3C632A; border-radius: 20px; width: 300px; margin: 0 auto; margin-top: 50px;">
                    <h1 style="color: #3C632A;">PINTARA</h1>
                    <h2>Kartu Akses Siswa</h2>
                    <h3 style="background: white; padding: 10px; border-radius: 10px;">Nama: \${name}</h3>
                    <h3 style="background: white; padding: 10px; border-radius: 10px;">Kode Kelas: \${teacherRoomCode}</h3>
                    <h1 style="background: white; padding: 20px; border-radius: 10px; font-size: 40px; color: #FF5685; letter-spacing: 5px;">\${pin}</h1>
                    <p>Simpan kode ini dengan aman ya!</p>
                  </body></html>
                \`;
                const blob = new Blob([cardHtml], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`Kartu_Akses_\${name}.html\`;
                a.click();
                URL.revokeObjectURL(url);

                alert(\`Siswa berhasil ditambah! Kartu akses sedang diunduh.\`);
                e.target.reset();
`;

if (content.match(targetRegex)) {
    content = content.replace(targetRegex, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Successfully added student card download feature.");
} else {
    console.log("Could not find the target string. Current file content length: ", content.length);
}
