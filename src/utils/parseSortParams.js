import { SORT_ODER } from '../constants/index.js';

const parseSortOder = (sortOder) => {
  const isKnownOder = Object.values(SORT_ODER).includes(sortOder);
  if (!isKnownOder) return SORT_ODER.ASC;
  return sortOder;
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
  const { sortBy, sortOder } = query;
  const parsedSortBy = parseSortBy(sortBy);
  const parsedSortOder = parseSortOder(sortOder);
  return {
    sortBy: parsedSortBy,
    sortOrder: parsedSortOder,
  };
};
