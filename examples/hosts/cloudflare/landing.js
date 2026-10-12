const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><rect width="28" height="28" rx="7" fill="#F38020"/><path d="M6 15.5c2.2-4 4.4-4 6.6 0s4.4 4 6.6 0" fill="none" stroke="#1C1917" stroke-width="2.6" stroke-linecap="round"/><path d="M19 9.5l3.5 3.5L19 16.5" fill="none" stroke="#1C1917" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const landingPage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relaywave · Webhook delivery infrastructure</title>
<meta name="description" content="Relaywave sends your webhooks with retries, signatures and delivery logs.">
<link rel="icon" href="/blog/images/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="Relaywave Blog" href="/blog/feed.xml">
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; background: #0C0A09; color: #E7E5E4;
    font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif;
    background-image: linear-gradient(#1C1917 1px, transparent 1px), linear-gradient(90deg, #1C1917 1px, transparent 1px);
    background-size: 40px 40px;
  }
  header, main { max-width: 64rem; margin: 0 auto; padding: 0 1.5rem; }
  header { display: flex; align-items: center; justify-content: space-between; height: 4rem; }
  .brand { display: flex; align-items: center; gap: .6rem; color: #fff; font-weight: 600; text-decoration: none; }
  nav { display: flex; gap: 1.5rem; }
  nav a { color: #A8A29E; text-decoration: none; }
  nav a:hover { color: #fff; }
  main { padding-top: 6rem; padding-bottom: 6rem; }
  .eyebrow { color: #F6821F; font-weight: 500; margin: 0 0 1rem; }
  h1 { font-size: clamp(2.25rem, 6vw, 3.75rem); line-height: 1.1; margin: 0 0 1.25rem; color: #fff; max-width: 18ch; text-wrap: balance; }
  .lead { color: #A8A29E; font-size: 1.125rem; max-width: 40rem; margin: 0 0 2rem; }
  .actions { display: flex; flex-wrap: wrap; gap: .75rem; }
  .button { display: inline-block; padding: .65rem 1.1rem; border-radius: .5rem; text-decoration: none; font-weight: 500; }
  .primary { background: #C2410C; color: #fff; }
  .primary:hover { background: #9A3412; }
  .secondary { border: 1px solid #44403C; color: #E7E5E4; }
  .secondary:hover { border-color: #78716C; }
  pre { margin: 4rem 0 0; padding: 1.25rem; background: #1C1917; border: 1px solid #292524; border-radius: .75rem; overflow-x: auto; color: #D6D3D1; font-size: .875rem; }
  pre span { color: #F6821F; }
</style>
</head>
<body>
<header>
  <a class="brand" href="/">${logo}Relaywave</a>
  <nav aria-label="Main">
    <a href="/blog">Blog</a>
    <a href="/changelog">Changelog</a>
  </nav>
</header>
<main>
  <p class="eyebrow">Webhook delivery infrastructure</p>
  <h1>Send webhooks your customers can rely on</h1>
  <p class="lead">Relaywave queues, signs and retries every webhook you send, and shows you each delivery attempt. One API call per event.</p>
  <div class="actions">
    <a class="button primary" href="/changelog">See what's new</a>
    <a class="button secondary" href="/blog">Read the blog</a>
  </div>
<pre><span>$</span> curl -X POST https://api.relaywave.dev/v1/messages \\
    -H "Authorization: Bearer $RELAYWAVE_API_KEY" \\
    -d '{"eventType": "invoice.paid", "payload": {"id": "inv_42"}}'</pre>
</main>
</body>
</html>`;
