const fs = require('fs');

const tsxCode = fs.readFileSync('./src/pages/public/ShowcasePage.tsx', 'utf8');
const particlesCode = fs.readFileSync('./src/components/ui/ParticlesBackground.tsx', 'utf8');
const showcaseCss = fs.readFileSync('./src/pages/public/ShowcasePage.css', 'utf8');
const indexCss = fs.readFileSync('./src/index.css', 'utf8');

// Clean up ParticlesBackground
let cleanParticles = particlesCode
  .replace(/import .*;/g, '')
  .replace('export const ParticlesBackground', 'const ParticlesBackground');

// Clean up ShowcasePage
let cleanTsx = tsxCode
  .replace(/import .*;/g, '')
  .replace('export default function ShowcasePage', 'function ShowcasePage');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>B_Hair Showcase</title>
  
  <style>
    /* ─── Global Styles ─── */
    ${indexCss}
    
    /* ─── Showcase Styles ─── */
    ${showcaseCss}
    
    body {
      margin: 0;
      padding: 0;
      background: #000;
    }
  </style>
  
  <!-- React & ReactDOM -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  
  <!-- Babel -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <!-- GSAP -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel" data-presets="react,typescript">
    const { useState, useEffect, useRef, FC } = React;

    ${cleanParticles}

    ${cleanTsx}

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<ShowcasePage />);
  </script>
</body>
</html>`;

fs.writeFileSync('showcase.html', htmlContent);
console.log('Successfully created showcase.html');
