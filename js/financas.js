/* Controle financeiro: cada compra é uma entrada (item, quantidade, valor, data, loja), mesmo que seja o mesmo
   alimento em datas diferentes. As funções são puras e testáveis em Node.
   Entrada: { id, tipo: 'estoque'|'manual', estoqueId, foodId, nome, grupo, categoria, qtd, un, kg, preco, data 'AAAA-MM-DD', loja } */
(function (root) {
  var CATEGORIAS = { agua: 'Água', gas: 'Gás', medicamento: 'Medicamentos', alimento: 'Alimentos (avulso)', outros: 'Outros' };
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  function mes(data) { return String(data || '').slice(0, 7); }
  function mesAtual(hoje) { hoje = hoje || new Date(); return hoje.getFullYear() + '-' + ('0' + (hoje.getMonth() + 1)).slice(-2); }
  function hojeISO(hoje) { hoje = hoje || new Date(); return mesAtual(hoje) + '-' + ('0' + hoje.getDate()).slice(-2); }
  function somaMes(m, n) {
    var p = m.split('-'), d = new Date(Number(p[0]), Number(p[1]) - 1 + n, 1);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
  }
  function rotuloMes(m, longo) {
    var p = m.split('-'); return MESES[Number(p[1]) - 1] + (longo ? ' de ' + p[0] : '/' + p[0].slice(2));
  }
  function diasDoMes(m) { var p = m.split('-'); return new Date(Number(p[0]), Number(p[1]), 0).getDate(); }

  function doMes(gastos, m) { return (gastos || []).filter(function (g) { return mes(g.data) === m; }); }
  function total(gastos, m) { return doMes(gastos, m).reduce(function (a, g) { return a + (Number(g.preco) || 0); }, 0); }

  /* totais dos n meses que terminam em 'ate' (inclui meses sem gasto) */
  function serie(gastos, ate, n) {
    var out = [];
    for (var i = n - 1; i >= 0; i--) { var m = somaMes(ate, -i); out.push({ mes: m, total: total(gastos, m) }); }
    return out;
  }

  function rotuloGrupo(g, grupos) {
    return (g.tipo === 'manual' ? CATEGORIAS[g.categoria] : (grupos && grupos[g.grupo])) || CATEGORIAS[g.categoria] || 'Outros';
  }
  /* total por categoria no mês, maior primeiro */
  function porCategoria(gastos, m, grupos) {
    var acc = {};
    doMes(gastos, m).filter(function (g) { return g.preco > 0; }).forEach(function (g) { var k = rotuloGrupo(g, grupos); acc[k] = (acc[k] || 0) + (Number(g.preco) || 0); });
    return Object.keys(acc).map(function (k) { return { nome: k, total: acc[k] }; }).sort(function (a, b) { return b.total - a.total; });
  }

  function precoKg(g) { return g && g.kg > 0 && g.preco > 0 ? g.preco / g.kg : null; }
  function precoUn(g) { return g && g.qtd > 0 && g.preco > 0 ? g.preco / g.qtd : null; }

  /* compras de um alimento, da mais antiga para a mais nova, com preço por kg */
  function historico(gastos, foodId) {
    return (gastos || []).filter(function (g) { return g.foodId === foodId && g.preco > 0; })
      .sort(function (a, b) { return String(a.data).localeCompare(String(b.data)); })
      .map(function (g) { return { gasto: g, porKg: precoKg(g), porUn: precoUn(g) }; });
  }
  function resumoPreco(gastos, foodId) {
    var h = historico(gastos, foodId).filter(function (x) { return x.porKg !== null; });
    if (!h.length) return null;
    var v = h.map(function (x) { return x.porKg; });
    var ult = v[v.length - 1], ant = v.length > 1 ? v[v.length - 2] : null;
    return { n: h.length, min: Math.min.apply(null, v), max: Math.max.apply(null, v), media: v.reduce(function (a, b) { return a + b; }, 0) / v.length,
             ultimo: ult, variacao: ant ? (ult - ant) / ant * 100 : null };
  }
  function ultimoPrecoKg(gastos, foodId) { var r = resumoPreco(gastos, foodId); return r ? r.ultimo : null; }

  function variacao(gastos, m) {
    var a = total(gastos, m), b = total(gastos, somaMes(m, -1));
    return { atual: a, anterior: b, diff: a - b, pct: b > 0 ? (a - b) / b * 100 : null };
  }

  /* custo estimado para completar a despensa, usando o último preço por kg de cada alimento */
  function estimativa(linhas, gastos) {
    var itens = [], tot = 0, semPreco = 0;
    (linhas || []).forEach(function (r) {
      if (!(r.faltaKg > 0.001)) return;
      var p = ultimoPrecoKg(gastos, r.food.id);
      if (p === null) { semPreco++; return; }
      var c = r.faltaKg * p; tot += c; itens.push({ food: r.food, faltaKg: r.faltaKg, precoKg: p, custo: c });
    });
    itens.sort(function (a, b) { return b.custo - a.custo; });
    return { total: tot, itens: itens, semPreco: semPreco };
  }

  function brl(v) { return (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

  /* CSV para planilha em português: ponto e vírgula e vírgula decimal, com BOM para acentos no Excel */
  function csv(gastos, grupos) {
    var cab = ['Data', 'Item', 'Categoria', 'Quantidade', 'Unidade', 'Valor (R$)', 'R$ por kg', 'Loja'];
    var lin = (gastos || []).slice().sort(function (a, b) { return String(a.data).localeCompare(String(b.data)); }).map(function (g) {
      var pk = precoKg(g), num = function (v) { return v === null || v === undefined ? '' : String(Math.round(v * 100) / 100).replace('.', ','); };
      var q = function (t) { t = String(t == null ? '' : t); return /[;"\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
      return [g.data, q(g.nome), q(rotuloGrupo(g, grupos)), num(g.qtd), g.un || '', num(g.preco), num(pk), q(g.loja)].join(';');
    });
    return '﻿' + [cab.join(';')].concat(lin).join('\r\n');
  }

  var api = { CATEGORIAS: CATEGORIAS, mes: mes, mesAtual: mesAtual, hojeISO: hojeISO, somaMes: somaMes, rotuloMes: rotuloMes, diasDoMes: diasDoMes,
              doMes: doMes, total: total, serie: serie, porCategoria: porCategoria, precoKg: precoKg, precoUn: precoUn, historico: historico,
              resumoPreco: resumoPreco, ultimoPrecoKg: ultimoPrecoKg, variacao: variacao, estimativa: estimativa, brl: brl, csv: csv, rotuloGrupo: rotuloGrupo };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FIN = api;
})(typeof window !== 'undefined' ? window : this);
