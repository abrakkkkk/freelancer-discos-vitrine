'use client';

import { createContext } from 'react';

// Total de discos que o catálogo acabou de contar. A abertura usa este número para não
// mostrar um valor diferente do de "Todo o estoque" (o dela vem de um cache de 5 minutos).
export const TotalEstoqueContext = createContext(null);
