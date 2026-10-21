// Collect the newest reviews of several Booking.com hotels in one step.
// Run with javascript_tool in a tab on any www.booking.com page, after putting the
// hotels and the number of reviews per hotel in the call on the last line. For
// each hotel it reads the hotel page's IDs, then calls the GraphQL query that the
// page's own review list uses, newest first. No clicks are needed. Results
// replace the page body; read them with get_page_text and max_chars 200000 (the
// default stops at 50,000 characters, about three hotels). The output ends with
// "# END", so a missing END line means it was cut off.
// Output: one "# slug: ..." header per hotel, then one line per review with text
// (liked or disliked non-empty; the others say nothing and are only counted):
//   date | score | lang | title | + liked | - disliked
// Texts are in the guest's language. Expect about 10 s for 10 hotels at N = 100.
await (async (HOTELS, N) => {
  const query = `query ReviewList($input: ReviewListFrontendInput!) {
    reviewListFrontend(input: $input) {
      ... on ReviewListFrontendResult {
        reviewsCount
        reviewCard { reviewedDate reviewScore textDetails { title positiveText negativeText lang } }
      }
    }
  }`;
  const clean = (s) => (s || "").replace(/\s+/g, " ").replace(/\|/g, "/").trim();
  const env = (html, k) => (html.match(new RegExp(`\\bb_${k}\\s*:\\s*'([^']*)'`)) || [])[1];

  async function one(h) {
    const path = new URL(h, location.origin).pathname;
    const slug = path.split("/").pop().split(".")[0];
    const html = await (await fetch(path, { credentials: "include" })).text();
    const id = env(html, "hotel_id"), ufi = env(html, "ufi"), cc = env(html, "countrycode"), csrf = env(html, "csrf_token");
    if (!id || !ufi || !csrf) return `# ${slug}: ERROR could not read hotel IDs from ${path}`;
    const rows = [];
    let total = null;
    for (let skip = 0; skip < N; skip += 25) {
      const input = { hotelId: Number(id), ufi: Number(ufi), hotelCountryCode: cc, sorter: "NEWEST_FIRST",
                      filters: { text: "" }, skip, limit: Math.min(25, N - skip) };
      const r = await fetch("/dml/graphql?lang=en-gb", {
        method: "POST", credentials: "include",
        headers: { "content-type": "application/json", "x-booking-csrf-token": csrf },
        body: JSON.stringify({ operationName: "ReviewList", query, variables: { input } }),
      });
      const d = await r.json();
      const f = d.data && d.data.reviewListFrontend;
      if (!f || !f.reviewCard) return `# ${slug}: ERROR ${JSON.stringify(d.errors || d).slice(0, 200)}`;
      total = f.reviewsCount;
      for (const c of f.reviewCard) {
        const t = c.textDetails || {};
        const date = new Date(c.reviewedDate * 1000).toISOString().slice(0, 10);
        rows.push([date, c.reviewScore, t.lang, clean(t.title), ("+ " + clean(t.positiveText)).trim(), ("- " + clean(t.negativeText)).trim()].join(" | "));
      }
      if (f.reviewCard.length < input.limit) break;
    }
    const withText = rows.filter((r) => !/\| \+ \| -$/.test(r));
    return `# ${slug}: ${total} reviews on Booking.com; fetched the newest ${rows.length}, ${withText.length} with text\n`
      + withText.join("\n");
  }

  const out = [];
  for (let i = 0; i < HOTELS.length; i += 4) out.push(...(await Promise.all(HOTELS.slice(i, i + 4).map(one))));
  const article = document.createElement("article");
  article.style.whiteSpace = "pre";
  article.textContent = out.join("\n\n") + `\n\n# END: ${HOTELS.length} hotels`;
  document.body.replaceChildren(article);
  return out.map((s) => s.split("\n")[0]).join("\n");
})(["/hotel/gb/hazlittshotel.html"], 100); // Booking.com hotel paths or URLs; newest reviews per hotel
