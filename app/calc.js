// Rechenkern der Kalkulation: Stückkosten, Marktplatzgebühren, Fixkosten und Break-even,
// USt-Pflicht, Lieferanten-Angebote, Angebote und B2B-Staffel.

export const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const num = (value, fallback = 0) => {
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
  return Number.isFinite(n) ? n : fallback;
};
const blank = (value) => value === null || value === undefined || value === "";

/** Was eine Ausgabe den Betrieb tatsächlich kostet: netto mit Vorsteuerabzug, sonst brutto. */
export function costBasis(amount, basis, settings) {
  const vat = num(settings.vatRate);
  const net = basis === "brutto" ? num(amount) / (1 + vat) : num(amount);
  return settings.vatLiable ? net : net * (1 + vat);
}

export function materialUnitCost(material, settings) {
  const quantity = num(material?.quantity);
  if (!material || quantity <= 0) return null;
  return costBasis(num(material.price) + num(material.procurement), material.basis, settings) / quantity;
}

export function materialByRole(data, role) {
  return data.materials.find((entry) => entry.role === role) || null;
}

function roleCost(data, role) {
  return materialUnitCost(materialByRole(data, role), data.settings) ?? 0;
}

/** Materialkosten eines Referenzdrucks (Tinte, Pulver, Folie) aus Verbrauch und Einkauf. */
export function printCosts(data) {
  const use = data.printUsage;
  const ink = num(use.cmykMl) * roleCost(data, "inkCmyk") + num(use.whiteMl) * roleCost(data, "inkWhite");
  const powder = num(use.powderG) * roleCost(data, "powder");
  const film = num(use.filmSheets) * roleCost(data, "film");
  return { ink, powder, film, total: ink + powder + film };
}

/** Preis eines Textil-Angebots je Stück inklusive Bezugskosten, in Kostenbasis. */
export function offerCost(offer, settings) {
  return costBasis(num(offer.price) + num(offer.procurement), offer.basis, settings);
}

/** Gewähltes Angebot: bevorzugter Lieferant, sonst das günstigste mit Preis. */
export function textileOffer(data, textileId, supplierId) {
  const textile = data.textiles.find((entry) => entry.id === textileId);
  if (!textile) return null;
  const offers = textile.offers.filter((offer) => !blank(offer.price));
  if (!offers.length) return null;
  for (const wanted of [supplierId, textile.preferredSupplierId]) {
    const chosen = wanted && offers.find((offer) => offer.supplierId === wanted);
    if (chosen) return chosen;
  }
  return offers.reduce((best, offer) =>
    offerCost(offer, data.settings) < offerCost(best, data.settings) ? offer : best,
  );
}

/** Kostenaufbau je verkauftem Artikel vor Verkaufsgebühren . */
export function productCosts(data, product, overrides = {}) {
  const settings = data.settings;
  const p = { ...product, ...overrides };
  const gross = num(p.priceGross);
  const net = gross > 0 ? (settings.vatLiable ? gross / (1 + num(settings.vatRate)) : gross) : 0;
  const offer = blank(p.ownTextilePrice) ? textileOffer(data, p.textileId, p.supplierId) : null;
  const textile = blank(p.ownTextilePrice)
    ? offer
      ? offerCost(offer, settings)
      : null
    : costBasis(p.ownTextilePrice, "netto", settings);
  const print = printCosts(data);
  const prints = num(p.prints, 1);
  const ink = prints * num(p.inkFactor, 1) * print.ink;
  const powder = prints * num(p.powderFactor, 1) * print.powder;
  const film = prints * num(p.filmFactor, 1) * print.film;
  const cleaning = costBasis(p.cleaning, "netto", settings);
  const procurement = costBasis(p.procurement, "netto", settings);
  const scrap = num(p.scrapRate);
  const productionBase = (textile ?? 0) + procurement + ink + powder + film + cleaning;
  const production = scrap >= 0 && scrap < 1 ? productionBase / (1 - scrap) : productionBase;
  const shipping = blank(p.shippingOverride) ? roleCost(data, "shipping") : costBasis(p.shippingOverride, "netto", settings);
  const bag = roleCost(data, "bag");
  const label = roleCost(data, "label");
  const packaging = costBasis(p.packagingExtra, "netto", settings);
  const reserves =
    costBasis(num(p.returnsReserve) + num(p.adPerSale) + num(p.otherVariable), "netto", settings) +
    gross * num(p.adShareOfPrice);
  const variable = production + shipping + bag + label + packaging + reserves;
  const problems = [];
  if (gross <= 0) problems.push("Verkaufspreis fehlt");
  if (textile === null) problems.push("Textilpreis fehlt");
  if (scrap < 0 || scrap >= 1) problems.push("Ausschussquote prüfen");
  return {
    gross, net, vat: gross - net, offer, textile: textile ?? 0, procurement, ink, powder, film, cleaning,
    production, shipping, bag, label, packaging, reserves, variable, problems,
  };
}

