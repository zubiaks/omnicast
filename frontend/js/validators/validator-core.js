// assets/js/validators/validator-core.js
import Ajv from 'ajv';

//
// 1. SCHEMAS DE VALIDAÇÃO
//
/** @type {{ [key: string]: object }} */
const schemas = {
  masterList: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id:          { type: 'string' },
        type:        { type: 'string', enum: ['iptv','webcam','vod','radio'] },
        name:        { type: 'string' },
        source:      { type: 'string' },
        category:    { type: 'string' },
        tags:        { type: 'array', items: { type: 'string' } },
        location: {
          type: 'object',
          properties: {
            country: { type: 'string', minLength: 2, maxLength: 2 },
            city:    { type: ['string','null'] }
          },
          required: ['country']
        },
        language:    { type: ['string','null'] },
        urls: {
          type: 'object',
          properties: {
            info:   { type: 'string', format: 'uri' },
            stream: { type: 'string', format: 'uri' }
          },
          required: ['stream']
        },
        status:      { type: 'string', enum: ['online','offline'] },
        lastChecked: { type: 'string', format: 'date-time' },
        collectedAt: { type: 'string', format: 'date-time' },
        metadata:    { type: 'object' }
      },
      required: ['id','type','name','urls','status','lastChecked','collectedAt']
    }
  },
  fontes: {
    type: 'object',
    properties: {
      refreshIntervalSeconds: { type: 'number' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id:       { type: 'string' },
            type:     { type: 'string', enum: ['webcam','vod','iptv','radio'] },
            title:    { type: 'string' },
            source:   { type: 'string' },
            location: {
              type: ['object','null'],
              properties: {
                country: { type: ['string','null'], minLength: 2, maxLength: 2 },
                city:    { type: ['string','null'] }
              }
            },
            language: { type: ['string','null'] },
            urls: {
              type: 'object',
              properties: {
                stream: { type: 'string', format: 'uri' }
              },
              required: ['stream']
            },
            metadata: { type: 'object' }
          },
          required: ['id','type','title','urls']
        }
      }
    },
    required: ['items','refreshIntervalSeconds']
  },
  painelConfig: {
    type: 'object',
    properties: {
      events: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            time:    { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
            seconds: { type: 'number' },
            text:    { type: 'string' },
            type:    { type: 'string' }
          },
          required: ['time','seconds','text','type']
        }
      },
      chapters: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title:   { type: 'string' },
            seconds: { type: 'number' }
          },
          required: ['title','seconds']
        }
      },
      notifications: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    required: ['events','chapters']
  },
  historicos: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        timestamp: { type: 'string', format: 'date-time' },
        latencia:  { type: 'number' },
        loadTime:  { type: 'number' },
        counts: {
          type: 'object',
          properties: {
            iptv:   { type: 'number' },
            webcam: { type: 'number' },
            vod:    { type: 'number' },
            radio:  { type: 'number' }
          },
          required: ['iptv','webcam','vod','radio']
        }
      },
      required: ['timestamp','latencia','counts']
    }
  },
  status: {
    type: 'object',
    properties: {
      statusData: {
        type: 'object',
        properties: {
          generatedAt: { type: 'string', format: 'date-time' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id:          { type: 'string' },
                status:      { type: 'string', enum: ['online','offline'] },
                lastChecked: { type: 'string', format: 'date-time' }
              },
              required: ['id','status','lastChecked']
            }
          }
        },
        required: ['generatedAt','items']
      },
      latencia: { type: 'number' }
    },
    required: ['statusData','latencia']
  }
};

//
// 2. AJV INSTANCE & COMPILAÇÃO
//
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  useDefaults: true,
  coerceTypes: true
});
Object.entries(schemas).forEach(([name, schema]) => {
  ajv.addSchema(schema, name);
});

//
// 3. VALIDAÇÃO DE DADOS
//
/**
 * Valida `data` contra o schema identificado por `schemaName`.
 *
 * @template T
 * @param {string} schemaName — Chave do schema registrado
 * @param {unknown} data      — Dados a validar
 * @returns {T}               — Dados validados (mesmo objeto)
 * @throws {Error}           — Se o schema não existir ou validação falhar
 */
export function validate(schemaName, data) {
  const validateFn = ajv.getSchema(schemaName);
  if (!validateFn) {
    throw new Error(`Schema "${schemaName}" não encontrado.`);
  }
  const valid = validateFn(data);
  if (!valid) {
    const errors = validateFn.errors
      ?.map(e => `${e.instancePath || '/'} ${e.message}`)
      .join('; ');
    console.error(`[validator-core] Erros em "${schemaName}":`, validateFn.errors);
    throw new Error(`Dados inválidos para "${schemaName}": ${errors}`);
  }
  return /** @type {T} */ (data);
}

//
// 4. FETCH COM TIMEOUT
//
/**
 * Executa fetch com abort após `timeoutMs`.
 *
 * @param {string} url
 * @param {number} timeoutMs
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 * @throws {Error} — AbortError em timeout ou erro de rede
 */
export async function fetchWithTimeout(url, timeoutMs, options = {}) {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timerId);
  }
}

//
// 5. VALIDAÇÃO DE STREAM
//
/**
 * Verifica se um stream está online e, se for HLS, confere o cabeçalho #EXTM3U.
 *
 * @param {string|object} input   — URL string ou objeto contendo `urls.stream`/`stream_url`
 * @param {number} [timeoutMs=5000]
 * @returns {Promise<{ online: boolean; motivo?: string }>}
 */
export async function validarStream(input, timeoutMs = 5000) {
  const url = typeof input === 'string'
    ? input
    : input.urls?.stream || input.stream_url;
  if (!url) {
    return { online: false, motivo: 'URL de stream ausente' };
  }

  try {
    // Verifica cabeçalho HTTP
    const head = await fetchWithTimeout(url, timeoutMs, { method: 'HEAD' });
    if (!head.ok) {
      return { online: false, motivo: `HTTP ${head.status}` };
    }

    // Se HLS, lê parte do conteúdo
    if (url.endsWith('.m3u8')) {
      const res = await fetchWithTimeout(url, timeoutMs);
      const text = await res.text();
      if (!text.includes('#EXTM3U')) {
        return { online: false, motivo: 'Formato HLS inválido' };
      }
    }

    return { online: true };
  } catch (err) {
    let motivo = 'Erro desconhecido';
    if (err.name === 'AbortError') motivo = 'Timeout atingido';
    else if (err.name === 'TypeError') motivo = 'Rede indisponível ou CORS bloqueado';
    return { online: false, motivo };
  }
}
