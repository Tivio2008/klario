import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rimtradxzxrdpxyptisy.supabase.co';
const SERVICE_ROLE_KEY = process.argv[2];

if (!SERVICE_ROLE_KEY) {
  console.error('Usage: node scripts/setup-storage.mjs <service-role-key>');
  console.error('Get it from: Supabase dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function setup() {
  console.log('Creating site-media bucket...');

  const { data, error } = await supabase.storage.createBucket('site-media', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    fileSizeLimit: 10485760, // 10MB
  });

  if (error && error.message !== 'The resource already exists') {
    console.error('Failed to create bucket:', error.message);
    process.exit(1);
  }

  console.log('✓ Bucket created (or already exists)');

  // Verify public access works
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucket = buckets?.find(b => b.id === 'site-media');
  if (bucket) {
    console.log(`✓ Bucket "site-media" is ${bucket.public ? 'public' : 'private'}`);
  }

  console.log('\n✓ Supabase Storage setup complete!');
  console.log('  Users can now upload photos during site creation.');
}

setup().catch(console.error);
