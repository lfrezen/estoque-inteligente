/* Base de dados inicial, por 100 g do alimento COMO ARMAZENADO (cru/seco/enlatado).
   fonte 'TACO' = conferido na Tabela TACO (UNICAMP); 'USDA' = USDA FoodData Central (conferido por fontes secundárias);
   sem fonte = estimativa média de rótulos. Tudo é editável no app.
   Campos:
   un     unidade de estoque: 'kg' | 'l' | 'un'
   gpu    gramas por unidade (un) ou gramas por litro (l)
   kcal, prot, gord, carb   por 100 g armazenado
   rend   rendimento: kg pronto para comer por kg armazenado (arroz 2.8 = 1 kg vira 2,8 kg cozido)
   porcao gramas PRONTAS por dia, por pessoa de referência (2000 kcal), modo normal
   coc    minutos de fogo por kg armazenado cozinhado
   agua   litros de água usados no preparo por kg armazenado
   val    validade típica fechado, em meses
   core   entra na "despensa ideal"
   fixed  consumo fixo por pessoa (não escala com a necessidade calórica) */
(function (root) {
  var GRUPOS = {
    cereal: 'Cereais e farináceos',
    leguminosa: 'Leguminosas',
    proteina: 'Proteínas (conservas, ovos, soja)',
    laticinio: 'Laticínios (leite em pó)',
    gordura: 'Gorduras e oleaginosas',
    acucar: 'Açúcares',
    vegetal: 'Legumes, frutas e molhos',
    micro: 'Vitaminas e suplementos',
    essencial: 'Essenciais (sal)'
  };

  var ALIMENTOS = [
    { id: 'arroz', nome: 'Arroz branco', grupo: 'cereal', un: 'kg', kcal: 358, prot: 7.2, gord: 0.3, carb: 79, rend: 2.8, porcao: 130, coc: 25, agua: 2.0, val: 24, fonte: 'TACO', core: true,
      dica: 'Fechado e seco dura anos. Guarde em pote hermético, longe da umidade.' },
    { id: 'macarrao', nome: 'Macarrão', grupo: 'cereal', un: 'kg', kcal: 371, prot: 13, gord: 1.5, carb: 75, rend: 2.3, porcao: 45, coc: 12, agua: 4.0, val: 24, fonte: 'USDA', core: true,
      dica: 'Cozinha rápido, gasta pouco gás. A água do cozimento pode ser reaproveitada.' },
    { id: 'aveia', nome: 'Aveia em flocos', grupo: 'cereal', un: 'kg', kcal: 394, prot: 13.9, gord: 8.5, carb: 66, rend: 2.5, porcao: 40, coc: 5, agua: 2.0, val: 12, fonte: 'TACO', core: true,
      dica: 'Ótima para o café da manhã e pode ser comida sem cozinhar, só hidratada.' },
    { id: 'fuba', nome: 'Fubá / milho para polenta', grupo: 'cereal', un: 'kg', kcal: 351, prot: 7.2, gord: 1.5, carb: 79.1, rend: 3.5, porcao: 30, coc: 30, agua: 3.5, val: 12, fonte: 'TACO', core: true,
      dica: 'Polenta e angu rendem muito. Prefira embalagens fechadas.' },
    { id: 'farinha_mandioca', nome: 'Farinha de mandioca', grupo: 'cereal', un: 'kg', kcal: 361, prot: 1.6, gord: 0.3, carb: 87.9, rend: 1.0, porcao: 20, coc: 0, agua: 0, val: 12, fonte: 'TACO', core: true,
      dica: 'Não precisa de fogo. Farofa e pirão acompanham feijão.' },
    { id: 'farinha_trigo', nome: 'Farinha de trigo', grupo: 'cereal', un: 'kg', kcal: 360, prot: 9.8, gord: 1.4, carb: 75.1, rend: 1.4, porcao: 40, coc: 20, agua: 0.6, val: 12, fonte: 'TACO', core: false,
      dica: 'Permite pão sem fermento, panquecas e massas. Dura menos que o arroz.' },
    { id: 'biscoito', nome: 'Biscoito cream cracker', grupo: 'cereal', un: 'kg', kcal: 432, prot: 10.1, gord: 14.4, carb: 68.7, rend: 1.0, porcao: 20, coc: 0, agua: 0, val: 9, fonte: 'TACO', core: false,
      dica: 'Pronto para comer, bom para quando não houver como cozinhar.' },

    { id: 'feijao', nome: 'Feijão carioca', grupo: 'leguminosa', un: 'kg', kcal: 329, prot: 20, gord: 1.3, carb: 61, rend: 2.3, porcao: 100, coc: 40, agua: 2.5, val: 18, fonte: 'TACO', core: true,
      dica: 'Feijão velho demora mais a cozinhar. Deixe de molho e use panela de pressão para economizar gás.' },
    { id: 'lentilha', nome: 'Lentilha', grupo: 'leguminosa', un: 'kg', kcal: 339, prot: 23.2, gord: 0.8, carb: 62, rend: 2.4, porcao: 45, coc: 25, agua: 2.5, val: 24, fonte: 'TACO', core: true,
      dica: 'Cozinha sem molho em cerca de 25 min. Pode germinar para ganhar vitamina C.' },
    { id: 'grao_bico', nome: 'Grão-de-bico', grupo: 'leguminosa', un: 'kg', kcal: 355, prot: 21.2, gord: 5.4, carb: 57.9, rend: 2.3, porcao: 40, coc: 45, agua: 3.0, val: 24, fonte: 'TACO', core: true,
      dica: 'Precisa de molho de 8 a 12 h. Bom em sopas e pastas.' },
    { id: 'soja_texturizada', nome: 'Soja texturizada (PTS)', grupo: 'proteina', un: 'kg', kcal: 335, prot: 51, gord: 1, carb: 33, rend: 2.8, porcao: 25, coc: 10, agua: 2.5, val: 24, fonte: 'USDA', core: true,
      dica: 'Proteína de longa duração e leve. Hidrate em água quente e tempere bem.' },

    { id: 'atum', nome: 'Atum ao natural (lata, peso drenado)', grupo: 'proteina', un: 'un', gpu: 120, kcal: 116, prot: 26, gord: 1, carb: 0, rend: 1.0, porcao: 15, coc: 0, agua: 0, val: 36, fonte: 'USDA', core: true,
      dica: 'Pronto para comer e dura 3 anos ou mais.' },
    { id: 'sardinha', nome: 'Sardinha em óleo (lata, peso total)', grupo: 'proteina', un: 'un', gpu: 125, kcal: 285, prot: 15.9, gord: 24, carb: 0, rend: 1.0, porcao: 20, coc: 0, agua: 0, val: 36, fonte: 'TACO', core: true,
      dica: 'Rica em ômega 3 e cálcio (com espinha). Muito calórica para o peso.' },
    { id: 'ovo', nome: 'Ovos frescos', grupo: 'proteina', un: 'un', gpu: 50, kcal: 143, prot: 13, gord: 8.9, carb: 1.6, rend: 1.0, porcao: 25, coc: 30, agua: 1.0, val: 1.5, fonte: 'TACO', core: false,
      dica: 'Duram cerca de 4 semanas fora da geladeira. Consuma primeiro.' },
    { id: 'leite_po', nome: 'Leite em pó integral', grupo: 'laticinio', un: 'kg', kcal: 497, prot: 25.4, gord: 26.9, carb: 39.2, rend: 8.0, porcao: 200, coc: 0, agua: 7.0, val: 12, fonte: 'TACO', core: true,
      dica: 'Cada 100 g vira cerca de 800 ml reconstituído. Fonte de cálcio e proteína.' },

    { id: 'oleo', nome: 'Óleo de soja', grupo: 'gordura', un: 'l', gpu: 920, kcal: 884, prot: 0, gord: 100, carb: 0, rend: 1.0, porcao: 15, coc: 0, agua: 0, val: 12, fonte: 'TACO', core: true,
      dica: 'A gordura é a forma mais compacta de energia. Guarde ao abrigo da luz e do calor.' },
    { id: 'amendoim', nome: 'Amendoim / castanhas', grupo: 'gordura', un: 'kg', kcal: 567, prot: 26, gord: 49, carb: 16, rend: 1.0, porcao: 20, coc: 0, agua: 0, val: 6, fonte: 'USDA', core: true,
      dica: 'Muita energia e proteína. Em lata ou pote fechado dura mais.' },
    { id: 'pasta_amendoim', nome: 'Pasta de amendoim', grupo: 'gordura', un: 'kg', kcal: 588, prot: 25, gord: 50, carb: 20, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 9, core: false,
      dica: 'Pronta para comer, dura cerca de 9 meses fechada.' },

    { id: 'acucar', nome: 'Açúcar', grupo: 'acucar', un: 'kg', kcal: 387, prot: 0, gord: 0, carb: 100, rend: 1.0, porcao: 25, coc: 0, agua: 0, val: 60, fonte: 'USDA', core: true,
      dica: 'Praticamente não estraga. Também serve para conservar alimentos.' },
    { id: 'sal', nome: 'Sal', grupo: 'essencial', un: 'kg', kcal: 0, prot: 0, gord: 0, carb: 0, rend: 1.0, porcao: 5, coc: 0, agua: 0, val: 60, core: true, fixed: true,
      dica: 'Essencial. Aproximadamente 5 g por pessoa por dia.' },

    { id: 'milho_lata', nome: 'Milho verde em lata (drenado)', grupo: 'vegetal', un: 'un', gpu: 200, kcal: 98, prot: 3.2, gord: 2.4, carb: 17.1, rend: 1.0, porcao: 30, coc: 0, agua: 0, val: 24, fonte: 'TACO', core: true,
      dica: 'Vegetal pronto, dura 2 anos fechado.' },
    { id: 'molho_tomate', nome: 'Molho / polpa de tomate', grupo: 'vegetal', un: 'un', gpu: 340, kcal: 40, prot: 1.4, gord: 0.3, carb: 8, rend: 1.0, porcao: 30, coc: 0, agua: 0, val: 18, core: true,
      dica: 'Dá sabor e vitaminas a arroz, feijão e macarrão.' },
    { id: 'uva_passa', nome: 'Frutas secas / uva passa', grupo: 'vegetal', un: 'kg', kcal: 299, prot: 3, gord: 0.5, carb: 79, rend: 1.0, porcao: 15, coc: 0, agua: 0, val: 12, fonte: 'USDA', core: true,
      dica: 'Fonte de açúcar e potássio, e doce pronto para comer.' },
    { id: 'batata', nome: 'Batata (fresca)', grupo: 'vegetal', un: 'kg', kcal: 64, prot: 1.8, gord: 0.1, carb: 14.7, rend: 1.0, porcao: 100, coc: 25, agua: 1.0, val: 2, fonte: 'TACO', core: false,
      dica: 'Dura 1 a 2 meses em local escuro e fresco. Consuma primeiro.' },

    { id: 'vitamina', nome: 'Multivitamínico (comprimido)', grupo: 'micro', un: 'un', gpu: 1, kcal: 0, prot: 0, gord: 0, carb: 0, rend: 1.0, porcao: 1, coc: 0, agua: 0, val: 24, core: true, fixed: true,
      dica: 'Ajuda a cobrir vitaminas e minerais que uma dieta de estoque não tem. Considere vitamina C e complexo B.' }
  ];

  /* Perfis: kcal/dia, proteína g/dia, água de beber L/dia, vulnerable = não reduzir tanto em racionamento */
  var PERFIS = {
    adulto_h:   { nome: 'Homem adulto',            kcal: 2400, prot: 60, agua: 2.5, vuln: false },
    adulto_m:   { nome: 'Mulher adulta',           kcal: 2000, prot: 50, agua: 2.0, vuln: false },
    idoso:      { nome: 'Idoso(a)',                kcal: 1800, prot: 55, agua: 2.0, vuln: false },
    adolescente:{ nome: 'Adolescente (13-17)',     kcal: 2400, prot: 55, agua: 2.0, vuln: true },
    crianca_9:  { nome: 'Criança (9-12 anos)',     kcal: 1900, prot: 45, agua: 1.7, vuln: true },
    crianca_4:  { nome: 'Criança (4-8 anos)',      kcal: 1400, prot: 30, agua: 1.3, vuln: true },
    crianca_1:  { nome: 'Criança (1-3 anos)',      kcal: 1000, prot: 15, agua: 1.0, vuln: true },
    gestante:   { nome: 'Gestante',                kcal: 2300, prot: 70, agua: 2.3, vuln: true },
    lactante:   { nome: 'Lactante',                kcal: 2500, prot: 70, agua: 3.0, vuln: true }
  };

  /* Fator sobre a necessidade em cada modo (adultos / vulneráveis) */
  var MODOS = {
    normal:      { nome: 'Normal',       adulto: 1.0,  vuln: 1.0,  desc: '100% da necessidade.' },
    racionamento:{ nome: 'Racionamento', adulto: 0.8,  vuln: 0.95, desc: 'Cerca de 80% para adultos. Crianças, gestantes e lactantes quase não reduzem.' },
    emergencia:  { nome: 'Emergência',   adulto: 0.65, vuln: 0.85, desc: 'Cerca de 65% para adultos, só por períodos curtos. Não é saudável a longo prazo.' }
  };

  var api = { GRUPOS: GRUPOS, ALIMENTOS: ALIMENTOS, PERFIS: PERFIS, MODOS: MODOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DATA = api;
})(typeof window !== 'undefined' ? window : this);