/** Gewählter Tarif eines Kanals (z. B. eBay Basis/Top/Premium), sonst null. */
export function channelPlan(channel) {
  const plans = channel?.plans || [];
  return plans.find((plan) => plan.id === channel.planId) || null;
}

/** Monatsabo netto: aus dem gewählten Tarif, sonst aus dem Feld am Kanal. */
export function channelMonthlyFee(channel) {
  const plan = channelPlan(channel);
  return plan ? num(plan.monthlyFee) : num(channel?.monthlyFee);
}

/** Verkaufsgebühren eines Kanals für einen Bruttopreis; jede Komponente auf Cent gerundet. */
export function channelFees(channel, gross, settings) {
  if (!channel || gross <= 0) return { total: 0, parts: [] };
  const tiers = [...(channel.tiers || [])].sort((a, b) => (a.upTo ?? Infinity) - (b.upTo ?? Infinity));
  let commission = 0;
  if (channel.tierMode === "marginal") {
    let lower = 0;
    for (const tier of tiers) {
      const upper = tier.upTo ?? Infinity;
      if (gross > lower) commission += (Math.min(gross, upper) - lower) * num(tier.rate);
      lower = upper;
    }
  } else if (tiers.length) {
    const tier = tiers.find((entry) => gross <= (entry.upTo ?? Infinity)) || tiers[tiers.length - 1];
    commission = gross * num(tier.rate);
  }
  commission = round2(Math.max(num(channel.minCommission), commission));
  const payment = round2(gross * num(channel.paymentRate) + num(channel.paymentFixed));
  const threshold = num(channel.orderFeeThreshold, Infinity);
  const orderFee = gross <= threshold || blank(channel.orderFeeHigh) ? num(channel.orderFee) : num(channel.orderFeeHigh);
  const listing = round2(num(channel.listingFee));
  const ads = round2(gross * num(channel.adRate)) * num(channel.adShare);
  const plan = channelPlan(channel);
  const perItem = plan && !blank(plan.perItemFee) ? num(plan.perItemFee) : num(channel.perItemFee);
  // Gebühren sind Kosten netto; ohne Vorsteuerabzug zahlt man die Umsatzsteuer darauf mit.
  const factor = settings.vatLiable ? 1 : 1 + num(settings.vatRate);
  const parts = [
    ["Provision", commission], ["Zahlung", payment], ["Bestellpauschale", orderFee],
    ["Einstellen", listing], ["Offsite Ads", ads], ["Stückgebühr", perItem],
  ].map(([label, value]) => ({ label, value: value * factor }));
  return { total: parts.reduce((sum, part) => sum + part.value, 0), parts: parts.filter((part) => part.value) };
}

export function activeScenario(data) {
  return data.scenarios.find((entry) => entry.id === data.settings.scenarioId) || data.scenarios[0] || null;
}

