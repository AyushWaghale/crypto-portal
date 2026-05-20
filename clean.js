const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend', 'src', 'pages');

const replacements = [
  [/bg-slate-900\/50/g, 'bg-card/50'],
  [/bg-slate-900/g, 'bg-card'],
  [/bg-slate-950/g, 'bg-background'],
  [/border-slate-800/g, 'border-border/50'],
  [/border-slate-700/g, 'border-border'],
  [/text-slate-500/g, 'text-muted-foreground'],
  [/text-slate-400/g, 'text-muted-foreground'],
  [/text-slate-300/g, 'text-foreground'],
  [/text-slate-200/g, 'text-foreground'],
  [/text-slate-100/g, 'text-foreground'],
  [/text-white/g, 'text-foreground'],
  [/hover:bg-slate-800\/50/g, 'hover:bg-secondary'],
  [/hover:bg-slate-800\/30/g, 'hover:bg-secondary/50'],
  [/bg-slate-800/g, 'bg-secondary'],
  [/hover:text-white/g, 'hover:text-foreground'],
  [/bg-blue-900\/50/g, 'bg-primary/20'],
  [/text-blue-400/g, 'text-primary'],
  [/focus:ring-blue-600/g, 'focus:ring-primary'],
  [/bg-blue-600/g, 'bg-primary'],
  [/from-blue-900\/20/g, 'from-primary/20'],
  [/to-indigo-900\/20/g, 'to-primary/10']
];

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx') && file !== 'Login.tsx' && file !== 'Register.tsx') {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    replacements.forEach(([regex, replacement]) => {
      content = content.replace(regex, replacement);
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned ${file}`);
  }
});
