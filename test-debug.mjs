async function test() {
  try {
    const res = await fetch("https://nbfkvpqaosisyuhilrsu.supabase.co/functions/v1/make-server-49810636/bracket/debug-knockout");
    const data = await res.text();
    console.log("STATUS:", res.status);
    console.log("DATA:", data);
  } catch(e) {
    console.error(e);
  }
}
test();
