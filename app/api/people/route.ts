import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Supabase query syntax for many-to-many is a bit specific with join tables.
    // We want people and their organizations.
    // This syntax '*, organizations:people_organizations(organization:organizations(*))'
    // joins people -> people_organizations -> organizations

    const { data, error } = await supabase
      .from('people')
      .select('*, organizations:people_organizations(role, organization:organizations(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten structure slightly for frontend convenience if needed
    const formattedData = data.map((p: { organizations: { role: string; organization: object }[] }) => ({
      ...p,
      organizations: p.organizations.map((po: { role: string; organization: object }) => ({
        ...po.organization,
        role: po.role // Attach role to the org object for display
      }))
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching people:', error);
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract org IDs from body
    const { organization_ids, ...personData } = body;

    // 1. Create Person with user_id
    const { data: person, error: personError } = await supabase
      .from('people')
      .insert({ ...personData, user_id: user.id })
      .select()
      .single();

    if (personError) throw personError;

    // 2. Link Organizations (if any)
    if (organization_ids && Array.isArray(organization_ids) && organization_ids.length > 0) {
      const links = organization_ids.map((orgId: string) => ({
        person_id: person.id,
        organization_id: orgId
      }));

      const { error: linkError } = await supabase
        .from('people_organizations')
        .insert(links);

      if (linkError) {
        console.error('Error linking organizations:', linkError);
        // Consider rollback or partial success warning
      }
    }

    return NextResponse.json(person);
  } catch (error) {
    console.error('Error creating person:', error);
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 });
  }
}
