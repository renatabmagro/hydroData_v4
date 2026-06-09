/**
 * SQLDataLoader - Carrega dados dos arquivos SQL locais
 * Replaces Supabase queries para bacias_niveis e municipios_dados
 */

interface BaciaRow {
  id: string;
  nome_bacia: string;
  nivel: string;
  codigo_bacia: string;
  geojson_bacia: any;
}

interface MunicipioRow {
  code_muni: string;
  name_muni: string;
  abbrev_state: string;
  area_urbanizada_km2: string | null;
  area_risco_km2: string | null;
  populacao_2022: number;
  geojson_urbanizacao: any;
  geojson_risco: any;
}

let cachedBacias: BaciaRow[] | null = null;
let cachedMunicipios: MunicipioRow[] | null = null;

/**
 * Extrai dados de um INSERT statement SQL
 * Suporta múltiplas linhas de dados com valores complexos (GeoJSON, etc)
 */
function parseInsertStatement(sql: string): Array<any[]> {
  // Remove quebras de linha mas preserva espaços dentro de strings
  let cleaned = sql.replace(/[\r\n]+/g, ' ');
  
  // Encontra VALUES (...)
  const valuesMatch = cleaned.match(/VALUES\s*\((.*)\)\s*;?\s*$/i);
  if (!valuesMatch) {
    console.error('No VALUES found in SQL');
    return [];
  }
  
  const valuesStr = valuesMatch[1];
  const rows: Array<any[]> = [];
  
  // Parsear linhas separadas por ),(
  let i = 0;
  while (i < valuesStr.length) {
    const rowValues = parseOneRow(valuesStr, i);
    if (rowValues.row.length > 0) {
      rows.push(rowValues.row);
    }
    i = rowValues.nextIndex;
    
    // Skip the comma and space between rows
    while (i < valuesStr.length && (valuesStr[i] === ',' || valuesStr[i] === ' ')) {
      i++;
    }
  }
  
  return rows;
}

/**
 * Parse uma única linha de valores
 */
function parseOneRow(str: string, startIndex: number): { row: any[], nextIndex: number } {
  const row: any[] = [];
  let i = startIndex;
  
  // Skip opening paren if present
  if (str[i] === '(') {
    i++;
  }
  
  while (i < str.length) {
    const char = str[i];
    
    // Check for closing paren
    if (char === ')') {
      i++;
      break;
    }
    
    // Skip whitespace and commas between values
    if (char === ',' || char === ' ') {
      i++;
      continue;
    }
    
    // Parse a single value
    const valueResult = parseOneValue(str, i);
    row.push(valueResult.value);
    i = valueResult.nextIndex;
  }
  
  return { row, nextIndex: i };
}

/**
 * Parse um único valor (pode ser string, número, null, JSON, etc)
 */
function parseOneValue(str: string, startIndex: number): { value: any, nextIndex: number } {
  let i = startIndex;
  
  // Skip leading whitespace
  while (i < str.length && str[i] === ' ') {
    i++;
  }
  
  if (i >= str.length) {
    return { value: null, nextIndex: i };
  }
  
  const char = str[i];
  
  // Handle strings with quotes
  if (char === "'" || char === '"') {
    const quote = char;
    let value = '';
    i++;
    
    while (i < str.length) {
      if (str[i] === quote) {
        // Check for escaped quote
        if (str[i + 1] === quote) {
          value += quote;
          i += 2;
        } else {
          i++;
          break;
        }
      } else {
        value += str[i];
        i++;
      }
    }
    
    // Skip trailing whitespace
    while (i < str.length && (str[i] === ' ' || str[i] === ',')) {
      if (str[i] === ',') break;
      i++;
    }
    
    return { value, nextIndex: i };
  }
  
  // Handle null
  if (str.substring(i, i + 4).toLowerCase() === 'null') {
    return { value: null, nextIndex: i + 4 };
  }
  
  // Handle booleans
  if (str.substring(i, i + 4).toLowerCase() === 'true') {
    return { value: true, nextIndex: i + 4 };
  }
  if (str.substring(i, i + 5).toLowerCase() === 'false') {
    return { value: false, nextIndex: i + 5 };
  }
  
  // Handle numbers and other unquoted values
  let value = '';
  while (i < str.length && str[i] !== ',' && str[i] !== ')' && str[i] !== ' ') {
    value += str[i];
    i++;
  }
  
  // Try to parse as number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return { value: parseFloat(value), nextIndex: i };
  }
  
  // Try to parse as JSON
  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      return { value: JSON.parse(value), nextIndex: i };
    } catch {
      return { value, nextIndex: i };
    }
  }
  
  return { value, nextIndex: i };
}

