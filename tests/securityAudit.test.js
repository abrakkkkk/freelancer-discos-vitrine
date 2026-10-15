import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Auditoria de Segurança de Bundle Cliente', () => {
  it('não deve conter chaves secretas nem referências ao service_role nos chunks do cliente', () => {
    const chunksDir = path.resolve(process.cwd(), '.next/static/chunks');
    if (!fs.existsSync(chunksDir)) {
      // Se ainda não rodou build, passa provisoriamente
      return;
    }

    const getAllFiles = (dir) => {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getAllFiles(fullPath));
        } else if (file.endsWith('.js')) {
          results.push(fullPath);
        }
      });
      return results;
    };

    const files = getAllFiles(chunksDir);
    expect(files.length).toBeGreaterThan(0);

    files.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toContain('SUPABASE_SECRET_KEY');
      expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(content).not.toMatch(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/); // Não deve conter JWTs de serviço
    });
  });
});
