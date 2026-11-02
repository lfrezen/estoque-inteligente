# Estoque Inteligente

Site estático (HTML/CSS/JS, sem build) para controlar alimentos armazenados e estimar quanto tempo duram
para a sua família, com sugestões de compras, estratégias de economia e cardápio.

- Cadastro de pessoas (perfis por faixa etária, gestante, lactante) e modos Normal / Racionamento / Emergência.
- Base inicial de alimentos com rendimento cru→cozido, calorias, proteína, validade (editável, aceita novos itens).
- Duração por energia, proteína, água e gás; alertas de validade; lista de compras para a meta de dias.
- Medicamentos (aba Medicamentos): cadastro com validade, quantidade e uso contínuo, kit essencial, orientação por nível de risco para itens vencidos e dicas de armazenamento. Conteúdo informativo, sem doses.
- Relatório para imprimir (aba Relatório): folhas A4 em paisagem com controle da despensa, cardápio de 7 dias e calendário de dias, para fixar na geladeira e usar sem energia nem internet.
- Dados guardados no navegador (localStorage), com exportação/importação em JSON.

Uso: abra `index.html` ou publique a pasta no GitHub Pages / Cloudflare Pages.
Valores são médias de referência (TACO/USDA) e não substituem orientação de nutricionista.

## Base de alimentos
- `js/data.js`: alimentos cadastrados à mão (arroz, feijão, quinoa, massas sem glúten etc.), com rendimento, porção diária e dicas.
- `js/taco.js`: 591 alimentos da Tabela Brasileira de Composição de Alimentos (TACO/UNICAMP), gerados por `tools/importar_taco.py`
  a partir de [marcelosanto/tabela_taco](https://github.com/marcelosanto/tabela_taco) (MIT). Valores conferidos por amostragem contra a tabela online.
- Cada valor mostra a fonte no catálogo: TACO, USDA, Rótulo (embalagem) ou estimado.

Para atualizar a base TACO: `python3 -I tools/importar_taco.py caminho/TACO.json js/taco.js`.
