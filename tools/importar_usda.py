#!/usr/bin/env python3
"""Gera js/usda.js a partir da base USDA FoodData Central, SR Legacy (domínio público).

Download: https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
Uso:  python3 -I tools/importar_usda.py PASTA_COM_OS_CSV js/usda.js

Curadoria: a base tem 7.793 alimentos, em inglês, com muitos produtos de marca, restaurantes e alimentos frescos.
Foram escolhidos 157 alimentos duráveis e genéricos (grãos, massas, farinhas, leguminosas secas e enlatadas,
oleaginosas, óleos, açúcares, laticínios em pó, peixes e carnes enlatados, frutas secas, tomate enlatado etc.),
listados em tools/usda_selecao.json com o nome em português. Variações pouco úteis (com e sem sal, enriquecido ou
não, versões industriais) foram agrupadas. Valores por 100 g, no estado do nome.
"""
import csv, json, os, re, sys

CAT = {'Cereal Grains and Pasta': 'cereal', 'Baked Products': 'cereal', 'Legume Products': 'leguminosa',
       'Legumes and Legume Products': 'leguminosa', 'Nut and Seed Products': 'gordura', 'Fats and Oils': 'gordura',
       'Sweets': 'acucar', 'Dairy and Egg Products': 'laticinio', 'Fruits and Fruit Juices': 'fruta',
       'Vegetables and Vegetable Products': 'vegetal', 'Beef Products': 'carne', 'Pork Products': 'carne',
       'Poultry Products': 'carne', 'Sausages and Luncheon Meats': 'carne', 'Finfish and Shellfish Products': 'pescado',
       'Soups, Sauces, and Gravies': 'preparado', 'Spices and Herbs': 'essencial', 'Beverages': 'bebida',
       'Snacks': 'preparado', 'Breakfast Cereals': 'cereal', 'Lamb, Veal, and Game Products': 'carne'}
GRUPO = {172430: 'gordura', 173806: 'gordura', 172441: 'leguminosa', 172188: 'proteina', 169094: 'vegetal',
         # molhos e condimentos ficam em "preparados"; azeitona verde e conservas de legumes em "legumes"
         174277: 'preparado', 174278: 'preparado', 172442: 'preparado', 171009: 'preparado', 169096: 'vegetal', 172234: 'essencial',
         174289: 'preparado', 172446: 'laticinio', 172475: 'proteina'}
# rendimento cru -> cozido (kg pronto por kg armazenado); valores médios de uso doméstico
REND = {}
for i in (168877, 168879, 168881, 168883, 168931, 169703, 169706): REND[i] = 2.8
for i in (168927, 169731, 169738): REND[i] = 2.3
for i in (172420, 174284, 172428): REND[i] = 2.5
for i in (173734, 173744, 173745, 173758, 174252, 174256, 175199, 175202, 175205, 173756): REND[i] = 2.3
# arroz parboilizado/pré-cozido, massas orientais, grits e aveia instantânea
for i in (169707, 168876): REND[i] = 2.8
REND.update({169709: 2.5, 168906: 2.3, 168908: 2.3, 169742: 2.5, 169755: 2.3, 168903: 2.3, 168911: 2.3, 168915: 2.3, 168899: 2.3, 168937: 2.3,
             171177: 2.3, 171661: 2.5, 171654: 4.0, 170685: 2.5, 169717: 3.0, 169715: 2.5})
REND.update({174270: 2.5, 169726: 3.0, 169699: 2.4, 170688: 3.0, 168874: 3.0, 169702: 3.0, 170284: 3.5, 170283: 3.0,
             170286: 2.5, 169745: 2.5, 169743: 2.5, 169747: 3.0, 170682: 3.0, 169716: 2.5, 169705: 2.5,
             170039: 5.5, 170445: 5.5, 170876: 8.0, 173454: 8.0, 172188: 4.0})

def validade(desc, grupo):
    if re.search(r'coconut meat, raw', desc, re.I): return 0.5
    if grupo in ('pescado', 'carne'): return 36 if re.search('canned', desc, re.I) else 12
    if re.search('canned', desc, re.I): return 24
    return {'cereal': 12, 'leguminosa': 18, 'gordura': 6 if re.search(r'^(Nuts|Seeds)', desc) else 12, 'acucar': 24,
            'laticinio': 3 if re.search('Cheese', desc) else 12, 'fruta': 12, 'vegetal': 12, 'preparado': 12, 'proteina': 12}.get(grupo, 12)

def main(pasta, destino):
    sel = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'usda_selecao.json'), encoding='utf-8'))
    cats = {r['id']: r['description'] for r in csv.DictReader(open(os.path.join(pasta, 'food_category.csv'), encoding='utf-8'))}
    foods = {r['fdc_id']: r for r in csv.DictReader(open(os.path.join(pasta, 'food.csv'), encoding='utf-8')) if r['fdc_id'] in sel}
    n = {}
    for r in csv.DictReader(open(os.path.join(pasta, 'food_nutrient.csv'), encoding='utf-8')):
        if r['fdc_id'] in sel and r['nutrient_id'] in ('1008', '1003', '1004', '1005') and r['amount']:
            n.setdefault(r['fdc_id'], {})[r['nutrient_id']] = float(r['amount'])
    linhas, faltam = [], []
    for fid, nome in sel.items():
        f, v = foods.get(fid), n.get(fid, {})
        if not f or len(v) < 4: faltam.append(fid); continue
        i = int(fid); grupo = GRUPO.get(i) or CAT[cats[f['food_category_id']]]
        alias = re.sub(r'\s*\(.*?\)', '', f['description']).lower()
        linhas.append(json.dumps([i, nome, grupo, round(v['1008'], 1), round(v['1003'], 1), round(v['1004'], 1), round(v['1005'], 1),
                                  REND.get(i, 1.0), validade(f['description'], grupo), alias], ensure_ascii=False))
    js = '''/* Gerado por tools/importar_usda.py a partir da USDA FoodData Central, SR Legacy (domínio público). Não edite à mão.
   Colunas: [id USDA, nome em português, grupo, kcal, proteína, gordura, carboidrato (por 100 g), rendimento, validade em meses, nome original em inglês (busca)] */
(function (root) {
  var D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.DATA;
  var U = [
%s
  ];
  U.forEach(function (r) {
    D.ALIMENTOS.push({ id: 'usda_' + r[0], nome: r[1], grupo: r[2], un: 'kg', kcal: r[3], prot: r[4], gord: r[5], carb: r[6],
      rend: r[7], porcao: 0, coc: 0, agua: 0, val: r[8], fonte: 'USDA', core: false, usda: true, alias: r[9],
      dica: 'Importado da USDA FoodData Central (SR Legacy) e traduzido, no estado indicado no nome. Defina uma porção diária para incluir nos cálculos de duração.' });
  });
})(typeof window !== 'undefined' ? window : this);
''' % ',\n'.join('    ' + l for l in linhas)
    open(destino, 'w', encoding='utf-8').write(js)
    print('itens:', len(linhas), '| sem dados:', faltam)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
