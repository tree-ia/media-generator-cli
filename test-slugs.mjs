import { config, higgsfield } from '@higgsfield/client/v2';

const key = process.env.HF_API_KEY;
const secret = process.env.HF_API_SECRET;

if (!key || !secret) {
  console.log('Set HF_API_KEY and HF_API_SECRET');
  process.exit(1);
}

config({ credentials: `${key}:${secret}` });

const slugs = [
  'higgsfield-ai/nano-banana-2/text-to-image',
  'higgsfield/nano-banana-2/text-to-image',
  'nano-banana-2/text-to-image',
  'nano-banana-2',
  'nano_banana_2',
  'google/gemini-2.5-flash-image/text-to-image',
  'higgsfield-ai/soul/standard',
  'higgsfield-ai/soul/text-to-image',
  'soul/text-to-image',
  'flux-pro/kontext/max/text-to-image',
  'bytedance/seedream/v4/text-to-image',
];

const input = { prompt: 'test', resolution: '0.5K', aspect_ratio: '1:1' };

for (const slug of slugs) {
  try {
    const res = await higgsfield.subscribe(slug, { input, withPolling: false });
    console.log(`OK ${slug} -> ${res.status} (${res.request_id})`);
  } catch (e) {
    const status = e.response?.status || e.statusCode || 'unknown';
    const msg = e.response?.data?.detail || e.responseData?.detail || e.message || '';
    console.log(`XX ${slug} -> ${status}: ${String(msg).slice(0, 100)}`);
  }
}
