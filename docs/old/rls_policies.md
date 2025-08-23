| policy_statement                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CREATE POLICY "categories_read" ON public.categories FOR SELECT USING (true);                                                                                                                                                                                                                                                    |
| CREATE POLICY "Anyone can view comment likes" ON public.comment_likes FOR SELECT USING (true);                                                                                                                                                                                                                                   |
| CREATE POLICY "Users can like comments" ON public.comment_likes FOR INSERT WITH CHECK ((auth.uid() = user_id));                                                                                                                                                                                                                  |
| CREATE POLICY "Users can unlike comments" ON public.comment_likes FOR DELETE USING ((auth.uid() = user_id));                                                                                                                                                                                                                     |
| CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);                                                                                                                                                                                                                                               |
| CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK ((auth.uid() = follower_id));                                                                                                                                                                                                                    |
| CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING ((auth.uid() = follower_id));                                                                                                                                                                                                                              |
| CREATE POLICY "Anyone can view likes" ON public.likes FOR SELECT USING (true);                                                                                                                                                                                                                                                   |
| CREATE POLICY "Users can delete their own likes" ON public.likes FOR DELETE USING ((auth.uid() = user_id));                                                                                                                                                                                                                      |
| CREATE POLICY "Users can insert their own likes" ON public.likes FOR INSERT WITH CHECK ((auth.uid() = user_id));                                                                                                                                                                                                                 |
| CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));                                                                                                                                                                                                                                    |
| CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT WITH CHECK ((id = auth.uid()));                                                                                                                                                                                                                               |
| CREATE POLICY "profiles_read" ON public.profiles FOR SELECT USING (true);                                                                                                                                                                                                                                                        |
| CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);                                                                                                                                                                                                                                                  |
| CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING ((auth.uid() = id));                                                                                                                                                                                                                                         |
| CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE USING ((id = auth.uid()));                                                                                                                                                                                                                                    |
| CREATE POLICY "rc_read" ON public.recipe_categories FOR SELECT USING ((EXISTS ( SELECT 1
   FROM recipes r
  WHERE ((r.id = recipe_categories.recipe_id) AND (r.is_public OR (r.author_id = auth.uid()))))));                                                                                                                    |
| CREATE POLICY "rc_write" ON public.recipe_categories FOR ALL USING ((EXISTS ( SELECT 1
   FROM recipes r
  WHERE ((r.id = recipe_categories.recipe_id) AND (r.author_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM recipes r
  WHERE ((r.id = recipe_categories.recipe_id) AND (r.author_id = auth.uid())))));     |
| CREATE POLICY "Create comments on accessible recipes" ON public.recipe_comments FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM recipes r
  WHERE ((r.id = recipe_comments.recipe_id) AND ((r.is_public = true) OR (r.author_id = auth.uid())))))));                                               |
| CREATE POLICY "Delete own comments or comments on own recipes" ON public.recipe_comments FOR DELETE USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM recipes r
  WHERE ((r.id = recipe_comments.recipe_id) AND (r.author_id = auth.uid()))))));                                                                      |
| CREATE POLICY "Read comments on accessible recipes" ON public.recipe_comments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM recipes r
  WHERE ((r.id = recipe_comments.recipe_id) AND ((r.is_public = true) OR (r.author_id = auth.uid()))))));                                                                                   |
| CREATE POLICY "Update own comments" ON public.recipe_comments FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));                                                                                                                                                                                     |
| CREATE POLICY "ing_read" ON public.recipe_ingredients FOR SELECT USING ((EXISTS ( SELECT 1
   FROM recipes r
  WHERE ((r.id = recipe_ingredients.recipe_id) AND (r.is_public OR (r.author_id = auth.uid()))))));                                                                                                                 |
| CREATE POLICY "ing_write" ON public.recipe_ingredients FOR ALL USING ((EXISTS ( SELECT 1
   FROM recipes r
  WHERE ((r.id = recipe_ingredients.recipe_id) AND (r.author_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM recipes r
  WHERE ((r.id = recipe_ingredients.recipe_id) AND (r.author_id = auth.uid()))))); |
| CREATE POLICY "steps_read" ON public.recipe_steps FOR SELECT USING ((EXISTS ( SELECT 1
   FROM recipes r
  WHERE ((r.id = recipe_steps.recipe_id) AND (r.is_public OR (r.author_id = auth.uid()))))));                                                                                                                           |
| CREATE POLICY "steps_write" ON public.recipe_steps FOR ALL USING ((EXISTS ( SELECT 1
   FROM recipes r
  WHERE ((r.id = recipe_steps.recipe_id) AND (r.author_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM recipes r
  WHERE ((r.id = recipe_steps.recipe_id) AND (r.author_id = auth.uid())))));                 |
| CREATE POLICY "recipes_delete" ON public.recipes FOR DELETE USING ((author_id = auth.uid()));                                                                                                                                                                                                                                    |
| CREATE POLICY "recipes_insert" ON public.recipes FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));                                                                                                                                                                                                                  |
| CREATE POLICY "recipes_read" ON public.recipes FOR SELECT USING (((is_public = true) OR (author_id = auth.uid())));                                                                                                                                                                                                              |
| CREATE POLICY "recipes_update" ON public.recipes FOR UPDATE USING ((author_id = auth.uid()));                                                                                                                                                                                                                                    |
| CREATE POLICY "Users can delete their own saves" ON public.saves FOR DELETE USING ((auth.uid() = user_id));                                                                                                                                                                                                                      |
| CREATE POLICY "Users can insert their own saves" ON public.saves FOR INSERT WITH CHECK ((auth.uid() = user_id));                                                                                                                                                                                                                 |
| CREATE POLICY "Users can view their own saves" ON public.saves FOR SELECT USING ((auth.uid() = user_id));                                                                                                                                                                                                                        |