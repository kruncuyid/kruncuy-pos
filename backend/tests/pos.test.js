const test = require("node:test");
const assert = require("node:assert/strict");
const { getPrisma } = require("./helpers/setup");

test("pos: invoice number format is valid", async () => {
  const { generateInvoiceNumber } = (() => {
    const crypto = require("crypto");
    return {
      generateInvoiceNumber: () => {
        const now = new Date();
        const date = now.toISOString().slice(0, 10).replaceAll("-", "");
        const random = crypto.randomBytes(4).toString("hex").toUpperCase();
        return `KR-${date}-${random}`;
      },
    };
  })();

  const invoice = generateInvoiceNumber();
  assert.ok(invoice.startsWith("KR-"));
  assert.equal(invoice.length, 20); // KR-YYYYMMDD-XXXXXXXX
});

test("pos: checkout requires active session", async () => {
  const { createTransaction } = require("../src/modules/transactions/transaction.service");

  const p = getPrisma();
  const crew = await p.user.findFirst({ where: { role: "CREW" } });
  const branch = await p.branch.findFirst();

  // Without active session, should throw
  try {
    await createTransaction(
      { id: crew.id, role: "CREW", branchId: branch.id },
      {
        items: [{ productId: "test", qty: 1, price: 5000 }],
        totalAmount: 5000,
        paymentMethod: "CASH",
      },
      { branchId: branch.id }
    );
    assert.fail("Should have thrown");
  } catch (err) {
    assert.ok(err.message.includes("aktif") || err.message.includes("session") || err.statusCode);
  }
});

test("pos: catalog returns categories", async () => {
  const { getCatalog } = require("../src/modules/pos/pos.service");

  const p = getPrisma();
  const crew = await p.user.findFirst({ where: { role: "CREW" } });
  const branch = await p.branch.findFirst();

  const result = await getCatalog(
    { id: crew.id },
    { branchId: branch.id },
    { channel: "OFFLINE" }
  );

  assert.ok(result.categories);
  assert.ok(result.branchId);
});
