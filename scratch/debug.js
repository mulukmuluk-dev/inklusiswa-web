const fs = require('fs');
const lines = fs.readFileSync('d:\\INKLUSISWA\\web\\src\\app\\dashboard\\page.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if(l.includes('activeTab === "kelas"')) {
    console.log(i + ': ' + l.trim());
  }
});
