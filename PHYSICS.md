# Modelo físico do Coastal Physics Sandbox

Este documento descreve as regras implementadas no motor. O objetivo é obter comportamento emergente e fisicamente coerente em tempo real no navegador. O projeto **não substitui CFD/engenharia costeira calibrada**.

## 1. Escalas e integração temporal

- Mundo: `1280 × 720 px`.
- Escala de referência: `48 px ≈ 1 m`.
- Gravidade: `470,88 px/s²`, equivalente a `9,81 m/s²` nessa escala.
- Física: timestep fixo `Δt = 1/120 s`.
- Água: espaçamento horizontal `Δx = 4 px`.
- Terreno: células de `8 × 8 px`.

O solver limita a velocidade característica para respeitar aproximadamente a condição CFL:

`(|u| + sqrt(g h)) Δt / Δx < 1`

Isso reduz instabilidades numéricas quando surgem correntes fortes ou águas profundas.

## 2. Água: águas rasas 1D

Cada coluna guarda:

- `h`: profundidade;
- `q = h u`: momento/descarga específica;
- `b`: elevação do leito;
- `η = b + h`: elevação da superfície livre;
- sedimento em suspensão;
- intensidade de arrebentação.

As equações-base são:

`∂h/∂t + ∂q/∂x = 0`

`∂q/∂t + ∂(q²/h + ½ g h²)/∂x = fontes`

### Fluxo numérico

É usado um fluxo local de Rusanov. Para terreno variável, o estado na interface é reconstruído hidrostaticamente usando a maior elevação de leito entre as duas colunas.

A correção lateral do fluxo de momento implementa a ideia de reconstrução hidrostática well-balanced: um oceano parado com superfície horizontal permanece parado mesmo sobre fundo inclinado.

O teste `npm run test:physics` verifica explicitamente essa propriedade.

## 3. Fundo seco, praia e inundação

Uma coluna pode ter `h = 0`. Chuva, maré ou fluxo vindo de uma coluna vizinha podem aumentar `h`, criando escoamento sobre uma região anteriormente seca.

Como o leito é recalculado a partir do terreno destrutível, erosão e deposição alteram a batimetria, e a nova batimetria modifica novamente o escoamento.

## 4. Maré e condição oceânica

A borda esquerda é tratada como oceano aberto. O nível-alvo é:

`η_mar = η_base + maré`

A interface converte metros de maré usando a mesma escala de `48 px/m`.

A fronteira é suavemente nudged para o nível oceânico em vez de teletransportar instantaneamente a água, reduzindo reflexões numéricas.

## 5. Vento

A velocidade do vento é dada em `m/s`.

A tensão superficial segue:

`τ = ρ_ar C_d |V_w - U| (V_w - U)`

com:

- `ρ_ar = 1,225 kg/m³`;
- `ρ_água = 1000 kg/m³`;
- `C_d` dependente da velocidade do vento.

A aceleração transmitida à coluna é aproximadamente:

`a = τ / (ρ_água h)`

Rajadas usam ruído coerente temporal/espacial, não ruído independente a cada frame.

## 6. Ondas e superfície secundária

Existem duas escalas:

1. **Águas rasas** transportam massa e momento.
2. **SurfaceWaveSolver** adiciona ondulação de menor escala por molas acopladas.

A ondulação secundária não altera o volume total: o solver remove lentamente o deslocamento médio das molas molhadas.

A aceleração de cada mola usa:

`a = -k y - c v + λ(y_esq + y_dir - 2y) + força_do_vento`

## 7. Arrebentação

A detecção combina:

- inclinação local da superfície livre;
- número de Froude aproximado `Fr = |u| / sqrt(g h)`;
- fator de águas rasas.

Importante: em vizinhos secos, a elevação do leito **não** é tratada como superfície livre. Isso impede uma praia estática de ser interpretada como uma onda quebrando.

Quando uma onda quebra:

- momento é dissipado;
- cria-se espuma/spray;
- aumenta a tensão erosiva efetiva.

