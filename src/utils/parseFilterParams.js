const parseType = (type) => {
  const isString = typeof type === 'string';
  if (!isString) return;

  const isType = (type) => ['work', 'home', 'personal'].includes(type);
  if (isType(type)) return type;
};

const parseBoolean = (isFavourite) => {
  if (typeof isFavourite !== 'string') return;

  if (isFavourite.toLowerCase() === 'true') return true;
  if (isFavourite.toLowerCase() === 'false') return false;

  return;
};

export const parseFilterParams = (query) => {
  const { type, isFavourite } = query;

  const parsedType = parseType(type);
  const parsedBoolean = parseBoolean(isFavourite);

  return {
    type: parsedType,
    isFavourite: parsedBoolean,
  };
};
