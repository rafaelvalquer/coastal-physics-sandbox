import test from "node:test";
import assert from "node:assert/strict";
import { PowerNetwork } from "../../src/gameplay/utilities/PowerNetwork.js";

test("rede elétrica prioriza infraestrutura marcada quando a geração é insuficiente", () => {
  const power = new PowerNetwork();
  power.addNode("plant", { generation: 100 });
  power.addNode("city", { demand: 80 });
  power.addNode("hospital", { demand: 60 });

  power.setPriority("hospital", 10);
  const state = power.update();

  assert.equal(state.nodes.hospital.powered, true);
  assert.equal(state.nodes.city.powered, false);
});
