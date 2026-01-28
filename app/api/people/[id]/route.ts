import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract org IDs from body if they are being updated
    const { organization_ids, ...personData } = body;

    // 1. Update Person (only if owned by user)
    const { data: person, error: personError } = await supabase
      .from('people')
      .update(personData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (personError) throw personError;

    // 2. Update Organizations (if provided)
    // This is a full replacement of links strategy for simplicity
    if (organization_ids && Array.isArray(organization_ids)) {
      // Remove existing links
      const { error: deleteError } = await supabase
        .from('people_organizations')
        .delete()
        .eq('person_id', id);

      if (deleteError) throw deleteError;

      // Add new links
      if (organization_ids.length > 0) {
        const links = organization_ids.map((orgId: string) => ({
          person_id: id,
          organization_id: orgId
        }));

        const { error: linkError } = await supabase
          .from('people_organizations')
          .insert(links);

        if (linkError) throw linkError;
      }
    }

    return NextResponse.json(person);
  } catch (error) {
    console.error('Error updating person:', error);
    return NextResponse.json({ error: 'Failed to update person' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete person (only if owned by user)
    const { error } = await supabase
      .from('people')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting person:', error);
    return NextResponse.json({ error: 'Failed to delete person' }, { status: 500 });
  }
}