/**
 * Carrega bacias do arquivo SQL
 */
export async function loadBacias(): Promise<BaciaRow[]> {
  if (cachedBacias) {
    return cachedBacias;
  }
  
  try {
    // Tenta primeiro via HTTP (navegador)
    try {
      const response = await fetch('/dados/bacias_niveis_rows.sql');
      const sql = await response.text();
      
      const rows = parseInsertStatement(sql);
      
      cachedBacias = rows.map(row => ({
        id: String(row[0]),
        nome_bacia: row[1],
        nivel: row[2],
        codigo_bacia: row[3],
        geojson_bacia: parseGeoJSON(row[5])
      }));
      
      return cachedBacias;
    } catch (fetchError) {
      // Se não conseguir via HTTP, tenta via require (Node.js no servidor)
      if (typeof window === 'undefined') {
        const fs = await import('fs');
        const path = await import('path');
        
        const filePath = path.resolve(process.cwd(), 'dados', 'bacias_niveis_rows.sql');
        const sql = fs.readFileSync(filePath, 'utf-8');
        
        const rows = parseInsertStatement(sql);
        
        cachedBacias = rows.map(row => ({
          id: String(row[0]),
          nome_bacia: row[1],
          nivel: row[2],
          codigo_bacia: row[3],
          geojson_bacia: parseGeoJSON(row[5])
        }));
        
        return cachedBacias;
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Erro ao carregar bacias:', error);
    return [];
  }
}

/**
 * Carrega municípios do arquivo SQL
 */
export async function loadMunicipios(): Promise<MunicipioRow[]> {
  if (cachedMunicipios) {
    return cachedMunicipios;
  }
  
  try {
    // Tenta primeiro via HTTP (navegador)
    try {
      const response = await fetch('/dados/municipios_dados_rows.sql');
      const sql = await response.text();
      
      const rows = parseInsertStatement(sql);
      
      cachedMunicipios = rows.map(row => ({
        code_muni: String(row[0]),
        name_muni: row[1],
        abbrev_state: row[2],
        area_urbanizada_km2: row[3],
        area_risco_km2: row[4],
        populacao_2022: row[5],
        geojson_urbanizacao: parseGeoJSON(row[6]),
        geojson_risco: parseGeoJSON(row[7])
      }));
      
      return cachedMunicipios;
    } catch (fetchError) {
      // Se não conseguir via HTTP, tenta via require (Node.js no servidor)
      if (typeof window === 'undefined') {
        const fs = await import('fs');
        const path = await import('path');
        
        const filePath = path.resolve(process.cwd(), 'dados', 'municipios_dados_rows.sql');
        const sql = fs.readFileSync(filePath, 'utf-8');
        
        const rows = parseInsertStatement(sql);
        
        cachedMunicipios = rows.map(row => ({
          code_muni: String(row[0]),
          name_muni: row[1],
          abbrev_state: row[2],
          area_urbanizada_km2: row[3],
          area_risco_km2: row[4],
          populacao_2022: row[5],
          geojson_urbanizacao: parseGeoJSON(row[6]),
          geojson_risco: parseGeoJSON(row[7])
        }));
        
        return cachedMunicipios;
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Erro ao carregar municípios:', error);
    return [];
  }
}

/**
 * Parse GeoJSON - converte strings para objetos se necessário
 */
function parseGeoJSON(value: any): any {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  
  return value;
}

/**
 * Busca bacias por nome (simula ilike do Supabase)
 */
export async function searchBacias(
  searchQuery: string,
  nivel?: string,
  limit: number = 10
): Promise<BaciaRow[]> {
  const bacias = await loadBacias();
  
  const filtered = bacias.filter(b => {
    const nameMatch = b.nome_bacia
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const nivelMatch = !nivel || nivel === 'Todos' || b.nivel === nivel;
    return nameMatch && nivelMatch;
  });
  
  return filtered.slice(0, limit);
}

/**
 * Busca uma bacia por ID
 */
export async function getBaciaById(id: string): Promise<BaciaRow | null> {
  const bacias = await loadBacias();
  return bacias.find(b => b.id === id) || null;
}

/**
 * Retorna todas as bacias
 */
export async function getAllBacias(): Promise<BaciaRow[]> {
  return loadBacias();
}

/**
 * Retorna todos os municípios
 */
export async function getAllMunicipios(): Promise<MunicipioRow[]> {
  return loadMunicipios();
}

/**
 * Limpa o cache (útil para testes ou reload)
 */
export function clearCache(): void {
  cachedBacias = null;
  cachedMunicipios = null;
}
