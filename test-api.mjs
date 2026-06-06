async function test() {
  try {
    const res = await fetch("https://nbfkvpqaosisyuhilrsu.supabase.co/functions/v1/make-server-49810636/bracket/knockout-teams?leagueId=be1a0128-f18b-4385-b624-6efa46ab03eb");
    const data = await res.text();
    console.log("STATUS:", res.status);
    console.log("DATA:", data);
  } catch(e) {
    console.error(e);
  }
}
test();
