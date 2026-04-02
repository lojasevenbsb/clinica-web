# Sistema de Design: Serenidade Sistêmica

## 1. Visão Geral & Estrela do Norte Criativa
**A Estrela do Norte: "O Santuário Digital"**

Este sistema de design transcende a funcionalidade básica de uma ferramenta de gestão para se tornar uma extensão da própria experiência de cuidado clínico. Para uma clínica de Pilates e Fisioterapia, o ambiente digital deve espelhar o ambiente físico: um espaço de respiração, precisão e calma. 

Abandonamos o visual de "software de prateleira" em favor de uma estética **Editorial Orgânica**. Isso significa que o design foge de grades rígidas e bordas duras, utilizando camadas tonais e assimetria intencional para guiar o olhar. O objetivo é que o profissional sinta-se em controle, e o paciente sinta-se acolhido.

---

## 2. Cores e Profundidade Tonal

A paleta é centrada em tons de verde sálvia (`primary`) e azul suave (`secondary`), evocando natureza e serenidade. 

### A Regra do "Sem Linhas"
Proibimos terminantemente o uso de bordas sólidas de 1px para separar seções. A estrutura do layout deve ser definida puramente por mudanças na cor de fundo ou transições tonais.
*   **Contraste de Superfície:** Use `surface-container-low` para o fundo da página e `surface-container-lowest` (branco puro) para áreas de conteúdo principal. A distinção visual nasce do encontro das cores, não de um traço.

### Hierarquia de Superfície e Aninhamento
Tratamos a UI como folhas de papel fino ou vidro fosco sobrepostas.
*   **Camadas:** Um card (`surface-container-highest`) nunca deve apenas "flutuar". Ele deve se integrar ao layout através de sombras ambientes ou desfoque de fundo.
*   **Texturas de Assinatura:** Para CTAs principais ou cabeçalhos de seção, utilize gradientes sutis que transicionam de `primary` para `primary_container`. Isso adiciona uma "alma" visual que cores sólidas não conseguem transmitir.

---

## 3. Tipografia: A Voz Editorial

Utilizamos a **Manrope** como nossa fundação tipográfica. É uma sans-serif moderna que equilibra geometria técnica com curvas humanas e orgânicas.

*   **Display & Headline (Escala Grande):** Devem ser usadas com generosidade. Títulos em `display-md` devem ter espaçamento entre letras levemente reduzido para um visual mais sofisticado e autoritário.
*   **Body (Corpo do Texto):** O foco é a legibilidade extrema em prontuários e agendas. `body-md` é o padrão para dados de pacientes, garantindo que a informação seja consumida sem esforço.
*   **Labels (Rótulos):** Use `label-md` em `on_surface_variant` para metadados, criando uma distinção clara entre o dado e sua descrição.

---

## 4. Elevação & Profundidade

A profundidade neste sistema é atmosférica, não estrutural.

*   **O Princípio do Empilhamento:** A elevação é conquistada via `surface-container` tiers. Para criar foco em um modal, não use um overlay preto pesado; use um `backdrop-blur` (Glassmorphism) com a cor `surface` a 80% de opacidade.
*   **Sombras Ambientes:** Quando um elemento precisa flutuar (ex: um botão de agendamento rápido), a sombra deve ser extra-difusa: `box-shadow: 0 12px 32px rgba(25, 28, 28, 0.06)`. A cor da sombra deve ser um tom derivado de `on-surface`, nunca um cinza genérico.
*   **Bordas Fantasmagóricas (Ghost Borders):** Se uma borda for indispensável para acessibilidade, utilize `outline_variant` com apenas 15% de opacidade. Ela deve ser sentida, não vista.

---

## 5. Componentes Principais

### Botões (Ações Intencionais)
*   **Primário:** Fundo `primary`, texto `on_primary`. Cantos arredondados em `md` (0.75rem). Sem bordas. Estado de hover eleva sutilmente a saturação, não a escuridão.
*   **Terciário (Ghost):** Apenas texto em `primary`. Usado para ações secundárias como "Cancelar" ou "Voltar".

### Cards de Agendamento
*   **Design:** Proibido o uso de linhas divisórias. O espaço em branco (`spacing-6`) define a separação entre o horário e o nome do paciente.
*   **Estado:** Utilize uma barra vertical de 4px de largura no canto esquerdo com a cor `secondary` para indicar sessões de fisioterapia e `primary` para pilates.

### Inputs de Prontuário
*   **Estilo:** Campos de texto usam `surface_container_highest` como fundo, sem borda inferior pesada. O foco é indicado por um aumento suave na sombra interna e uma transição de cor no label para `primary`.

### Chips de Status
*   **Visual:** Pílulas totalmente arredondadas (`full`). Para "Presença Confirmada", use `primary_fixed` com texto em `on_primary_fixed_variant`. O contraste baixo é proposital para manter a calma visual da agenda.

---

## 6. Diretrizes de "Do's & Don'ts" (O Que Fazer e O Que Não Fazer)

### ✅ Do's (Faça)
*   **Respiro Excessivo:** Use o `spacing-12` ou `16` entre grandes seções de conteúdo. O espaço vazio é um elemento de design, não um desperdício.
*   **Linguagem Humana:** Use termos acolhedores. Em vez de "Usuário não encontrado", use "Não conseguimos localizar este cadastro".
*   **Micro-interações:** Adicione transições suaves (200ms ease-out) em todos os estados de hover para reforçar a sensação de fluidez.

### ❌ Don'ts (Não Faça)
*   **Bordas Pretas ou Cinzas:** Nunca use `#000000` ou cinzas genéricos. Use sempre os tons de `on_surface` ou `outline` derivados da nossa paleta.
*   **Grades Apertadas:** Evite espremer dados em tabelas densas. Se a informação for excessiva, use o princípio de "Divulgação Progressiva" (mostrar o essencial, esconder o detalhe sob interação).
*   **Sombras Pesadas:** Evite sombras com opacidade acima de 10%. Elas "sujam" a pureza do sistema de sálvia e branco.

---

## 7. Tokens de Implementação Rápida

*   **Arredondamento Padrão:** `0.75rem` (md) para a maioria dos containers.
*   **Arredondamento de Botão:** `full` ou `0.75rem`.
*   **Cor de Fundo da App:** `surface` (#f8faf9).
*   **Texto Principal:** `on_surface` (#191c1c).
*   **Destaque Clínico:** `primary` (#466250).

Este sistema não é apenas uma interface; é o reflexo digital da promessa de bem-estar da clínica. Cada pixel deve transmitir cuidado.