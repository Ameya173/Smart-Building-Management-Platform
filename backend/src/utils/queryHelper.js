const paginate = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const sort = query.sort ? query.sort.split(",").join(" ") : "-createdAt";
  return { page, limit, skip, sort };
};

const buildPaginatedResponse = (data, total, page, limit) => ({
  results: data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  },
});

module.exports = { paginate, buildPaginatedResponse };
