const fs = require('fs');
const content = fs.readFileSync('d:\\INKLUSISWA\\web\\src\\app\\dashboard\\page.tsx', 'utf8');
const lines = content.split('\n');
const match = lines.findIndex(l => l.includes('guruTab === "materi"'));
console.log('Match index for materi:', match);
if(match !== -1) {
  console.log(lines.slice(match - 2, match + 2).join('\n'));
}