## 8. Chuva

A chuva é especificada em `mm/h`. Para manter o sandbox visualmente responsivo, a taxa de entrada de água é acelerada em relação à escala real, mas permanece proporcional ao valor informado.

A chuva também aumenta a umidade das células superficiais.

## 9. Umidade e infiltração

Cada célula sólida contém `moisture ∈ [0,1]`.

A infiltração depende da permeabilidade do material. Água submersa tende a saturar o terreno; chuva infiltra pela superfície; a umidade difunde preferencialmente para baixo e lateralmente.

Materiais coesivos perdem parte da resistência erosiva quando saturados.

## 10. Erosão hidráulica

A tensão de corrente é aproximada por:

`τ_corrente = ½ ρ C_f U²`

A contribuição orbital das ondas usa relação quadrática semelhante. A arrebentação acrescenta uma tensão proporcional à energia cinética local da água.

A erosão só ocorre quando:

`τ_efetiva > τ_crítica(material, umidade)`

A taxa é:

`dD/dt ∝ erodibilidade × excesso_de_tensão`

O excesso é limitado numericamente para evitar destruição instantânea causada por um único pico.

### Resistência efetiva usada

Os valores são parâmetros de jogo calibrados em ordem física plausível:

- areia: baixa;
- cascalho: baixa/moderada;
- terra: moderada;
- argila: maior e bastante sensível à saturação;
- rocha: alta;
- concreto: muito alta.

## 11. Sedimentos

Quando material erodível perde massa, parte entra na coluna de água como sedimento.

O sedimento é:

- advectado na direção da corrente;
- suavizado por difusão turbulenta numérica;
- depositado quando a concentração supera a capacidade de transporte.

A capacidade cresce com velocidade e arrebentação.

Sedimento acumulado pode criar uma nova célula de areia sobre o leito. Portanto, massa erodida pode reaparecer em outra região da costa.

## 12. Material granular

Areia e cascalho obedecem gravidade discreta:

1. cair se a célula abaixo estiver vazia;
2. escorregar diagonalmente se houver espaço.

Terra/argila saturadas podem perder estabilidade e sofrer movimento de massa simplificado quando ficam sem suporte.

Esse módulo representa deslizamento/ângulo de repouso sem usar corpos rígidos para cada grão.

## 13. Concreto e estabilidade estrutural

Concreto construído pelo jogador é uma célula resistente à erosão, mas não é absolutamente indestrutível.

Trechos sem apoio inferior acumulam perda estrutural. Quando falham, a célula vira um corpo rígido de concreto.

É uma aproximação de estabilidade, não análise de elementos finitos.

## 14. Corpos rígidos e empuxo

Destroços usam gravidade e empuxo de Arquimedes:

`F_b = ρ_água g V_submerso`

Dividindo pela massa do corpo, a aceleração vertical depende da razão entre densidade da água e densidade do objeto.

A corrente aplica arrasto horizontal. Há colisão simplificada contra o perfil superior do terreno.

## 15. Feedbacks emergentes

Os sistemas são deliberadamente acoplados:

`vento → ondas → arrebentação → erosão → sedimento → deposição → nova batimetria → novas ondas`

Também:

`chuva/água → saturação → perda de resistência → deslizamento → nova topografia → novo escoamento`

Esses ciclos são a base do sandbox: o cenário altera a física futura em vez de ser apenas um obstáculo estático.

## 16. Limitações atuais

- Água é 1D horizontal com terreno 2D lateral; não há corrente costeira fora do plano da tela.
- Não há Navier-Stokes 2D/3D completo.
- Não há pressão dinâmica em cavidades/overhangs.
- Estruturas usam regra de suporte simplificada, não FEM.
- Sedimentos usam capacidade de transporte simplificada, não uma formulação calibrada como Meyer-Peter–Müller/Van Rijn.
- Chuva é acelerada para jogabilidade.

Esses pontos são caminhos claros para futuras versões sem precisar descartar a arquitetura atual.
