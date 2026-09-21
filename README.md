# Coastal Physics Sandbox

Sandbox físico 2D de costa/ilha feito com **JavaScript + React + Canvas + Node/Express**.

## Executar

Requisitos: Node.js 20+ e npm.

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`.

Teste do núcleo físico (não depende de React/Vite):

```bash
npm run test:physics
```

Para gerar uma build de produção:

```bash
npm run build
npm start
```

Abra `http://localhost:3001`.

## O que já está implementado

- Loop físico com **fixed timestep de 120 Hz** independente do FPS de renderização.
- Água 1D por colunas com uma aproximação de **Shallow Water Equations**:
  - profundidade `h`;
  - momento horizontal `q = h·u`;
  - fluxo numérico tipo Rusanov;
  - reconstrução hidrostática na interface para transição molhado/seco;
  - gravidade, arrasto do fundo e limite de velocidade local.
- Maré com condição de contorno aberta no oceano.
- Vento com rajadas coerentes e tensão de cisalhamento do ar na superfície.
- Ondulação secundária por sistema de molas acopladas, sem criar volume de água.
- Arrebentação com dissipação de energia e partículas de espuma.
- Chuva e escoamento superficial simplificado.
- Terreno destrutível com materiais: areia, terra, argila, cascalho, rocha e concreto.
- Erosão baseada em tensão de cisalhamento hidráulica, energia orbital e arrebentação.
- Solo molhado perde resistência conforme o material.
- Sedimentos em suspensão, advecção, difusão, capacidade de transporte e deposição.
- Areia/cascalho granulares com queda e escorregamento.
- Terra/argila saturadas podem sofrer movimentos de massa simplificados.
- Infiltração e difusão de umidade no solo.
- Estruturas de concreto com suporte simplificado; trechos sem apoio podem romper.
- Corpos rígidos/destroços com gravidade, arrasto, colisão com terreno e **empuxo de Arquimedes**.
- Ferramentas para escavar, adicionar materiais, criar concreto, gerar destroços e perturbar ondas.
- Debug de grid, velocidade, pressão hidrostática, sedimentos e umidade.
- Sonda física sob o cursor.
- Salvamento/carregamento via API Node (`saves/slot-1.json`).

## Modelo físico

### Água

O solver usa a forma de conservação das águas rasas, discretizada em colunas:

`∂h/∂t + ∂(hu)/∂x = 0`

`∂(hu)/∂t + ∂(hu² + ½gh²)/∂x = forças`

O fluxo nas interfaces usa uma forma Rusanov/Lax-Friedrichs local. Em degraus de terreno, a profundidade disponível é reconstruída com a elevação máxima do leito entre duas colunas, reduzindo fluxos espúrios em praias secas.

### Pressão

A telemetria usa a pressão hidrostática aproximada:

`P = ρgh`

Na conversão do mundo visual, 48 px equivalem a aproximadamente 1 unidade métrica de profundidade para exibição.

### Vento

A tensão de cisalhamento segue a relação:

`τ = ρ_ar Cd |Vvento - Vágua| (Vvento - Vágua)`

Rajadas são geradas por ruído coerente, evitando `Math.random()` independente em cada frame como fonte principal da física atmosférica.

### Erosão

A erosão começa quando a tensão hidráulica efetiva supera a resistência crítica do material:

`E ∝ erodibilidade · max(0, τ - τc)`

A tensão combina corrente, velocidade orbital das ondas e arrebentação. Umidade reduz a resistência crítica de materiais coesivos como terra e argila.

### Sedimentos

Material erodido entra na água como sedimento em suspensão. O sedimento é transportado com a corrente e deposita quando a concentração supera a capacidade local de transporte, que cresce com a velocidade e turbulência.

### Empuxo

Destroços usam:

`Fb = ρágua · g · Vsubmerso`

A aceleração de empuxo é calculada pela fração submersa e pela densidade do corpo.

## Observações importantes

Este projeto busca **comportamento físico plausível em tempo real**, não precisão de engenharia costeira. Unidades internas são escaladas para estabilidade e jogabilidade. Para uma simulação científica quantitativa, seriam necessários calibração, malha 2D/3D, condições de contorno medidas e validação contra dados experimentais.

## Estrutura

```text
src/
  components/          React / UI
  engine/
    physics/           água, atmosfera, erosão, granular, estruturas, corpos rígidos
    world/             grid, materiais e constantes
    rendering/         Canvas renderer
    particles/         espuma, spray e sedimento visual
    utils/
server/                 Express / save-load / presets
saves/                  saves locais
```

Para detalhes das equações, escalas, calibração e limitações, consulte `PHYSICS.md`.
