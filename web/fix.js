const fs = require('fs');
const path = require('path');

function walk(d) {
  fs.readdirSync(d).forEach(f => {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      let c = fs.readFileSync(p, 'utf8');
      let orig = c;
      
      c = c.replace(/import\s+{([^}]+)}\s+from\s+(['"])(.*?types)\2/g, 'import type {$1} from $2$3$2');
      c = c.replace(/import\s+React(,\s*{[^}]+})?\s+from\s+['"]react['"];\r?\n?/g, (m, p1) => {
        if (p1) {
          return 'import ' + p1.replace(/^,\s*/, '') + ' from "react";\n';
        }
        return '';
      });
      c = c.replace(/Record<string,\s*(unknown|string)>/g, 'any');
      
      if (c !== orig) {
        fs.writeFileSync(p, c);
        console.log('Fixed:', p);
      }
    }
  });
}
walk('./src');