/** Monatliche Fixkosten: Personal, laufende Kosten, Plattformabos und Standort. */
export function fixedCosts(data, scenario = activeScenario(data)) {
  const settings = data.settings;
  const staff = data.staff.reduce((sum, entry) => sum + num(entry.budget) * num(entry.count, 1), 0);
  const running = data.fixedCosts
    .filter((entry) => entry.active !== false)
    .reduce((sum, entry) => {
      const monthly = entry.interval === "yearly" ? num(entry.amount) / 12 : num(entry.amount);
      return sum + costBasis(monthly, entry.basis, settings);
    }, 0);
  const platforms = data.channels
    .filter((entry) => entry.active !== false)
    .reduce((sum, entry) => sum + costBasis(channelMonthlyFee(entry), "netto", settings), 0);
  const location = scenario
    ? costBasis(num(scenario.area) * (num(scenario.rentPerM2) + num(scenario.extraPerM2)), "netto", settings)
    : 0;
  const total = staff + running + platforms + location;
  return { staff, running, platforms, location, total, toCover: total + num(settings.profitTarget) };
}

/** Deckungsbeitrag, Break-even und Monatsergebnis eines Produkts in einem Kanal. */
export function channelResult(data, product, channel, options = {}) {
  const costs = options.costs || productCosts(data, product, options.overrides);
  const fees = channelFees(channel, costs.gross, data.settings);
  const fixed = options.fixed || fixedCosts(data);
  const contribution = costs.net - costs.variable - fees.total;
  const roundTo = Math.max(1, num(data.settings.roundTo, 1));
  const days = Math.max(1, num(data.settings.daysPerMonth, 30));
  const coverable = contribution > 0 && !costs.problems.length;
  const monthly = coverable ? Math.ceil(fixed.toCover / contribution / roundTo - 1e-9) * roundTo : null;
  return {
    channel, costs, fees, contribution,
    margin: costs.net > 0 ? contribution / costs.net : 0,
    breakEvenMonthly: monthly,
    breakEvenDaily: monthly === null ? null : Math.ceil(monthly / days - 1e-9),
    resultAt: (quantity) => num(quantity) * contribution - fixed.total,
  };
}

/**
 * Kleinster Bruttopreis (auf Cent), bei dem der Rest je Verkauf mindestens `margin` vom
 * Nettoumsatz erreicht. Gebühren sind gestaffelt, daher Bisektion statt Formel.
 */
export function priceForMargin(data, product, channel, margin) {
  const marginAt = (gross) => {
    const result = channelResult(data, product, channel, { overrides: { priceGross: gross } });
    return result.costs.net > 0 ? result.contribution / result.costs.net : -Infinity;
  };
  let low = 0.01, high = 10000;
  if (marginAt(high) < margin) return null;
  for (let step = 0; step < 60; step += 1) {
    const mid = (low + high) / 2;
    if (marginAt(mid) >= margin) high = mid; else low = mid;
  }
  const cents = Math.ceil(high * 100 - 1e-6) / 100;
  return marginAt(cents) >= margin ? cents : round2(cents + 0.01);
}

/** Monatsergebnis aus einem Absatzmix [{product, channel, quantity}]. */
export function portfolio(data, mix, fixed = fixedCosts(data)) {
  const rows = mix.map((entry) => {
    const result = channelResult(data, entry.product, entry.channel, { fixed, overrides: entry.overrides });
    const quantity = num(entry.quantity);
    return { ...entry, result, quantity, revenue: quantity * result.costs.gross, contribution: quantity * result.contribution };
  });
  const contribution = rows.reduce((sum, row) => sum + row.contribution, 0);
  const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const pieces = rows.reduce((sum, row) => sum + row.quantity, 0);
  return { rows, contribution, revenue, pieces, fixed, result: contribution - fixed.total };
}

/**
 * Angebot für eine Kundenanfrage: Stückkosten, Versand je Paket, Einrichtung,
 * optionaler Fixkostenanteil, Aufschlag oder Wunschpreis und Rabatt.
 */
