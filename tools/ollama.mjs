// Una llamada de chat a Ollama (http://localhost:11434), leída en streaming: con un texto largo la
// respuesta completa tarda más que el tiempo de espera por defecto de fetch (5 min) y se cortaba antes
// de empezar; en streaming los datos llegan de a poco. Sin dependencias.

const URL = process.env.OLLAMA_URL ?? 'http://localhost:11434/api/chat';
const NL = String.fromCharCode(10);

/**
 * @param {string} model p. ej. 'gemma3:12b'
 * @param {{ role: 'system' | 'user' | 'assistant', content: string }[]} messages
 * @param {{ temperature?: number, num_ctx?: number }} [options]
 */
export async function chat(model, messages, options = {}) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: { temperature: 0.1, num_ctx: 8192, ...options },
    }),
  });
  if (!res.ok) throw new Error(`Ollama respondió ${res.status}: ${await res.text()}`);
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let nl = buffer.indexOf(NL);
    while (nl >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) text += JSON.parse(line).message?.content ?? '';
      nl = buffer.indexOf(NL);
    }
  }
  return text.trim();
}
