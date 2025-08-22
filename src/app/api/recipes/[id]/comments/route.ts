import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/recipes/[id]/comments - Get all comments for a recipe
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const recipeId = parseInt(id);
    
    if (isNaN(recipeId)) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
    }

    const supabase = await getServerSupabase();

    // Check if recipe exists and is accessible
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id, is_public, author_id')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Check if user can access this recipe
    const { data: { user } } = await supabase.auth.getUser();
    if (!recipe.is_public && recipe.author_id !== user?.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch comments with author information
    const { data: comments, error } = await supabase
      .from('recipe_comments')
      .select(`
        id,
        recipe_id,
        user_id,
        parent_id,
        body,
        is_edited,
        edited_at,
        like_count,
        created_at,
        author:profiles!inner(
          id,
          username,
          display_name,
          avatar_key
        )
      `)
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    // Check if current user has liked each comment
    if (user) {
      const commentIds = comments?.map(c => c.id) || [];
      const { data: userLikes } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds);

      const likedCommentIds = new Set(userLikes?.map(l => l.comment_id) || []);
      
      // Add is_liked flag to each comment
      const commentsWithLikes = comments?.map(comment => ({
        ...comment,
        is_liked: likedCommentIds.has(comment.id),
        author: Array.isArray(comment.author) ? comment.author[0] : comment.author
      }));

      return NextResponse.json({ comments: commentsWithLikes || [] });
    }

    // Transform author data if it's an array
    const transformedComments = comments?.map(comment => ({
      ...comment,
      is_liked: false,
      author: Array.isArray(comment.author) ? comment.author[0] : comment.author
    }));

    return NextResponse.json({ comments: transformedComments || [] });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST /api/recipes/[id]/comments - Create a new comment
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const recipeId = parseInt(id);
    
    if (isNaN(recipeId)) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
    }

    const supabase = await getServerSupabase();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { text, parentId } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    // Check if recipe exists and is accessible
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id, is_public, author_id')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (!recipe.is_public && recipe.author_id !== user.id) {
      return NextResponse.json({ error: 'Cannot comment on private recipe' }, { status: 403 });
    }

    // Create the comment
    const { data: newComment, error: insertError } = await supabase
      .from('recipe_comments')
      .insert({
        recipe_id: recipeId,
        user_id: user.id,
        parent_id: parentId || null,
        body: text.trim()
      })
      .select(`
        id,
        recipe_id,
        user_id,
        parent_id,
        body,
        is_edited,
        edited_at,
        like_count,
        created_at,
        author:profiles!inner(
          id,
          username,
          display_name,
          avatar_key
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating comment:', insertError);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    // Transform author data if it's an array
    const transformedComment = {
      ...newComment,
      is_liked: false,
      author: Array.isArray(newComment.author) ? newComment.author[0] : newComment.author
    };

    return NextResponse.json({ comment: transformedComment }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// PATCH /api/recipes/[id]/comments - Update a comment
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const supabase = await getServerSupabase();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    // Update the comment (RLS will ensure only owner can update)
    const { data: updatedComment, error: updateError } = await supabase
      .from('recipe_comments')
      .update({ body: text.trim() })
      .eq('id', commentId)
      .eq('user_id', user.id) // Extra safety check
      .select(`
        id,
        recipe_id,
        user_id,
        parent_id,
        body,
        is_edited,
        edited_at,
        like_count,
        created_at,
        author:profiles!inner(
          id,
          username,
          display_name,
          avatar_key
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating comment:', updateError);
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
    }

    if (!updatedComment) {
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 });
    }

    // Transform author data if it's an array
    const transformedComment = {
      ...updatedComment,
      is_liked: false,
      author: Array.isArray(updatedComment.author) ? updatedComment.author[0] : updatedComment.author
    };

    return NextResponse.json({ comment: transformedComment });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE /api/recipes/[id]/comments - Delete a comment
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const recipeId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const supabase = await getServerSupabase();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns the comment or the recipe
    const { data: recipe } = await supabase
      .from('recipes')
      .select('author_id')
      .eq('id', recipeId)
      .single();

    // Delete the comment (RLS will handle authorization)
    const { error: deleteError } = await supabase
      .from('recipe_comments')
      .delete()
      .eq('id', commentId)
      .eq('recipe_id', recipeId);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}