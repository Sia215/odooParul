const fs = require('fs');
const path = require('path');

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) { walk(full); continue; }
    if (!/\.(jsx|js)$/.test(f)) continue;
    let c = fs.readFileSync(full, 'utf8');
    if (c.includes("import.meta.env.VITE_API_URL;")) {
      c = c.replaceAll(
        "import.meta.env.VITE_API_URL;",
        "import.meta.env.VITE_API_URL || 'http://localhost:5000/api';"
      );
      fs.writeFileSync(full, c, 'utf8');
      console.log('Fixed:', f);
    }
  }
}

walk(path.join(__dirname, 'src'));
console.log('Done.');
