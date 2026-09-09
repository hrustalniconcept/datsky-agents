/* Датский квартал — партнёрский сайт. Ядро: данные, роутер, утилиты, формы. */
window.DK = (function () {
  'use strict';

  var D = {};                 // загруженные данные
  var app, modal, modalWin;

  /* ---------------- Утилиты ---------------- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nf(n) { return Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' '); }
  function money(n) { return n == null ? '—' : nf(n) + ' ₽'; }
  function mln(n) { return n == null ? '—' : (n / 1e6).toFixed(2).replace('.', ',') + ' млн'; }
  function num(n, d) {
    if (n == null) return '—';
    return n.toFixed(d == null ? 2 : d).replace(/[.,]?0+$/, '').replace('.', ',');
  }
  function area(n) { return n == null ? '—' : num(n) + ' м²'; }
  function plural(n, a, b, c) {
    var m = n % 100, k = n % 10;
    return n + ' ' + (m > 10 && m < 20 ? c : k === 1 ? a : k > 1 && k < 5 ? b : c);
  }

  /* Цена, по которой работаем: акционная, если есть */
  function price(l) { return l.cena_akciya || l.cena_bazovaya; }

  /* Статус лота → подпись и класс бейджа */
  function status(l) {
    var s = (l.status || '').toLowerCase();
    if (s.indexOf('шоу') === 0) return { t: 'Подготовлен к показу', c: 'sub' };
    if (s.indexOf('бронь') > -1) return { t: 'Бронь', c: 'bron' };
    if (s.indexOf('акц или суб') > -1) return { t: 'Акция или субсидия', c: 'sub' };
    if (s.indexOf('акция') > -1) return { t: 'Акция', c: 'akciya' };
    return { t: 'В продаже', c: 'sale' };
  }
  function isBron(l) { return (l.status || '').toLowerCase().indexOf('бронь') > -1; }

  /* Правило: от 12 м² — терраса, от 6 до 12 — балкон */
  function outdoor(l) {
    var s = l.s_balkon || 0;
    if (s >= 12) return { kind: 'терраса', s: s };
    if (s >= 6) return { kind: 'балкон', s: s };
    if (s > 0) return { kind: 'балкон', s: s };
    return { kind: null, s: 0 };
  }

  /* Комиссия 4,5%. База не подтверждена — считаем оба варианта. */
  var RATE = 0.045;
  function commission(l) {
    return {
      base: l.cena_bazovaya * RATE,
      deal: price(l) * RATE
    };
  }

  function lotTitle(l) {
    return l.spalni + ' · ' + area(l.s_klientskaya);
  }
  function lotWhere(l) {
    return l.tip_doma + ' д. ' + l.dom + ', кв. ' + l.kv + ' · ' + l.etazh + ' этаж';
  }
  function typeOf(l) { return D.types[l.tovarnyi_tip]; }

  function byId(id) { return D.registry.lots.filter(function (l) { return l.id === id; })[0]; }

  /* ---------------- Роутер ---------------- */

  var NAV = [
    { p: '', t: 'Главная', s: 'Главная' },
    { p: 'about', t: 'О проекте и качестве', s: 'О проекте' },
    { p: 'flats', t: 'Квартиры и цены', s: 'Квартиры и цены' },
    { p: 'plans', t: 'Планировки и метражи', s: 'Планировки' },
    { p: 'life', t: 'Образ жизни в квартале', s: 'Образ жизни' },
    { p: 'client', t: 'Работа с клиентом', s: 'Работа с клиентом' },
    { p: 'terms', t: 'Комиссия и закрепление', s: 'Комиссия 4,5%' },
    { p: 'media', t: 'Материалы для работы', s: 'Материалы' },
    { p: 'kb', t: 'Обучение агента', s: 'Обучение' }
  ];


  /* Внутренние страницы: в верхнее меню не выносим, но они живут и линкуются */
  var SUB = [
    { p: 'park', t: 'Хрустальный парк: что вокруг' },
    { p: 'tour', t: 'Фотоэкскурсия по кварталу' },
    { p: 'video', t: 'Видео и онлайн-экскурсии' },
    { p: 'finance', t: 'Финансы и расчёты' },
    { p: 'tours', t: 'Экскурсии и вебинары' }
  ];



  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var qi = h.indexOf('?');
    var q = {};
    if (qi > -1) {
      h.slice(qi + 1).split('&').forEach(function (kv) {
        var p = kv.split('=');
        q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
      });
      h = h.slice(0, qi);
    }
    var parts = h.split('/').filter(Boolean).map(decodeURIComponent);
    return { path: parts[0] || '', sub: parts[1] || '', q: q };
  }

  function go(hash) { location.hash = hash; }

  var ALIAS = { genplan: 'flats', types: 'plans', lifestyle: 'client', downloads: 'media', community: 'life' };

  function render() {
    var r = parseHash();
    if (ALIAS[r.path] && !r.sub) {
      location.replace('#/' + ALIAS[r.path] + (location.hash.indexOf('?') > -1 ? location.hash.slice(location.hash.indexOf('?')) : ''));
      return;
    }
    var view = DK.views[r.path] || DK.views.notfound;
    app.innerHTML = view(r);
    document.title = (DK.pageTitle || 'Датский квартал') + ' — партнёрский сайт';
    DK.pageTitle = null;
    markNav(r.path);
    window.scrollTo(0, 0);
    if (DK.afterRender) { DK.afterRender(r); DK.afterRender = null; }
    initReveal();
  }

  function markNav(path) {
    [].forEach.call(document.querySelectorAll('#nav a, #drawer a'), function (a) {
      var p = a.getAttribute('href').replace(/^#\/?/, '').split('?')[0].split('/')[0];
      if (p === path) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function buildNav() {
    document.getElementById('nav').innerHTML = NAV.filter(function (n) { return n.p; }).map(function (n) {
      return '<a href="#/' + n.p + '" title="' + esc(n.t) + '">' + esc(n.s || n.t) + '</a>';
    }).join('');
    document.querySelector('#drawer .wrap').innerHTML = NAV.concat(SUB).map(function (n) {
      return '<a href="#/' + n.p + '">' + esc(n.t) + '</a>';
    }).join('');
    document.getElementById('ftrNav').innerHTML = NAV.slice(1).concat(SUB).map(function (n) {
      return '<li><a href="#/' + n.p + '">' + esc(n.t) + '</a></li>';
    }).join('');
  }

  /* ---------------- Модалка ---------------- */

  function openModal(html) {
    modalWin.innerHTML = '<button class="modal__close" data-close aria-label="Закрыть">×</button>' + html;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    modalWin.scrollTop = 0;
    var f = modalWin.querySelector('button, a, input');
    if (f) f.focus();
  }
  function closeModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  /* ---------------- Лайтбокс ---------------- */

  var LB = { list: [], i: 0 };
  function openLightbox(list, i) {
    LB.list = list; LB.i = i;
    document.getElementById('lightbox').classList.add('is-open');
    document.body.style.overflow = 'hidden';
    paintLightbox();
  }
  function paintLightbox() {
    var it = LB.list[LB.i]; if (!it) return;
    document.getElementById('lbImg').src = it.s;
    document.getElementById('lbCap').textContent =
      (it.t || '') + (LB.list.length > 1 ? '   ' + (LB.i + 1) + ' / ' + LB.list.length : '');
  }
  function stepLightbox(d) { LB.i = (LB.i + d + LB.list.length) % LB.list.length; paintLightbox(); }
  function closeLightbox() {
    document.getElementById('lightbox').classList.remove('is-open');
    if (!document.getElementById('modal').classList.contains('is-open')) document.body.style.overflow = '';
  }

  /* ---------------- Формы ---------------- */

  var FORMS = {
    zakreplenie: {
      title: 'Закрепить клиента',
      lead: 'Проверяем базу и отвечаем в день обращения. Если клиент уже у нас — скажем сразу, а не после сделки.',
      btn: 'Отправить заявку',
      fields: [
        { n: 'agent', l: 'Вы: имя и агентство', req: true, ph: 'Иванова Мария, АН «Пример»' },
        { n: 'agent_phone', l: 'Ваш телефон', req: true, type: 'tel', ph: '+7 ' },
        { n: 'client', l: 'ФИО клиента', req: true, ph: 'Петров Пётр Петрович' },
        { n: 'client_phone', l: 'Телефон клиента', req: true, type: 'tel', ph: '+7 ' },
        { n: 'lot', l: 'Лот или тип (если уже выбран)', ph: 'например, 4-3 или тип B1' },
        { n: 'note', l: 'Комментарий', area: true, ph: 'Бюджет, сроки, что важно клиенту' }
      ]
    },
    raschet: {
      title: 'Запросить расчёт под клиента',
      lead: 'Считаем оба сценария — снижение цены и субсидирование ставки — и присылаем готовый расчёт, который можно показывать клиенту. Обычно в течение дня.',
      btn: 'Запросить расчёт',
      fields: [
        { n: 'agent', l: 'Вы: имя и агентство', req: true },
        { n: 'agent_phone', l: 'Ваш телефон', req: true, type: 'tel', ph: '+7 ' },
        { n: 'lot', l: 'Лот или формат', ph: 'например, 6-6 или дуплекс 92 м²' },
        { n: 'vznos', l: 'Первоначальный взнос', ph: '3 000 000 ₽' },
        { n: 'srok', l: 'Срок кредита', ph: '20 лет' },
        { n: 'deti', l: 'Дети до 18 / до 6 лет', ph: 'двое, младшему 4 года' },
        { n: 'pogashenie', l: 'Как планирует гасить', ph: 'по графику / досрочно примерно за 3 года' },
        { n: 'note', l: 'Комментарий', area: true }
      ]
    },
    ekskursiya: {
      title: 'Записать на показ',
      lead: 'Экскурсия занимает около полутора часов. Показ нашим менеджером на закрепление клиента не влияет.',
      btn: 'Записать',
      fields: [
        { n: 'agent', l: 'Вы: имя и агентство', req: true },
        { n: 'agent_phone', l: 'Ваш телефон', req: true, type: 'tel', ph: '+7 ' },
        { n: 'kogo', l: 'Кого записываем', ph: 'клиента / себя на тур для агентов' },
        { n: 'client', l: 'ФИО клиента' },
        { n: 'when', l: 'Желаемые дата и время', ph: 'суббота, 11:00' },
        { n: 'lot', l: 'Что показать', ph: 'типы или конкретные лоты' },
        { n: 'note', l: 'Комментарий', area: true }
      ]
    },
    tur: {
      title: 'Записаться на тур для агентов',
      lead: 'Раз в две недели: две квартиры разных типов, территория, разбор условий. Полтора часа, без клиентов.',
      btn: 'Записаться',
      fields: [
        { n: 'agent', l: 'Имя и агентство', req: true },
        { n: 'agent_phone', l: 'Телефон', req: true, type: 'tel', ph: '+7 ' },
        { n: 'people', l: 'Сколько человек', ph: '1' },
        { n: 'note', l: 'Вопросы, которые хотите разобрать', area: true }
      ]
    },
    vebinar: {
      title: 'Записаться на вебинар',
      lead: 'Расписание формируется. Оставьте контакты — пришлём дату и ссылку, когда тема будет назначена.',
      btn: 'Записаться',
      fields: [
        { n: 'agent', l: 'Имя и агентство', req: true },
        { n: 'agent_phone', l: 'Телефон или e-mail', req: true },
        { n: 'tema', l: 'Какая тема интереснее', area: true, ph: 'субсидирование / планировки / возражения' }
      ]
    },
    podpiska: {
      title: 'Подписка на обновления',
      lead: 'Раз в неделю — что изменилось в реестре, какие запустились акции и что нового можно взять для своих объявлений.',
      btn: 'Подписаться',
      reklama: true,
      fields: [
        { n: 'agent', l: 'Имя и агентство', req: true },
        { n: 'contact', l: 'Почта или телефон для рассылки', req: true, ph: 'ivanova@mail.ru' }
      ]
    },
    materialy: {
      title: 'Запросить материалы',
      lead: 'Скажите, что нужно под конкретную задачу — соберём и пришлём.',
      btn: 'Отправить запрос',
      fields: [
        { n: 'agent', l: 'Имя и агентство', req: true },
        { n: 'agent_phone', l: 'Телефон или e-mail', req: true },
        { n: 'what', l: 'Что нужно', req: true, area: true, ph: 'фото террас, планировка типа B1 в PDF, текст объявления под дуплекс 92' }
      ]
    }
  };

  function formHTML(key, preset) {
    var f = FORMS[key];
    if (!f) return '';
    var fields = f.fields.map(function (x) {
      var v = preset && preset[x.n] ? esc(preset[x.n]) : '';
      var id = 'f_' + key + '_' + x.n;
      var inp = x.area
        ? '<textarea id="' + id + '" name="' + x.n + '" placeholder="' + esc(x.ph || '') + '">' + v + '</textarea>'
        : '<input id="' + id + '" type="' + (x.type || 'text') + '" name="' + x.n + '" value="' + v + '" placeholder="' + esc(x.ph || '') + '"' + (x.type === 'tel' ? ' inputmode="tel"' : '') + '>';
      return '<div class="fld' + (x.req ? ' is-req' : '') + '">' +
        '<label for="' + id + '">' + esc(x.l) + (x.req ? ' *' : '') + '</label>' + inp +
        '<span class="fld__err">Заполните поле</span></div>';
    }).join('');
    return '<form class="form" data-form="' + key + '" novalidate>' +
      '<div class="fields">' + fields + '</div>' +
      '<label class="consent"><input type="checkbox" name="consent">' +
      '<span>' + (f.reklama
        ? 'Согласен на обработку персональных данных ООО СЗ «Хрустальный Девелопмент» в соответствии с <a href="/policy" target="_blank">политикой</a> и <a href="/agree" target="_blank">согласием</a>.'
        : 'Я согласен на обработку персональных данных — своих и переданных мной данных клиента — в соответствии с <a href="/policy" target="_blank">политикой</a> и <a href="/agree" target="_blank">согласием</a>. Подтверждаю, что получил согласие клиента на передачу его данных застройщику.') +
      '</span></label>' +
      '<span class="fld__err" data-consent-err>Без согласия заявку принять нельзя</span>' +
      (f.reklama
        ? '<label class="consent"><input type="checkbox" name="reklama">' +
          '<span>Согласен получать рекламные и информационные сообщения от ООО СЗ «Хрустальный Девелопмент» по указанному контакту — часть 1 статьи 18 закона «О рекламе». Отозвать согласие можно в любой момент письмом на marketing@hrustalni.ru или по ссылке в письме.</span></label>' +
          '<span class="fld__err" data-reklama-err>Без этого согласия рассылку отправлять нельзя</span>'
        : '') +
      '<div><button class="btn" type="submit">' + esc(f.btn) + '</button></div>' +
      '</form>';
  }

  function formBlock(key, preset) {
    var f = FORMS[key];
    return '<h2>' + esc(f.title) + '</h2><p class="lead">' + esc(f.lead) + '</p>' + formHTML(key, preset);
  }

  function submitForm(form) {
    var key = form.getAttribute('data-form');
    var f = FORMS[key];
    var data = {}, ok = true;

    f.fields.forEach(function (x) {
      var el = form.querySelector('[name="' + x.n + '"]');
      var v = (el.value || '').trim();
      data[x.l] = v;
      var wrap = el.closest('.fld');
      if (x.req && !v) { wrap.classList.add('is-err'); ok = false; }
      else wrap.classList.remove('is-err');
    });

    var consent = form.querySelector('[name="consent"]');
    var cErr = form.querySelector('[data-consent-err]');
    if (!consent.checked) { cErr.style.display = 'block'; ok = false; }
    else cErr.style.display = 'none';

    var rek = form.querySelector('[name="reklama"]');
    var rErr = form.querySelector('[data-reklama-err]');
    if (rek) {
      if (!rek.checked) { rErr.style.display = 'block'; ok = false; }
      else { rErr.style.display = 'none'; data['Согласие на рекламную рассылку'] = 'да, ' + new Date().toLocaleString('ru-RU'); }
    }

    if (!ok) {
      var bad = form.querySelector('.is-err input, .is-err textarea');
      if (bad) bad.focus();
      return;
    }

    var lines = [f.title.toUpperCase(), '— — —'];
    f.fields.forEach(function (x) { if (data[x.l]) lines.push(x.l + ': ' + data[x.l]); });
    var names = f.fields.map(function (x) { return x.l; });
    Object.keys(data).forEach(function (k) {
      if (names.indexOf(k) === -1 && data[k]) lines.push(k + ': ' + data[k]);
    });
    lines.push('Согласие на обработку ПДн: да, ' + new Date().toLocaleString('ru-RU'));
    lines.push('— — —', 'Источник: партнёрский сайт, ' + location.href);
    var payload = lines.join('\n');

    // TODO: когда появится endpoint приёма заявок, отправлять сюда.
    var hook = D.site.formy.webhook;
    if (hook) {
      fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .catch(function () {});
    }

    var mail = 'mailto:' + D.site.formy.otvetstvennyi_email +
      '?subject=' + encodeURIComponent(f.title + ' — партнёрский сайт') +
      '&body=' + encodeURIComponent(payload);
    var tg = 'https://t.me/' + D.site.formy.otvetstvennyi_telegram;

    form.outerHTML =
      '<div class="form__ok">' +
      '<h3>Заявка собрана</h3>' +
      '<p>Приём заявок на сервер ещё не подключён — пока отправьте её одним из способов ниже. Ответ по закреплению даём в день обращения.</p>' +
      '<div class="payload" id="payload">' + esc(payload) + '</div>' +
      '<div class="actions">' +
      '<button class="btn btn--sm" data-copy>Скопировать текст</button>' +
      '<a class="btn btn--sm btn--ghost" href="' + mail + '">Отправить почтой</a>' +
      '<a class="btn btn--sm btn--ghost" href="' + tg + '" target="_blank" rel="noopener">Написать в Telegram</a>' +
      '<a class="btn btn--sm btn--ghost" href="tel:+73952199841">Позвонить</a>' +
      '</div></div>';
  }

  /* ---------------- Reveal ---------------- */

  function initReveal() {
    var els = app.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      [].forEach.call(els, function (e) { e.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    [].forEach.call(els, function (e) { io.observe(e); });
  }

  /* ---------------- Старт ---------------- */

  function start() {
    app = document.getElementById('app');
    modal = document.getElementById('modal');
    modalWin = document.getElementById('modalWin');

    var files = ['registry', 'types', 'infrastructure', 'agents_terms', 'finance', 'site', 'articles', 'video', 'lifestyle', 'media', 'life', 'tour', 'updates', 'competition', 'project'];
    Promise.all(files.map(function (f) {
      return fetch('data/' + f + '.json', { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error(f);
        return r.json();
      });
    })).then(function (res) {
      files.forEach(function (f, i) { D[f] = res[i]; });
      DK.D = D;
      D.registry.lots.sort(function (a, b) { return price(a) - price(b); });
      buildNav();
      [].forEach.call(document.querySelectorAll('[data-obnovleno]'), function (e) {
        e.textContent = D.site.obnovleno;
      });
      render();
      window.addEventListener('hashchange', render);
    }).catch(function (e) {
      app.innerHTML = '<div class="wrap section"><h1>Данные не загрузились</h1>' +
        '<p class="lead">Сайт читает JSON-файлы из папки <code>data/</code>, поэтому его нужно открывать по http, а не двойным кликом по файлу.</p>' +
        '<p>В папке проекта выполните <code>python3 -m http.server 8000</code> и откройте <code>http://localhost:8000</code>.</p>' +
        '<p class="meta meta--dim">Ошибка: ' + esc(e.message) + '</p></div>';
    });

    /* Делегирование событий */
    document.addEventListener('click', function (e) {
      var t = e.target;

      if (t.closest('[data-close]')) { closeModal(); return; }

      var lot = t.closest('[data-lot]');
      if (lot) { DK.openLot(lot.getAttribute('data-lot')); return; }

      var house = t.closest('[data-house]');
      if (house && !house.classList.contains('is-sold')) {
        DK.selectHouse(+house.getAttribute('data-house')); return;
      }

      var g = t.closest('[data-gal]');
      if (g) {
        var box = g.closest('[data-gal-box]');
        openLightbox(JSON.parse(box.getAttribute('data-gal-box')), +g.getAttribute('data-gal'));
        return;
      }
      if (t.closest('[data-lb-close]')) { closeLightbox(); return; }
      if (t.closest('[data-lb-prev]')) { stepLightbox(-1); return; }
      if (t.closest('[data-lb-next]')) { stepLightbox(1); return; }
      if (t.id === 'lightbox') { closeLightbox(); return; }

      var copy = t.closest('[data-copy]');
      if (copy) {
        var p = copy.closest('.form__ok').querySelector('.payload').textContent;
        navigator.clipboard.writeText(p).then(function () {
          copy.textContent = 'Скопировано';
          setTimeout(function () { copy.textContent = 'Скопировать текст'; }, 2000);
        });
        return;
      }

      if (t.closest('#burger')) {
        var d = document.getElementById('drawer');
        var b = document.getElementById('burger');
        var open = d.classList.toggle('is-open');
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        return;
      }
      if (t.closest('#drawer a')) {
        document.getElementById('drawer').classList.remove('is-open');
        document.getElementById('burger').setAttribute('aria-expanded', 'false');
      }
      if (t.closest('#cookieOk')) {
        try { localStorage.setItem('dk_cookie', '1'); } catch (x) {}
        document.getElementById('cookie').classList.remove('is-on');
      }
    });

    document.addEventListener('submit', function (e) {
      if (e.target.matches('[data-form]')) { e.preventDefault(); submitForm(e.target); }
    });

    document.addEventListener('keydown', function (e) {
      var lb = document.getElementById('lightbox');
      if (lb.classList.contains('is-open')) {
        if (e.key === 'Escape') { closeLightbox(); return; }
        if (e.key === 'ArrowLeft') { stepLightbox(-1); return; }
        if (e.key === 'ArrowRight') { stepLightbox(1); return; }
      }
      if (e.key === 'Escape' && modal.classList.contains('is-open')) { closeModal(); return; }
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var h = e.target.closest && e.target.closest('[data-house]');
      if (h && !h.classList.contains('is-sold')) {
        e.preventDefault();
        DK.selectHouse(+h.getAttribute('data-house'));
      }
    });

    /* Sticky CTA появляется после первого экрана */
    var sticky = document.getElementById('stickyCta');
    var last = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      sticky.classList.toggle('is-on', y > 700 && y < document.body.scrollHeight - window.innerHeight - 400);
      last = y;
    }, { passive: true });

    try {
      if (!localStorage.getItem('dk_cookie')) document.getElementById('cookie').classList.add('is-on');
    } catch (x) {}
  }

  return {
    start: start, D: D, esc: esc, nf: nf, money: money, mln: mln, num: num, area: area,
    plural: plural, price: price, status: status, isBron: isBron, outdoor: outdoor,
    commission: commission, RATE: RATE, lotTitle: lotTitle, lotWhere: lotWhere,
    typeOf: typeOf, byId: byId, openModal: openModal, closeModal: closeModal,
    formHTML: formHTML, formBlock: formBlock, go: go, NAV: NAV, SUB: SUB, parseHash: parseHash,
    openLightbox: openLightbox
  };
})();
