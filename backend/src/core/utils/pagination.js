/**
 * Pagination helper — standardisasi response pagination di semua endpoint.
 *
 * Usage:
 *   const { page, limit, skip } = parsePagination(req.query);
 *   const [data, total] = await Promise.all([
 *     model.findMany({ where, skip, take: limit, ... }),
 *     model.count({ where }),
 *   ]);
 *   res.json(paginatedResponse(data, total, page, limit));
 */

/**
 * Parse page & limit dari query params.
 * Default: page=1, limit=20. Max limit=100.
 */
function parsePagination(query = {}) {
  const rawPage = Number(query.page) || 1;
  const rawLimit = Number(query.limit) || 20;

  const page = Math.max(1, rawPage);
  const limit = Math.min(100, Math.max(1, rawLimit));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Bungkus data array dengan meta pagination.
 */
function paginatedResponse(data, total, page, limit) {
  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

module.exports = { parsePagination, paginatedResponse };
