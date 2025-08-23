| create_statement                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CREATE TABLE public.categories (
  id bigint NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);                                                                                                                                                                                                                                                                              |
| CREATE TABLE public.comment_likes (
  id bigint NOT NULL DEFAULT nextval('comment_likes_id_seq'::regclass),
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);                                                                                                                                                                                                                                                               |
| CREATE TABLE public.follower_profiles (
  id bigint,
  follower_id uuid,
  following_id uuid,
  created_at timestamp with time zone,
  follower_username text,
  follower_display_name text,
  follower_avatar_key text,
  following_username text,
  following_display_name text,
  following_avatar_key text
);                                                                                                                                                                     |
| CREATE TABLE public.follows (
  id bigint NOT NULL DEFAULT nextval('follows_id_seq'::regclass),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);                                                                                                                                                                                                                                                                     |
| CREATE TABLE public.likes (
  id bigint NOT NULL DEFAULT nextval('likes_id_seq'::regclass),
  recipe_id bigint NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);                                                                                                                                                                                                                                                                              |
| CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text,
  display_name text,
  avatar_key text,
  created_at timestamp with time zone DEFAULT now(),
  bio text,
  follower_count integer DEFAULT 0,
  following_count integer DEFAULT 0
);                                                                                                                                                                                                                               |
| CREATE TABLE public.recipe_categories (
  recipe_id bigint NOT NULL,
  category_id bigint NOT NULL
);                                                                                                                                                                                                                                                                                                                                                                                 |
| CREATE TABLE public.recipe_comment_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comment_id uuid,
  image_key text NOT NULL,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now()
);                                                                                                                                                                                                                                                                    |
| CREATE TABLE public.recipe_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipe_id bigint,
  user_id uuid,
  body text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  parent_id uuid,
  is_edited boolean DEFAULT false,
  edited_at timestamp with time zone,
  like_count integer DEFAULT 0
);                                                                                                                                                       |
| CREATE TABLE public.recipe_comments_with_author (
  id uuid,
  recipe_id bigint,
  user_id uuid,
  parent_id uuid,
  body text,
  is_edited boolean,
  edited_at timestamp with time zone,
  like_count integer,
  created_at timestamp with time zone,
  username text,
  display_name text,
  avatar_key text,
  is_liked_by_user boolean
);                                                                                                                                        |
| CREATE TABLE public.recipe_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipe_id bigint,
  image_key text NOT NULL,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now()
);                                                                                                                                                                                                                                                                           |
| CREATE TABLE public.recipe_ingredients (
  id bigint NOT NULL DEFAULT nextval('recipe_ingredients_id_seq'::regclass),
  recipe_id bigint,
  position integer NOT NULL,
  text text NOT NULL
);                                                                                                                                                                                                                                                                                        |
| CREATE TABLE public.recipe_steps (
  id bigint NOT NULL DEFAULT nextval('recipe_steps_id_seq'::regclass),
  recipe_id bigint,
  position integer NOT NULL,
  text text NOT NULL
);                                                                                                                                                                                                                                                                                                    |
| CREATE TABLE public.recipes (
  id bigint NOT NULL DEFAULT nextval('recipes_id_seq'::regclass),
  author_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  summary text,
  cover_image_key text,
  is_public boolean DEFAULT false,
  like_count integer DEFAULT 0,
  search_vector tsvector,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  difficulty text,
  prep_time integer,
  cook_time integer
); |
| CREATE TABLE public.saves (
  id bigint NOT NULL DEFAULT nextval('saves_id_seq'::regclass),
  recipe_id bigint NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);                                                                                                                                                                                                                                                                              |