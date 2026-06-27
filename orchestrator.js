
async function getResults(query, searchParams, { resolveLocation, search }) {
    const location = await resolveLocation(query);
    return search(location, searchParams);
  }
  
  module.exports = { getResults };