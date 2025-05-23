export const parseSortParams = (query) => {
  const { sortBy, sortOrder } = query;
  const allowedSortBy = [
    'name',
    'email',
    'createdAt',
    'updatedAt',
    'contactType',
  ];
  const allowedSortOrder = ['asc', 'desc'];
  const finalSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'name';
  const finalSortOrder = allowedSortOrder.includes(sortOrder)
    ? sortOrder
    : 'asc';
  return {
    sortBy: finalSortBy,
    sortOrder: finalSortOrder,
  };
};
