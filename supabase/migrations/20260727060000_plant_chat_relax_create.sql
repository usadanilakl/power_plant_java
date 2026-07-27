-- ============================================================================
-- Plant Chat — relax conversation-create RLS so PWA users (specifically
-- managers outside the plant) can start new conversations directly, without
-- requiring an admin to provision the channel first.
--
-- Access matrix update (was: admin-only for create/update/delete):
--   INSERT — any chat-eligible caller (ADMIN / PLANT / NAES / JPOWER / EMPLOYEE),
--            constrained to created_by = auth.uid() so people can only create
--            in their own name. Contractors remain excluded.
--   UPDATE — creator can rename / re-describe their OWN conversation.
--            ADMIN can update ANY conversation.
--   DELETE — ADMIN only (hard delete is still an admin-only operation; the
--            create-eligible user pool only uses archive-via-UPDATE for
--            takedown, and archive is expressed by setting archived_at, which
--            the creator-owned UPDATE policy already permits).
--
-- Idempotent: drops then recreates the affected policies.
-- ============================================================================

drop policy if exists plant_conv_admin_insert on public.plant_conversation;
create policy plant_conv_eligible_insert on public.plant_conversation
  for insert
  with check (
    public.jwt_is_chat_eligible()
    and created_by = auth.uid()
  );

drop policy if exists plant_conv_admin_update on public.plant_conversation;
-- Owner OR admin — self-service rename/archive for the creator, blanket update for admin.
create policy plant_conv_owner_or_admin_update on public.plant_conversation
  for update
  using (created_by = auth.uid() or public.jwt_is_admin())
  with check (created_by = auth.uid() or public.jwt_is_admin());

-- Delete policy stays admin-only; drop-and-recreate here just to give it a
-- consistent name alongside the others.
drop policy if exists plant_conv_admin_delete on public.plant_conversation;
create policy plant_conv_admin_delete on public.plant_conversation
  for delete
  using (public.jwt_is_admin());
