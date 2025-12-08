import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();
    
    // Extract org IDs from body if they are being updated
    const { organization_ids, ...personData } = body;

    // 1. Update Person
    const { data: person, error: personError } = await supabase
      .from('people')
      .update(personData)
      .eq('id', id)
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

    // Delete person (cascading deletes should handle relations if configured, 
    // but we can manually delete from join table first to be safe if not)
    
    const { error } = await supabase
      .from('people')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting person:', error);
    return NextResponse.json({ error: 'Failed to delete person' }, { status: 500 });
  }
}
