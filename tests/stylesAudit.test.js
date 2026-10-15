import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Auditoria de Estilos Sólidos', () => {
  it('não deve conter backdrop-filter nem transparência em backgrounds de superfícies', () => {
    const cssPath = path.resolve(process.cwd(), 'src/app/globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    expect(cssContent).not.toMatch(/backdrop-filter/i);
    expect(cssContent).not.toMatch(/background(-color)?:\s*rgba\(/i);
    expect(cssContent).not.toMatch(/background(-color)?:\s*hsla\(/i);
  });
});
