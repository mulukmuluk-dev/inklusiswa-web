const fs = require('fs');
const content = fs.readFileSync('d:\\INKLUSISWA\\web\\src\\app\\dashboard\\page.tsx', 'utf8');
const lines = content.split('\n');
const match = lines.findIndex(l => l.includes('Siswa berhasil ditambah!'));
console.log('Match index:', match);
if(match !== -1) {
  console.log(lines.slice(match - 5, match + 5).join('\n'));
}
