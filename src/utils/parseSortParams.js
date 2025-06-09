import { SORT_ORDER } from '../constants/index.js';

const parseSortOrder = (sortOrder) => {
  const isKnownOrder = Object.values(SORT_ORDER).includes(sortOrder);
  if (!isKnownOrder) return SORT_ORDER.ASC;
  return sortOrder;
};

const parseSortBy = (sortBy) => {
  const allowedSortBy = [
    'id',
    'name',
    'email',
    'phoneNumber',
    'isFavourite',
    'contactType',
    'createdAt',
    'updatedAt',
  ];
  if (allowedSortBy.includes(sortBy)) {
    return sortBy;
  }
  return '_id';
};
export const parseSortParams = (query) => {
  const { sortBy, sortOrder } = query;
  const parsedSortBy = parseSortBy(sortBy);
  const parsedSortOrder = parseSortOrder(sortOrder);
  return {
    sortBy: parsedSortBy,
    sortOrder: parsedSortOrder,
  };
};
