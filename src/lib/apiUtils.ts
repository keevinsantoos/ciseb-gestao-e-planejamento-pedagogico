/**
 * CISEB Safe API Fetch Utilities
 * Prevents "Unexpected token 'A', 'A server e'..." errors by safely handling
 * non-JSON server responses (HTML error pages, proxy errors, network timeouts).
 */

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function safeJsonFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(options?.headers || {}),
      },
    });

    const rawText = await res.text();

    let parsed: any = null;
    if (rawText && rawText.trim().length > 0) {
      try {
        parsed = JSON.parse(rawText);
      } catch {
        // Response is not valid JSON (e.g. "A server error occurred.", HTML 500, or proxy message)
        const stripped = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const shortError = stripped.length > 180 ? stripped.substring(0, 180) + '...' : stripped;
        
        return {
          ok: false,
          status: res.status || 500,
          error: shortError || `O servidor retornou uma resposta inesperada (HTTP ${res.status}).`,
        };
      }
    } else {
      parsed = {};
    }

    if (!res.ok) {
      const errorMsg =
        parsed?.error ||
        parsed?.message ||
        `Erro no servidor ao processar requisição (Código ${res.status}).`;
      return {
        ok: false,
        status: res.status,
        data: parsed,
        error: errorMsg,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: parsed,
    };
  } catch (netErr: any) {
    console.warn(`[safeJsonFetch] Erro de rede ou comunicação com ${url}:`, netErr);
    return {
      ok: false,
      status: 0,
      error: netErr?.message || 'Falha de conexão com o servidor da aplicação.',
    };
  }
}
