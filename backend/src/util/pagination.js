/**
 * Pagination utility for cursor-based pagination
 * Eliminates duplicate pagination logic across controllers
 */

export const DEFAULT_MESSAGE_LIMIT = 20;
export const DEFAULT_USERS_LIMIT = 20;
export const DEFAULT_POSTS_LIMIT = 10;

export const MAX_MESSAGE_LIMIT = 100;
export const MAX_USERS_LIMIT = 100;
export const MAX_POSTS_LIMIT = 50;

/**
 * Parse pagination parameters from request
 * @param {Object} req - Express request object
 * @param {number} defaultLimit - Default limit if not provided
 * @param {number} maxLimit - Maximum allowed limit
 * @returns {Object} {cursor, safeLimit}
 */
export const parsePaginationParams = (
  req,
  defaultLimit = DEFAULT_MESSAGE_LIMIT,
  maxLimit = MAX_MESSAGE_LIMIT,
) => {
  const { cursor, limit } = req.query;
  const safeLimit = Math.min(
    Math.max(parseInt(limit, 10) || defaultLimit, 1),
    maxLimit,
  );
  return { cursor, safeLimit };
};

/**
 * Build MongoDB query with cursor-based pagination
 * @param {Object} baseQuery - Base MongoDB query
 * @param {string|ObjectId} cursor - Cursor for pagination
 * @returns {Object} MongoDB query with cursor condition
 */
export const buildPaginationQuery = (baseQuery, cursor) => {
  const query = { ...baseQuery };
  if (cursor) {
    query._id = { $lt: cursor };
  }
  return query;
};

/**
 * Process pagination results
 * @param {Array} docs - Database documents
 * @param {number} safeLimit - Safe limit value
 * @param {Object} options - Options {reverse: true/false}
 * @returns {Object} {page, hasMore, nextCursor}
 */
export const processPaginationResults = (
  docs,
  safeLimit,
  options = { reverse: true },
) => {
  const hasMore = docs.length > safeLimit;
  const page = hasMore ? docs.slice(0, safeLimit) : docs;

  if (options.reverse) {
    page.reverse();
  }

  const nextCursor = hasMore ? docs[safeLimit]._id : null;

  return {
    page,
    hasMore,
    nextCursor,
  };
};

/**
 * Complete pagination helper - combines all steps
 * @param {Object} req - Express request
 * @param {Object} baseQuery - MongoDB base query
 * @param {Object} options - {defaultLimit, maxLimit, model, reverse}
 * @returns {Promise<Object>} {data, hasMore, nextCursor}
 */
export const performPagination = async (
  req,
  baseQuery,
  options = {},
) => {
  const {
    defaultLimit = DEFAULT_MESSAGE_LIMIT,
    maxLimit = MAX_MESSAGE_LIMIT,
    model,
    reverse = true,
    sortField = "_id",
    selectFields = null,
  } = options;

  if (!model) throw new Error("Model is required for pagination");

  const { cursor, safeLimit } = parsePaginationParams(
    req,
    defaultLimit,
    maxLimit,
  );
  const query = buildPaginationQuery(baseQuery, cursor);

  let queryBuilder = model.find(query).sort({ [sortField]: -1 }).limit(safeLimit + 1);

  if (selectFields) {
    queryBuilder = queryBuilder.select(selectFields);
  }

  queryBuilder = queryBuilder.lean();
  const docs = await queryBuilder;

  const { page, hasMore, nextCursor } = processPaginationResults(
    docs,
    safeLimit,
    { reverse },
  );

  return { page, hasMore, nextCursor };
};
