const fetch = require('node:fetch');

async function test() {
  try {
    const res = await fetch("https://nbfkvpqaosisyuhilrsu.supabase.co/functions/v1/make-server-49810636/bracket/knockout-teams?leagueId=7f2c2560-64ad-40ca-83f1-f09cdeef2140");
    const data = await res.text();
    console.log("STATUS:", res.status);
    console.log("DATA:", data);
  } catch(e) {
    console.error(e);
  }
}
test();
