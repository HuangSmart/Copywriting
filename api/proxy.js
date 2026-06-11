export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const missing = [];
  if (!process.env.API_BASE_URL) missing.push('API_BASE_URL');
  if (!process.env.API_KEY) missing.push('API_KEY');
  if (missing.length > 0) {
    return res.status(500).json({ error: `Missing env vars: ${missing.join(', ')}. Set them in Vercel → Settings → Environment Variables.` });
  }

  const { productName, features } = req.body;
  if (!productName || !features) {
    return res.status(400).json({ error: 'Missing productName or features' });
  }

  const prompt = `You are a professional e-commerce copywriter. Write high-converting English product copy based on the following info.

Product Name: ${productName}
Key Features: ${features}

Generate the following sections in clean Markdown format:
1. **Product Title** - A compelling headline optimized for Amazon/Shopify
2. **Bullet Points** - 5 key selling points (benefit-driven, not just feature list)
3. **Product Description** - A persuasive 2-3 paragraph description using sensory language
4. **SEO Keywords** - 10 high-intent search terms

Make it ready to copy-paste into a store listing.`;

  try {
    const upstream = await fetch(`${process.env.API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8
      })
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).json({ error: `Upstream error: ${text}` });
    }

    const data = await upstream.json();
    return res.status(200).json({ content: data.choices?.[0]?.message?.content || '' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
