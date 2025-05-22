export const parseFilterParams = (query) => {
  const { type, isFavourite } = query;
  const allowedContactTypes = ['work', 'personal', 'home'];
  const finalType = allowedContactTypes.includes(type) ? type : undefined;
  let finalIsFavourite;
  if (isFavourite === 'true') {
    finalIsFavourite = true;
  } else if (isFavourite === 'false') {
    finalIsFavourite = false;
  } else {
    finalIsFavourite = undefined;
  }
  return {
    type: finalType,
    isFavorite: finalIsFavourite,
  };
};
