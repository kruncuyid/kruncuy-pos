const prisma = require("../../core/config/prisma");

exports.listSuppliers = async () => {
  return prisma.supplier.findMany({
    orderBy: { name: "asc" },
  });
};

exports.getSupplierById = async (id) => {
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) {
    const err = new Error("Supplier tidak ditemukan");
    err.statusCode = 404;
    throw err;
  }
  return supplier;
};

exports.createSupplier = async (payload) => {
  const { code, name, contactPerson, phone, email, address, paymentTerms } = payload;
  if (!code || !name) {
    const err = new Error("Kode dan nama supplier wajib diisi");
    err.statusCode = 400;
    throw err;
  }
  return prisma.supplier.create({
    data: { code, name, contactPerson, phone, email, address, paymentTerms },
  });
};

exports.updateSupplier = async (id, payload) => {
  await exports.getSupplierById(id);
  return prisma.supplier.update({
    where: { id },
    data: {
      code: payload.code,
      name: payload.name,
      contactPerson: payload.contactPerson,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
      paymentTerms: payload.paymentTerms,
      isActive: payload.isActive,
    },
  });
};

exports.deleteSupplier = async (id) => {
  await exports.getSupplierById(id);
  // Soft delete
  return prisma.supplier.update({
    where: { id },
    data: { isActive: false },
  });
};
