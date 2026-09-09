/**
 * Приёмник заявок партнёрского сайта «Датский квартал».
 * Разворачивается как Cloudflare Worker. Токен бота живёт в секретах Worker'а,
 * в коде сайта его нет — на публичном GitHub Pages это принципиально.
 *
 * Переменные окружения:
 *   TG_TOKEN        — токен бота от @BotFather   (секрет)
 *   TG_CHAT_ID      — id группы, куда падают заявки (секрет)
 *   ALLOWED_ORIGIN  — https://hrustalniconcept.github.io
 */

const MAX_LEN = 3500;

function reply(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || '*';

    if (request.method === 'OPTIONS') return reply({}, 204, origin);
    if (request.method !== 'POST') return reply({ ok: false, error: 'method' }, 405, origin);

    if (env.ALLOWED_ORIGIN) {
      const from = request.headers.get('Origin');
      if (from && from !== env.ALLOWED_ORIGIN) return reply({ ok: false, error: 'origin' }, 403, origin);
    }

    let data;
    try { data = await request.json(); }
    catch { return reply({ ok: false, error: 'json' }, 400, origin); }

    // Ловушка для ботов: поле скрыто от человека, заполнить его может только робот.
    // Отвечаем «принято», чтобы спамер не подбирал обход.
    if (data.website) return reply({ ok: true }, 200, origin);

    const text = String(data.text || '').trim().slice(0, MAX_LEN);
    if (!text) return reply({ ok: false, error: 'empty' }, 400, origin);

    const tg = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TG_CHAT_ID,
        text,
        disable_web_page_preview: true
      })
    });

    if (!tg.ok) {
      console.log('telegram error', tg.status, await tg.text());
      return reply({ ok: false, error: 'telegram' }, 502, origin);
    }
    return reply({ ok: true }, 200, origin);
  }
};
