const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ewwuzbdpipemphlyeprq.supabase.co',
  'sb_publishable_nwnR065R50sBeW8umN7H8w_nVIbPysE'
);

async function makeAdmin() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    if (!user) {
      console.log('No user logged in. Please log in first.');
      return;
    }

    console.log('Current user ID:', user.id);
    console.log('Current user email:', user.email);

    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      return;
    }

    console.log('Current profile:', profile);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error making user admin:', updateError);
    } else {
      console.log('✅ User made admin successfully!');
      console.log('You can now access the admin page at /admin');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

makeAdmin();