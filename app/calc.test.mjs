// Prüft den Rechenkern. Start: node --test app/calc.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { channelFees, channelMonthlyFee, offerTotals, productCosts, quote, tierDiscount } from "./calc.js";

const seed = () => JSON.parse(readFileSync(new URL("./seed.json", import.meta.url), "utf8"));
const close = (actual, expected, digits = 4) => assert.ok(Math.abs(actual - expected) < 10 ** -digits, `${actual} ≠ ${expected}`);

test("Startstand lädt und rechnet ohne Fehler", () => {
  const data = seed();
  data.textiles.push({ id: "t", name: "Shirt", offers: [{ id: "o", supplierId: data.suppliers[0].id, price: 2, procurement: 0, basis: "netto" }] });
  const product = { id: "p", name: "Shirt", priceGross: 19.95, textileId: "t", prints: 1, inkFactor: 1, powderFactor: 1, filmFactor: 1 };
  const costs = productCosts(data, product);
  close(costs.textile, 2);
  assert.ok(quote(data, { product, overrides: {}, quantity: 50, targetUnitNet: 6, discount: 0.1 }).revenueNet > 0);
});

test("Tarif bestimmt Monatsabo und Stückgebühr", () => {
  const channel = { id: "x", tiers: [{ upTo: null, rate: 0.1 }], plans: [{ id: "a", monthlyFee: 39.95, perItemFee: 0.99 }], planId: "a", monthlyFee: 0 };
  assert.equal(channelMonthlyFee(channel), 39.95);
  close(channelFees(channel, 19.95, { vatLiable: true, vatRate: 0.19 }).total, 2 + 0.99, 6);
});

test("Angebot: Rabatt je Position, USt auf die Summe", () => {
  const offer = { positions: [
    { id: "a", qty: 50, unitNet: 4.5, discount: 0.2, unitCost: 2.56 },
    { id: "b", qty: 20, unitNet: 9.99, discount: "", unitCost: 6.5 },
    { id: "c", qty: 1, unitNet: 25, discount: 0, unitCost: "" },
  ] };
  const t = offerTotals(offer, { vatLiable: true, vatRate: 0.19 });
  assert.deepEqual(t.lines.map((l) => l.net), [180, 199.8, 25]);
  assert.equal(t.saved, 45);
  assert.equal(t.gross, 481.71);
  assert.equal(offerTotals(offer, { vatLiable: false, vatRate: 0.19 }).gross, 404.8);
});

test("Staffel: Rabatt der höchsten erreichten Stufe", () => {
  const tiers = [{ minQty: 100, discount: 0.15 }, { minQty: 25, discount: 0.05 }, { minQty: 50, discount: 0.1 }, { minQty: "", discount: 0.5 }];
  assert.equal(tierDiscount(tiers, 24), 0);
  assert.equal(tierDiscount(tiers, 50), 0.1);
  assert.equal(tierDiscount(tiers, 250), 0.15);
});