export function quote(data, input) {
  const settings = data.settings;
  const vat = num(settings.vatRate);
  const quantity = Math.max(1, Math.round(num(input.quantity, 1)));
  const product = input.product;
  // Ohne Marktplatz: kein Verkaufspreis-Anteil für Werbung, Versand je Paket statt je Stück.
  const costs = productCosts(data, product, {
    priceGross: 1, shippingOverride: 0, adShareOfPrice: 0, ...input.overrides,
  });
  const pieceCost = costs.production + costs.packaging + costs.reserves;
  const parcels = Math.ceil(quantity / Math.max(1, num(input.piecesPerParcel, 20)));
  const shippingTotal = input.shippingIncluded === false ? 0 : parcels * (costBasis(input.parcelCost, "netto", settings) + roleCost(data, "bag") + roleCost(data, "label"));
  const setup = costBasis(input.setupCost, "netto", settings);
  const overheadPiece = input.includeOverhead
    ? fixedCosts(data).total / Math.max(1, num(input.overheadVolume, 1000))
    : 0;
  const totalCost = pieceCost * quantity + shippingTotal + setup + overheadPiece * quantity;
  const unitCost = totalCost / quantity;
  const toGross = (netValue) => (settings.vatLiable ? netValue * (1 + vat) : netValue);
  const listUnitNet = blank(input.targetUnitNet)
    ? unitCost * (1 + num(input.markup))
    : num(input.targetUnitNet);
  const discount = Math.min(0.99, Math.max(0, num(input.discount)));
  const unitNet = listUnitNet * (1 - discount);
  const revenueNet = unitNet * quantity;
  const profit = revenueNet - totalCost;
  // Höchster Rabatt, bei dem das Angebot noch die Kosten deckt.
  const maxDiscount = listUnitNet > 0 ? Math.max(0, 1 - unitCost / listUnitNet) : 0;
  return {
    quantity, parcels, pieceCost, shippingTotal, setup, overheadPiece, totalCost, unitCost,
    listUnitNet, unitNet, unitGross: toGross(unitNet), revenueNet, revenueGross: toGross(revenueNet),
    discount, profit, margin: revenueNet > 0 ? profit / revenueNet : 0, maxDiscount,
    breakEvenUnitNet: unitCost, costs,
  };
}

/** Summen eines Angebots: Positionen mit regulärem Stückpreis netto und optionalem Rabatt. */
export function offerTotals(offer, settings) {
  const lines = (offer.positions || []).map((position) => {
    const quantity = num(position.qty);
    const discount = Math.min(1, Math.max(0, num(position.discount)));
    const regular = round2(quantity * num(position.unitNet));
    const net = round2(regular * (1 - discount));
    return { id: position.id, quantity, discount, regular, net, saved: round2(regular - net), cost: blank(position.unitCost) ? null : quantity * num(position.unitCost) };
  });
  const sum = (key) => round2(lines.reduce((total, line) => total + line[key], 0));
  const net = sum("net");
  const vat = settings.vatLiable ? round2(net * num(settings.vatRate)) : 0;
  const costed = lines.filter((line) => line.cost !== null);
  const cost = costed.reduce((total, line) => total + line.cost, 0);
  const costedNet = costed.reduce((total, line) => total + line.net, 0);
  return {
    lines, regular: sum("regular"), saved: sum("saved"), net, vat, gross: round2(net + vat),
    hasDiscount: lines.some((line) => line.discount > 0),
    cost, profit: costedNet - cost, margin: costedNet > 0 ? (costedNet - cost) / costedNet : 0, costedAll: costed.length === lines.length,
  };
}

/** Staffelrabatt: höchster Rabatt aller Stufen, deren Mindestmenge erreicht ist. */
export function tierDiscount(tiers, quantity) {
  return (tiers || []).reduce((best, tier) => (!blank(tier.minQty) && num(quantity) >= num(tier.minQty, Infinity) ? Math.max(best, num(tier.discount)) : best), 0);
}
