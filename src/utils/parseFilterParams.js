export const parseFilterParams = (query) => {
  const { type, isFavorite } = query;
  const allowedContactTypes = ['work', 'personal', 'home'];
  const finalType = allowedContactTypes.includes(type) ? type : undefined;
  let finalIsFavorite;
  if (isFavorite === 'true') {
    finalIsFavorite = true;
  } else if (isFavorite === 'false') {
    finalIsFavorite = false;
  } else {
    finalIsFavorite = undefined;
  }
  return {
    type: finalType,
    isFavorite: finalIsFavorite,
  };
};
