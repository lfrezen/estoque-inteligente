#!/usr/bin/env python3
"""Gera js/taco.js a partir do TACO.json (Tabela Brasileira de Composição de Alimentos, UNICAMP,
em formato JSON: https://github.com/marcelosanto/tabela_taco, licença MIT).

Uso:  python3 -I tools/importar_taco.py caminho/para/TACO.json js/taco.js

- 'Tr' (traços) vira 0; 'NA' e vazio viram "sem dado" (0 nos macros, mas o item só entra se tiver energia).
- O rendimento cru -> cozido só é calculado quando a própria tabela traz as duas versões do mesmo alimento
  e a razão de energia fica entre 1,3 e 3,5 (cereais, leguminosas e vegetais). Leguminosas cruas sem par usam 2,3.
"""
import json, re, sys

CAT = {
    'Cereais e derivados': 'cereal', 'Verduras, hortaliças e derivados': 'vegetal', 'Frutas e derivados': 'fruta',
    'Gorduras e óleos': 'gordura', 'Pescados e frutos do mar': 'pescado', 'Carnes e derivados': 'carne',
    'Leite e derivados': 'laticinio', 'Bebidas (alcoólicas e não alcoólicas)': 'bebida', 'Ovos e derivados': 'proteina',
    'Produtos açucarados': 'acucar', 'Miscelâneas': 'outros', 'Outros alimentos industrializados': 'preparado',
    'Alimentos preparados': 'preparado', 'Leguminosas e derivados': 'leguminosa', 'Nozes e sementes': 'gordura',
}
VAL = {'cereal': 12, 'leguminosa': 18, 'gordura': 12, 'acucar': 12, 'vegetal': 0.5, 'fruta': 0.5, 'carne': 0.3,
       'pescado': 0.3, 'laticinio': 3, 'bebida': 6, 'preparado': 1, 'outros': 6, 'proteina': 1}
LONGA = re.compile(r'(conserva|enlatad|em lata|\bseco\b|\bseca\b|em p[oó]\b|charque|defumad|salgad|farinha|passa|desidrat|torrad|biscoito|bolacha|macarr)', re.I)

def num(v):
    if v is None: return None
    if isinstance(v, (int, float)): return float(v)
    v = str(v).strip()
    if v == 'Tr': return 0.0
    try: return float(v)
    except ValueError: return None

def main(src, dst):
    dados = json.load(open(src, encoding='utf-8'))
    itens = []
    for x in dados:
        kcal = num(x.get('energy_kcal'))
        grupo = CAT.get(x.get('category'))
        if kcal is None or not grupo: continue
        val = 12 if LONGA.search(x['description']) and grupo not in ('cereal', 'leguminosa') else VAL[grupo]
        itens.append({'id': x['id'], 'nome': x['description'].strip(), 'grupo': grupo, 'kcal': round(kcal, 1),
                      'prot': round(num(x.get('protein_g')) or 0, 1), 'gord': round(num(x.get('lipid_g')) or 0, 1),
                      'carb': round(num(x.get('carbohydrate_g')) or 0, 1), 'rend': 1.0, 'val': val})
    # rendimento cru -> cozido
    base = {}
    pad = re.compile(r',\s*(cru[as]?|cozid[oa]s?)$', re.I)
    for it in itens:
        m = pad.search(it['nome'])
        if m: base.setdefault(pad.sub('', it['nome']).lower(), {})['cru' if m.group(1).lower().startswith('cru') else 'coz'] = it
    n_rend = 0
    for par in base.values():
        c, z = par.get('cru'), par.get('coz')
        if c and z and z['kcal'] > 0 and c['grupo'] in ('cereal', 'leguminosa', 'vegetal'):
            r = c['kcal'] / z['kcal']
            if 1.3 < r <= 3.5: c['rend'] = round(r, 1); n_rend += 1
    # leguminosas cruas sem versão cozida comparável na tabela: rendimento padrão de 2,3 (feijão cozido e escorrido)
    for it in itens:
        if it['grupo'] == 'leguminosa' and it['rend'] == 1.0 and re.search(r',\s*cru[as]?$', it['nome'], re.I) and not re.search(r'(farinha|broto|germinad|amendoim)', it['nome'], re.I):
            it['rend'] = 2.3; n_rend += 1
    linhas = ',\n'.join('    ' + json.dumps([i['id'], i['nome'], i['grupo'], i['kcal'], i['prot'], i['gord'], i['carb'], i['rend'], i['val']], ensure_ascii=False) for i in itens)
    js = '''/* Gerado por tools/importar_taco.py a partir da Tabela Brasileira de Composição de Alimentos (TACO/UNICAMP),
   via https://github.com/marcelosanto/tabela_taco (MIT). Não edite à mão.
   Colunas: [id TACO, nome, grupo, kcal, proteína, gordura, carboidrato (por 100 g), rendimento, validade em meses]
   Valores no estado em que a tabela os traz (cru, cozido, preparado). */
(function (root) {
  var D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.DATA;
  Object.assign(D.GRUPOS, {
    fruta: 'Frutas', carne: 'Carnes e derivados', pescado: 'Pescados', bebida: 'Bebidas',
    preparado: 'Preparados e industrializados', outros: 'Outros'
  });
  var T = [
%s
  ];
  T.forEach(function (r) {
    D.ALIMENTOS.push({ id: 'taco_' + r[0], nome: r[1], grupo: r[2], un: 'kg', kcal: r[3], prot: r[4], gord: r[5], carb: r[6],
      rend: r[7], porcao: 0, coc: 0, agua: 0, val: r[8], fonte: 'TACO', core: false, taco: true,
      dica: 'Importado da Tabela TACO (UNICAMP), no estado indicado no nome. Defina uma porção diária para incluir nos cálculos de duração.' });
  });
})(typeof window !== 'undefined' ? window : this);
''' % linhas
    open(dst, 'w', encoding='utf-8').write(js)
    print('itens importados:', len(itens), '| com rendimento cru->cozido:', n_rend)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
