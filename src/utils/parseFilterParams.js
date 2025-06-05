const parseBoolean = (value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const parseContactType = (type) => {
  const allowedContactTypes = ['work', 'home', 'personal'];
  if (allowedContactTypes.includes(type)) return type;
  return undefined;
};

export const parseFilterParams = (query) => {
  const { type, isFavourite } = query;
  const finalType = parseContactType(type);
  const finalIsFavourite = parseBoolean(isFavourite);

  return {
    type: finalType,
    isFavourite: finalIsFavourite,
  };
};
