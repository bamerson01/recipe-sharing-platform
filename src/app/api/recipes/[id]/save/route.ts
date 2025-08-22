import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getServerSupabase();
    const { id } = await params;

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ saved: false });
    }

    const recipeId = parseInt(id);
    if (isNaN(recipeId)) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
    }

    // Check if user saved this recipe
    const { data: save, error: saveError } = await supabase
      .from('saves')
      .select('id')
      .eq('recipe_id', recipeId)
      .eq('user_id', user.id)
      .single();

    if (saveError && saveError.code !== 'PGRST116') {
      console.error('Error checking save status:', saveError);
      return NextResponse.json({ error: 'Error checking save status' }, { status: 500 });
    }

    return NextResponse.json({
      saved: !!save
    });

  } catch (error) {
    console.error('Unexpected error checking save status:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getServerSupabase();
    const { id } = await params;

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipeId = parseInt(id);
    if (isNaN(recipeId)) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
    }

    // Check if recipe exists
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Check if user already saved this recipe
    const { data: existingSave, error: saveCheckError } = await supabase
      .from('saves')
      .select('id')
      .eq('recipe_id', recipeId)
      .eq('user_id', user.id)
      .single();

    if (saveCheckError && saveCheckError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is expected if not saved
      return NextResponse.json({ error: 'Error checking save status' }, { status: 500 });
    }

    if (existingSave) {
      // Unsave: Remove the save
      const { error: deleteError } = await supabase
        .from('saves')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error removing save:', deleteError);
        return NextResponse.json({ error: 'Failed to remove save' }, { status: 500 });
      }

      return NextResponse.json({
        saved: false,
        message: 'Recipe unsaved successfully'
      });
    } else {
      // Save: Add the save
      const { error: insertError } = await supabase
        .from('saves')
        .insert({
          recipe_id: recipeId,
          user_id: user.id,
        });

      if (insertError) {
        console.error('Error adding save:', insertError);
        return NextResponse.json({ error: 'Failed to add save' }, { status: 500 });
      }

      return NextResponse.json({
        saved: true,
        message: 'Recipe saved successfully'
      });
    }

  } catch (error) {
    console.error('Unexpected error in save toggle:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
