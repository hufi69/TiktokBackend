// Cursor helper (createdAt + _id)
const buildCursorQuery = (cursor) => {
  if (!cursor) return {};
  // cursor format: `${createdAtMs}_${id}`
  const [ms, id] = cursor.split('_');
  return {
    $or: [
      { createdAt: { $lt: new Date(Number(ms)) } },
      { createdAt: new Date(Number(ms)), _id: { $lt: id } }
    ]
  };
};

const getNextCursor = (lastDoc) => {
  if (!lastDoc) return null;
  return `${lastDoc.createdAt.getTime()}_${lastDoc._id}`;
};

module.exports = { buildCursorQuery, getNextCursor };
