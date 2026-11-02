/* Base de dados inicial, por 100 g do alimento COMO ARMAZENADO (cru/seco/enlatado).
   fonte 'TACO' = conferido na Tabela TACO (UNICAMP); 'USDA' = USDA FoodData Central SR Legacy; 'Rótulo' = embalagem;
   'Sem calorias' = item sem valor nutricional (sal, vitaminas, pastilhas); sem fonte = estimativa. Tudo é editável no app.
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
    { id: 'arroz', nome: 'Arroz branco', grupo: 'cereal', un: 'kg', kcal: 358, prot: 7.2, gord: 0.3, carb: 79, rend: 2.8, porcao: 130, coc: 25, agua: 2.0, val: 24, fonte: 'TACO', alias: 'arroz agulhinha tipo 1', core: true,
      dica: 'Fechado e seco dura anos. Guarde em pote hermético, longe da umidade.' },
    { id: 'macarrao', nome: 'Macarrão', grupo: 'cereal', un: 'kg', kcal: 371, prot: 13, gord: 1.5, carb: 75, rend: 2.3, porcao: 45, coc: 12, agua: 4.0, val: 24, fonte: 'USDA', core: true,
      dica: 'Cozinha rápido, gasta pouco gás. A água do cozimento pode ser reaproveitada.' },
    { id: 'aveia', nome: 'Aveia em flocos', grupo: 'cereal', un: 'kg', kcal: 394, prot: 13.9, gord: 8.5, carb: 66, rend: 2.5, porcao: 40, coc: 5, agua: 2.0, val: 12, fonte: 'TACO', core: true,
      dica: 'Ótima para o café da manhã e pode ser comida sem cozinhar, só hidratada.' },
    { id: 'fuba', nome: 'Fubá / milho para polenta', grupo: 'cereal', un: 'kg', kcal: 351, prot: 7.2, gord: 1.5, carb: 79.1, rend: 3.5, porcao: 30, coc: 30, agua: 3.5, val: 12, fonte: 'TACO', alias: 'milho polenta angu', core: true,
      dica: 'Polenta e angu rendem muito. Prefira embalagens fechadas.' },
    { id: 'farinha_mandioca', nome: 'Farinha de mandioca', grupo: 'cereal', un: 'kg', kcal: 361, prot: 1.6, gord: 0.3, carb: 87.9, rend: 1.0, porcao: 20, coc: 0, agua: 0, val: 12, fonte: 'TACO', alias: 'farofa pirao', core: true,
      dica: 'Não precisa de fogo. Farofa e pirão acompanham feijão.' },
    { id: 'farinha_trigo', nome: 'Farinha de trigo', grupo: 'cereal', un: 'kg', kcal: 360, prot: 9.8, gord: 1.4, carb: 75.1, rend: 1.4, porcao: 40, coc: 20, agua: 0.6, val: 12, fonte: 'TACO', core: false,
      dica: 'Permite pão sem fermento, panquecas e massas. Dura menos que o arroz.' },
    { id: 'biscoito', nome: 'Biscoito cream cracker', grupo: 'cereal', un: 'kg', kcal: 432, prot: 10.1, gord: 14.4, carb: 68.7, rend: 1.0, porcao: 20, coc: 0, agua: 0, val: 9, fonte: 'TACO', core: false,
      dica: 'Pronto para comer, bom para quando não houver como cozinhar.' },

    { id: 'feijao', nome: 'Feijão carioca', grupo: 'leguminosa', un: 'kg', kcal: 329, prot: 20, gord: 1.3, carb: 61, rend: 2.3, porcao: 100, coc: 40, agua: 2.5, val: 18, fonte: 'TACO', alias: 'feijao carioca', core: true,
      dica: 'Feijão velho demora mais a cozinhar. Deixe de molho e use panela de pressão para economizar gás.' },
    { id: 'lentilha', nome: 'Lentilha', grupo: 'leguminosa', un: 'kg', kcal: 339, prot: 23.2, gord: 0.8, carb: 62, rend: 2.4, porcao: 45, coc: 25, agua: 2.5, val: 24, fonte: 'TACO', core: true,
      dica: 'Cozinha sem molho em cerca de 25 min. Pode germinar para ganhar vitamina C.' },
    { id: 'grao_bico', nome: 'Grão-de-bico', grupo: 'leguminosa', un: 'kg', kcal: 355, prot: 21.2, gord: 5.4, carb: 57.9, rend: 2.3, porcao: 40, coc: 45, agua: 3.0, val: 24, fonte: 'TACO', core: true,
      dica: 'Precisa de molho de 8 a 12 h. Bom em sopas e pastas.' },
    { id: 'soja_texturizada', nome: 'Soja texturizada (PTS)', grupo: 'proteina', un: 'kg', kcal: 335, prot: 51, gord: 1, carb: 33, rend: 2.8, porcao: 25, coc: 10, agua: 2.5, val: 24, fonte: 'USDA', alias: 'pts carne de soja proteina texturizada', core: true,
      dica: 'Proteína de longa duração e leve. Hidrate em água quente e tempere bem.' },

    { id: 'atum', nome: 'Atum ao natural (lata, peso drenado)', grupo: 'proteina', un: 'un', gpu: 120, kcal: 116, prot: 26, gord: 1, carb: 0, rend: 1.0, porcao: 15, coc: 0, agua: 0, val: 36, fonte: 'USDA', alias: 'atum natural lata', core: true,
      dica: 'Pronto para comer e dura 3 anos ou mais.' },
    { id: 'sardinha', nome: 'Sardinha em óleo (lata, peso total)', grupo: 'proteina', un: 'un', gpu: 125, kcal: 285, prot: 15.9, gord: 24, carb: 0, rend: 1.0, porcao: 20, coc: 0, agua: 0, val: 36, fonte: 'TACO', alias: 'sardinha lata oleo', core: true,
      dica: 'Rica em ômega 3 e cálcio (com espinha). Muito calórica para o peso.' },
    { id: 'ovo', nome: 'Ovos frescos', grupo: 'proteina', un: 'un', gpu: 50, kcal: 143, prot: 13, gord: 8.9, carb: 1.6, rend: 1.0, porcao: 25, coc: 30, agua: 1.0, val: 1.5, fonte: 'TACO', core: false,
      dica: 'Duram cerca de 4 semanas fora da geladeira. Consuma primeiro.' },
    { id: 'leite_po', nome: 'Leite em pó integral', grupo: 'laticinio', un: 'kg', kcal: 497, prot: 25.4, gord: 26.9, carb: 39.2, rend: 8.0, porcao: 200, coc: 0, agua: 7.0, val: 12, fonte: 'TACO', alias: 'leite em po integral', core: true,
      dica: 'Cada 100 g vira cerca de 800 ml reconstituído. Fonte de cálcio e proteína.' },

    { id: 'oleo', nome: 'Óleo de soja', grupo: 'gordura', un: 'l', gpu: 920, kcal: 884, prot: 0, gord: 100, carb: 0, rend: 1.0, porcao: 15, coc: 0, agua: 0, val: 12, fonte: 'TACO', alias: 'oleo soja', core: true,
      dica: 'A gordura é a forma mais compacta de energia. Guarde ao abrigo da luz e do calor.' },
    { id: 'amendoim', nome: 'Amendoim / castanhas', grupo: 'gordura', un: 'kg', kcal: 567, prot: 26, gord: 49, carb: 16, rend: 1.0, porcao: 20, coc: 0, agua: 0, val: 6, fonte: 'USDA', alias: 'castanha amendoim', core: true,
      dica: 'Muita energia e proteína. Em lata ou pote fechado dura mais.' },
    { id: 'pasta_amendoim', nome: 'Pasta de amendoim', grupo: 'gordura', un: 'kg', kcal: 598, prot: 22.2, gord: 51.4, carb: 22.3, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 9, fonte: 'USDA', alias: 'pacoca amendoim pasta', core: false,
      dica: 'Pronta para comer, dura cerca de 9 meses fechada.' },

    { id: 'acucar', nome: 'Açúcar', grupo: 'acucar', un: 'kg', kcal: 387, prot: 0, gord: 0, carb: 100, rend: 1.0, porcao: 25, coc: 0, agua: 0, val: 60, fonte: 'USDA', core: true,
      dica: 'Praticamente não estraga. Também serve para conservar alimentos.' },
    { id: 'sal', nome: 'Sal', grupo: 'essencial', un: 'kg', kcal: 0, prot: 0, gord: 0, carb: 0, rend: 1.0, porcao: 5, coc: 0, agua: 0, val: 60, fonte: 'USDA', core: true, fixed: true,
      dica: 'Essencial. Aproximadamente 5 g por pessoa por dia.' },

    { id: 'milho_lata', nome: 'Milho verde em lata (drenado)', grupo: 'vegetal', un: 'un', gpu: 180, kcal: 98, prot: 3.2, gord: 2.4, carb: 17.1, rend: 1.0, porcao: 30, coc: 0, agua: 0, val: 24, fonte: 'TACO', core: true,
      dica: 'Vegetal pronto, dura 2 anos fechado. O peso drenado varia de 170 a 200 g conforme a marca: informe o peso da sua lata ao cadastrar.' },
    { id: 'molho_tomate', nome: 'Molho / polpa de tomate', grupo: 'vegetal', un: 'un', gpu: 340, kcal: 38, prot: 1.4, gord: 0.9, carb: 7.7, rend: 1.0, porcao: 30, coc: 0, agua: 0, val: 18, fonte: 'TACO', alias: 'extrato polpa sugo', core: true,
      dica: 'Dá sabor e vitaminas a arroz, feijão e macarrão.' },
    { id: 'uva_passa', nome: 'Frutas secas / uva passa', grupo: 'vegetal', un: 'kg', kcal: 299, prot: 3, gord: 0.5, carb: 79, rend: 1.0, porcao: 15, coc: 0, agua: 0, val: 12, fonte: 'USDA', alias: 'passas frutas secas', core: true,
      dica: 'Fonte de açúcar e potássio, e doce pronto para comer.' },
    { id: 'batata', nome: 'Batata (fresca)', grupo: 'vegetal', un: 'kg', kcal: 64, prot: 1.8, gord: 0.1, carb: 14.7, rend: 1.0, porcao: 100, coc: 25, agua: 1.0, val: 2, fonte: 'TACO', core: false,
      dica: 'Dura 1 a 2 meses em local escuro e fresco. Consuma primeiro.' },

    { id: 'vitamina', nome: 'Multivitamínico (comprimido)', grupo: 'micro', un: 'un', gpu: 1, kcal: 0, prot: 0, gord: 0, carb: 0, rend: 1.0, porcao: 1, coc: 0, agua: 0, val: 24, fonte: 'Sem calorias', alias: 'multivitaminico polivitaminico', core: true, fixed: true,
      dica: 'Ajuda a cobrir vitaminas e minerais que uma dieta de estoque não tem. Considere vitamina C e complexo B.' },
    { id: "arroz_integral", nome: "Arroz integral", grupo: "cereal", un: "kg", kcal: 360, prot: 7.3, gord: 1.9, carb: 77.5, rend: 2.9, porcao: 130, coc: 40, agua: 2.3, val: 6, fonte: "TACO", alias: "arroz integral", core: false, dica: "Tem mais fibras, mas a gordura do farelo rancifica. Dura menos que o branco; guarde bem fechado e fresco." },
    { id: "arroz_parboilizado", nome: "Arroz parboilizado", grupo: "cereal", un: "kg", kcal: 374, prot: 7.5, gord: 1, carb: 80.9, rend: 2.8, porcao: 130, coc: 25, agua: 2.0, val: 24, fonte: 'USDA', alias: "arroz parboilizado", core: false, dica: "Os grãos soltam mais e conserva bem." },
    { id: "quinoa", nome: "Quinoa", grupo: "cereal", un: "kg", kcal: 368, prot: 14.1, gord: 6.1, carb: 64.2, rend: 3.0, porcao: 40, coc: 15, agua: 2.0, val: 24, fonte: "USDA", alias: "quinua grao", core: false, dica: "Proteína completa e cozinha em cerca de 15 min. Enxágue antes para tirar o amargor." },
    { id: "cuscuz_milho", nome: "Cuscuz / flocão de milho", grupo: "cereal", un: "kg", kcal: 360, prot: 7, gord: 1.5, carb: 78, rend: 3.0, porcao: 60, coc: 10, agua: 0.6, val: 12, alias: "flocao cuscuz paulista nordestino", core: false, dica: "Hidrata e cozinha no vapor, rápido." },
    { id: "macarrao_integral", nome: "Macarrão integral", grupo: "cereal", un: "kg", kcal: 352, prot: 13.9, gord: 2.9, carb: 73.4, rend: 2.3, porcao: 45, coc: 12, agua: 4.0, val: 18, fonte: 'USDA', alias: "massa espaguete integral", core: false, dica: "Mais fibras que o comum." },
    { id: "macarrao_sg_espinafre", nome: "Macarrão sem glúten de arroz com espinafre (Urbano Kids)", grupo: "cereal", un: "kg", kcal: 348, prot: 7, gord: 1.1, carb: 77.5, rend: 2.3, porcao: 45, coc: 12, agua: 10, val: 24, fonte: "Rótulo", alias: "macarrao sem gluten arroz espinafre urbano kids pena celiaco", core: false, dica: "Sem glúten, de farinha de arroz com espinafre (fonte de ferro). Cozinha em 10 a 12 min; o rótulo indica 1 L de água para cada 100 g, mas você pode usar menos se mexer com frequência." },
    { id: "macarrao_sg_lentilha", nome: "Macarrão de lentilha vermelha sem glúten (Urbano Protein)", grupo: "leguminosa", un: "kg", kcal: 336, prot: 15, gord: 1.5, carb: 65, rend: 2.3, porcao: 45, coc: 9, agua: 10, val: 24, fonte: "Rótulo", alias: "macarrao lentilha vermelha sem gluten urbano protein pena celiaco", core: false, dica: "Sem glúten, 100% vegetal, com cerca de 15 g de proteína por 100 g seco (rótulo). Cozinha em 7 a 9 min." },
    { id: "trigo_quibe", nome: "Trigo para quibe (bulgur)", grupo: "cereal", un: "kg", kcal: 342, prot: 12.3, gord: 1.3, carb: 75.9, rend: 3.0, porcao: 40, coc: 10, agua: 2.0, val: 12, fonte: 'USDA', alias: "bulgur trigo triguilho", core: false, dica: "Basta deixar de molho ou cozinhar poucos minutos." },
    { id: "milho_pipoca", nome: "Milho de pipoca", grupo: "cereal", un: "kg", kcal: 375, prot: 12, gord: 4.5, carb: 74, rend: 1.0, porcao: 20, coc: 5, agua: 0, val: 24, alias: "pipoca", core: false, dica: "Dura bastante seco e vira lanche leve." },
    { id: "amido_milho", nome: "Amido de milho (maisena)", grupo: "cereal", un: "kg", kcal: 361, prot: 0.6, gord: 0, carb: 87.1, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 36, fonte: 'TACO', alias: "maisena maizena", core: false, dica: "Usado para engrossar caldos e mingaus." },
    { id: "polvilho_doce", nome: "Polvilho doce", grupo: "cereal", un: "kg", kcal: 351, prot: 0.4, gord: 0, carb: 86.8, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 12, fonte: "TACO", alias: "tapioca goma", core: false, dica: "Base de pão de queijo e tapioca." },
    { id: "feijao_preto", nome: "Feijão preto", grupo: "leguminosa", un: "kg", kcal: 324, prot: 21.3, gord: 1.2, carb: 58.8, rend: 2.3, porcao: 100, coc: 40, agua: 2.5, val: 18, fonte: "TACO", alias: "feijao preto feijoada", core: false, dica: "Cozinha como o carioca; use panela de pressão." },
    { id: "feijao_fradinho", nome: "Feijão fradinho", grupo: "leguminosa", un: "kg", kcal: 339, prot: 20.2, gord: 2.4, carb: 61.2, rend: 2.3, porcao: 80, coc: 30, agua: 2.5, val: 18, fonte: "TACO", alias: "feijao de corda caupi", core: false, dica: "Cozinha mais rápido que o carioca." },
    { id: "feijao_branco", nome: "Feijão branco", grupo: "leguminosa", un: "kg", kcal: 337, prot: 22.3, gord: 1.5, carb: 60.8, rend: 2.4, porcao: 80, coc: 45, agua: 3.0, val: 24, fonte: 'USDA', alias: "feijao branco navy", core: false, dica: "Bom em sopas e guisados." },
    { id: "ervilha_seca", nome: "Ervilha seca / partida", grupo: "leguminosa", un: "kg", kcal: 364, prot: 23.1, gord: 3.9, carb: 61.6, rend: 2.5, porcao: 40, coc: 30, agua: 3.0, val: 24, fonte: 'USDA', alias: "ervilha seca partida", core: false, dica: "Desmancha e engrossa sopas." },
    { id: "lentilha_vermelha", nome: "Lentilha vermelha", grupo: "leguminosa", un: "kg", kcal: 358, prot: 23.9, gord: 2.2, carb: 63.1, rend: 2.4, porcao: 40, coc: 15, agua: 2.5, val: 24, fonte: 'USDA', alias: "lentilha vermelha", core: false, dica: "Cozinha em 15 min, sem molho." },
    { id: "soja_grao", nome: "Soja em grão", grupo: "leguminosa", un: "kg", kcal: 446, prot: 36.5, gord: 19.9, carb: 30.2, rend: 2.5, porcao: 30, coc: 70, agua: 4.0, val: 18, fonte: 'USDA', alias: "soja grao", core: false, dica: "Muita proteína, mas pede molho longo e cozimento prolongado (gasta mais gás)." },
    { id: "atum_oleo", nome: "Atum em óleo (lata, drenado)", grupo: "proteina", un: "un", gpu: 120, kcal: 166, prot: 26.2, gord: 6, carb: 0, rend: 1.0, porcao: 15, coc: 0, agua: 0, val: 36, fonte: "TACO", alias: "atum oleo", core: false, dica: "Dura anos fechado." },
    { id: "salmao_lata", nome: "Salmão em lata (drenado)", grupo: "proteina", un: "un", gpu: 120, kcal: 136, prot: 24.6, gord: 4.2, carb: 0, rend: 1.0, porcao: 20, coc: 0, agua: 0, val: 36, fonte: 'USDA', alias: "salmao lata", core: false, dica: "Rico em ômega 3; pode comer a espinha mole para cálcio." },
    { id: "carne_enlatada", nome: "Carne enlatada (corned beef)", grupo: "proteina", un: "un", gpu: 300, kcal: 250, prot: 27.1, gord: 14.9, carb: 0, rend: 1.0, porcao: 20, coc: 0, agua: 0, val: 36, fonte: 'USDA', alias: "corned beef carne lata", core: false, dica: "Pronta para comer, muito salgada." },
    { id: "ovo_po", nome: "Ovo em pó", grupo: "proteina", un: "kg", kcal: 592, prot: 48, gord: 43.9, carb: 1.1, rend: 4.0, porcao: 25, coc: 10, agua: 3.0, val: 12, fonte: 'USDA', alias: "ovo desidratado pasteurizado", core: false, dica: "Rende cerca de 4 vezes ao reconstituir." },
    { id: "bacalhau", nome: "Bacalhau salgado seco", grupo: "proteina", un: "kg", kcal: 290, prot: 62.8, gord: 2.4, carb: 0, rend: 2.0, porcao: 30, coc: 15, agua: 3.0, val: 12, fonte: 'USDA', alias: "bacalhau salgado", core: false, dica: "Dura meses sem geladeira, mas precisa dessalgar com bastante água." },
    { id: "leite_uht", nome: "Leite longa vida (UHT)", grupo: "laticinio", un: "l", gpu: 1030, kcal: 61, prot: 3.1, gord: 3.2, carb: 4.8, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 4, fonte: 'USDA', alias: "leite integral caixinha uht", core: false, dica: "Dura cerca de 4 meses fechado. Depois de aberto, só na geladeira." },
    { id: "leite_po_desnatado", nome: "Leite em pó desnatado", grupo: "laticinio", un: "kg", kcal: 362, prot: 34.7, gord: 0.9, carb: 53, rend: 9.0, porcao: 0, coc: 0, agua: 8.0, val: 12, fonte: "TACO", alias: "leite desnatado po", core: false, dica: "Dura mais que o integral e tem mais proteína." },
    { id: "leite_condensado", nome: "Leite condensado", grupo: "laticinio", un: "un", gpu: 395, kcal: 313, prot: 7.7, gord: 6.7, carb: 57, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 12, fonte: "TACO", alias: "leite condensado lata", core: false, dica: "Calorias concentradas e dura cerca de 1 ano." },
    { id: "azeite", nome: "Azeite de oliva", grupo: "gordura", un: "l", gpu: 910, kcal: 884, prot: 0, gord: 100, carb: 0, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 18, fonte: "TACO", alias: "azeite oliva", core: false, dica: "Guarde ao abrigo da luz." },
    { id: "oleo_girassol", nome: "Óleo de girassol / milho / canola", grupo: "gordura", un: "l", gpu: 920, kcal: 884, prot: 0, gord: 100, carb: 0, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 12, fonte: 'TACO', alias: "oleo girassol milho canola", core: false, dica: "Equivale ao óleo de soja em calorias." },
    { id: "ghee", nome: "Manteiga ghee", grupo: "gordura", un: "kg", kcal: 876, prot: 0.3, gord: 99.5, carb: 0, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 12, fonte: 'USDA', alias: "ghee manteiga clarificada", core: false, dica: "Dura meses sem geladeira." },
    { id: "castanha_para", nome: "Castanha-do-pará", grupo: "gordura", un: "kg", kcal: 643, prot: 14.5, gord: 63.5, carb: 15.1, rend: 1.0, porcao: 10, coc: 0, agua: 0, val: 6, fonte: "TACO", alias: "castanha do brasil", core: false, dica: "Rica em selênio. Limite a 1 ou 2 por dia." },
    { id: "castanha_caju", nome: "Castanha de caju", grupo: "gordura", un: "kg", kcal: 553, prot: 18.2, gord: 43.9, carb: 30.2, rend: 1.0, porcao: 15, coc: 0, agua: 0, val: 6, fonte: 'USDA', alias: "castanha caju", core: false, dica: "Energia e proteína." },
    { id: "nozes", nome: "Nozes", grupo: "gordura", un: "kg", kcal: 620, prot: 14, gord: 59.4, carb: 18.4, rend: 1.0, porcao: 10, coc: 0, agua: 0, val: 6, fonte: 'TACO', alias: "nozes", core: false, dica: "Guarde em pote fechado e fresco." },
    { id: "amendoas", nome: "Amêndoas", grupo: "gordura", un: "kg", kcal: 579, prot: 21.1, gord: 49.9, carb: 21.6, rend: 1.0, porcao: 15, coc: 0, agua: 0, val: 9, fonte: 'USDA', alias: "amendoas", core: false, dica: "Rica em vitamina E." },
    { id: "gergelim", nome: "Gergelim", grupo: "gordura", un: "kg", kcal: 584, prot: 21.2, gord: 50.4, carb: 21.6, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 6, fonte: 'TACO', alias: "gergelim sesamo", core: false, dica: "Boa fonte de cálcio e gorduras." },
    { id: "linhaca", nome: "Linhaça", grupo: "gordura", un: "kg", kcal: 495, prot: 14.1, gord: 32.3, carb: 43.3, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 6, fonte: "TACO", alias: "linhaca semente", core: false, dica: "Triture na hora para aproveitar melhor." },
    { id: "chia", nome: "Chia", grupo: "gordura", un: "kg", kcal: 486, prot: 16.5, gord: 30.7, carb: 42.1, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 24, fonte: 'USDA', alias: "chia semente", core: false, dica: "Dura bastante e forma gel com água." },
    { id: "semente_girassol", nome: "Semente de girassol", grupo: "gordura", un: "kg", kcal: 584, prot: 20.8, gord: 51.5, carb: 20, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 6, fonte: 'USDA', alias: "girassol semente", core: false, dica: "Energia e vitamina E." },
    { id: "mel", nome: "Mel", grupo: "acucar", un: "kg", kcal: 309, prot: 0, gord: 0, carb: 84, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 60, fonte: 'TACO', alias: "mel abelha", core: false, dica: "Não estraga se bem fechado; pode cristalizar." },
    { id: "acucar_mascavo", nome: "Açúcar mascavo", grupo: "acucar", un: "kg", kcal: 369, prot: 0.8, gord: 0.1, carb: 94.5, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 36, fonte: 'TACO', alias: "acucar mascavo demerara", core: false, dica: "Endurece com o tempo, mas continua bom." },
    { id: "rapadura", nome: "Rapadura", grupo: "acucar", un: "kg", kcal: 350, prot: 0.4, gord: 0, carb: 90, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 12, alias: "rapadura", core: false, dica: "Energia doce e portátil." },
    { id: "achocolatado", nome: "Achocolatado em pó", grupo: "acucar", un: "kg", kcal: 401, prot: 4.2, gord: 2.2, carb: 91.2, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 12, fonte: 'TACO', alias: "achocolatado nescau toddy chocolate po", core: false, dica: "Ajuda crianças a aceitar leite em pó." },
    { id: "goiabada", nome: "Goiabada", grupo: "acucar", un: "kg", kcal: 269, prot: 0.6, gord: 0, carb: 74.1, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 18, fonte: 'TACO', alias: "goiabada doce de fruta", core: false, dica: "Doce de longa duração." },
    { id: "ervilha_lata", nome: "Ervilha em lata (drenada)", grupo: "vegetal", un: "un", gpu: 170, kcal: 74, prot: 4.6, gord: 0.4, carb: 13.4, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 24, fonte: 'TACO', alias: "ervilha lata conserva", core: false, dica: "Vegetal pronto." },
    { id: "palmito", nome: "Palmito em conserva", grupo: "vegetal", un: "un", gpu: 150, kcal: 29, prot: 2.5, gord: 0.5, carb: 5.5, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 24, fonte: 'TACO', alias: "palmito conserva", core: false, dica: "Poucas calorias; vira acompanhamento." },
    { id: "tomate_pelado", nome: "Tomate pelado em lata", grupo: "vegetal", un: "un", gpu: 240, kcal: 16, prot: 0.8, gord: 0.2, carb: 3.5, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 24, fonte: 'USDA', alias: "tomate pelado lata", core: false, dica: "Base de molhos; fonte de vitamina C." },
    { id: "cenoura", nome: "Cenoura", grupo: "vegetal", un: "kg", kcal: 34, prot: 1.3, gord: 0.2, carb: 7.7, rend: 1.0, porcao: 50, coc: 10, agua: 0.5, val: 1, fonte: 'TACO', alias: "cenoura", core: false, dica: "Dura cerca de 1 mês em local fresco." },
    { id: "cebola", nome: "Cebola", grupo: "vegetal", un: "kg", kcal: 39, prot: 1.7, gord: 0.1, carb: 8.9, rend: 1.0, porcao: 20, coc: 0, agua: 0, val: 2, fonte: 'TACO', alias: "cebola", core: false, dica: "Dura cerca de 2 meses em local seco e arejado." },
    { id: "alho", nome: "Alho", grupo: "vegetal", un: "kg", kcal: 113, prot: 7, gord: 0.2, carb: 23.9, rend: 1.0, porcao: 3, coc: 0, agua: 0, val: 3, fonte: 'TACO', alias: "alho", core: false, dica: "Dura meses em local seco e dá sabor à comida." },
    { id: "batata_doce", nome: "Batata-doce", grupo: "vegetal", un: "kg", kcal: 118, prot: 1.3, gord: 0.1, carb: 28.2, rend: 1.0, porcao: 100, coc: 25, agua: 1.0, val: 1.5, fonte: 'TACO', alias: "batata doce", core: false, dica: "Dura de 1 a 2 meses em local fresco e escuro." },
    { id: "abobora", nome: "Abóbora", grupo: "vegetal", un: "kg", kcal: 39, prot: 1.7, gord: 0.5, carb: 8.4, rend: 1.0, porcao: 80, coc: 20, agua: 1.0, val: 1.5, fonte: 'TACO', alias: "abobora jerimum moranga", core: false, dica: "Inteira, dura cerca de 2 meses." },
    { id: "mandioca", nome: "Mandioca / aipim", grupo: "vegetal", un: "kg", kcal: 151, prot: 1.1, gord: 0.3, carb: 36.2, rend: 1.0, porcao: 100, coc: 30, agua: 1.5, val: 0.5, fonte: 'TACO', alias: "mandioca aipim macaxeira", core: false, dica: "Perece rápido; consuma primeiro ou congele descascada." },
    { id: "pure_flocos", nome: "Purê de batata em flocos", grupo: "vegetal", un: "kg", kcal: 354, prot: 8.3, gord: 0.4, carb: 81.2, rend: 6.0, porcao: 100, coc: 3, agua: 5.0, val: 12, fonte: 'USDA', alias: "pure batata instantaneo flocos", core: false, dica: "Rápido de preparar: só adicionar água quente." },
    { id: "tamara", nome: "Tâmara", grupo: "vegetal", un: "kg", kcal: 282, prot: 2.5, gord: 0.4, carb: 75, rend: 1.0, porcao: 15, coc: 0, agua: 0, val: 12, fonte: 'USDA', alias: "tamara fruta seca", core: false, dica: "Energia rápida e dura meses." },
    { id: "damasco_seco", nome: "Damasco seco", grupo: "vegetal", un: "kg", kcal: 241, prot: 3.4, gord: 0.5, carb: 62.6, rend: 1.0, porcao: 15, coc: 0, agua: 0, val: 12, fonte: 'USDA', alias: "damasco fruta seca", core: false, dica: "Fonte de vitamina A e potássio." },
    { id: "ameixa_seca", nome: "Ameixa seca", grupo: "vegetal", un: "kg", kcal: 240, prot: 2.2, gord: 0.4, carb: 63.9, rend: 1.0, porcao: 15, coc: 0, agua: 0, val: 12, fonte: 'USDA', alias: "ameixa seca fruta", core: false, dica: "Ajuda o intestino em dietas pobres em fibras." },
    { id: "vitamina_c", nome: "Vitamina C (comprimido)", grupo: "micro", un: "un", gpu: 1, kcal: 0, prot: 0, gord: 0, carb: 0, rend: 1.0, porcao: 1, coc: 0, agua: 0, val: 24, fonte: 'Sem calorias', alias: "vitamina c acido ascorbico", core: false, fixed: true, dica: "Previne a falta de vitamina C quando não há frutas frescas." },
    { id: "vitamina_d", nome: "Vitamina D (cápsula)", grupo: "micro", un: "un", gpu: 1, kcal: 0, prot: 0, gord: 0, carb: 0, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 24, fonte: 'Sem calorias', alias: "vitamina d", core: false, dica: "Útil se houver pouca exposição ao sol." },
    { id: "sais_reidratacao", nome: "Sais de reidratação oral", grupo: "micro", un: "un", gpu: 27, kcal: 0, prot: 0, gord: 0, carb: 0, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 24, fonte: 'Sem calorias', alias: "sais reidratacao soro oral", core: false, dica: "Essencial em casos de diarreia e desidratação." },
    { id: "pastilhas_agua", nome: "Pastilhas de purificação de água", grupo: "essencial", un: "un", gpu: 1, kcal: 0, prot: 0, gord: 0, carb: 0, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 36, fonte: 'Sem calorias', alias: "cloro pastilha purificar agua hipoclorito", core: false, dica: "Siga as instruções do rótulo para a dose por litro." },
    { id: "fermento", nome: "Fermento biológico seco", grupo: "essencial", un: "kg", kcal: 325, prot: 40.4, gord: 7.6, carb: 41.2, rend: 1.0, porcao: 0, coc: 0, agua: 0, val: 12, fonte: 'USDA', alias: "fermento biologico seco pao", core: false, dica: "Permite fazer pão em casa." }
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
