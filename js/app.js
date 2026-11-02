(function () {
  'use strict';
  var D = window.DATA, E = window.Engine;
  var KEY = 'estoque-inteligente-v1';

  var DEFAULT = {
    versao: 1, modo: 'normal', metaDias: 90, pessoas: [], estoque: [], custom: [], porcoes: {},
    aguaL: 0, aguaHigiene: 1, gasKg: 0, fogaoKgH: 0.2, atualizado: null
  };
  var state = load();
  var tab = 'painel';

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return Object.assign({}, DEFAULT, JSON.parse(raw));
    } catch (e) { /* storage indisponível */ }
    return JSON.parse(JSON.stringify(DEFAULT));
  }
  function save() {
    state.atualizado = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignora */ }
  }
  function uid() { return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function n1(x) { return (Math.round(x * 10) / 10).toLocaleString('pt-BR'); }
  function n0(x) { return Math.round(x).toLocaleString('pt-BR'); }
  function dias(d) { return E.fmtDias(d); }
  function cls(d, meta) { return !isFinite(d) ? 'ok' : d >= meta ? 'ok' : d >= meta / 3 ? 'warn' : 'bad'; }

  var EMOJI = { arroz: '🍚', macarrao: '🍝', aveia: '🥣', fuba: '🌽', farinha_mandioca: '🥔', farinha_trigo: '🌾', biscoito: '🍪',
    feijao: '🫘', lentilha: '🫘', grao_bico: '🫘', soja_texturizada: '🌱', atum: '🐟', sardinha: '🐟', ovo: '🥚', leite_po: '🥛',
    oleo: '🫒', amendoim: '🥜', pasta_amendoim: '🥜', acucar: '🧂', sal: '🧂', milho_lata: '🌽', molho_tomate: '🍅', uva_passa: '🍇',
    batata: '🥔', vitamina: '💊' };
  var GEMOJI = { cereal: '🌾', leguminosa: '🫘', proteina: '🐟', laticinio: '🥛', gordura: '🫒', acucar: '🍬', vegetal: '🥕', micro: '💊', essencial: '🧂' };
  function em(f) { return EMOJI[f.id] || GEMOJI[f.grupo] || '🍽️'; }
  function fname(f, sub) { return '<div class="fname"><span class="em" aria-hidden="true">' + em(f) + '</span><div>' + esc(f.nome) + (sub ? '<div class="muted">' + sub + '</div>' : '') + '</div></div>'; }

  var TABS = [
    ['painel', '📊 Painel'], ['pessoas', '👨‍👩‍👧 Pessoas'], ['estoque', '📦 Estoque'], ['compras', '🛒 Compras'],
    ['cardapio', '🍽️ Cardápio'], ['estrategias', '💡 Estratégias'], ['catalogo', '📖 Catálogo'], ['config', '⚙️ Config e backup']
  ];

  function renderChrome() {
    document.getElementById('modo').innerHTML = Object.keys(D.MODOS).map(function (k) {
      return '<button type="button" data-modo="' + k + '" aria-pressed="' + (state.modo === k) + '">' + D.MODOS[k].nome + '</button>';
    }).join('');
    document.getElementById('tabs').innerHTML = TABS.map(function (t) {
      return '<button role="tab" data-tab="' + t[0] + '" aria-selected="' + (tab === t[0]) + '">' + t[1] + '</button>';
    }).join('');
  }

  function render() {
    renderChrome();
    var v = document.getElementById('view');
    var fn = { painel: vPainel, pessoas: vPessoas, estoque: vEstoque, compras: vCompras, cardapio: vCardapio,
      estrategias: vEstrategias, catalogo: vCatalogo, config: vConfig }[tab];
    v.innerHTML = fn();
  }

  /* ---------------- PAINEL ---------------- */
  function vPainel() {
    var an = E.analyze(state), meta = state.metaDias, d = an.dias;
    var modoDesc = D.MODOS[state.modo].desc;
    var h = '<h2>Visão geral</h2>';
    if (!an.h.n) {
      return h + '<div class="card">Comece em <b>Pessoas</b> para informar quantas pessoas moram na casa. Depois cadastre o <b>Estoque</b>.</div>';
    }
    var pct = isFinite(d.energia) ? Math.min(100, d.energia / meta * 100) : 100;
    var c = cls(d.energia, meta), R = 70, C = 2 * Math.PI * R;
    var veredito = d.energia >= meta ? 'Meta atingida em calorias 🎉' : d.energia >= meta / 3 ? 'Já tem uma boa base. Ainda falta chegar à meta.' : 'Estoque curto para a meta. Veja a aba Compras.';
    h += '<div class="card hero"><div class="ring ' + c + '" role="img" aria-label="' + n0(pct) + '% da meta">' +
      '<svg viewBox="0 0 168 168"><circle class="trk" cx="84" cy="84" r="' + R + '" fill="none" stroke-width="14"/>' +
      '<circle class="val" cx="84" cy="84" r="' + R + '" fill="none" stroke-width="14" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - pct / 100)).toFixed(1) + '"/></svg>' +
      '<div class="mid"><b>' + (isFinite(d.energia) ? n0(d.energia) : '∞') + '</b><span>dias de ' + meta + '</span></div></div>' +
      '<div><h2>' + veredito + '</h2><p class="muted">' + esc(modoDesc) + '</p>' +
      '<div class="chips"><span class="chip">👥 ' + an.h.n + ' pessoa(s)</span><span class="chip">🔥 ' + n0(an.h.kcal) + ' kcal/dia</span><span class="chip">🎯 meta ' + meta + ' dias</span></div></div></div>';
    h += '<div class="grid">' +
      kpi('Energia', dias(d.energia), cls(d.energia, meta), 'Meta: ' + meta + ' dias', '🔥') +
      kpi('Proteína', dias(d.proteina), cls(d.proteina, meta), n0(an.h.prot) + ' g/dia necessários', '💪') +
      (state.aguaL > 0 ? kpi('Água', dias(d.agua), cls(d.agua, Math.min(meta, 14)), n1(an.aguaDia) + ' L/dia (inclui cozimento)', '💧')
        : kpi('Água', 'Informe', 'warn', 'Preencha em Config. Precisa de ' + n1(an.aguaDia) + ' L/dia', '💧')) +
      (state.gasKg > 0 ? kpi('Gás de cozinha', dias(d.gas), cls(d.gas, meta), (Math.round(an.gasDia * 100) / 100).toLocaleString('pt-BR') + ' kg/dia estimados', '🧯')
        : kpi('Gás de cozinha', 'Informe', 'warn', 'Preencha em Config. Uso: ' + (Math.round(an.gasDia * 100) / 100).toLocaleString('pt-BR') + ' kg/dia', '🧯')) +
      '</div>';

    // comparação de modos
    h += '<div class="card"><h3>Quanto dura em cada modo</h3><table><thead><tr><th>Modo</th><th class="num">Energia</th><th class="num">Proteína</th><th class="num">Ganho vs normal</th></tr></thead><tbody>';
    var base = E.analyze(state, 'normal').dias.energia;
    Object.keys(D.MODOS).forEach(function (m) {
      var a = E.analyze(state, m);
      var ganho = isFinite(a.dias.energia) && isFinite(base) ? '+' + n0(a.dias.energia - base) + ' dias' : '—';
      h += '<tr><td>' + D.MODOS[m].nome + (m === state.modo ? ' <span class="tag">atual</span>' : '') + '</td><td class="num">' + dias(a.dias.energia) +
        '</td><td class="num">' + dias(a.dias.proteina) + '</td><td class="num">' + (m === 'normal' ? '—' : ganho) + '</td></tr>';
    });
    h += '</tbody></table></div>';

    // alertas e sugestões
    var sug = E.sugestoes(state, an, meta);
    h += '<div class="card"><h3>Alertas e sugestões</h3>' + sug.map(function (s) {
      var ic = { alto: '⚠️', medio: '⚡', ok: '✅', baixo: 'ℹ️', info: '💡' }[s.nivel] || '💡';
      return '<div class="sug ' + s.nivel + '"><span class="ic" aria-hidden="true">' + ic + '</span><div><b>' + esc(s.t) + '</b>' + esc(s.d) + '</div></div>';
    }).join('') + '</div>';

    // macronutrientes
    h += macroCard(an, meta);
    var tot = an.tot.kcal || 1;
    h += '<div class="card"><h3>Calorias por grupo</h3>' + Object.keys(D.GRUPOS).map(function (g) {
      var v = (an.grupos[g] || 0); if (!v) return '';
      var dd = v / an.h.kcal;
      return '<div class="meal"><div class="flex between"><span>' + GEMOJI[g] + ' ' + D.GRUPOS[g] + '</span><span class="muted">' + dias(dd) + ' (' + n0(v / tot * 100) + '%)</span></div>' +
        '<div class="bar"><i style="width:' + Math.min(100, v / tot * 100) + '%"></i></div></div>';
    }).join('') + '</div>';

    // por alimento
    if (an.items.length) {
      h += '<div class="card"><h3>Duração por alimento</h3><div class="scroll"><table><thead><tr><th>Alimento</th><th class="num">Estoque</th><th class="num">Pronto</th><th class="num">Duração</th></tr></thead><tbody>' +
        an.items.map(function (i) {
          var f = i.food;
          return '<tr><td>' + fname(f) + '</td><td class="num">' + n1(i.kg) + ' kg</td><td class="num">' + n1(i.cozidoKg) + ' kg</td><td class="num">' + (i.porDiaKg > 0 ? dias(i.dias) : '—') + '</td></tr>';
        }).join('') + '</tbody></table></div><p class="muted">Duração de cada item sozinho, seguindo as porções da aba Catálogo.</p></div>';
    }

    // validade
    if (an.alertas.length) {
      h += '<div class="card"><h3>Validade</h3><table><thead><tr><th>Item</th><th>Situação</th></tr></thead><tbody>' +
        an.alertas.map(function (a) {
          var txt = a.tipo === 'vencido' ? 'Vencido há ' + Math.abs(a.dias) + ' dia(s)' :
            a.tipo === 'vence_antes' ? 'Vence em ' + a.dias + ' dia(s), antes de ser consumido (dura ' + dias(a.consumo) + ')' : 'Vence em ' + a.dias + ' dia(s)';
          return '<tr><td>' + esc(a.food.nome) + '</td><td>' + txt + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    return h;
  }
  function kpi(l, v, c, sub, ic) { return '<div class="kpi ' + c + '"><div class="l"><span class="ic" aria-hidden="true">' + (ic || '') + '</span> ' + l + '</div><div class="v">' + v + '</div><div class="l">' + sub + '</div></div>'; }
  function donut(parts) {
    var R = 54, C = 2 * Math.PI * R, off = 0, out = '';
    parts.forEach(function (p) {
      var len = C * p.pct / 100;
      out += '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + p.cor + '" stroke-width="18" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '"/>';
      off += len;
    });
    return '<svg viewBox="0 0 140 140" style="transform:rotate(-90deg)" aria-hidden="true"><circle cx="70" cy="70" r="' + R + '" fill="none" stroke="var(--bar)" stroke-width="18"/>' + out + '</svg>';
  }
  function macroCard(an, meta) {
    var m = an.macro, mc = an.macros;
    var def = [
      { k: 'carb', nome: 'Carboidratos', ic: '🍚', cor: 'var(--accent)', faixa: '45–65%', ok: mc.carb >= 45 && mc.carb <= 70, pct: mc.carb },
      { k: 'prot', nome: 'Proteínas', ic: '🥩', cor: 'var(--bad)', faixa: '10–20%', ok: mc.prot >= 10 && mc.prot <= 25, pct: mc.prot },
      { k: 'gord', nome: 'Gorduras', ic: '🫒', cor: 'var(--info)', faixa: '20–35%', ok: mc.gord >= 18 && mc.gord <= 38, pct: mc.gord }
    ];
    var kg = function (g) { return g >= 1000 ? n1(g / 1000) + ' kg' : n0(g) + ' g'; };
    var h = '<div class="card"><h3>🥗 Carboidratos, proteínas e gorduras do estoque</h3>' +
      '<p class="muted">Quanto de cada nutriente existe nos alimentos que você tem, comparado ao que a casa precisa por dia (proteína pelo perfil de cada pessoa; gordura cerca de 28% das calorias; carboidrato o restante).</p>' +
      '<div class="macro-wrap"><div class="donut">' + donut(def.map(function (d) { return { pct: d.pct, cor: d.cor }; })) +
      '<div class="mid"><b>' + n0(an.tot.kcal) + '</b><span>kcal no estoque</span></div></div><div class="macro-list">';
    def.forEach(function (d) {
      var x = m[d.k], c = cls(x.dias, meta), pctMeta = isFinite(x.dias) ? Math.min(100, x.dias / meta * 100) : 100;
      h += '<div class="macro"><div class="flex between"><b><span class="dot" style="background:' + d.cor + '"></span>' + d.ic + ' ' + d.nome + '</b>' +
        '<span class="tag ' + (d.ok ? '' : 'est') + '" title="Faixa recomendada: ' + d.faixa + ' das calorias">' + n0(d.pct) + '% das kcal</span></div>' +
        '<div class="flex between muted"><span>Estoque: <b>' + kg(x.tem) + '</b></span><span>Precisa: <b>' + n0(x.precisa) + ' g/dia</b></span><span>Dura: <b>' + dias(x.dias) + '</b></span></div>' +
        '<div class="bar ' + (c === 'ok' ? '' : c) + '" title="' + n0(pctMeta) + '% da meta de ' + meta + ' dias"><i style="width:' + pctMeta.toFixed(0) + '%"></i></div>' +
        (x.fontes.length ? '<div class="muted src">Principais fontes: ' + x.fontes.map(function (f) { return em(f.food) + ' ' + esc(f.food.nome.replace(/ \(.*\)/, '')) + ' ' + n0(f.pct) + '%'; }).join(' · ') + '</div>' : '') + '</div>';
    });
    h += '</div></div>';
    var menor = def.slice().sort(function (a, b) { return m[a.k].dias - m[b.k].dias; })[0];
    if (isFinite(m[menor.k].dias) && m[menor.k].dias < meta)
      h += '<p class="muted" style="margin-top:10px">⚠️ O nutriente que acaba primeiro é <b>' + menor.nome.toLowerCase() + '</b> (' + dias(m[menor.k].dias) + '). Reforce essa categoria nas compras.</p>';
    return h + '</div>';
  }
  function macroBar(nome, v, faixa, ok) {
    return '<div class="meal"><div class="flex" style="justify-content:space-between"><span>' + nome + '</span><span class="muted">' + n0(v) + '% · ideal ' + faixa + '</span></div>' +
      '<div class="bar ' + (ok ? '' : 'warn') + '"><i style="width:' + Math.min(100, v) + '%"></i></div></div>';
  }

  /* ---------------- PESSOAS ---------------- */
  function vPessoas() {
    var h = '<h2>Pessoas da casa</h2><div class="card"><form class="form" data-form="pessoa">' +
      '<div><label>Nome</label><input name="nome" placeholder="Opcional" maxlength="40"></div>' +
      '<div><label>Perfil</label><select name="perfil">' + Object.keys(D.PERFIS).map(function (k) { return '<option value="' + k + '">' + D.PERFIS[k].nome + '</option>'; }).join('') + '</select></div>' +
      '<div><label>kcal/dia (opcional)</label><input name="kcal" type="number" min="500" max="5000" step="50" placeholder="Padrão do perfil"></div>' +
      '<div><button class="btn" type="submit">Adicionar</button></div></form></div>';
    if (!state.pessoas.length) return h + '<div class="empty"><big>👨‍👩‍👧</big>Nenhuma pessoa cadastrada. Adicione acima quem mora na casa.</div>';
    var hh = E.household(state);
    h += '<div class="card"><div class="scroll"><table><thead><tr><th>Nome</th><th>Perfil</th><th class="num">kcal/dia</th><th class="num">No modo atual</th><th></th></tr></thead><tbody>' +
      state.pessoas.map(function (p, i) {
        var prof = D.PERFIS[p.perfil], base = E.personKcal(p);
        var mf = (prof.vuln ? D.MODOS[state.modo].vuln : D.MODOS[state.modo].adulto);
        return '<tr><td>' + esc(p.nome || 'Pessoa ' + (i + 1)) + '</td><td>' + prof.nome + '</td><td class="num">' + n0(base) + '</td><td class="num">' + n0(base * mf) + '</td>' +
          '<td><button class="btn del" data-act="del-pessoa" data-id="' + p.id + '">Remover</button></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="muted">Total: ' + hh.n + ' pessoa(s), ' + n0(hh.kcal) + ' kcal/dia, ' + n0(hh.prot) + ' g de proteína/dia no modo ' + D.MODOS[state.modo].nome + '.</p>' +
      '<div class="disclaimer">Os valores são médias de referência. Crianças, gestantes, lactantes e pessoas com doenças crônicas devem ser acompanhadas por profissional de saúde. O sistema reduz pouco o consumo desses perfis nos modos de racionamento.</div></div>';
    return h;
  }

  /* ---------------- ESTOQUE ---------------- */
  function foodOptions(foods) {
    return Object.keys(D.GRUPOS).map(function (g) {
      var list = foods.filter(function (f) { return f.grupo === g; });
      if (!list.length) return '';
      return '<optgroup label="' + D.GRUPOS[g] + '">' + list.map(function (f) { return '<option value="' + f.id + '">' + esc(f.nome) + '</option>'; }).join('') + '</optgroup>';
    }).join('');
  }
  function unitLabel(f) { return f.un === 'kg' ? 'kg' : f.un === 'l' ? 'litro(s)' : 'unidade(s)'; }

  function vEstoque() {
    var foods = E.allFoods(state), fm = E.foodMap(foods);
    var h = '<h2>Estoque</h2><div class="card"><form class="form" data-form="estoque">' +
      '<div><label>Alimento</label><select name="foodId" id="foodSel">' + foodOptions(foods) + '</select></div>' +
      '<div><label>Quantidade <span id="unitLbl">(kg)</span></label><input name="qtd" type="number" min="0" step="any" required></div>' +
      '<div><label>Validade (opcional)</label><input name="validade" type="date"></div>' +
      '<div><button class="btn" type="submit">Adicionar</button></div></form>' +
      '<p class="muted" id="foodHint"></p></div>';
    if (!state.estoque.length) return h + '<div class="empty"><big>📦</big>Estoque vazio. Adicione o primeiro alimento acima.</div>';
    var an = E.analyze(state);
    var byFood = {}; an.items.forEach(function (i) { byFood[i.food.id] = i; });
    h += '<div class="card"><div class="scroll"><table><thead><tr><th>Alimento</th><th class="num">Qtd.</th><th class="num">Pronto (kg)</th><th class="num">kcal</th><th>Validade</th><th class="num">Dura</th><th></th></tr></thead><tbody>' +
      state.estoque.map(function (s) {
        var f = fm[s.foodId]; if (!f) return '';
        var kg = E.toKg(f, s.qtd), it = byFood[f.id];
        return '<tr><td>' + fname(f) + '</td>' +
          '<td class="num"><input type="number" min="0" step="any" value="' + s.qtd + '" data-act="qtd" data-id="' + s.id + '" style="width:85px"> ' + unitLabel(f).replace('(s)', '') + '</td>' +
          '<td class="num">' + n1(kg * f.rend) + '</td><td class="num">' + n0(kg * 10 * f.kcal) + '</td>' +
          '<td><input type="date" value="' + esc(s.validade || '') + '" data-act="validade" data-id="' + s.id + '"></td>' +
          '<td class="num">' + (it && it.porDiaKg > 0 ? dias(it.dias) : '—') + '</td>' +
          '<td><button class="btn del" data-act="del-estoque" data-id="' + s.id + '">×</button></td></tr>';
      }).join('') + '</tbody></table></div></div>';
    return h;
  }

  /* ---------------- COMPRAS ---------------- */
  function vCompras() {
    var meta = state.metaDias;
    var h = '<h2>Compras para ' + meta + ' dias</h2>';
    if (!state.pessoas.length) return h + '<div class="empty"><big>👥</big>Cadastre as pessoas primeiro.</div>';
    var dp = E.despensa(state, state.modo, meta);
    h += '<p class="muted">Lista para ' + dp.h.n + ' pessoa(s) em modo <b>' + D.MODOS[state.modo].nome + '</b>, considerando o que você já tem. ' +
      'Cada linha usa a mesma porção diária do Catálogo e do Painel.</p>';
    var falta = dp.rows.filter(function (r) { return r.faltaKg > 0.001; });
    h += '<div class="card"><div class="scroll"><table><thead><tr><th>Alimento</th><th class="num">Meta</th><th class="num">Tem</th><th class="num">Falta</th><th style="width:20%">Atingido</th></tr></thead><tbody>' +
      dp.rows.map(function (r) {
        var u = r.food.un === 'kg' ? 'kg' : r.food.un === 'l' ? 'L' : 'un';
        var dec = r.food.un === 'un' ? n0 : n1;
        return '<tr><td>' + fname(r.food) + '</td><td class="num">' + dec(r.necessarioQtd) + ' ' + u + '</td><td class="num">' + dec(r.temQtd) + ' ' + u +
          '</td><td class="num"><b>' + (r.faltaKg > 0.001 ? dec(r.faltaQtd) + ' ' + u : '✓') + '</b></td>' +
          '<td><div class="bar ' + (r.pct >= 100 ? '' : r.pct >= 50 ? 'warn' : 'bad') + '"><i style="width:' + r.pct.toFixed(0) + '%"></i></div></td></tr>';
      }).join('') + '</tbody></table></div></div>';
    if (!falta.length) h += '<div class="sug ok"><b>Despensa completa para a meta.</b></div>';
    var cp = dp.complemento;
    if (cp.kcalDia > 1) {
      h += '<div class="card"><h3>⚡ Complemento calórico</h3>' +
        '<p>As porções do catálogo cobrem <b>' + n0(cp.cobertura) + '%</b> das calorias da casa. Faltam <b>' + n0(cp.kcalDia) + ' kcal por dia</b> (' + n0(cp.kcalTotal / 1000) + ' mil kcal em ' + meta + ' dias).</p>' +
        '<p>Para fechar, aumente as porções no Catálogo ou some alimentos baratos e duradouros. Em arroz, seriam cerca de <b>' + n0(cp.arrozKg) + ' kg</b> a mais, ou o equivalente em macarrão, farinha, feijão, óleo e açúcar. O ideal é dividir entre vários alimentos, não só arroz.</p>' +
        '<p class="muted">Este valor não está incluído nas linhas acima.</p></div>';
    }
    // água e gás
    var an = E.analyze(state);
    var aguaMeta = an.aguaDia * meta, gasMeta = an.gasDia * meta;
    h += '<div class="card"><h3>Água e gás</h3>' +
      '<p>Água para ' + meta + ' dias: <b>' + n0(aguaMeta) + ' L</b> · você tem ' + n0(state.aguaL) + ' L · falta <b>' + n0(Math.max(0, aguaMeta - state.aguaL)) + ' L</b>.</p>' +
      '<p>Gás para ' + meta + ' dias: <b>' + n1(gasMeta) + ' kg</b> (' + n1(gasMeta / 13) + ' botijões de 13 kg) · você tem ' + n1(state.gasKg) + ' kg.</p>' +
      '<p class="muted">Ajuste água e gás na aba Config. A água estoque é a prioridade número um.</p></div>';
    return h;
  }

  /* ---------------- CARDÁPIO ---------------- */
  function vCardapio() {
    var an = E.analyze(state);
    var h = '<h2>Cardápio sugerido</h2>';
    if (!an.h.n || !an.items.length) return h + '<div class="empty"><big>🍽️</big>Cadastre pessoas e estoque para gerar o cardápio.</div>';
    h += '<p class="muted">Quantidades <b>prontas para comer</b> (g) para a casa toda, no modo ' + D.MODOS[state.modo].nome + ', usando só o que existe no estoque. Alterna leguminosas e proteínas ao longo dos dias.</p>';
    E.cardapio(state, an, 7).forEach(function (d) {
      h += '<div class="card menu-day"><div class="dnum"><small>DIA</small>' + d.dia + '</div><div>' + d.refeicoes.map(function (r) {
        if (!r.itens.length) return '';
        return '<div class="meal"><b>' + r.nome + ':</b> ' + r.itens.map(function (i) {
          var nome = i.food.nome.replace(/ \(.*\)/, '');
          var unidade = i.food.id === 'vitamina' ? ' comp.' : i.food.id === 'leite_po' ? ' ml' : ' g';
          return em(i.food) + ' ' + esc(nome) + ' <b>' + n0(i.g) + unidade + '</b>';
        }).join(' · ') + '</div>';
      }).join('') + '</div></div>';
    });
    return h;
  }

  /* ---------------- ESTRATÉGIAS ---------------- */
  function vEstrategias() {
    var an = E.analyze(state);
    var h = '<h2>Estratégias para economizar</h2>';
    if (an.h.n && an.tot.kcal > 0) {
      var base = an.dias.energia, rac = E.analyze(state, 'racionamento').dias.energia, em = E.analyze(state, 'emergencia').dias.energia;
      h += '<div class="card"><h3>Seu caso</h3><p>No modo normal o estoque dura <b>' + dias(base) + '</b>. Em racionamento dura <b>' + dias(rac) + '</b> e em emergência <b>' + dias(em) + '</b>.</p></div>';
    }
    h += E.ESTRATEGIAS.map(function (s) { return '<div class="card"><h3>' + esc(s.t) + '</h3><p>' + esc(s.d) + '</p></div>'; }).join('');
    return h;
  }

  /* ---------------- CATÁLOGO ---------------- */
  function vCatalogo() {
    var foods = E.allFoods(state);
    var h = '<h2>Catálogo de alimentos</h2><p class="muted">Rendimento e porção são editáveis. <b>Porção</b> = gramas prontas por dia, por pessoa de referência (2.000 kcal) no modo normal. Os modos reduzem automaticamente.</p>' +
      '<div class="card"><div class="scroll"><table><thead><tr><th>Alimento</th><th class="num">Rendimento</th><th class="num">kcal/100g pronto</th><th class="num">Porção (g)</th><th class="num">Validade</th></tr></thead><tbody>' +
      foods.map(function (f) {
        var ov = state.porcoes[f.id];
        var src = f.fonte ? '<span class="tag src" title="Valor conferido em ' + (f.fonte === 'TACO' ? 'Tabela TACO (UNICAMP)' : 'USDA FoodData Central') + '">' + f.fonte + '</span>' : '<span class="tag est" title="Estimativa média">estimado</span>';
        return '<tr title="' + esc(f.dica || '') + '"><td>' + fname(f, D.GRUPOS[f.grupo] + ' · ' + src) + '</td>' +
          '<td class="num">×' + n1(f.rend) + (f.rend > 1 ? '<div class="muted">1 kg → ' + n1(f.rend) + ' kg</div>' : '') + '</td>' +
          '<td class="num">' + n0(f.kcal / (f.rend || 1)) + '</td>' +
          '<td class="num"><input type="number" min="0" step="1" value="' + f.porcao + '" data-act="porcao" data-id="' + f.id + '" style="width:80px">' +
          (ov !== undefined ? ' <button class="btn del" data-act="reset-porcao" data-id="' + f.id + '" title="Restaurar padrão">↺</button>' : '') + '</td>' +
          '<td class="num">' + f.val + ' m</td></tr>';
      }).join('') + '</tbody></table></div></div>';
    h += '<p class="muted">Fontes: <b>TACO</b> = Tabela Brasileira de Composição de Alimentos (UNICAMP); <b>USDA</b> = USDA FoodData Central; <b>estimado</b> = média de rótulos. Rendimento, porção, tempo de cozimento e validade são estimativas médias.</p>' +
      '<div class="card"><h3>Adicionar alimento</h3><form class="form" data-form="custom">' +
      '<div><label>Nome</label><input name="nome" required maxlength="50"></div>' +
      '<div><label>Grupo</label><select name="grupo">' + Object.keys(D.GRUPOS).map(function (g) { return '<option value="' + g + '">' + D.GRUPOS[g] + '</option>'; }).join('') + '</select></div>' +
      '<div><label>Unidade</label><select name="un"><option value="kg">kg</option><option value="l">litro</option><option value="un">unidade</option></select></div>' +
      '<div><label>g por unidade/litro</label><input name="gpu" type="number" min="1" placeholder="se unid. ou litro"></div>' +
      '<div><label>kcal/100g (armazenado)</label><input name="kcal" type="number" min="0" required></div>' +
      '<div><label>Proteína g/100g</label><input name="prot" type="number" min="0" step="any" value="0"></div>' +
      '<div><label>Gordura g/100g</label><input name="gord" type="number" min="0" step="any" value="0"></div>' +
      '<div><label>Carboidrato g/100g</label><input name="carb" type="number" min="0" step="any" value="0"></div>' +
      '<div><label>Rendimento (×)</label><input name="rend" type="number" min="0.1" step="any" value="1"></div>' +
      '<div><label>Porção diária (g pronto)</label><input name="porcao" type="number" min="0" value="0"></div>' +
      '<div><label>Validade (meses)</label><input name="val" type="number" min="0" step="any" value="12"></div>' +
      '<div><button class="btn" type="submit">Adicionar ao catálogo</button></div></form></div>';
    return h;
  }

  /* ---------------- CONFIG ---------------- */
  function vConfig() {
    var h = '<h2>Configurações</h2><div class="card"><div class="form">' +
      '<div><label>Meta (dias)</label><input type="number" min="1" max="730" value="' + state.metaDias + '" data-act="cfg" data-k="metaDias"></div>' +
      '<div><label>Água armazenada (litros)</label><input type="number" min="0" step="any" value="' + state.aguaL + '" data-act="cfg" data-k="aguaL"></div>' +
      '<div><label>Água de higiene (L/pessoa/dia)</label><input type="number" min="0" step="any" value="' + state.aguaHigiene + '" data-act="cfg" data-k="aguaHigiene"></div>' +
      '<div><label>Gás armazenado (kg)</label><input type="number" min="0" step="any" value="' + state.gasKg + '" data-act="cfg" data-k="gasKg"></div>' +
      '<div><label>Consumo do fogão (kg/h)</label><input type="number" min="0.05" step="0.05" value="' + state.fogaoKgH + '" data-act="cfg" data-k="fogaoKgH"></div></div>' +
      '<p class="muted">Botijão de 13 kg equivale a 13 kg de gás. Um queimador comum consome cerca de 0,2 kg/h. A estimativa de gás considera apenas o tempo de fogo dos alimentos que exigem cozimento.</p></div>';
    h += '<div class="card"><h3>Backup dos dados</h3><p class="muted">Os dados ficam só neste navegador. Exporte um arquivo para guardar ou levar para outro aparelho.' +
      (state.atualizado ? ' Última alteração: ' + new Date(state.atualizado).toLocaleString('pt-BR') + '.' : '') + '</p>' +
      '<div class="flex"><button class="btn" data-act="export">Exportar JSON</button>' +
      '<label class="btn sec" style="display:inline-block;cursor:pointer;color:var(--ink)">Importar JSON<input type="file" accept="application/json" data-act="import" hidden></label>' +
      '<button class="btn del" data-act="reset">Apagar tudo</button></div></div>';
    return h;
  }

  /* ---------------- EVENTOS ---------------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab],[data-act],[data-modo]'); if (!t) return;
    if (t.dataset.modo) { state.modo = t.dataset.modo; save(); render(); return; }
    if (t.dataset.tab) { tab = t.dataset.tab; render(); window.scrollTo(0, 0); return; }
    var act = t.dataset.act, id = t.dataset.id;
    if (act === 'del-pessoa') { state.pessoas = state.pessoas.filter(function (p) { return p.id !== id; }); save(); render(); }
    else if (act === 'del-estoque') { state.estoque = state.estoque.filter(function (s) { return s.id !== id; }); save(); render(); }
    else if (act === 'reset-porcao') { delete state.porcoes[id]; save(); render(); }
    else if (act === 'export') exportar();
    else if (act === 'reset') {
      if (confirm('Apagar TODOS os dados deste navegador? Esta ação não pode ser desfeita.')) {
        state = JSON.parse(JSON.stringify(DEFAULT)); save(); render();
      }
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'foodSel') { updateFoodHint(); return; }
    var act = t.dataset && t.dataset.act; if (!act) return;
    if (act === 'qtd') { var s = find(state.estoque, t.dataset.id); if (s) { s.qtd = Math.max(0, Number(t.value) || 0); save(); render(); } }
    else if (act === 'validade') { var s2 = find(state.estoque, t.dataset.id); if (s2) { s2.validade = t.value; save(); render(); } }
    else if (act === 'porcao') { state.porcoes[t.dataset.id] = Math.max(0, Number(t.value) || 0); save(); render(); }
    else if (act === 'cfg') { var v = Number(t.value); state[t.dataset.k] = isFinite(v) && v >= 0 ? v : 0; if (t.dataset.k === 'metaDias' && !state.metaDias) state.metaDias = 90; save(); render(); }
    else if (act === 'import') importar(t.files[0]);
  });

  document.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-form]'); if (!f) return;
    e.preventDefault();
    var fd = new FormData(f), kind = f.dataset.form;
    if (kind === 'pessoa') {
      state.pessoas.push({ id: uid(), nome: String(fd.get('nome') || '').trim(), perfil: fd.get('perfil'), kcal: Number(fd.get('kcal')) || 0 });
    } else if (kind === 'estoque') {
      var qtd = Number(fd.get('qtd'));
      if (!(qtd > 0)) return;
      state.estoque.push({ id: uid(), foodId: fd.get('foodId'), qtd: qtd, validade: fd.get('validade') || '' });
    } else if (kind === 'custom') {
      var un = fd.get('un'), gpu = Number(fd.get('gpu')) || (un === 'l' ? 1000 : 1);
      state.custom.push({ id: 'c_' + uid(), nome: String(fd.get('nome')).trim(), grupo: fd.get('grupo'), un: un, gpu: gpu,
        kcal: Number(fd.get('kcal')) || 0, prot: Number(fd.get('prot')) || 0, gord: Number(fd.get('gord')) || 0, carb: Number(fd.get('carb')) || 0,
        rend: Number(fd.get('rend')) || 1, porcao: Number(fd.get('porcao')) || 0, val: Number(fd.get('val')) || 12, coc: 0, agua: 0, core: Number(fd.get('porcao')) > 0 });
    }
    save(); render();
  });

  function find(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }

  function updateFoodHint() {
    var sel = document.getElementById('foodSel'); if (!sel) return;
    var f = E.foodMap(E.allFoods(state))[sel.value]; if (!f) return;
    document.getElementById('unitLbl').textContent = '(' + (f.un === 'kg' ? 'kg' : f.un === 'l' ? 'litros' : 'unidades de ' + f.gpu + ' g') + ')';
    document.getElementById('foodHint').textContent = (f.dica || '') + (f.rend > 1 ? ' Rendimento: 1 kg → ' + n1(f.rend) + ' kg pronto.' : '');
  }
  var origRender = render;
  render = function () { origRender(); if (tab === 'estoque') updateFoodHint(); };

  function exportar() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'estoque-inteligente-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function importar(file) {
    if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(r.result);
        if (!d || typeof d !== 'object' || !Array.isArray(d.pessoas) || !Array.isArray(d.estoque)) throw new Error('formato');
        if (!confirm('Substituir os dados atuais pelo arquivo importado?')) return;
        state = Object.assign({}, DEFAULT, d); save(); render();
      } catch (err) { alert('Arquivo inválido.'); }
    };
    r.readAsText(file);
  }

  render();
})();
