/* Itens do dia a dia que as tabelas TACO e USDA não trazem (produtos industrializados, versões sem glúten/zero/light,
   arroz especiais etc.). Os valores são MÉDIOS de rótulos comuns no Brasil, por 100 g (ou 100 mL), e por isso levam a
   fonte "estimado": confira o rótulo da sua marca e ajuste no catálogo se precisar. */
(function (root) {
  var D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.DATA;
  var DICA = 'Valores médios de rótulos comerciais (por 100 g ou 100 mL). Confira o rótulo da sua marca e, se quiser, cadastre uma versão com os seus números.';
  // [id, nome, grupo, unidade, kcal, proteína, gordura, carboidrato, rendimento, validade em meses, busca]
  var X = [
    ['sg_macarrao', 'Macarrão sem glúten (arroz ou milho), seco', 'cereal', 'kg', 355, 7, 1.2, 78, 2.3, 24, 'zero gluten sem gluten gluten free sem glutem zero glutem massa espaguete penne parafuso'],
    ['sg_pao', 'Pão de forma sem glúten', 'cereal', 'kg', 255, 3, 7, 44, 1, 3, 'zero gluten sem gluten gluten free sem glutem zero glutem'],
    ['sg_farinha', 'Mistura de farinhas sem glúten (pães e bolos)', 'cereal', 'kg', 345, 5, 1.5, 78, 1, 12, 'zero gluten sem gluten gluten free sem glutem zero glutem farinha mix'],
    ['sg_biscoito', 'Biscoito sem glúten', 'cereal', 'kg', 440, 4, 14, 73, 1, 9, 'zero gluten sem gluten gluten free sem glutem zero glutem bolacha'],
    ['goma_tapioca', 'Goma de tapioca (hidratada, para fazer tapioca)', 'cereal', 'kg', 240, 0.2, 0, 59, 1, 6, 'tapioca goma massa de tapioca hidratada beiju crepioca fecula hidratada'],
    ['fecula_tapioca', 'Fécula de tapioca (amido de mandioca, seca)', 'cereal', 'kg', 350, 0.3, 0.1, 86, 1, 24, 'tapioca farinha de tapioca polvilho goma seca fecula amido de mandioca'],
    ['arroz_negro', 'Arroz negro', 'cereal', 'kg', 350, 8.5, 3.3, 72, 2.5, 24, 'arroz preto integral gourmet'],
    ['arroz_vermelho', 'Arroz vermelho', 'cereal', 'kg', 360, 7.5, 2.5, 74, 2.5, 24, 'arroz integral gourmet'],
    ['pao_hamburguer', 'Pão de hambúrguer', 'cereal', 'kg', 275, 9, 4.5, 50, 1, 1, 'pao de hamburguer hot dog bisnaguinha'],
    ['barra_cereal', 'Barra de cereal', 'cereal', 'kg', 390, 5, 8, 75, 1, 9, 'barrinha de cereais'],
    ['salgadinho', 'Salgadinho de milho (snack)', 'preparado', 'kg', 520, 6, 30, 57, 1, 6, 'chips cheetos doritos salgadinho de pacote'],
    ['batata_palha', 'Batata palha', 'preparado', 'kg', 530, 5, 32, 55, 1, 6, 'batata frita palha'],
    ['pipoca_micro_tradicional', 'Pipoca de micro-ondas (saquinho), tradicional', 'preparado', 'kg', 480, 9, 25, 55, 1, 9, 'pipoca microondas micro-ondas micro ondas saquinho manteiga yoki'],
    ['pipoca_micro_light', 'Pipoca de micro-ondas (saquinho), light', 'preparado', 'kg', 400, 11, 10, 68, 1, 9, 'pipoca microondas micro-ondas micro ondas saquinho yoki'],
    ['nuggets', 'Nuggets de frango (congelado)', 'carne', 'kg', 250, 12, 15, 16, 1, 6, 'empanado frango'],
    ['salsicha', 'Salsicha (tipo hot dog)', 'carne', 'kg', 240, 11, 20, 3, 1, 3, 'hot dog salsicha de frango'],
    ['calabresa', 'Linguiça calabresa', 'carne', 'kg', 330, 17, 28, 2, 1, 2, 'linguica defumada paio'],
    ['peito_peru', 'Peito de peru fatiado', 'carne', 'kg', 105, 16, 3, 3, 1, 1.5, 'frios fatiado blanquet'],
    ['pizza_congelada', 'Pizza congelada', 'preparado', 'kg', 250, 10, 9, 32, 1, 6, 'pizza pronta'],
    ['massa_recheada', 'Massa recheada (ravioli, capeletti)', 'preparado', 'kg', 230, 9, 6, 35, 1, 1, 'ravioli capeletti nhoque tortellini'],
    ['sopa_po', 'Sopa instantânea em pó (creme)', 'preparado', 'kg', 380, 8, 12, 60, 1, 12, 'sopa de pacote cremosa sopão'],
    ['whey', 'Proteína em pó (whey protein)', 'proteina', 'kg', 400, 80, 6, 6, 1, 18, 'whey suplemento proteina'],
    ['barra_proteina', 'Barra de proteína', 'proteina', 'kg', 370, 30, 12, 36, 1, 9, 'barrinha de proteina protein bar'],
    ['requeijao', 'Requeijão cremoso', 'laticinio', 'kg', 250, 7, 22, 3, 1, 3, 'requeijao catupiry'],
    ['queijo_coalho', 'Queijo coalho', 'laticinio', 'kg', 320, 22, 25, 2, 1, 1.5, 'queijo de coalho churrasco'],
    ['leite_sem_lactose', 'Leite UHT sem lactose, integral', 'laticinio', 'l', 47, 3.1, 3, 4.6, 1, 6, 'zero lactose leite longa vida'],
    ['leite_aveia', 'Bebida de aveia (leite de aveia)', 'laticinio', 'l', 45, 1, 1.5, 7.5, 1, 9, 'leite vegetal'],
    ['leite_amendoas', 'Bebida de amêndoas (leite de amêndoas), sem açúcar', 'laticinio', 'l', 22, 0.6, 1.1, 2.4, 1, 9, 'leite vegetal amendoa'],
    ['creme_avela', 'Creme de avelã com cacau', 'acucar', 'kg', 539, 6.3, 30.9, 57.5, 1, 12, 'nutella nutela'],
    ['po_pudim', 'Pó para pudim ou mousse (mistura)', 'acucar', 'kg', 380, 1, 0.5, 90, 1, 18, 'pudim mousse sobremesa instantanea flan'],
    ['sorvete', 'Sorvete cremoso', 'acucar', 'kg', 200, 3.5, 10, 24, 1, 6, 'sorvete de creme picole'],
    ['suco_po', 'Suco em pó (refresco)', 'bebida', 'kg', 380, 0, 0, 95, 1, 24, 'refresco em po tang clight'],
    ['suco_laranja', 'Suco de laranja pronto (integral)', 'bebida', 'l', 45, 0.7, 0.2, 10.4, 1, 6, 'suco de laranja caixinha'],
    ['suco_uva', 'Suco de uva integral', 'bebida', 'l', 65, 0.4, 0.1, 16, 1, 12, 'suco de uva garrafa'],
    ['nectar', 'Néctar ou suco de caixinha (sabores)', 'bebida', 'l', 50, 0.2, 0, 12.5, 1, 9, 'suco de caixinha nectar refresco pronto'],
    ['adocante', 'Adoçante (sucralose ou estévia)', 'essencial', 'kg', 0, 0, 0, 0, 1, 36, 'estevia stevia sucralose sacarina zero acucar'],
    ['molho_pimenta', 'Molho de pimenta (tipo tabasco)', 'preparado', 'l', 12, 1, 0.6, 0.8, 1, 36, 'tabasco molho de pimenta vermelha'],
    ['molho_pesto', 'Molho pesto', 'preparado', 'kg', 430, 5, 42, 5, 1, 6, 'pesto manjericao'],
    ['molho_alho', 'Molho de alho', 'preparado', 'kg', 330, 1.5, 33, 6, 1, 6, 'alho molho de alho cremoso'],
    ['tempero_completo', 'Tempero completo em pó (alho, cebola e sal)', 'essencial', 'kg', 120, 6, 2, 22, 1, 24, 'sazon tempero pronto colorau mix de temperos'],
    ['colorau', 'Colorau (urucum em pó)', 'essencial', 'kg', 280, 11, 13, 40, 1, 24, 'urucum corante']
  ];
  var G = { carne: 'Carnes e derivados', bebida: 'Bebidas', preparado: 'Preparados e industrializados' };
  X.forEach(function (r) {
    D.ALIMENTOS.push({ id: 'x_' + r[0], nome: r[1], grupo: r[2], un: r[3], gpu: r[3] === 'l' ? 1000 : undefined, kcal: r[4], prot: r[5], gord: r[6], carb: r[7],
      rend: r[8], porcao: 0, coc: 0, agua: 0, val: r[9], fonte: r[4] === 0 ? 'Sem calorias' : 'estimado', alias: r[10], core: false, dica: DICA });
  });
})(typeof window !== 'undefined' ? window : this);
