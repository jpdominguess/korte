import assert from "node:assert/strict";
import test from "node:test";
import { Subscription } from "../src/domain/entities/subscription";
import { addDays } from "../src/domain/shared/time";

for (const start of ["2026-11-01", "2026-12-20", "2028-02-15"]) {
  test(`a assinatura iniciada em ${start} permite uso em exatamente 30 dias`, () => {
    const subscription = new Subscription({
      id: "subscription", clientId: "client", planId: "plan", canceledAt: null,
      ...Subscription.firstCycle(start, 3),
    });
    assert.equal(subscription.isUsable(addDays(start, -1)), false);
    for (let day = 0; day < 30; day++) assert.equal(subscription.isUsable(addDays(start, day)), true);
    assert.equal(subscription.isUsable(addDays(start, 30)), false);
    assert.equal(subscription.situation(addDays(start, 30)), "EXPIRADA");
  });
}

test("a renovação inicia 30 dias e zera os usos; cancelamento impede renovação e consumo", () => {
  const subscription = new Subscription({
    id: "subscription", clientId: "client", planId: "plan", canceledAt: null,
    ...Subscription.firstCycle("2026-10-01", 1),
  });
  subscription.consumeUse("2026-10-01");
  assert.equal(subscription.remainingUses, 0);
  assert.throws(() => subscription.consumeUse("2026-10-01"));
  subscription.renew("2026-11-12", 3);
  assert.equal(subscription.cycleEnd, "2026-12-11");
  assert.equal(subscription.usedUses, 0);
  subscription.cancel(new Date("2026-11-12T15:00:00Z"));
  assert.equal(subscription.isUsable("2026-11-12"), false);
  assert.throws(() => subscription.renew("2026-11-12", 3));
  assert.throws(() => subscription.consumeUse("2026-11-12"));
});
