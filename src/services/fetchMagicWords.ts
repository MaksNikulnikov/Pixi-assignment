export async function fetchMagicWordsData() {
  const url =
    "https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch magic words data");
  return await res.json();
}
