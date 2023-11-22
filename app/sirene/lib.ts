export const geocode = async (query: string) => {
  const params = {
    limit: "10",
    ranked: "true",
    matchingLimit: "10",
    query,
  };
  const baseUrl =
    "https://api.recherche-entreprises.fabrique.social.gouv.fr/api/v1/search";
  const response = await fetch(`${baseUrl}?${new URLSearchParams(params)}`);
  return response.json();
};
