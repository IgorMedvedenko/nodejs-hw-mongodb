export const parsePaginationParams = (query) => {
  const { pafe, perPage } = query;
  const parsedPage = parseInt(pafe, 10);
  const parsedPerPage = parseInt(perPage, 10);
  const finalPage = !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const finalPerPage =
    !isNaN(parsedPerPage) && parsedPerPage > 0 ? parsedPerPage : 10;
  return {
    page: finalPage,
    perPage: finalPerPage,
  };
};
