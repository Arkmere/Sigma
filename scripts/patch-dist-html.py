from pathlib import Path
p=Path('dist/index.html')
s=p.read_text().replace('/src/main.tsx','/main.js').replace('/src/main.ts','/main.js')
p.write_text(s)
