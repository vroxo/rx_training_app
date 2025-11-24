/**
 * Timezone Utilities
 * 
 * Estas funções garantem que datas sejam tratadas consistentemente
 * entre o cliente (timezone local) e o banco de dados (UTC).
 * 
 * ESTRATÉGIA:
 * 1. O banco de dados (Supabase) armazena tudo em UTC (TIMESTAMPTZ)
 * 2. O cliente trabalha com Date objects em timezone local
 * 3. Ao salvar: convertemos local → UTC via toISOString()
 * 4. Ao ler: o Date object converte automaticamente UTC → local
 * 5. Ao exibir: date-fns format() usa o timezone local automaticamente
 */

/**
 * Converte uma Date local para string ISO em UTC
 * Usa toISOString() que sempre retorna em UTC (sufixo Z)
 * 
 * Exemplo:
 * Input: Date(2025-11-18T14:00:00) no timezone America/Sao_Paulo (UTC-3)
 * Output: "2025-11-18T17:00:00.000Z" (converteu +3 horas para UTC)
 */
export function toUTCString(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString();
}

/**
 * Converte uma string ISO (UTC) para Date object
 * O Date object automaticamente converte para o timezone local do dispositivo
 * 
 * Exemplo:
 * Input: "2025-11-18T17:00:00.000Z" (UTC)
 * Output: Date(2025-11-18T14:00:00) no timezone America/Sao_Paulo (UTC-3)
 */
export function fromUTCString(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Retorna o offset do timezone atual em minutos
 * Negativo para timezones oeste de GMT, positivo para leste
 * 
 * Exemplo:
 * America/Sao_Paulo (UTC-3): retorna +180 minutos
 * Europe/London (UTC+0): retorna 0 minutos
 * Asia/Tokyo (UTC+9): retorna -540 minutos
 */
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset();
}

/**
 * Retorna o nome do timezone atual (IANA timezone identifier)
 * 
 * Exemplo:
 * "America/Sao_Paulo", "America/New_York", "Europe/London", etc.
 */
export function getTimezoneName(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Retorna informações completas sobre o timezone atual
 */
export function getTimezoneInfo() {
  const offsetMinutes = getTimezoneOffset();
  const offsetHours = Math.abs(offsetMinutes) / 60;
  const offsetSign = offsetMinutes <= 0 ? '+' : '-';
  
  return {
    name: getTimezoneName(),
    offsetMinutes,
    offsetHours,
    offsetString: `UTC${offsetSign}${offsetHours}`,
  };
}

/**
 * Cria uma nova Date preservando o horário "wall clock" informado
 * 
 * Útil para quando o usuário informa uma data/hora e queremos
 * que aquele horário exato seja preservado no timezone dele
 * 
 * Exemplo:
 * createLocalDate(2025, 10, 18, 14, 0) no timezone UTC-3
 * Cria: Date(2025-11-18T14:00:00-03:00)
 * Ao salvar com toISOString(): "2025-11-18T17:00:00.000Z"
 */
export function createLocalDate(
  year: number,
  month: number, // 0-11 (Janeiro = 0)
  day: number,
  hours: number = 0,
  minutes: number = 0,
  seconds: number = 0
): Date {
  return new Date(year, month, day, hours, minutes, seconds);
}

/**
 * Formata uma data para exibição, garantindo que use o timezone local
 * 
 * Esta é apenas uma helper function que delega para date-fns format(),
 * mas deixa explícito que estamos usando o timezone local
 */
export function formatLocalDate(date: Date, formatString: string, options?: any): string {
  // date-fns format() já usa automaticamente o timezone local do Date object
  const { format } = require('date-fns');
  return format(date, formatString, options);
}

/**
 * Debug: exibe informações sobre uma data em diferentes formatos
 */
export function debugDate(date: Date, label: string = 'Date') {
  console.log(`\n🕐 ${label}:`);
  console.log(`  Local String: ${date.toString()}`);
  console.log(`  UTC String:   ${date.toISOString()}`);
  console.log(`  Timezone:     ${getTimezoneInfo().offsetString} (${getTimezoneName()})`);
  console.log(`  Timestamp:    ${date.getTime()}`);
}

