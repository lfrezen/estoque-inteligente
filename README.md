# Estoque Inteligente

Site estático (HTML/CSS/JS, sem build) para controlar alimentos armazenados e estimar quanto tempo duram
para a sua família, com sugestões de compras, estratégias de economia e cardápio.

- Cadastro de pessoas (perfis por faixa etária, gestante, lactante) e modos Normal / Racionamento / Emergência.
- Base inicial de alimentos com rendimento cru→cozido, calorias, proteína, validade (editável, aceita novos itens).
- Duração por energia, proteína, água e gás; alertas de validade; lista de compras para a meta de dias.
- Cardápio de 7 dias que usa qualquer alimento do estoque (inclusive os da TACO): classifica cada item por papel na refeição, calcula as quantidades pelas calorias da casa no modo escolhido, prioriza o que vence primeiro e avisa o que acaba.
- Medicamentos (aba Medicamentos): cadastro com validade, quantidade e uso contínuo, kit essencial, orientação por nível de risco para itens vencidos e dicas de armazenamento. Conteúdo informativo, sem doses.
- Prontidão (aba Prontidão): pontuação de 0 a 100 com níveis, checklists de luz, comunicação, higiene, segurança, mochila de fuga de 72 h, plano da família, cuidado com crianças, idosos e pets e carro, cenários de emergência e revisão a cada 6 meses.
- Relatório para imprimir (aba Relatório): folhas A4 em paisagem com controle da despensa, cardápio de 7 dias e calendário de dias, para fixar na geladeira e usar sem energia nem internet.
- Dados guardados no navegador (localStorage), com exportação/importação em JSON.

Uso: abra `index.html` ou publique a pasta no GitHub Pages / Cloudflare Pages.
Valores são médias de referência (TACO/USDA) e não substituem orientação de nutricionista.

## Base de alimentos
- `js/data.js`: alimentos cadastrados à mão (arroz, feijão, quinoa, massas sem glúten etc.), com rendimento, porção diária e dicas.
- `js/taco.js`: 591 alimentos da Tabela Brasileira de Composição de Alimentos (TACO/UNICAMP), gerados por `tools/importar_taco.py`
  a partir de [marcelosanto/tabela_taco](https://github.com/marcelosanto/tabela_taco) (MIT). Valores conferidos por amostragem contra a tabela online.
- `js/usda.js`: 157 alimentos duráveis da USDA FoodData Central (SR Legacy, domínio público), traduzidos para o português e gerados por `tools/importar_usda.py` a partir da seleção em `tools/usda_selecao.json` (grãos, massas, farinhas, leguminosas, oleaginosas, óleos, açúcares, laticínios em pó, conservas). Incluem itens que a TACO não tem, como quinoa, teff, espelta, kamut e amaranto.
- Cada valor mostra a fonte no catálogo: TACO, USDA, Rótulo (embalagem), Sem calorias (sal, vitaminas, pastilhas) ou estimado. Dos 84 itens cadastrados à mão, 81 foram conferidos nas bases (TACO 42, USDA 32, rótulo 2, sem calorias 5). Só cuscuz/flocão de milho, milho de pipoca e rapadura continuam como estimados, porque não há equivalente nas bases.

Para atualizar a base USDA: baixe o zip SR Legacy (link no cabeçalho de `tools/importar_usda.py`) e rode `python3 -I tools/importar_usda.py PASTA_CSV js/usda.js`.

Para atualizar a base TACO: `python3 -I tools/importar_taco.py caminho/TACO.json js/taco.js`.
