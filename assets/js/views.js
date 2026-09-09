/* Датский квартал — представления. Часть 1: общие блоки, генплан, реестр. */
(function () {
  'use strict';
  var esc = DK.esc, money = DK.money, mln = DK.mln, area = DK.area, num = DK.num, nf = DK.nf;
  var price = DK.price, status = DK.status, outdoor = DK.outdoor, commission = DK.commission;

  function d() { return DK.D; }

  /* ---------- мелочи ---------- */

  function badge(l) {
    var s = status(l);
    return '<span class="badge badge--' + s.c + '">' + esc(s.t) + '</span>';
  }
  function note(t, body, kind) {
    return '<div class="note' + (kind ? ' note--' + kind : '') + '">' +
      '<span class="note__t">' + esc(t) + '</span><p>' + body + '</p></div>';
  }
  function photosOf(l) { return (d().media.lots || {})[l.id] || []; }
  function photosOfType(k) { return (d().media.types || {})[k] || []; }

  /* Галерея с лайтбоксом. list — массив {s, th, t} */
  function gallery(list, cls) {
    if (!list || !list.length) return '';
    var payload = esc(JSON.stringify(list.map(function (x) { return { s: x.s, t: x.t }; })));
    return '<div class="gal ' + (cls || '') + '" data-gal-box="' + payload + '">' +
      list.map(function (x, i) {
        return '<button type="button" data-gal="' + i + '" aria-label="' + esc(x.t || 'Фото') + '">' +
          '<img src="' + esc(x.th || x.s) + '" alt="' + esc(x.t || '') + '" loading="lazy">' +
          (x.t ? '<span class="cap">' + esc(x.t) + '</span>' : '') +
          '</button>';
      }).join('') + '</div>';
  }
  DK.gallery = gallery; DK.note = note; DK.badge = badge;
  DK.photosOf = photosOf; DK.photosOfType = photosOfType;

  function tourBlock(t, compact) {
    if (!t || !t.onlain) return '';
    var o = t.onlain;
    return '<div class="tour">' +
      '<div class="tour__b"><h3>Онлайн-экскурсия по этой квартире</h3>' +
      '<p class="small">' + esc(o.opisanie) + '</p>' +
      '<div class="actions" style="margin-top:14px">' +
      '<a class="btn" href="' + esc(o.tur) + '" target="_blank" rel="noopener">Открыть 3D-тур</a>' +
      '<a class="btn btn--ghost" href="' + esc(o.sait) + '" target="_blank" rel="noopener">Лендинг квартиры</a>' +
      '</div>' +
      (compact ? '' : '<div class="pill-row" style="margin-top:14px">' + (o.files || []).map(function (f) {
        return '<a class="pill" href="' + esc(f[1]) + '" target="_blank" rel="noopener">' + esc(f[0]) + '</a>';
      }).join('') + '</div>') +
      '<p class="small" style="margin:14px 0 0">Ссылку можно отправить клиенту: тур открывается в браузере с телефона.</p>' +
      '</div></div>';
  }
  DK.tourBlock = tourBlock;

  function tgUrl(v) { return 'https://t.me/hrustalni138/' + v.id; }
  function videoByType(key) {
    return (d().video.video || []).filter(function (v) { return v.tip === key && v.k !== 'stop'; });
  }
  function videoCard(v) {
    return '<a class="vid" href="' + tgUrl(v) + '" target="_blank" rel="noopener">' +
      '<span class="vid__top"><span class="vid__dur">' + esc(v.dur || '—') + '</span>' +
      (v.tip ? '<span class="badge badge--sub">тип ' + esc(v.tip) + '</span>' : '') +
      (v.k === 'stop' ? '<span class="badge badge--bron">не отправлять</span>' : '') + '</span>' +
      '<span class="vid__t">' + esc(v.t) + '</span>' +
      (v.n ? '<span class="vid__n">' + esc(v.n) + '</span>' : '') +
      '<span class="vid__m">Telegram · ' + esc(v.d || '') + (v.tochno === false ? ' · привязку проверить' : '') + '</span>' +
      '</a>';
  }
  DK.tgUrl = tgUrl; DK.videoByType = videoByType; DK.videoCard = videoCard;

  /* ---------- карточка лота в списке ---------- */

  function lotCard(l) {
    var o = outdoor(l), c = commission(l), ph = photosOf(l);
    var cover = ph.filter(function (p) { return p.k !== 'plan'; })[0] || ph[0];
    return '<button class="lot" data-lot="' + l.id + '">' +
      '<span class="lot__ph' + (cover ? '' : ' lot__ph--empty') + '">' +
      (cover ? '<img src="' + esc(cover.th) + '" alt="" loading="lazy">' : '<span class="lot__noph">Фото готовится</span>') +
      badge(l) + '</span>' +
      '<span class="lot__b">' +
      '<span class="lot__where">' + esc(l.tip_doma) + ', дом ' + l.dom + ', кв. ' + l.kv + ' · ' + l.etazh + ' этаж</span>' +
      '<span class="lot__title">' + esc(l.spalni) + ', ' + area(l.s_klientskaya) + '</span>' +
      '<span class="lot__sub">Тип ' + esc(l.tovarnyi_tip) + ' · ' + esc(l.raspolozhenie) +
      (o.kind ? ' · ' + o.kind + ' ' + num(o.s) + ' м²' : '') +
      (l.uchastok ? ' · участок ' + num(l.uchastok, 0) + ' м²' : '') + '</span>' +
      '<span class="lot__price">' +
      (l.cena_akciya ? '<s>' + money(l.cena_bazovaya) + '</s>' : '') +
      money(price(l)) + '</span>' +
      '<span class="lot__m2">' + nf(l.cena_za_m2_klient) + ' ₽ за м² клиентской площади</span>' +
      '<span class="lot__com">Ваша комиссия <b>' + money(c.deal) + '</b></span>' +
      '</span></button>';
  }
  DK.lotCard = lotCard;

  /* ---------- карточка лота в модалке ---------- */

  DK.openLot = function (id) {
    var l = DK.byId(id); if (!l) return;
    var t = DK.typeOf(l), o = outdoor(l), c = commission(l);
    var sv = d().site.storony_sveta.gruppy.filter(function (g) { return g.doma.indexOf(l.dom) > -1; })[0];
    var mismatch = (l.balkon_ili_terrasa || null) !== o.kind && o.s > 0;
    var ph = photosOf(l);
    var plans = ph.filter(function (p) { return p.k === 'plan'; });
    var pics = ph.filter(function (p) { return p.k !== 'plan'; });
    var vs = videoByType(l.tovarnyi_tip);

    function row(k, v) { return '<dt>' + k + '</dt><dd>' + v + '</dd>'; }

    var html =
      '<p class="eyebrow">Лот ' + esc(l.id) + ' · товарный тип ' + esc(l.tovarnyi_tip) + '</p>' +
      '<h2>' + esc(l.spalni) + ', ' + area(l.s_klientskaya) + '</h2>' +
      '<p class="lead">' + esc(DK.lotWhere(l)) + '. ' + esc(t ? t.name : '') + '</p>' +
      '<div style="margin-bottom:22px">' + badge(l) + '</div>' +

      (l.vss ? note('Квартира вернулась в продажу',
        'Первый этаж' + (l.uchastok ? ' с закреплённым придомовым участком ' + num(l.uchastok, 0) + ' м²' : '') +
        '. Комплект фото и чертёж по этому лоту ещё готовятся — метраж и планировку перед показом сверьте с отделом продаж.', 'warn') : '') +
      (pics.length ? '<h3>Квартира и дом</h3>' + gallery(pics)
        : note('Фото по этому лоту пока нет', 'Съёмка в очереди. Территорию и двор можно показать из <a href="#/media">общей подборки</a>, а формат — по соседнему лоту того же типа.')) +

      '<dl class="kv">' +
      row('Дом и квартира', 'д. ' + l.dom + ', кв. ' + l.kv) +
      row('Тип дома', l.tip_doma + ', ' + l.raspolozhenie) +
      row('Этаж', l.etazh) +
      row('Жилая площадь', area(l.s_zhilaya)) +
      (o.kind ? row(o.kind[0].toUpperCase() + o.kind.slice(1), area(o.s)) : '') +
      row('Приведённая площадь <span class="small">по договору, балкон с коэффициентом 0,3</span>', area(l.s_privedennaya)) +
      row('Клиентская площадь <span class="small">жилая плюс балкон целиком</span>', '<b>' + area(l.s_klientskaya) + '</b>') +
      (l.uchastok ? row('Закреплённый придомовый участок', num(l.uchastok, 0) + ' м²') : '') +
      row('Базовая цена', money(l.cena_bazovaya)) +
      (l.cena_akciya ? row('Цена по акции', '<b>' + money(l.cena_akciya) + '</b>') : '') +
      row('Цена за м² по договору', nf(l.cena_za_m2_dogovor) + ' ₽') +
      row('Цена за м² клиентской площади', nf(l.cena_za_m2_klient) + ' ₽') +
      (sv ? row('Парадный фасад', sv.paradnyi) + row('Дворовый фасад', sv.dvorovyi) : '') +
      '</dl>' +

      (mismatch ? note('Расхождение в данных', 'В реестре по лоту стоит «' + esc(l.balkon_ili_terrasa || '—') +
        '», а по правилу «от 12 м² терраса, от 6 до 12 балкон» при ' + num(o.s) + ' м² это ' + o.kind +
        '. Уточните до показа: клиент померяет сам.', 'warn') : '') +

      '<h3>Ваш доход</h3>' +
      '<dl class="kv">' +
      row('Цена сделки', money(price(l))) +
      row('Комиссия 4,5%', '<b>' + money(c.deal) + '</b>') +
      '</dl>' +
      '<p class="small">Считается от фактической цены договора, включая акционную.</p>' +

      '<h3>Планировка</h3>' +
      (plans.length
        ? gallery(plans, 'gal--wide')
        : '<p class="small">Отдельного чертежа по этой квартире нет. Формат ' + esc(l.tovarnyi_tip) +
          ' есть в общем альбоме планировок.</p><div class="actions" style="margin-top:0">' +
          '<a class="btn btn--ghost btn--sm" href="downloads/' +
          (l.tip_doma === 'МКД' ? 'Планировки новые квартир.pdf' : 'Планировки дуплексов.pdf') +
          '" target="_blank" rel="noopener">Открыть альбом, PDF</a></div>') +

      tourBlock(t, true) +
      (vs.length
        ? '<h3>Видео этого формата</h3><p class="small">Ссылку отправляйте клиенту как есть. Цену в ролике сверьте с реестром.</p><div class="vids">' + vs.map(videoCard).join('') + '</div>'
        : '') +

      '<div class="actions">' +
      '<a class="btn" href="#/terms?form=zakreplenie&lot=' + esc(l.id) + '" data-close>Закрепить клиента на этот лот</a>' +
      '<a class="btn btn--ghost" href="#/finance?form=raschet&lot=' + esc(l.id) + '" data-close>Посчитать ипотеку</a>' +
      (t ? '<a class="btn btn--ghost" href="#/plans/' + esc(l.tovarnyi_tip) + '" data-close>Весь тип ' + esc(l.tovarnyi_tip) + '</a>' : '') +
      '</div>';

    DK.openModal(html);
  };

  /* ---------- генплан ---------- */

  function genplanSVG(activeDom) {
    var gp = d().site.genplan;
    var byHouse = {};
    d().registry.lots.forEach(function (l) { (byHouse[l.dom] = byHouse[l.dom] || []).push(l); });

    var houses = gp.doma.map(function (h) {
      var arr = byHouse[h.dom] || [];
      var sold = arr.length === 0;
      var bx = h.x + h.w - 34, by = h.y - 6;
      return '<g class="gp-h' + (sold ? ' is-sold' : '') + (activeDom === h.dom ? ' is-active' : '') + '" ' +
        'data-house="' + h.dom + '" tabindex="' + (sold ? -1 : 0) + '" role="button" ' +
        'aria-label="Дом ' + h.dom + ': ' + (sold ? 'всё продано' : DK.plural(arr.length, 'свободный лот', 'свободных лота', 'свободных лотов')) + '">' +
        '<rect x="' + h.x + '" y="' + h.y + '" width="' + h.w + '" height="' + h.h + '" rx="8"/>' +
        '<circle class="gp-pin' + (sold ? ' gp-pin--sold' : '') + '" cx="' + bx + '" cy="' + by + '" r="30"/>' +
        '<text class="gp-pin__t" x="' + bx + '" y="' + (by + 11) + '" font-size="32">' + (sold ? '0' : arr.length) + '</text>' +
        '</g>';
    }).join('');

    var free = gp.doma.filter(function (h) { return (byHouse[h.dom] || []).length; }).length;

    return '<div class="gp">' +
      '<p class="gp__hint">Нажмите на дом — реестр отфильтруется по нему. Ещё раз — фильтр снимется.</p>' +
      '<span class="gp__swipe">Схему можно тянуть вбок пальцем.</span>' +
      '<div class="gp__scroll"><div class="gp__stage">' +
      '<img class="gp__img" src="' + esc(gp.image) + '" alt="Генплан Датского квартала">' +
      '<svg class="gp__svg" viewBox="' + gp.viewBox + '" preserveAspectRatio="none">' + houses + '</svg>' +
      '</div></div>' +
      '<div class="gp__bar">' +
      (gp.legenda || []).map(function (l) {
        return '<span class="gp__lg"><i style="background:' + esc(l[0]) + '"></i>' + esc(l[1]) + '</span>';
      }).join('') +
      '<span><b>' + free + ' домов с остатком</b>, серые кружки — всё продано</span>' +
      '</div></div>';
  }
  DK.genplanSVG = genplanSVG;

  /* ---------- фильтры реестра ---------- */

  var F0 = function () {
    return { tip: '', spalni: '', etazh: '', status: '', terrasa: false, balkon: false, uchastok: false, dom: 0, smin: '', smax: '', pmax: '' };
  };
  var F = F0();

  function applyFilters() {
    return d().registry.lots.filter(function (l) {
      var o = outdoor(l), s = status(l);
      if (F.dom && l.dom !== F.dom) return false;
      if (F.tip && l.tovarnyi_tip !== F.tip) return false;
      if (F.spalni && l.spalni !== F.spalni) return false;
      if (F.etazh && String(l.etazh) !== F.etazh) return false;
      if (F.status === 'akciya' && s.c === 'sale') return false;
      if (F.status === 'sale' && s.c !== 'sale') return false;
      if (F.status === 'free' && DK.isBron(l)) return false;
      if (F.terrasa && o.kind !== 'терраса') return false;
      if (F.balkon && o.kind !== 'балкон') return false;
      if (F.uchastok && !l.uchastok) return false;
      if (F.smin && l.s_klientskaya < +F.smin) return false;
      if (F.smax && l.s_klientskaya > +F.smax) return false;
      if (F.pmax && price(l) > +F.pmax * 1e6) return false;
      return true;
    });
  }

  function filtersHTML() {
    var lots = d().registry.lots;
    var uniq = function (k) { var m = {}; lots.forEach(function (l) { m[l[k]] = 1; }); return Object.keys(m).sort(); };
    var opt = function (arr, cur, fmt) {
      return arr.map(function (v) {
        return '<option value="' + esc(v) + '"' + (String(cur) === String(v) ? ' selected' : '') + '>' + esc(fmt ? fmt(v) : v) + '</option>';
      }).join('');
    };
    var sel = function (n, l, body) { return '<div class="f"><label for="f_' + n + '">' + l + '</label><select id="f_' + n + '" data-f="' + n + '">' + body + '</select></div>'; };
    var inp = function (n, l, v) { return '<div class="f"><label for="f_' + n + '">' + l + '</label><input id="f_' + n + '" type="text" inputmode="decimal" data-f="' + n + '" value="' + esc(v) + '"></div>'; };

    return '<div class="filters">' +
      sel('tip', 'Товарный тип', '<option value="">Все девять</option>' + opt(Object.keys(d().types), F.tip, function (t) { return t + ' — ' + d().types[t].name.split('·')[0].trim(); })) +
      sel('spalni', 'Спальни', '<option value="">Сколько угодно</option>' + opt(uniq('spalni'), F.spalni)) +
      sel('etazh', 'Этаж', '<option value="">Любой</option>' + opt(uniq('etazh'), F.etazh, function (v) { return v + ' этаж'; })) +
      sel('status', 'Что со скидкой', '<option value="">Показать всё</option>' +
        '<option value="akciya"' + (F.status === 'akciya' ? ' selected' : '') + '>Акция или субсидия</option>' +
        '<option value="sale"' + (F.status === 'sale' ? ' selected' : '') + '>Без скидки</option>' +
        '<option value="free"' + (F.status === 'free' ? ' selected' : '') + '>Кроме брони</option>') +
      inp('smin', 'Клиентская площадь от, м²', F.smin) +
      inp('smax', 'Клиентская площадь до, м²', F.smax) +
      inp('pmax', 'Цена до, млн ₽', F.pmax) +
      '<div class="f"><label>Что должно быть</label><div class="chips">' +
      '<button class="chip" data-toggle="terrasa" aria-pressed="' + F.terrasa + '">Терраса от 12 м²</button>' +
      '<button class="chip" data-toggle="balkon" aria-pressed="' + F.balkon + '">Балкон</button>' +
      '<button class="chip" data-toggle="uchastok" aria-pressed="' + F.uchastok + '">Участок</button>' +
      '</div></div></div>';
  }

  function resultsHTML() {
    var list = applyFilters();
    var sum = list.reduce(function (a, l) { return a + price(l); }, 0);
    var bar = '<div class="result-bar">' +
      '<b>' + DK.plural(list.length, 'лот', 'лота', 'лотов') + '</b>' +
      '<span>сумма по выборке ' + mln(sum) + '</span>' +
      '<span>комиссия ' + money(sum * DK.RATE) + '</span>' +
      (F.dom ? '<button class="linkbtn" data-clear="dom">снять дом ' + F.dom + '</button>' : '') +
      '<button class="linkbtn" data-clear="all">сбросить всё</button>' +
      '</div>';
    return bar + (list.length
      ? '<div class="lots">' + list.map(lotCard).join('') + '</div>'
      : '<div class="card"><p style="margin:0">Под такие условия ничего нет. <button class="linkbtn" data-clear="all">Сбросить фильтры</button></p></div>');
  }

  function refreshResults() {
    var box = document.getElementById('results');
    if (box) box.innerHTML = resultsHTML();
    var svg = document.querySelector('.gp__svg');
    if (svg) {
      [].forEach.call(svg.querySelectorAll('.gp-h'), function (g) {
        g.classList.toggle('is-active', !!F.dom && +g.getAttribute('data-house') === F.dom);
      });
    }
  }

  DK.selectHouse = function (n) {
    F.dom = (F.dom === n ? 0 : n);
    refreshResults();
    var r = document.getElementById('results');
    if (r && F.dom) r.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  var boundEl = null;
  function bindFilters() {
    var root = document.getElementById('registry');
    if (!root || root === boundEl) return;
    boundEl = root;
    root.addEventListener('change', function (e) {
      var f = e.target.getAttribute('data-f');
      if (f) { F[f] = e.target.value; refreshResults(); }
    });
    root.addEventListener('input', function (e) {
      var f = e.target.getAttribute('data-f');
      if (f && e.target.tagName === 'INPUT') { F[f] = e.target.value; refreshResults(); }
    });
    root.addEventListener('click', function (e) {
      var t = e.target.closest('[data-toggle]');
      if (t) {
        var k = t.getAttribute('data-toggle');
        F[k] = !F[k]; t.setAttribute('aria-pressed', F[k]); refreshResults(); return;
      }
      var c = e.target.closest('[data-clear]');
      if (c) {
        if (c.getAttribute('data-clear') === 'all') { F = F0(); root.innerHTML = registryInner(); }
        else { F.dom = 0; }
        refreshResults();
      }
    });
  }

  function registryInner() { return filtersHTML() + '<div id="results">' + resultsHTML() + '</div>'; }

  DK.setTypeFilter = function (t) { F.tip = t; };
  DK.registryInner = registryInner;
  DK.bindFiltersOnce = bindFilters;
  DK.applyFilters = applyFilters;
  DK.filterState = function () { return F; };
})();

/* Часть 2: страницы. */
(function () {
  'use strict';
  var esc = DK.esc, money = DK.money, mln = DK.mln, area = DK.area, num = DK.num, nf = DK.nf;
  var note = DK.note, gallery = DK.gallery, lotCard = DK.lotCard;
  function d() { return DK.D; }

  function sec(inner, mod) {
    return '<section class="section' + (mod ? ' ' + mod : '') + '"><div class="wrap">' + inner + '</div></section>';
  }
  function secN(inner) { return '<section class="section"><div class="wrap wrap--narrow">' + inner + '</div></section>'; }
  function stat(n, l) { return '<div class="stat"><span class="stat__n">' + n + '</span><span class="stat__l">' + esc(l) + '</span></div>'; }
  function eyebrow(t) { return '<p class="eyebrow">' + esc(t) + '</p>'; }

  function typesSorted() {
    var t = d().types;
    return Object.keys(t).map(function (k) { var o = JSON.parse(JSON.stringify(t[k])); o.key = k; return o; })
      .sort(function (a, b) {
        var oa = a._prioritet_marketinga === 'стоп' ? 99 : a._prioritet_marketinga, ob = b._prioritet_marketinga === 'стоп' ? 99 : b._prioritet_marketinga;
        return (oa - ob) || (b.prays_mln - a.prays_mln);
      });
  }

  function commissionTable() {
    var rows = typesSorted().slice().sort(function (a, b) { return b.cena_akt_do - a.cena_akt_do; }).map(function (t) {
      return '<tr><td>' + esc(t.name) + '</td><td class="n">' + mln(t.cena_akt_ot) + ' — ' + mln(t.cena_akt_do) + '</td>' +
        '<td class="n">' + money(t.cena_akt_ot * DK.RATE) + '</td><td class="n">' + money(t.cena_akt_do * DK.RATE) + '</td></tr>';
    }).join('');
    return '<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Формат</th><th class="n">Цена сделки</th><th class="n">Комиссия от</th><th class="n">Комиссия до</th></tr></thead><tbody>' +
      rows + '</tbody></table></div>' +
      '<p class="small">4,5% от актуальной цены: там, где действует акция, — от акционной. По конкретной квартире сумма стоит в её карточке.</p>';
  }

  function ostatokTable() {
    var g = {};
    d().registry.lots.forEach(function (l) {
      var k = l.tovarnyi_tip;
      var x = g[k] || (g[k] = { n: 0, smin: 1e9, smax: 0, pmin: 1e12, pmax: 0, name: d().types[k].name, key: k });
      x.n++;
      x.smin = Math.min(x.smin, l.s_klientskaya); x.smax = Math.max(x.smax, l.s_klientskaya);
      x.pmin = Math.min(x.pmin, l.cena_bazovaya); x.pmax = Math.max(x.pmax, l.cena_bazovaya);
    });
    var rows = Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return b.pmax - a.pmax; })
      .map(function (x) {
        return '<tr><td><a href="#/plans/' + x.key + '">' + esc(x.name) + '</a></td>' +
          '<td class="n">' + x.n + '</td><td class="n nowrap">' + num(x.smin) + '–' + num(x.smax) + ' м²</td>' +
          '<td class="n nowrap">' + mln(x.pmin) + ' — ' + mln(x.pmax) + '</td></tr>';
      }).join('');
    return '<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Формат</th><th class="n">Лотов</th><th class="n">Площадь</th><th class="n">Базовая цена</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function shpargalkaTable() {
    var rows = d().site.shpargalka_metrazhi.map(function (r) {
      return '<tr><td>' + esc(r.format) + '</td><td class="n">' + esc(r.kg) + '</td><td class="n">' + esc(r.spalni) + '</td><td class="n">' + esc(r.sanuzly) + '</td><td class="n">' + esc(r.terrasa) + '</td></tr>';
    }).join('');
    return '<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Формат</th><th class="n">Кухня-гостиная</th><th class="n">Спальни</th><th class="n">Санузлы</th><th class="n">Терраса</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function oshibkiBlock() {
    return '<div class="grid g2">' + d().site.gde_oshibayutsya.map(function (o) {
      return '<div class="card"><h4>' + esc(o.t) + '</h4><p class="small" style="margin:0">' + esc(o.d) + '</p></div>';
    }).join('') + '</div>';
  }
  var WIDGETS = { ostatok: ostatokTable, shpargalka: shpargalkaTable, oshibki: oshibkiBlock, komissiya: commissionTable };

  function updatesBlock(limit, compact) {
    var U = d().updates;
    var list = U.zhurnal.slice(0, limit || 99);
    return '<div class="upd">' + list.map(function (x) {
      return '<a class="up" href="' + esc(x.href) + '">' +
        '<span class="up__top"><span class="up__d">' + esc(x.d.split('-').reverse().join('.')) + '</span>' +
        '<span class="up__r">' + esc(x.r) + '</span>' +
        (x.new ? '<span class="badge badge--akciya">новое</span>' : '') + '</span>' +
        '<span class="up__t">' + esc(x.t) + '</span>' +
        (compact ? '' : '<span class="up__n">' + esc(x.d2) + '</span>') +
        '</a>';
    }).join('') + '</div>';
  }
  DK.updatesBlock = updatesBlock;

  function commonBy(kind, n) {
    return (d().media.common || []).filter(function (c) { return !kind || c.k === kind; }).slice(0, n || 99);
  }

  /* Раскладывает фото по кругу из нескольких групп: подряд не идут два кадра одного вида */
  function mix(groups) {
    var out = [], i = 0, left = true;
    while (left) {
      left = false;
      for (var g = 0; g < groups.length; g++) {
        if (groups[g][i]) { out.push(groups[g][i]); left = true; }
      }
      i++;
    }
    return out;
  }

  /* ================= Главная ================= */
  function home() {
    var r = d().registry, s = d().site, t = d().agents_terms;
    var big = r.lots.filter(function (l) { return l.s_klientskaya >= 76; });
    var akc = r.lots.filter(function (l) { return DK.status(l).c !== 'sale'; });
    var uch = r.lots.filter(function (l) { return l.uchastok; });
    var maxCom = Math.max.apply(null, r.lots.map(function (l) { return (l.cena_akciya || l.cena_bazovaya) * DK.RATE; }));
    var minPrice = Math.min.apply(null, r.lots.map(function (l) { return l.cena_akciya || l.cena_bazovaya; }));

    var hero = mix([
      commonBy('lyudi', 4),
      commonBy('les', 3),
      commonBy('dvor', 3),
      commonBy('sport', 3),
      commonBy('terrasa', 2),
      commonBy('arh', 3),
      commonBy('zaliv', 1),
      commonBy('dom', 2),
      commonBy('balkon', 1),
      commonBy('aero', 1),
      commonBy('uchastok', 1)
    ]).slice(0, 24);

    var tasks = [
      ['Найти квартиру под клиента', 'Генплан, живой реестр, фильтры по спальням, террасе и участку. Фото есть почти по каждому лоту — отправляйте клиенту прямо отсюда.', '#/flats', 'Открыть реестр'],
      ['Подготовиться к показу', 'Семь типов покупателей, маршрут показа из десяти шагов, тринадцать возражений с дословными ответами.', '#/client', 'Что говорить'],
      ['Посчитать деньги', 'Ваша комиссия по каждому лоту, четыре сценария покупки и подсказка, какой из них выгоднее конкретному клиенту.', '#/terms', 'Условия и расчёты'],
      ['Забрать материалы', 'Планировки в PDF, 65 роликов из канала, фото квартир и террас. Ставьте в свои объявления.', '#/media', 'Скачать']
    ];

    var kozyri = [
      ['Кухня-гостиная 34–42 м²', 'В городской трёшке на 77 метров кухня будет 12–14. Разница в двадцать метров — это и есть то, за что клиент платит, только он пока об этом не знает.'],
      ['Два санузла возможны уже с 63 м²', 'Планировка позволяет развести второй санузел начиная с 63 метров — на рынке такая возможность обычно появляется от восьмидесяти. Отделка черновая, поэтому клиент решает сам, но проект это допускает.'],
      ['Терраса от 12 м²', 'По площади это отдельная комната под открытым небом. В договоре терраса учитывается с коэффициентом 0,3: клиент платит примерно за треть площади, а пользуется целиком.'],
      ['Больше 30 событий в год', 'Масленица, Пасхальный квест пятый год подряд, детская ярмарка, ХП-ФЕСТ на 250 гостей, общий новогодний салют. Половину придумывают сами жители — такое не строится вместе с домом.'],
      ['Участок 60 м² у первых этажей', DK.plural(uch.length, 'лот', 'лота', 'лотов') + ' с закреплённым придомовым участком. Для клиента, который «хотел дом», это единственный аргумент, который работает сразу.'],
      ['Ключи после сделки', 'Квартал сдан в декабре 2025-го. Ремонт можно начинать на следующий день — никакого котлована и переносов срока.'],
      ['Лес в ста метрах', 'Залив Щучий примерно в пятистах, до центра Иркутска пятнадцать минут по шестиполосной трассе.']
    ];

    return sec(
      eyebrow('Партнёрам · реестр от ' + esc(s.obnovleno)) +
      '<h1>Объект, который продаёт себя сам. Ваша задача — привезти клиента</h1>' +
      '<p class="lead">«Хрустальный парк» — девять кварталов на Байкальском тракте, больше трёх тысяч жителей. Датский сдан в декабре 2025-го: дома заселены, деревья растут, во дворах гуляют дети. Магазин, пекарня, кафе, ФАП, аптека и садик — пешком, до сорока с лишним секций Байкал-Арены четырнадцать минут, лес в ста метрах, залив примерно в пятистах. Больше тридцати событий в год, и половину придумывают сами жители.</p>' +
      '<p class="lead">В вашем списке жилых комплексов второго такого нет, и это ваш аргумент. Уговаривать не придётся: покажите двор без машин, террасу на закате и соседей, которые здороваются. Через год клиент возвращается с рекомендацией, а не с претензией. Комиссия — 4,5% от цены договора, закрепление на 60 дней, персональный менеджер ведёт сделку вместе с вами.</p>' +
      '<div class="actions" style="margin-bottom:34px">' +
      '<a class="btn" href="#/flats">Открыть реестр</a>' +
      '<a class="btn btn--ghost" href="#/tour">Фотоэкскурсия</a>' +
      '</div>' +
      gallery(hero, 'gal--wide') +
      '<div class="grid g4">' +
      stat(r.vsego_lotov, 'квартир в остатке') +
      stat(mln(minPrice).replace(' млн', '') + ' млн', 'самая доступная') +
      stat('4,5%', 'ваша комиссия') +
      stat('до ' + nf(Math.round(maxCom / 1000)) + ' тыс', 'с одной сделки') +
      '</div>'
    ) +

    sec(
      eyebrow('История для показа') +
      '<h2>Расскажите это, когда клиент спросит про соседей</h2>' +
      '<blockquote>В чате квартала вечером написали: срочно нужен детский колпак, завтра фотосессия на день рождения. Через десять минут колпак нашёлся у соседей из дома напротив. Наутро его вернули — с шоколадкой.</blockquote>' +
      '<p class="lead">Эта история отвечает на страх, который клиент почти никогда не проговаривает вслух: переехать за город и оказаться одному среди чужих людей за забором. Ни один список преимуществ на этот страх не отвечает, а короткий случай из жизни — отвечает.</p>' +
      '<p class="lead">Дальше добавьте цифры. Больше тридцати событий в год, Пасхальный квест пятый год подряд, детская ярмарка в конце августа, ХП-ФЕСТ на 250 гостей. Половину придумывают сами жители, застройщик только помогает.</p>' +
      '<div class="grid g4">' +
      '<div class="card"><h4>Больше 30 событий в год</h4><p class="small" style="margin:0">Масленица, Пасха, День здоровья, фестиваль детских талантов, Хэллоуин, общий новогодний салют.</p></div>' +
      '<div class="card"><h4>Всё нужное пешком</h4><p class="small" style="margin:0">Магазины, пекарня с рейтингом 4,8, кафе, ФАП, аптека, пункты выдачи, частный садик, парикмахерская, лыжная мастерская. Репетиторы и детские занятия — тоже внутри микрорайона.</p></div>' +
      '<div class="card"><h4>Девять кварталов вместо одного двора</h4><p class="small" style="margin:0">Гуляют по всему микрорайону, а не по своему периметру. Озеленение — больше половины территории.</p></div>' +
      '<div class="card"><h4>Двор без машин</h4><p class="small" style="margin:0">Парковки вынесены по периметру, коэффициент 1,6 на квартиру — вдвое выше городского.</p></div>' +
      '</div>' +
      '<div class="actions"><a class="btn btn--ghost" href="#/life">Год в квартале и истории соседей</a>' +
      '<a class="btn btn--ghost" href="#/about">Как это построено</a></div>',
      'section--alt'
    ) +

    sec(
      eyebrow('Окружение') +
      '<h2>Лес в ста метрах, залив — в пятистах</h2>' +
      '<p class="lead">На показе выведите клиента за ворота. Сосны начинаются сразу за домами, до берега залива Щучьего идти минут семь. Рыбалка на закате, сап, лыжня зимой — здесь это вечер после работы, а не вылазка на выходные, к которой полдня собираешься.</p>' +
      '<p class="lead">Городской покупатель редко проговаривает это вслух, но смотрит загород именно за этим. Дом на участке даёт ему землю и забирает вечера на её обслуживание. Здесь за территорию отвечает управляющая компания, а вечер остаётся клиенту.</p>' +
      '<div class="grid g4">' +
      '<div class="card"><h4>Залив Щучий</h4><p class="small" style="margin:0">Пятьсот метров до берега. Летом рыбалка, сап и купание, зимой лёд и лыжня. По соседству на заливе работает яхт-клуб — адрес уточняйте в отделе продаж перед показом.</p></div>' +
      '<div class="card"><h4>Сосновый лес</h4><p class="small" style="margin:0">Начинается в ста метрах от квартала. Пробежка, велосипед, грибы — маршрут стартует от подъезда. Зимой по лесу идёт лыжня, а в микрорайоне работает лыжная мастерская.</p></div>' +
      '<div class="card"><h4>Спорт по всем девяти кварталам</h4><p class="small" style="margin:0">Воркаут-площадки, спортивные коробки с покрытием, теннисные столы. Житель Датского ходит на любую: микрорайон общий, гуляют по всей территории.</p></div>' +
      '<div class="card"><h4>Байкал-Арена за 14 минут</h4><p class="small" style="margin:0">Больше сорока секций для детей от трёх лет, бассейн 25 метров, залы и сауна. Две поездки в неделю вместо ежедневного городского маршрута по трём адресам.</p></div>' +
      '</div>' +
      gallery(mix([commonBy('zaliv'), commonBy('les'), commonBy('sport'), commonBy('arh')]), 'gal--wide') +
      '<div class="actions"><a class="btn btn--ghost" href="#/park">Что вокруг: три пояса инфраструктуры</a>' +
      '<a class="btn btn--ghost" href="#/life">Как здесь живут круглый год</a></div>'
    ) +

    (function () {
      var N = d().project.nagrady.list;
      return sec(
        eyebrow('Чем снять недоверие за десять секунд') +
        '<h2>Три года подряд забираем федеральные награды</h2>' +
        '<div class="grid g4">' + N.map(function (n) {
          return '<div class="award award--sm"><span class="award__y">' + esc(n.y) + '</span>' +
            '<h4>' + esc(n.t) + '</h4><p class="award__n">' + esc(n.n) + '</p></div>';
        }).join('') + '</div>' +
        '<p class="small" style="margin-top:14px">Стройку финансирует ПАО «Сбербанк», деньги покупателей до передачи ключей лежат на эскроу по 214-ФЗ. <a href="#/about">Все доказательства качества →</a></p>'
      );
    })() +
    sec(
      '<h2>С чего начать</h2>' +
      '<div class="grid g4">' + tasks.map(function (x) {
        return '<div class="card"><h3>' + esc(x[0]) + '</h3><p class="small">' + esc(x[1]) + '</p>' +
          '<a href="' + x[2] + '">' + esc(x[3]) + ' →</a></div>';
      }).join('') + '</div>',
      'section--alt'
    ) +

    sec(
      eyebrow('Ваши козыри') +
      '<h2>Шесть аргументов, которые решают на показе</h2>' +
      '<p class="lead">Каждый — конкретный и в цифрах. Их достаточно, чтобы клиент перестал считать одну только цену за метр.</p>' +
      '<div class="grid g3">' + kozyri.map(function (k) {
        return '<div class="card"><h4>' + esc(k[0]) + '</h4><p class="small" style="margin:0">' + esc(k[1]) + '</p></div>';
      }).join('') + '</div>' +
      '<div class="actions"><a class="btn btn--ghost" href="#/plans">Метражи по всем форматам</a>' +
      '<a class="btn btn--ghost" href="#/client">Ответы на возражения</a></div>'
    ) +


    (function () {
      var C = d().competition;
      return sec(
        eyebrow('Разговор про альтернативы') +
        '<h2>Когда клиент начинает сравнивать</h2>' +
        '<p class="lead">' + esc(C.glavnoe) + '</p>' +
        '<div class="grid g2">' +
        '<div class="card card--pad"><h3>Против дома на участке</h3>' +
        '<p class="small">Центральные сети и канализация в городские очистные, ливнёвка, уличное освещение, парковок 1,6 на квартиру и двор без машин. Магазин, пекарня, ФАП, аптека и садик — пешком. В доме за те же деньги всего этого нет, и достраивать это придётся годами.</p>' +
        '<a href="#/client">Таблица сравнения →</a></div>' +
        '<div class="card card--pad"><h3>Против городской квартиры</h3>' +
        '<p class="small">Кафе рядом меньше — признаём сразу. Зато исчезают пробка по дороге домой, круги по двору в поисках парковки и триста соседей за стеной. До Байкал-Арены отсюда 14 минут и два светофора, а из городского комплекса в четырёх километрах — 11 минут и пять.</p>' +
        '<a href="#/client">Аргументы целиком →</a></div>' +
        '</div>' +
        '<div class="actions"><a class="btn" href="#/client">Как выигрывать сравнение</a>' +
        '<a class="btn btn--ghost" href="#/plans">Что внутри квартир</a></div>'
      ) +
      sec(
        eyebrow('Разговор о сроке') +
        '<h2>' + esc(C.srochnost.title) + '</h2>' +
        '<div class="grid g4">' + C.srochnost.punkty.map(function (p) {
          return '<div class="card"><h4>' + esc(p.t) + '</h4><p class="small" style="margin:0">' + esc(p.d) + '</p></div>';
        }).join('') + '</div>' +
        '<blockquote style="margin-top:22px">' + esc(C.srochnost.kak_govorit) + '</blockquote>' +
        '<p class="small">Конкретный рост цены в процентах и будущие ставки не обещаем. Подробнее — в разделе «Работа с клиентом».</p>',
        'section--alt'
      );
    })() +
    sec(
      eyebrow('Как вы получаете деньги') +
      '<h2>Комиссия 4,5% — всегда и сразу</h2>' +
      '<p class="lead">Клиент выбирает что-то одно: скидку с цены или субсидированную ставку. Между собой они не складываются, но на вашу комиссию не влияют ни та, ни другая — 4,5% считаются от фактической цены договора.</p>' +
      '<div class="grid g3">' +
      '<div class="card"><h4>Считаем от цены сделки</h4><p class="small" style="margin:0">Если по квартире идёт акция, 4,5% берутся от акционной цены. Сумма посчитана в карточке каждой квартиры — гадать не нужно.</p></div>' +
      '<div class="card"><h4>Закрепление на 60 дней</h4><p class="small" style="margin:0">Плюс 30 при состоявшемся показе или брони. Проверка по CRM в день обращения, отказ — если клиент приходил напрямую в последние 90 дней.</p></div>' +
      '<div class="card"><h4>Персональный менеджер</h4><p class="small" style="margin:0">Ведёт вас от заявки до регистрации: оформление, согласования, ответы клиенту. Вы приводите покупателя, бумаги на нас.</p></div>' +
      '</div>' +
      '<div class="actions"><a class="btn" href="#/terms">Все условия целиком</a>' +
      '<a class="btn btn--ghost" href="#/terms?form=zakreplenie">Закрепить клиента</a></div>',
      'section--dark'
    ) +

    sec(
      eyebrow('Что в продаже') +
      '<h2>Девять форматов, ' + r.vsego_lotov + ' квартир</h2>' +
      '<p class="lead">Внутри формата планировка одна и та же — меняются номер дома и цена. Девять форматов, и это весь квартал.</p>' +
      ostatokTable() +
      '<div class="actions"><a class="btn btn--ghost" href="#/plans">Разобрать по типам</a><a class="btn btn--ghost" href="#/flats">Посмотреть на генплане</a></div>'
    ) +

    sec(
      '<div class="grid g2">' +
      '<div class="card card--pad"><h3>Большой формат: ' + DK.plural(big.length, 'лот', 'лота', 'лотов') + ' от 76 м²</h3>' +
      '<p class="small">Квартир с четырьмя спальнями осталось ' + r.lots.filter(function (l) { return l.spalni === '4 спальни'; }).length +
      ', с тремя — ' + r.lots.filter(function (l) { return l.spalni === '3 спальни'; }).length +
      '. В Иркутске такой метраж под ключ на готовом объекте предложить почти некому. Одна такая сделка — больше 700 тысяч вам.</p>' +
      '<a href="#/flats">Показать эти лоты →</a></div>' +
      '<div class="card card--pad"><h3>' + DK.plural(akc.length, 'лот', 'лота', 'лотов') + ' со скидкой или субсидией</h3>' +
      '<p class="small">Скидка и субсидирование ставки не суммируются: клиент берёт что-то одно, а посчитать надо оба. Пришлите взнос, срок и возраст детей — вернём расчёт в тот же день, его можно показывать.</p>' +
      '<a href="#/finance">Как это устроено →</a></div>' +
      '</div>'
    ) +

    sec(
      eyebrow('Обновлено на этой неделе') +
      '<h2>Что нового</h2>' +
      DK.updatesBlock(3, true) +
      '<div class="actions"><a class="btn btn--ghost" href="#/media">Весь журнал обновлений</a>' +
      '<a class="btn btn--ghost" href="#/media?form=podpiska">Подписаться</a></div>'
    ) +
    sec(
      '<h2>Закрепить клиента</h2>' +
      '<p class="lead">Базу проверяем в день обращения. Если клиент уже у нас — скажем сразу, а не после сделки. Срок закрепления ' + t.zakreplenie.srok_dney + ' дней, продлеваем, пока вы работаете.</p>' +
      DK.formHTML('zakreplenie'),
      'section--alt'
    );
  }

  /* ================= Квартиры и генплан ================= */
  function flats(r) {
    var s = d().site;
    if (r.q.tip) DK.setTypeFilter(r.q.tip);
    DK.afterRender = function () { DK.bindFiltersOnce(); };
    return sec(
      eyebrow('Реестр от ' + esc(d().site.obnovleno)) +
      '<h1>Квартиры и генплан</h1>' +
      '<p class="lead">Нажмите на дом — реестр отфильтруется по нему. Нажмите на квартиру — откроется карточка с фото, планировкой, сторонами света и вашей комиссией в рублях. Реестр здесь тот же, что у отдела продаж.</p>' +
      DK.genplanSVG() +
      '<div id="registry" style="margin-top:32px">' + DK.registryInner() + '</div>'
    ) +
    sec(
      eyebrow('Свет и вид') +
      '<h2>Что куда выходит</h2>' +
      '<p class="lead">' + esc(s.storony_sveta.orientaciya) + '</p>' +
      '<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Группа домов</th><th>Парадный фасад</th><th>Дворовый фасад</th></tr></thead><tbody>' +
      s.storony_sveta.gruppy.map(function (g) {
        return '<tr><td>' + esc(g.podpis) + '</td><td>' + esc(g.paradnyi) + '</td><td>' + esc(g.dvorovyi) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="grid g2">' +
      '<div class="card"><h4>Лучший свет и вид</h4><p class="small" style="margin:0">' + esc(s.storony_sveta.luchshee) + '</p></div>' +
      '<div class="card"><h4>Про что сказать первым</h4><p class="small" style="margin:0">' + esc(s.storony_sveta.ogranichenie) + '</p></div>' +
      '</div>',
      'section--alt'
    ) +
    (function () {
      var aero = d().media.aero || [];
      return aero.length ? sec(
        '<h2>Квартал с высоты</h2>' +
        '<p class="lead">Летняя съёмка на закате: видно и залив на горизонте, и то, что двор действительно без машин. Хороший кадр для объявления.</p>' +
        gallery(aero, 'gal--wide')
      ) : '';
    })();
  }

  /* ================= Планировки и типы ================= */
  var PLAN_STATUS = [
    ['A', 'Дуплекс 64 м²', 'Фото и планировка есть, 3D нет'],
    ['B1', 'Дуплекс 92 м², 4 спальни', 'Фото и две планировки (3 и 4 спальни), 3D нет'],
    ['B2', 'Дуплекс 92 м², 2 спальни', 'Фото и планировка есть, 3D нет'],
    ['C', 'МКД 63 м²', 'Фото по квартирам есть, в сводной пометка СНЯТЬ'],
    ['D', 'МКД 66–67 м²', 'Полный комплект, квартира подготовлена к показу'],
    ['E', 'МКД 39–42 м²', 'Фото по квартирам есть, 3D нет'],
    ['F', 'Дуплекс 77 м²', 'Фото и планировка есть, оффера нет'],
    ['G', 'Дуплекс 79–80 м²', 'Боковая и средняя сняты отдельно, 3D нет'],
    ['H', 'МКД 55–62 м²', 'Фото по квартирам есть, 3D нет']
  ];

  function plans(r) {
    if (r.sub) return typeOne(r.sub);
    var list = typesSorted();
    return sec(
      eyebrow('Девять форматов') +
      '<h1>Планировки и типы</h1>' +
      '<p class="lead">Клиент придёт с цифрой общей площади в голове. Ваша работа — показать, как эти метры разложены: восемьдесят в городе и восемьдесят здесь дают разную жизнь. Форматов всего девять, и подбор после этого занимает минуту.</p>' +
      '<div class="rows">' + list.map(function (t) {
        var ph = DK.photosOfType(t.key)[0];
        return '<a href="#/plans/' + t.key + '">' +
          '<div class="row__top"><span class="small">Тип ' + t.key + ' · ' + DK.plural(t.lotov, 'квартира', 'квартиры', 'квартир') + ' в продаже</span>' +
          (t.shourum ? '<span class="badge badge--sub">показ: ' + esc(t.shourum) + '</span>' : '') + '</div>' +
          '<h3 style="margin-bottom:6px">' + esc(t.name) + '</h3>' +
          '<p class="small" style="margin:0 0 8px">' + esc(t.offer) + '</p>' +
          '<p class="small" style="margin:0">' + DK.plural(t.lotov, 'лот', 'лота', 'лотов') + ' · ' + mln(t.cena_ot) + ' — ' + mln(t.cena_do) + ' · комиссия от ' + money(t.cena_ot * DK.RATE) + '</p>' +
          '</a>';
      }).join('') + '</div>'
    ) +
    sec(
      '<h2>Шпаргалка по метражам</h2>' +
      '<p class="lead">Сохраните на телефон. На показе клиент достаёт рулетку и считает сам — отвечать надо сразу и точно.</p>' +
      shpargalkaTable(),
      'section--alt'
    ) +
    sec(
      '<h2>Где легко ошибиться</h2>' +
      '<p class="lead">Девять мест, на которых агенты спотыкаются чаще всего. Прочитайте до первого показа.</p>' +
      oshibkiBlock()
    ) +
    sec(
      '<h2>Как построен дом</h2>' +
      '<p class="lead">Цифры, которые клиент проверит и которые стоит называть точно.</p>' +
      '<div class="tbl-scroll"><table class="tbl"><tbody>' +
      (d().site.tehnika || []).map(function (r) {
        return '<tr><td style="width:38%"><b>' + esc(r[0]) + '</b></td><td>' + esc(r[1]) + '</td></tr>';
      }).join('') + '</tbody></table></div>',
      'section--alt'
    ) +
    sec(
      '<h2>Что готово по типам</h2>' +
      '<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Тип</th><th>Формат</th><th>Материалы</th><th></th></tr></thead><tbody>' +
      PLAN_STATUS.map(function (p) {
        return '<tr><td>' + p[0] + '</td><td>' + esc(p[1]) + '</td><td>' + esc(p[2]) + '</td><td><a href="#/plans/' + p[0] + '">открыть</a></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="actions"><a class="btn btn--ghost" href="downloads/Планировки новые квартир.pdf" target="_blank">Планировки квартир, PDF</a>' +
      '<a class="btn btn--ghost" href="downloads/Планировки дуплексов.pdf" target="_blank">Планировки дуплексов, PDF</a></div>'
    );
  }

  function typeOne(key) {
    var t = d().types[key];
    if (!t) return notfound();
    DK.pageTitle = 'Тип ' + key;
    var lots = d().registry.lots.filter(function (l) { return l.tovarnyi_tip === key; });
    var ph = DK.photosOfType(key);
    var plansPh = ph.filter(function (p) { return p.k === 'plan'; });
    var pics = ph.filter(function (p) { return p.k !== 'plan'; });
    var vs = DK.videoByType(key);

    return sec(
      '<p class="eyebrow"><a href="#/plans">Планировки</a> · тип ' + esc(key) + '</p>' +
      '<h1>' + esc(t.name) + '</h1>' +
      '<p class="lead">' + esc(t.offer) + '</p>' +
      '<div class="grid g4">' +
      stat(t.lotov, 'лотов') + stat(mln(t.cena_ot), 'цена от') +
      stat(num(t.prays_mln, 1) + ' млн', 'прайс типа') + stat(money(t.cena_akt_ot * DK.RATE), 'ваша комиссия от') +
      '</div>' +
      (t.vnimanie ? note('Уточнить перед показом', esc(t.vnimanie), 'warn') : '') +
      '<div class="grid g2" style="margin-top:20px">' +
      '<div class="card"><h4>Кому показываем</h4><p class="small" style="margin:0">' + (t.komu && t.komu !== '—' ? esc(t.komu) : 'Показываем как альтернативу по площади и цене тем, кто смотрел соседний формат.') + '</p></div>' +
      '<div class="card"><h4>Квартира, подготовленная к показу</h4><p class="small" style="margin:0">' + (t.shourum ? esc(t.shourum) : 'По этому типу подготовленной квартиры нет. Показываем по фото и планировке либо соседний тип в том же доме.') + '</p></div>' +
      '</div>'
    ) +
    (t.onlain ? sec(DK.tourBlock(t)) : '') +
    (pics.length ? sec('<h2>Как это выглядит</h2>' + gallery(pics), 'section--alt') : '') +
    (plansPh.length ? sec('<h2>Планировка</h2>' + gallery(plansPh, 'gal--wide')) : '') +
    (vs.length ? sec('<h2>Видео этого типа</h2><p class="lead">Ссылка открывается в Telegram без установки приложения. Цены в роликах сверяйте с реестром.</p><div class="vids">' + vs.map(DK.videoCard).join('') + '</div>') : '') +
    sec('<h2>Лоты этого типа</h2><div class="lots">' + lots.map(lotCard).join('') + '</div>');
  }

  /* ================= Что говорить клиенту ================= */
  function client() {
    var L = d().lifestyle;
    var P = L.pervyi_razgovor, M = L.marshrut_pokaza, PF = L.podbor_formata;

    return sec(
      eyebrow('Ваш сценарий разговора') +
      '<h1>Работа с клиентом</h1>' +
      '<p class="lead">' + esc(L.chto_prodaem) + '</p>' +
      '<p class="lead">Ниже — весь путь: какие вопросы задать в первом разговоре, в каком порядке вести по территории, что отвечать на «дорого» и «далеко». Читается за двадцать минут, работает на первом же показе.</p>'
    ) +

    sec(
      eyebrow('Инструмент номер один') +
      '<h2>' + esc(P.title) + '</h2>' +
      '<p class="lead">' + esc(P.lead) + '</p>' +
      '<blockquote>' + esc(P.pravilo) + '</blockquote>' +
      P.stupeni.map(function (st) {
        return '<div class="step">' +
          '<div class="step__h"><span class="step__n">' + st.n + '</span>' +
          '<div><h3>' + esc(st.t) + '</h3><p class="small" style="margin:0">' + esc(st.d) + '</p></div></div>' +
          '<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Спрашиваете</th><th>Что это вскрывает</th></tr></thead><tbody>' +
          st.q.map(function (q) {
            return '<tr><td><b>' + esc(q[0]) + '</b></td><td>' + esc(q[1] || '—') + '</td></tr>';
          }).join('') + '</tbody></table></div>' +
          (st.posle ? note('Дальше — тишина', esc(st.posle), 'warn') : '') +
          '</div>';
      }).join('') +
      '<h3>Как свести всё вместе</h3>' +
      '<blockquote>' + esc(P.svodka) + '</blockquote>' +
      '<p class="small">' + esc(P.svodka_note) + '</p>',
      'section--alt'
    ) +


    (function () {
      var C = d().competition;
      return sec(
        eyebrow('Как выигрывать сравнение') +
        '<h2>С чем нас сравнивают</h2>' +
        '<p class="lead">' + esc(C.lead) + '</p>' +
        '<blockquote>' + esc(C.glavnoe) + '</blockquote>'
      ) +
      sec(
        '<h2>' + esc(C.dom.title) + '</h2>' +
        '<p class="lead">' + esc(C.dom.lead) + '</p>' +
        '<blockquote>' + esc(C.dom.vopros) + '</blockquote>' +
        '<div class="tbl-scroll"><table class="tbl"><thead><tr><th></th><th>Дом за те же деньги</th><th>Квартира в Датском</th></tr></thead><tbody>' +
        C.dom.table.map(function (r) {
          return '<tr><td><b>' + esc(r[0]) + '</b></td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<h3>Фразы, которые работают</h3>' +
        '<ul class="list-a">' + C.dom.frazy.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>',
        'section--alt'
      ) +
      sec(
        '<h2>' + esc(C.gorod.title) + '</h2>' +
        '<p class="lead">' + esc(C.gorod.lead) + '</p>' +
        note('Признаём вслух и первыми', esc(C.gorod.priznanie)) +
        '<blockquote>' + esc(C.gorod.vopros) + '</blockquote>' +
        '<div class="grid g2">' + C.gorod.argumenty.map(function (a) {
          return '<div class="card"><h4>' + esc(a.t) + '</h4><p class="small" style="margin:0">' + esc(a.d) + '</p></div>';
        }).join('') + '</div>' +
        '<ul class="list-a" style="margin-top:20px">' + C.gorod.frazy.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'
      ) +
      sec(
        '<h2>' + esc(C.srochnost.title) + '</h2>' +
        '<p class="lead">' + esc(C.srochnost.lead) + '</p>' +
        '<div class="grid g2">' + C.srochnost.punkty.map(function (p) {
          return '<div class="card"><h4>' + esc(p.t) + '</h4><p class="small" style="margin:0 0 8px">' + esc(p.d) + '</p>' +
            '<span class="pill">' + esc(p.status) + '</span></div>';
        }).join('') + '</div>' +
        '<h3>Как это произнести</h3>' +
        '<blockquote>' + esc(C.srochnost.kak_govorit) + '</blockquote>' +
        '<h3>Чего не делаем</h3>' +
        '<ul class="list-a">' + C.srochnost.chego_ne_delaem.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>',
        'section--dark'
      );
    })() +
    sec(
      '<h2>Подбор формата</h2>' +
      '<p class="lead">' + esc(PF.lead) + '</p>' +
      '<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Формат</th><th>Кому</th><th>Что решает</th><th></th></tr></thead><tbody>' +
      PF.rows.map(function (r) {
        return '<tr><td><b>' + esc(r[0]) + '</b></td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td>' +
          '<td><a href="#/plans/' + esc(r[3]) + '">тип ' + esc(r[3]) + '</a></td></tr>';
      }).join('') + '</tbody></table></div>' +
      note('Формулировка', esc(PF.note))
    ) +

    sec(
      '<h2>Семь портретов покупателя</h2>' +
      '<p class="lead">Опознайте портрет в первые пять минут разговора — дальше подбор соберётся сам, а вы будете знать, какую фразу сказать на террасе.</p>' +
      L.portrety.map(function (p) {
        return '<div class="card card--pad" style="margin-bottom:14px">' +
          '<div class="row__top" style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px">' +
          '<span class="small">Портрет ' + p.n + '</span>' +
          '<span class="pill-row">' + p.tipy.map(function (t) { return '<a class="pill" href="#/plans/' + esc(t) + '">тип ' + esc(t) + '</a>'; }).join('') + '</span></div>' +
          '<h3>' + esc(p.name) + '</h3>' +
          '<dl class="kv kv--wide">' +
          '<dt>Как узнать</dt><dd>' + esc(p.kak_uznat) + '</dd>' +
          '<dt>Настоящая боль</dt><dd>' + esc(p.bol) + '</dd>' +
          '<dt>Скрытый страх</dt><dd>' + esc(p.strah) + '</dd>' +
          '<dt>Что решает</dt><dd>' + esc(p.reshaet) + '</dd>' +
          '<dt>Сообщество</dt><dd>' + esc(p.soobshchestvo) + '</dd>' +
          '<dt>Формат</dt><dd>' + esc(p.format) + '</dd>' +
          '</dl>' +
          '<blockquote>' + esc(p.fraza) + '</blockquote>' +
          '<a href="#/flats?tip=' + esc(p.tipy[0]) + '">Показать подходящие лоты →</a>' +
          '</div>';
      }).join(''),
      'section--alt'
    ) +

    sec(
      eyebrow('Десять шагов') +
      '<h2>Маршрут показа</h2>' +
      '<p class="lead">' + esc(M.princip) + '</p>' +
      '<div class="route">' + M.shagi.map(function (sh, i) {
        return '<div class="rstep"><span class="rstep__n">' + (i + 1) + '</span>' +
          '<div class="rstep__b"><h4>' + esc(sh[0]) + '</h4>' +
          '<p class="rstep__say">«' + esc(sh[1]) + '»</p>' +
          (sh[2] ? '<p class="small" style="margin:0">' + esc(sh[2]) + '</p>' : '') +
          '</div></div>';
      }).join('') + '</div>' +
      '<h3>Внутри квартиры говорите сценами</h3>' +
      '<p>' + esc(M.vnutri_kvartiry) + '</p>' +
      '<div class="grid g2">' +
      '<div class="card"><h4>Момент, ради которого всё</h4><p class="small" style="margin:0">' + esc(M.moment) + '</p></div>' +
      '<div class="card"><h4>Один честный минус</h4><p class="small" style="margin:0">' + esc(M.minus) + '</p></div>' +
      '</div>' +
      '<ul class="list-a" style="margin-top:20px">' + M.pravila.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'
    ) +

    sec(
      '<h2>' + DK.plural(L.vozrazheniya.length, 'возражение', 'возражения', 'возражений') + ' и ответы</h2>' +
      '<p class="lead">Дословно. Можно читать с телефона, пока клиент идёт к машине.</p>' +
      L.vozrazheniya.map(function (o) {
        return '<div class="card" style="margin-bottom:12px"><h4>' + esc(o.v) + '</h4>' +
          '<p style="margin:0">' + esc(o.o) + '</p>' +
          (o.n ? '<p class="small" style="margin:10px 0 0">' + esc(o.n) + '</p>' : '') + '</div>';
      }).join(''),
      'section--dark'
    ) +

    sec(
      '<h2>Речь</h2>' +
      '<p class="lead">' + esc(L.rech.pravilo) + '</p>' +
      '<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Слабо</th><th>Сильно</th></tr></thead><tbody>' +
      L.rech.zamena.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td><b>' + esc(r[1]) + '</b></td></tr>'; }).join('') +
      '</tbody></table></div>'
    ) +

    sec(
      '<h2>Что вокруг квартала</h2>' +
      '<p class="lead">Лес в ста метрах, залив Щучий примерно в пятистах, восемь соседних кварталов со своей инфраструктурой. Полный разбор по трём поясам, замеры 2ГИС и школы — на отдельной странице.</p>' +
      gallery(mix([commonBy('les'), commonBy('zaliv'), commonBy('priroda'), commonBy('sport', 2), commonBy('aero', 1)]), 'gal--wide') +
      '<div class="actions"><a class="btn btn--ghost" href="#/park">Три пояса инфраструктуры</a>' +
      '<a class="btn btn--ghost" href="#/life">Образ жизни и соседи</a></div>',
      'section--alt'
    ) +

    sec(
      '<h2>Удалёнка и семейное обучение</h2>' +
      '<p class="lead">' + esc(L.udalenka.zachem) + '</p>' +
      '<ul class="list-a">' + L.udalenka.fakty.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
      note('Главное возражение', esc(L.udalenka.vozrazhenie)) +
      '<h2 style="margin-top:2em">Престиж: за что платят</h2>' +
      '<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Что</th><th>Почему это важно клиенту</th></tr></thead><tbody>' +
      L.prestizh.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('') +
      '</tbody></table></div>'
    );
  }
  DK.commonBy = commonBy;
  DK.mix = mix;

  /* ================= Условия и деньги ================= */
  function terms(r) {
    var t = d().agents_terms;
    var preset = r.q.lot ? { lot: r.q.lot } : null;
    if (r.q.form) DK.afterRender = function () {
      var f = document.querySelector('[data-form]');
      if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    return sec(
      eyebrow('Условия для партнёров') +
      '<h1>Комиссия 4,5% с каждой сделки. Закрепление на 60 дней</h1>' +
      '<p class="lead">Скажем честно: до этого года агентский канал у нас почти не работал. Денег не жалели — просто никто им не занимался. Сейчас занимаемся, и условия написаны без мелкого шрифта.</p>' +
      '<div class="grid g3">' +
      stat('4,5%', 'с любой сделки, скидка клиента не влияет') +
      stat('14 дней', 'выплата после регистрации права') +
      stat(t.zakreplenie.srok_dney + ' дней', 'закрепление, проверка по CRM в тот же день') +
      '</div>'
    ) +
    sec(
      '<h2>Сколько вы заработаете</h2>' +
      commissionTable() +
      note('От какой цены считаем', esc(t.komissiya.baza) + ' Акция и субсидирование ставки между собой не суммируются: клиент берёт что-то одно, но на вашу комиссию это не влияет.'),
      'section--alt'
    ) +
    sec(
      '<h2>Закрепление клиента</h2>' +
      '<ul class="list-a">' +
      '<li>Клиент закрепляется по заявке с ФИО и телефоном. Проверяем по CRM в день обращения.</li>' +
      '<li>Срок — ' + t.zakreplenie.srok_dney + ' дней, ' + esc(t.zakreplenie.prodlenie) + '.</li>' +
      '<li>' + esc(t.zakreplenie.otkaz) + '</li>' +
      '<li>' + esc(t.zakreplenie.prioritet) + '</li>' +
      '<li>Если клиент уже в базе, скажем сразу. Не после сделки.</li>' +
      '</ul>' +
      '<p>Предпоследний пункт важнее остальных. Именно на нём обычно и портятся отношения с застройщиками.</p>' +
      '<h3>Выплата</h3><p>' + esc(t.vyplata) + '</p>' +
      (t.vyplata_spor ? note('Формулировку нужно зафиксировать', esc(t.vyplata_spor), 'warn') : '') +
      '<ul class="list-a">' + (t.vyplata_detali || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      (t.soprovozhdenie ? '<h3>' + esc(t.soprovozhdenie.kto) + '</h3><p>' + esc(t.soprovozhdenie.chto) + '</p>' : '')
    ) +
    sec(
      '<h2>Что мы даём для работы</h2>' +
      '<ul class="list-a">' + t.chto_daem.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<h3>Показ</h3>' +
      '<p>Приезжайте с клиентом сами или передайте показ нашему менеджеру — на закрепление это не влияет. Экскурсия занимает около ' + esc(t.ekskursii.dlitelnost) + '. Для иногородних — ' + esc(t.ekskursii.onlayn) + '.</p>' +
      '<div class="actions"><a class="btn btn--ghost" href="#/tours">Расписание экскурсий</a><a class="btn btn--ghost" href="#/finance">Финансы и расчёты</a></div>',
      'section--dark'
    ) +
    (function () {
      var R = d().competition.rieltoru;
      return sec(
        '<h2>' + esc(R.title) + '</h2>' +
        '<div class="grid g2">' + R.punkty.map(function (p) {
          return '<div class="card"><h4>' + esc(p.t) + '</h4><p class="small" style="margin:0">' + esc(p.d) + '</p></div>';
        }).join('') + '</div>'
      );
    })() +
    sec(
      '<h2>Правила формулировок</h2>' +
      '<p class="lead">Обязательны для объявлений, переписки и разговора на показе. Одна неточность про террасу стоит дороже, чем кажется: клиент померяет рулеткой.</p>' +
      '<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Не пишем</th><th>Пишем</th></tr></thead><tbody>' +
      d().site.stop_list.map(function (p) { return '<tr><td>' + esc(p[0]) + '</td><td>' + esc(p[1]) + '</td></tr>'; }).join('') +
      '</tbody></table></div>',
      'section--alt'
    ) +
    secN(DK.formBlock('zakreplenie', preset));
  }

  /* ================= Финансы ================= */
  function finance(r) {
    var f = d().finance, P = f.publichno;
    var preset = r.q.lot ? { lot: r.q.lot } : null;
    if (r.q.form) DK.afterRender = function () {
      var el = document.querySelector('[data-form]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    return sec(
      '<p class="eyebrow"><a href="#/terms">Условия</a> · деньги клиента</p>' +
      '<h1>Четыре сценария покупки</h1>' +
      '<p class="lead">Клиент берёт что-то одно: скидку с цены или субсидированную ставку. Между собой они не складываются, а посчитать нужно оба — и показать клиенту обе цифры, а не выбирать за него.</p>' +
      note('Почему здесь нет ставок и платежей', esc(P.disclaimer)) +
      '<div class="grid g2">' + P.scenarii.map(function (s) {
        return '<div class="card"><h3>' + esc(s.name) + '</h3>' +
          '<p class="eyebrow">' + esc(s.cena) + '</p>' +
          '<p class="small" style="margin:0">' + esc(s.komu) + '</p></div>';
      }).join('') + '</div>'
    ) +
    sec(
      '<h2>Где проходит граница выгоды</h2>' +
      '<p class="lead">' + esc(P.granica) + '</p>' +
      '<blockquote>' + esc(P.vopros) + '</blockquote>' +
      '<h3>Что называем всегда</h3>' +
      '<ul class="list-a">' + P.pravila.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>',
      'section--alt'
    ) +
    sec(
      '<h2>Разделение денег при субсидировании</h2>' +
      '<p>Объясняется клиенту до подписания договора, а не на сделке. Часть суммы, равная субсидии, уходит на счёт застройщика — из неё платится комиссия банку за снижение ставки. Всё остальное, включая ипотеку, идёт на эскроу по стандартному порядку 214-ФЗ.</p>' +
      note('Не упоминаем', 'Рассрочку не выносим в материалы до подтверждения условий. Газа в проекте нет ни в каком виде.', 'warn')
    ) +
    sec(
      '<h2>Расчёт под конкретного клиента</h2>' +
      '<p class="lead">Присылаем в течение рабочего дня, с цифрами, которые можно показывать. Чтобы посчитать оба сценария, нужны шесть параметров:</p>' +
      '<ul class="list-a">' + P.zapros.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      DK.formHTML('raschet', preset),
      'section--dark'
    );
  }

  /* ================= Материалы ================= */
  function media(r) {
    var preset = r.q.tip ? { what: 'Материалы по типу ' + r.q.tip } : null;
    if (r.q.form) DK.afterRender = function () {
      var f = document.querySelector('[data-form="' + r.q.form + '"]');
      if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    var V = d().video, all = V.video;
    var covered = {}; all.forEach(function (v) { if (v.tip && v.k !== 'stop') covered[v.tip] = 1; });
    var files = [
      ['Планировки квартир', 'МКД, все форматы с метражами', 'downloads/Планировки новые квартир.pdf'],
      ['Планировки дуплексов', 'Боковые и центральные, с КУИ', 'downloads/Планировки дуплексов.pdf'],
      ['Планировки дуплексов без КУИ', 'Версия для клиента', 'downloads/Планировки дуплексов без КУИ.pdf'],
      ['Генплан 13-й очереди', 'Официальная схема квартала', 'downloads/Генплан 13 очереди Датского.pdf']
    ];
    return sec(
      eyebrow('Для ваших объявлений и показов') +
      '<h1>Фото, видео, файлы</h1>' +
      '<p class="lead">Всё это можно ставить в свои объявления и отправлять клиенту в мессенджер. Фото по конкретной квартире лежат прямо в её карточке, здесь — то, что берут целиком.</p>' +
      '<div class="grid g4">' +
      stat(Object.keys(d().media.lots || {}).length + ' из 40', 'лотов с фотографиями') +
      stat((d().media.common || []).length, 'фото территории') +
      stat(all.filter(function (v) { return v.k !== 'stop'; }).length, 'роликов в канале') +
      stat(files.length, 'файла в PDF') +
      '</div>'
    ) +
    (function () {
      var t = d().types.D;
      return t && t.onlain ? sec(
        eyebrow('Готовый инструмент') +
        '<h2>Отдельный сайт квартиры 66–67 м²</h2>' +
        '<p class="lead">По трёшке с террасой собран отдельный лендинг с 3D-туром и тремя PDF. Отправляйте клиенту ссылку вместо описания в мессенджере.</p>' +
        DK.tourBlock(t)
      ) : '';
    })() +
    sec(
      eyebrow('Обновляем постоянно') +
      '<h2>Что изменилось за последнее время</h2>' +
      '<p class="lead">' + esc(d().updates.reglament.lead) + '</p>' +
      updatesBlock(6) +
      '<div class="actions"><a class="btn" href="#/media?form=podpiska">Подписаться на обновления</a></div>',
      'section--alt'
    ) +
    sec(
      '<h2>Что и как часто обновляется</h2>' +
      '<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Что</th><th>Как часто</th><th>Кто ведёт</th><th></th></tr></thead><tbody>' +
      d().updates.reglament.chastota.map(function (r) {
        return '<tr><td><b>' + esc(r.chto) + '</b></td><td>' + esc(r.kak_chasto) + '</td><td>' + esc(r.kto) + '</td>' +
          '<td><a href="' + esc(r.gde) + '">открыть</a></td></tr>';
      }).join('') + '</tbody></table></div>'
    ) +
    sec(
      '<h2>Скачать</h2>' +
      '<div class="rows">' + files.map(function (f) {
        return '<a href="' + f[2] + '" target="_blank" rel="noopener"><div class="row__top"><h3 style="margin:0">' + esc(f[0]) + '</h3><span class="badge badge--sub">PDF</span></div>' +
          '<p class="small" style="margin:0">' + esc(f[1]) + '</p></a>';
      }).join('') + '</div>',
      'section--alt'
    ) +
    sec(
      '<h2>Территория, дворы и виды</h2>' +
      '<p class="lead">Летняя съёмка готового квартала: ни строительной техники, ни заборов. Годится и для объявления, и для клиента, который смотрит на карту и не понимает, что там на самом деле.</p>' +
      gallery(commonBy(null).filter(function (c) { return c.real; }))
    ) +
    sec(
      '<h2>Террасы и участки</h2>' +
      '<p class="lead">Визуализации: как выглядит терраса и закреплённый придомовый участок, когда их обжили. Помечайте клиенту, что это визуализация.</p>' +
      gallery(commonBy(null).filter(function (c) { return !c.real; }), 'gal--wide'),
      'section--alt'
    ) +
    sec(
      '<h2>Видео из канала застройщика</h2>' +
      '<p class="lead">Отобрали ' + all.filter(function (v) { return v.k !== 'stop'; }).length +
      ' роликов из канала застройщика. Ссылку можно кинуть клиенту в мессенджер — она открывается без установки Telegram. Обзоры квартир есть по ' + Object.keys(covered).length + ' форматам из девяти.</p>' +
      '<div class="vids">' + all.filter(function (v) { return v.k === 'tur' || v.k === 'kvartira'; }).slice(0, 9).map(DK.videoCard).join('') + '</div>' +
      '<div class="actions"><a class="btn" href="#/tour">Фотоэкскурсия по кварталу</a>' +
      '<a class="btn btn--ghost" href="#/video">Весь каталог видео</a></div>'
    ) +
    secN(DK.formBlock('materialy', preset)) +
    (function () {
      var P = d().updates.podpiska;
      return sec(
        eyebrow('Чтобы не проверять сайт вручную') +
        '<h2>' + esc(P.title) + '</h2>' +
        '<p class="lead">' + esc(P.lead) + '</p>' +
        '<div class="grid g2"><div>' +
        '<h4>Что будем присылать</h4>' +
        '<ul class="list-a">' + P.chto_prisylaem.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        '</div><div>' + DK.formHTML('podpiska') + '</div></div>',
        'section--dark'
      ) + sec(
        '<h2>Как это устроено по закону</h2>' +
        '<p class="lead">Оператор данных — ' + esc(P.yuridicheskoe.operator) + '.</p>' +
        '<ul class="list-a">' + P.yuridicheskoe.punkty.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        note('До запуска рассылки', esc(P.yuridicheskoe.proverit), 'warn')
      );
    })() +
    '';
  }



  /* ================= Видео ================= */
  function video() {
    var V = d().video, all = V.video, byKat = {};
    all.forEach(function (v) { (byKat[v.k] = byKat[v.k] || []).push(v); });
    var covered = {};
    all.forEach(function (v) { if (v.tip && v.k !== 'stop') covered[v.tip] = (covered[v.tip] || 0) + 1; });
    return sec(
      '<p class="eyebrow"><a href="#/media">Материалы</a> · видео</p>' +
      '<h1>Видео и онлайн-экскурсии</h1>' +
      '<p class="lead">' + esc(V.kak_polzovatsya) + '</p>' +
      '<div class="grid g4">' +
      stat(all.filter(function (v) { return v.k !== 'stop'; }).length, 'роликов в работе') +
      stat(Object.keys(covered).length + ' из 9', 'типов с обзором') +
      stat((byKat.tur || []).length, 'туров по кварталу') +
      stat((byKat.stop || []).length, 'в стоп-листе') +
      '</div>'
    ) +
    sec(
      '<h2>Покрытие по типам</h2>' +
      '<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Тип</th><th>Формат</th><th class="n">Роликов</th><th>Что делать</th></tr></thead><tbody>' +
      Object.keys(d().types).map(function (k) {
        var n = covered[k] || 0;
        return '<tr><td><a href="#/plans/' + k + '">' + k + '</a></td><td>' + esc(d().types[k].name) + '</td>' +
          '<td class="n">' + n + '</td><td>' + (n ? 'Отправлять клиенту, цену сверять с реестром' : 'Снять обзор — формата нет ни в одном ролике') + '</td></tr>';
      }).join('') + '</tbody></table></div>',
      'section--alt'
    ) +
    V.kategorii.map(function (c) {
      var list = byKat[c.k] || [];
      if (!list.length) return '';
      return sec(
        (c.k === 'stop' ? eyebrow('Стоп-лист') : eyebrow(DK.plural(list.length, 'ролик', 'ролика', 'роликов'))) +
        '<h2>' + esc(c.t) + '</h2>' +
        (c.k === 'stop' ? '<p class="lead">Эти ролики в канале есть, но клиенту их отправлять нельзя: устаревшие формулировки, закончившиеся акции или продукт, которого больше нет.</p>' : '') +
        '<div class="vids">' + list.map(DK.videoCard).join('') + '</div>',
        c.k === 'stop' ? 'section--dark' : ''
      );
    }).join('') +
    sec(
      '<h2>Чего не хватает</h2>' +
      '<ul class="list-a">' + V.chego_ne_hvataet.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<div class="actions"><a class="btn" href="#/media">Запросить материалы</a></div>'
    );
  }

  /* ================= Парк ================= */
  function park() {
    var i = d().infrastructure, z = i.zamery_2gis || {};
    function belt(title, sub, arr) {
      return '<h3>' + esc(title) + '</h3><p class="small">' + esc(sub) + '</p>' +
        '<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Объект</th><th>Что это</th><th>Адрес</th><th class="n">Рейтинг</th></tr></thead><tbody>' +
        arr.map(function (o) {
          return '<tr><td>' + esc(o.name) + (o.note ? '<br><span class="small">' + esc(o.note) + '</span>' : '') + '</td>' +
            '<td>' + esc(o.type || '') + '</td><td>' + esc(o.address || o.distance || '') + '</td>' +
            '<td class="n">' + (o.rating ? num(o.rating, 1) : '—') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    return sec(
      '<p class="eyebrow"><a href="#/client">Клиенту</a> · среда</p>' +
      '<h1>Что вокруг квартала</h1>' +
      '<p class="lead">Датский — девятый квартал микрорайона. Клиент покупает не только квартиру: лес в ста метрах, залив Щучий примерно в пятистах, восемь соседних кварталов, по которым гуляют так же свободно, как по своему двору.</p>' +
      gallery(DK.mix([DK.commonBy('les'), DK.commonBy('zaliv'), DK.commonBy('sport'), DK.commonBy('priroda'), DK.commonBy('arh'), DK.commonBy('aero')]), 'gal--wide')
    ) +
    sec(
      '<h2>Три пояса инфраструктуры</h2>' +
      belt('Пояс 1 — пешком', 'До чего клиент дойдёт, не садясь в машину', i.poyas_1_peshkom) +
      belt('Пояс 2 — по дороге в город', 'Что по пути и не требует отдельной поездки', i.poyas_2_po_doroge) +
      belt('Пояс 3 — одна поездка', 'Ради чего один раз садятся в машину', i.poyas_3_odna_poezdka),
      'section--alt'
    ) +
    sec(
      '<h2>Сколько ехать</h2>' +
      '<p class="small">Замеры 2ГИС: ' + esc(z.data || '') + '</p>' +
      '<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Куда</th><th>Откуда</th><th class="n">Км</th><th class="n">Минут</th><th class="n">Светофоров</th></tr></thead><tbody>' +
      (z.marshruty || []).map(function (m) {
        return '<tr><td>' + esc(m.kuda) + '</td><td>' + esc(m.otkuda) + '</td>' +
          '<td class="n">' + (m.km ? num(m.km, 1) : '—') + '</td><td class="n">' + m.min + '</td>' +
          '<td class="n">' + (m.svetofory == null ? '—' : m.svetofory) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      (z.taksi ? '<h3>Такси, для сравнения: ' + esc(z.taksi.do) + '</h3><div class="grid g2">' +
        '<div class="card"><h4>Из Хрустального парка</h4><p class="small" style="margin:0">' + z.taksi.hp.min + ' минут · комфорт ' + money(z.taksi.hp.komfort) + ' · детский ' + money(z.taksi.hp.detskiy) + ' · подача ' + z.taksi.hp.podacha + ' мин</p></div>' +
        '<div class="card"><h4>Из города</h4><p class="small" style="margin:0">' + z.taksi.gorod.min + ' минут · комфорт ' + money(z.taksi.gorod.komfort) + ' · детский ' + money(z.taksi.gorod.detskiy) + ' · подача ' + z.taksi.gorod.podacha + ' мин</p></div></div>' : '') +
      note('Чего не хватает', 'Четыре замера есть. Нужны остальные, и главное — в час пик: 18:00 в будни и 8:00 утром в город. Там разрыв с городом максимален в нашу пользу. Скриншоты сохраняйте: они работают доказательством, а не картинкой.')
    ) +
    sec(
      '<h2>Образование</h2>' +
      i.shkoly.map(function (s) {
        return '<div class="card card--pad" style="margin-bottom:14px"><h3>' + esc(s.name) + '</h3>' +
          '<p class="small">' + esc(s.status || '') + (s.address ? ' · ' + esc(s.address) : '') + '</p>' +
          (s.fakty ? '<ul class="list-a">' + s.fakty.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '') +
          (s.chestno ? note('Говорим честно', esc(s.chestno), 'warn') : '') + '</div>';
      }).join(''),
      'section--alt'
    );
  }

  /* ================= Экскурсии ================= */
  function tours() {
    var t = d().agents_terms;
    return sec(
      '<p class="eyebrow"><a href="#/terms">Условия</a> · показы</p>' +
      '<h1>Экскурсии и вебинары</h1>' +
      '<p class="lead">Показ нашим менеджером на закрепление клиента не влияет. Экскурсия идёт около ' + esc(t.ekskursii.dlitelnost) + '.</p>' +
      '<div class="tbl-scroll"><table class="tbl"><thead><tr><th>День</th><th>Время</th><th>Формат</th></tr></thead><tbody>' +
      t.ekskursii.raspisanie.map(function (x) {
        return '<tr><td>' + esc(x.den) + '</td><td>' + esc(x.time) + '</td><td>' + esc(x.format) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p>Для иногородних клиентов — ' + esc(t.ekskursii.onlayn) + '.</p>' +
      note('Чего не хватает', 'Расписание с конкретными датами на две недели вперёд появится, когда его подтвердит отдел продаж. Пока показан постоянный недельный график.')
    ) +
    secN(DK.formBlock('ekskursiya')) +
    sec(
      '<h2>Тур для агентов</h2>' +
      '<p class="lead">' + esc(t.tur_dlya_agentov.chastota) + ' собираем группу и показываем объект без клиентов: ' + esc(t.tur_dlya_agentov.chto) + '. Полтора часа, кофе, презентаций на экране не будет.</p>' +
      DK.formHTML('tur'),
      'section--dark'
    ) +
    sec(
      '<h2>Вебинары</h2>' +
      '<p class="lead">Статус: ' + esc(t.vebinary.status) + '. Формат — ' + esc(t.vebinary.format) + '.</p>' +
      note('Чего не хватает', esc(t.vebinary.chto_nuzhno) + '. Архив записей появится после первых эфиров.') +
      DK.formHTML('vebinar')
    );
  }

  /* ================= Обучение ================= */
  function kb(r) {
    var a = d().articles;
    if (r.sub) return kbOne(r.sub);
    return sec(
      eyebrow('Серия для агентов · ' + a.seriya.napisano + ' из ' + a.seriya.vsego + ' написаны') +
      '<h1>Обучение</h1>' +
      '<p class="lead">' + esc(a.seriya.princip) + '</p>' +
      '<div class="rows">' + a.articles.map(function (x) {
        var body = '<div class="row__top"><span class="small">' + x.n + ' · ' + esc(x.tema) + '</span>' +
          (x.status === 'готова' ? '<span class="badge badge--sale">' + x.min + ' мин</span>' : '<span class="badge badge--bron">в работе</span>') + '</div>' +
          '<h3 style="margin-bottom:6px">' + esc(x.title) + '</h3>' +
          '<p class="small" style="margin:0 0 6px">' + esc(x.vopros) + '</p>' +
          '<p class="small" style="margin:0">Инструмент: ' + esc(x.instrument) + '</p>';
        return x.status === 'готова' ? '<a href="#/kb/' + esc(x.slug) + '">' + body + '</a>' : '<div class="soon">' + body + '</div>';
      }).join('') + '</div>'
    ) +
    sec(
      '<h2>Приезжайте посмотреть сами</h2>' +
      '<p class="lead">Раз в две недели собираем группу агентов: две квартиры разных форматов, территория, разбор условий. Без клиентов, полтора часа, кофе. Продать то, чего не видел, почти невозможно.</p>' +
      '<div class="actions"><a class="btn" href="#/tours">Записаться на тур</a><a class="btn btn--ghost" href="#/tours">Расписание экскурсий</a></div>',
      'section--alt'
    ) +
    sec(
      '<h2>График выхода</h2>' +
      '<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Неделя</th><th>Статьи</th><th>Рассылка</th></tr></thead><tbody>' +
      a.seriya.grafik.map(function (g) {
        return '<tr><td>' + esc(g.nedelya) + '</td><td>' + esc(g.statyi) + '</td><td>' + esc(g.rassylka) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="small">Две статьи в неделю — верхняя граница. Больше агент не прочитает, меньше — забудет про нас.</p>'
    );
  }

  function kbOne(slug) {
    var x = d().articles.articles.filter(function (a) { return a.slug === slug; })[0];
    if (!x || x.status !== 'готова') return notfound();
    DK.pageTitle = x.title;
    var body = x.body.map(function (b) {
      if (b.t === 'p') return '<p>' + b.v + '</p>';
      if (b.t === 'h') return '<h2>' + esc(b.v) + '</h2>';
      if (b.t === 'ul') return '<ul class="list-a">' + b.v.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
      if (b.t === 'quote') return '<blockquote>' + esc(b.v) + '</blockquote>';
      if (b.t === 'note') return note('Важно', esc(b.v));
      if (b.t === 'cta') return '<div class="actions"><a class="btn" href="' + esc(b.href) + '">' + esc(b.v) + '</a></div>';
      if (b.t === 'table') {
        return '<div class="tbl-scroll"><table class="tbl"><thead><tr>' +
          b.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          b.rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td' + (i ? ' class="n"' : '') + '>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') +
          '</tbody></table></div>';
      }
      if (b.t === 'foto') return gallery(commonBy(b.k, b.n || 3), 'gal--wide');
      if (b.t === 'widget') return (WIDGETS[b.v] || function () { return ''; })();
      return '';
    }).join('');
    return sec(
      '<p class="eyebrow"><a href="#/kb">Обучение</a> · статья ' + x.n + ' · ' + x.min + ' мин</p>' +
      '<h1>' + esc(x.title) + '</h1>' +
      '<p class="lead">' + esc(x.anons) + '</p>' +
      '<div class="article">' + body + '</div>' +
      '<div class="actions"><a class="btn btn--ghost" href="#/kb">Все статьи</a>' +
      '<a class="btn" href="#/terms?form=zakreplenie">Закрепить клиента</a></div>'
    );
  }

  /* ================= Комьюнити ================= */
  function community() {
    var lyudi = DK.commonBy('lyudi').concat(DK.commonBy('dvor', 4));
    var vids = (d().video.video || []).filter(function (v) { return v.k === 'lyudi'; });
    return sec(
      '<p class="eyebrow"><a href="#/client">Клиенту</a> · соседи</p>' +
      '<h1>Комьюнити</h1>' +
      '<p class="lead">Двор конкурент построит за сезон. Соседей — нет. Мероприятия и живущие тут люди — единственная часть продукта, которую невозможно повторить, и показывать её клиенту стоит раньше планировок.</p>' +
      gallery(lyudi, 'gal--wide')
    ) +
    (vids.length ? sec('<h2>Видео из канала</h2><div class="vids">' + vids.map(DK.videoCard).join('') + '</div>', 'section--alt') : '') +
    sec(
      '<h2>Что собираем</h2>' +
      '<div class="grid g2">' +
      '<div class="card"><h4>Фотоархив мероприятий</h4><p class="small" style="margin:0">Больше 30 мероприятий в год, около сотни за три года. Нужен подсчёт, отбор и даты.</p></div>' +
      '<div class="card"><h4>Интервью с жителями</h4><p class="small" style="margin:0">Есть одно — с Ольгой Макаревич. Нужны ещё два-три: переехавшие из частного дома, работающие удалённо, семья со школьниками.</p></div>' +
      '<div class="card"><h4>Отзывы</h4><p class="small" style="margin:0">Тексты или скриншоты, с согласия авторов.</p></div>' +
      '<div class="card"><h4>Видео праздников</h4><p class="small" style="margin:0">Соседские посиделки, барбекю, Пасха и 1 июня — часть уже лежит в канале.</p></div>' +
      '</div>' +
      note('Обязательное условие', 'Письменные согласия жителей на публикацию — до размещения, а не после. В интервью звучат имена и названия проектов.', 'warn')
    );
  }


  /* ================= Образ жизни ================= */
  function tg(id) { return 'https://t.me/hrustalni138/' + id; }
  function tgLinks(ids, label) {
    if (!ids || !ids.length) return '';
    return '<span class="tg-links">' + ids.map(function (i, n) {
      return '<a href="' + tg(i) + '" target="_blank" rel="noopener">' + (label || 'пост') + (ids.length > 1 ? ' ' + (n + 1) : '') + '</a>';
    }).join('') + '</span>';
  }

  function life() {
    var L = d().life;
    var pics = mix([
      commonBy('lyudi', 8),
      commonBy('sport', 5),
      commonBy('dvor', 4),
      commonBy('les', 3),
      commonBy('arh', 3),
      commonBy('zaliv', 1),
      commonBy('priroda', 2),
      commonBy('aero', 2)
    ]);

    return sec(
      eyebrow('То, что нельзя скопировать') +
      '<h1>Образ жизни в квартале</h1>' +
      '<p class="lead">' + esc(L.lead) + '</p>' +
      gallery(pics, 'gal--wide') +
      '<div class="grid g4">' + L.cifry.map(function (c) { return stat(esc(c[0]), c[1]); }).join('') + '</div>'
    ) +

    sec(
      '<h2>' + esc(L.god.title) + '</h2>' +
      '<p class="lead">' + esc(L.god.lead) + '</p>' +
      '<div class="year">' + L.god.mesyacy.map(function (m) {
        return '<div class="mon"><span class="mon__m">' + esc(m.m) + '</span>' +
          '<h4>' + esc(m.t) + '</h4>' +
          '<p class="small">' + esc(m.d) + '</p>' +
          tgLinks(m.posts, 'смотреть') + '</div>';
      }).join('') + '</div>',
      'section--alt'
    ) +

    sec(
      '<h2>' + esc(L.priroda.title) + '</h2>' +
      '<p class="lead">' + esc(L.priroda.lead) + '</p>' +
      gallery(mix([commonBy('zaliv'), commonBy('les'), commonBy('sport'), commonBy('arh')]), 'gal--wide') +
      '<div class="grid g3">' + L.priroda.punkty.map(function (p) {
        return '<div class="card"><h4>' + esc(p.t) + '</h4><p class="small" style="margin:0">' + esc(p.d) + '</p></div>';
      }).join('') + '</div>' +
      '<blockquote style="margin-top:22px">' + esc(L.priroda.vyvod) + '</blockquote>',
      'section--alt'
    ) +

    sec(
      '<h2>Квартал в разные сезоны</h2>' +
      '<p class="lead">Кадры для показа и для объявлений: двор летом и зимой, вода рядом, вид с высоты.</p>' +
      gallery(commonBy('dvor').slice(4).concat(commonBy('zima')).concat(commonBy('terrasa', 3)).concat(commonBy('dom', 3)), 'gal--wide')
    ) +
    sec(
      eyebrow(DK.plural(L.meropriyatiya.length, 'ролик', 'ролика', 'роликов') + ' с мероприятий и из жизни квартала') +
      '<h2>Как это выглядит вживую</h2>' +
      '<p class="lead">Праздники, субботники, квесты и просто будни за три года. Любую ссылку можно переслать клиенту — Telegram откроется в браузере, ставить приложение не нужно. Это готовые короткие ролики: их не надо монтировать, достаточно отправить.</p>' +
      '<div class="vids">' + L.meropriyatiya.map(function (v) {
        return '<a class="vid" href="' + tg(v.id) + '" target="_blank" rel="noopener">' +
          '<span class="vid__top"><span class="vid__dur">' + esc(v.dur) + '</span></span>' +
          '<span class="vid__t">' + esc(v.t) + '</span>' +
          (v.n ? '<span class="vid__n">' + esc(v.n) + '</span>' : '') +
          '<span class="vid__m">' + esc(v.d) + '</span></a>';
      }).join('') + '</div>'
    ) +

    sec(
      '<h2>' + esc(L.sosedi.title) + '</h2>' +
      '<p class="lead">' + esc(L.sosedi.lead) + '</p>' +
      '<div class="grid g2">' + L.sosedi.ludi.map(function (x) {
        return '<div class="card"><h4>' + esc(x.n) + '</h4><p class="small" style="margin:0 0 10px">' + esc(x.d) + '</p>' +
          tgLinks(x.posts, 'пост') + '</div>';
      }).join('') + '</div>' +
      '<blockquote style="margin-top:22px">' + esc(L.sosedi.chat) + '</blockquote>',
      'section--dark'
    ) +

    sec(
      '<h2>' + esc(L.zima.title) + '</h2>' +
      '<p class="lead">' + esc(L.zima.lead) + '</p>' +
      '<ul class="list-a">' + L.zima.punkty.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<blockquote>' + esc(L.zima.vyvod) + '</blockquote>'
    ) +

    sec(
      '<h2>Что работает в квартале каждый день</h2>' +
      '<p class="lead">Не список из презентации, а то, что открылось и работает. С датами — их можно называть.</p>' +
      '<div class="grid g2">' + L.infra_zhizni.map(function (x) {
        return '<div class="card"><h4>' + esc(x.t) + '</h4><p class="small" style="margin:0 0 10px">' + esc(x.d) + '</p>' +
          tgLinks(x.posts, 'пост') + '</div>';
      }).join('') + '</div>' +
      '<div class="actions"><a class="btn btn--ghost" href="#/park">Три пояса инфраструктуры</a></div>',
      'section--alt'
    ) +

    sec(
      eyebrow('Лента канала') +
      '<h2>' + DK.plural(L.lenta.length, 'пост', 'поста', 'постов') + ', которые складываются в картину</h2>' +
      '<p class="lead">Отобраны из 417 публикаций. Открываются по ссылке без установки Telegram — можно переслать клиенту прямо в переписке.</p>' +
      '<div class="feed">' + L.lenta.map(function (x) {
        return '<a class="fp" href="' + tg(x.id) + '" target="_blank" rel="noopener">' +
          '<span class="fp__d">' + esc(x.d) + '</span>' +
          '<span class="fp__t">' + esc(x.t) + '</span>' +
          '<span class="fp__n">' + esc(x.n) + '</span></a>';
      }).join('') + '</div>' +
      '<div class="actions"><a class="btn" href="#/tour">Фотоэкскурсия по кварталу</a>' +
      '<a class="btn btn--ghost" href="https://t.me/hrustalni138" target="_blank" rel="noopener">Открыть канал целиком</a>' +
      '<a class="btn btn--ghost" href="#/video">Все видео по квартирам</a></div>'
    ) +

    sec(
      '<h2>Согласия жителей</h2>' +
      note('Обязательное условие', 'Ссылки на посты канала пересылать можно: они уже опубликованы застройщиком. А вот выкладывать фото и истории жителей в свою рекламу — только с письменного согласия. В интервью звучат имена и названия проектов.', 'warn')
    );
  }


  /* ================= Фотоэкскурсия ================= */
  function tour() {
    var T = d().tour;
    return sec(
      eyebrow('Десять остановок') +
      '<h1>Фотоэкскурсия по кварталу</h1>' +
      '<p class="lead">' + esc(T.lead) + '</p>' +
      '<div class="actions"><a class="btn" href="#/tours">Записать клиента на живой показ</a>' +
      '<a class="btn btn--ghost" href="#/client">Маршрут показа по шагам</a></div>'
    ) +
    T.stops.map(function (st, i) {
      var pics;
      if (st.tip) {
        pics = (d().media.types[st.tip] || []).filter(function (p) { return p.k !== 'plan'; });
      } else {
        pics = [];
        (st.k || []).forEach(function (k) { pics = pics.concat(commonBy(k, 99)); });
        if (st.skip) pics = pics.slice(st.skip);
        pics = pics.slice(0, st.n || 4);
      }
      if (!pics.length) return '';
      return sec(
        '<div class="stop"><span class="stop__n">' + (i + 1) + '</span>' +
        '<div><h2 style="margin-bottom:8px">' + esc(st.t) + '</h2>' +
        '<p class="rstep__say" style="margin-bottom:10px">«' + esc(st.say) + '»</p>' +
        '<p class="small" style="margin:0">' + esc(st.why) + '</p></div></div>' +
        gallery(pics, 'gal--wide'),
        i % 2 ? 'section--alt' : ''
      );
    }).join('') +
    sec(
      '<h2>Что дальше</h2>' +
      '<p class="lead">Живой показ занимает около полутора часов. Для иногородних клиентов проводим онлайн-экскурсию по видеосвязи, а по трёшке с террасой есть отдельный 3D-тур.</p>' +
      '<div class="actions"><a class="btn" href="#/tours">Записать на показ</a>' +
      '<a class="btn btn--ghost" href="https://hrustalniconcept.github.io/hrustalnipark/tour.html" target="_blank" rel="noopener">3D-тур квартиры 66 м²</a>' +
      '<a class="btn btn--ghost" href="#/media">Скачать фото для объявления</a></div>',
      'section--dark'
    );
  }


  /* ================= О проекте ================= */
  function about() {
    var P = d().project;
    function tbl(rows, head) {
      return '<div class="tbl-scroll"><table class="tbl">' +
        (head ? '<thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead>' : '') +
        '<tbody>' + rows.map(function (r) {
          return '<tr>' + r.map(function (c, i) { return '<td' + (i === 0 ? ' style="width:34%"><b>' + esc(c) + '</b>' : '>' + esc(c)) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
    }
    return sec(
      eyebrow('Чем доказать качество') +
      '<h1>О проекте</h1>' +
      '<p class="lead">' + esc(P.lead) + '</p>' +
      '<div class="grid g4">' + P.masshtab.map(function (m) { return stat(esc(m[0]), m[1]); }).join('') + '</div>'
    ) +
    sec(
      '<h2>Награды</h2>' +
      '<p class="lead">' + esc(P.nagrady.lead) + '</p>' +
      '<div class="grid g2">' + P.nagrady.list.map(function (n) {
        return '<div class="award"><span class="award__y">' + esc(n.y) + '</span>' +
          '<h3>' + esc(n.t) + '</h3><p class="award__n">' + esc(n.n) + '</p>' +
          '<p class="small" style="margin:0">' + esc(n.d) + '</p></div>';
      }).join('') + '</div>' +
      note('Нужны файлы', esc(P.nagrady.logo_todo)),
      'section--alt'
    ) +
    sec(
      '<h2>' + esc(P.sber.title) + '</h2>' +
      '<p class="lead">' + esc(P.sber.d) + '</p>' +
      '<blockquote>' + esc(P.sber.argument) + '</blockquote>',
      'section--dark'
    ) +
    sec(
      '<h2>Как построено</h2>' +
      '<p class="lead">' + esc(P.konstruktiv.lead) + '</p>' +
      '<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Факт</th><th>Что это даёт клиенту</th></tr></thead><tbody>' +
      P.konstruktiv.rows.map(function (r) {
        return '<tr><td style="width:44%"><b>' + esc(r.f) + '</b>' +
          (r.s ? '<br><span class="small" style="color:var(--c-brand)">' + esc(r.s) + '</span>' : '') +
          '</td><td>' + esc(r.z) + '</td></tr>';
      }).join('') + '</tbody></table></div>'
    ) +
    sec(
      '<h2>Инженерия и сети</h2>' +
      '<p class="lead">' + esc(P.inzheneriya.lead) + '</p>' +
      tbl(P.inzheneriya.rows, ['Что', 'Как устроено', 'Что это значит']) +
      note('Частый вопрос на показе', esc(P.inzheneriya.aktsent)),
      'section--alt'
    ) +
    sec(
      '<h2>Дом и подъезд</h2>' +
      '<p class="lead">' + esc(P.dom.lead) + '</p>' +
      tbl(P.dom.rows)
    ) +
    sec(
      '<h2>Квартал и двор</h2>' +
      '<p class="lead">' + esc(P.kvartal.lead) + '</p>' +
      tbl(P.kvartal.rows) +
      gallery(mix([commonBy('arh'), commonBy('dvor', 4), commonBy('les'), commonBy('aero', 2)]), 'gal--wide'),
      'section--alt'
    ) +
    sec(
      '<h2>Энергоэффективность и качество</h2>' +
      '<p class="lead">' + esc(P.energo.lead) + '</p>' +
      tbl(P.energo.rows),
      'section--alt'
    ) +
    sec(
      '<h2>Что вокруг: окружение и инфраструктура</h2>' +
      '<p class="lead">' + esc(P.okruzhenie.lead) + '</p>' +
      P.okruzhenie.rows.map(function (r) {
        return '<div class="card" style="margin-bottom:12px"><h4>' + esc(r.t) + '</h4>' +
          '<p style="margin:0 0 8px">' + esc(r.d) + '</p>' +
          '<p class="small" style="margin:0;color:var(--c-brand)">' + esc(r.z) + '</p></div>';
      }).join('') +
      '<div class="actions"><a class="btn btn--ghost" href="#/park">Три пояса инфраструктуры и замеры 2ГИС</a></div>'
    ) +
    sec(
      '<h2>Гарантия и обслуживание</h2>' +
      tbl(P.garantiya.rows) +
      note('Предупредить клиента заранее', esc(P.garantiya.vazhno), 'warn') +
      '<div class="actions"><a class="btn" href="#/plans">Планировки и метражи</a>' +
      '<a class="btn btn--ghost" href="#/client">Как выигрывать сравнение</a></div>'
    );
  }

  function notfound() {
    return sec('<h1>Такой страницы нет</h1><p class="lead">Проверьте адрес или начните с <a href="#/">главной</a>.</p>');
  }

  DK.views = {
    '': home, flats: flats, plans: plans, client: client, terms: terms,
    media: media, kb: kb, video: video, park: park, finance: finance,
    tours: tours, life: life, tour: tour, about: about, community: community, notfound: notfound
  };
})();
