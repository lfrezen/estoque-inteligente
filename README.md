# Estoque Inteligente

Site estático (HTML/CSS/JS, sem build) para controlar alimentos armazenados e estimar quanto tempo duram
para a sua família, com sugestões de compras, estratégias de economia e cardápio.

- Cadastro de pessoas (perfis por faixa etária, gestante, lactante) e modos Normal / Racionamento / Emergência.
- Base inicial de alimentos com rendimento cru→cozido, calorias, proteína, validade (editável, aceita novos itens).
- Duração por energia, proteína, água e gás; alertas de validade; lista de compras para a meta de dias.
- Cardápio de 7 dias que usa qualquer alimento do estoque (inclusive os da TACO): classifica cada item por papel na refeição, calcula as quantidades pelas calorias da casa no modo escolhido, prioriza o que vence primeiro e avisa o que acaba.
- Notificações (ícone de sino no topo, com contador): tela própria que agrupa vencidos e a vencer em até 30 dias (alimentos e medicamentos, configurável), reposição de remédio de uso contínuo, backup pendente ou antigo, revisão do kit de emergência e orçamento do mês. Cada aviso tem botão de ação e "Adiar" por 1 dia; dá para adiar todos e desligar categorias. O Painel fica limpo. O app só confere os avisos quando está aberto (sem notificações de celular com o app fechado).
- Finanças (aba Finanças): cada compra é uma entrada com valor, data e loja, mesmo do mesmo alimento em datas diferentes; gasto por mês e variação, orçamento mensal, gastos por categoria, gráfico de 12 meses, histórico de preço por kg de cada alimento, gastos avulsos (água, gás, remédios), custo estimado para completar a lista de Compras e exportação em CSV. Remover um item do estoque não apaga o gasto.
- Medicamentos (aba Medicamentos): cadastro com validade, quantidade e uso contínuo, kit essencial, orientação por nível de risco para itens vencidos e dicas de armazenamento. Conteúdo informativo, sem doses.
- Prontidão (aba Prontidão): pontuação de 0 a 100 com níveis, checklists de luz, comunicação, higiene, segurança, mochila de fuga de 72 h, plano da família, cuidado com crianças, idosos e pets e carro, cenários de emergência e revisão a cada 6 meses.
- Relatório para imprimir (aba Relatório): folhas A4 em paisagem com controle da despensa, cardápio de 7 dias e calendário de dias, para fixar na geladeira e usar sem energia nem internet.
- Baixa de estoque (aba Estoque, botão ➖ Usar): registra quanto foi usado (g/kg, mL/L ou unidades) de uma entrada específica ou do alimento todo; no alimento, sai primeiro o que vence antes. Entradas do mesmo alimento (validades e preços diferentes) ficam agrupadas numa sanfona com o total e a validade mais próxima. Histórico de uso com Desfazer, incluído no backup.
- Cardápio: sugestão de 7 dias com cinco refeições (café, almoço, jantar, lanche e ceia), com porções realistas por refeição (a base, como arroz, é limitada e as calorias restantes vão para feijão, proteína, legumes e frutas). Cada refeição pode ser editada (✏️): a pessoa monta a sua com qualquer alimento do catálogo e as quantidades; o estoque é descontado e a sugestão dos outros dias se ajusta. Dá para voltar à sugestão por refeição ou de uma vez.
- Ajuda (aba Ajuda): explica em linguagem simples onde ficam os dados, os três jeitos de backup (Drive, arquivo, papel), como usar em outro aparelho, primeiros passos e perguntas rápidas. O Painel vazio e a tela de backup têm atalho para ela.
- Backup no Google Drive (aba Config e backup): login do Google no próprio navegador e arquivo na pasta oculta do app (escopo `drive.appdata`), sem servidor intermediário. O token (válido por cerca de 1 hora) fica só na memória e na sessão da aba, então atualizar a página não desconecta; fechar a aba, sim. O app já traz um ID de cliente OAuth padrão (público por natureza, vale só nas origens autorizadas): quem usa só entra com a conta Google. Quem hospedar o próprio site em outro endereço pode informar o seu ID em Avançado, com o passo a passo na própria tela. Conflitos entre aparelhos pedem confirmação antes de sobrescrever. As Notificações avisam quando não há backup, quando o último está velho (mais de 7 dias), quando há alterações não salvas ou quando a sessão do Google expirou com o backup automático ligado.
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
