drop extension if exists "pg_net";


  create table "public"."share_links" (
    "id" uuid not null default gen_random_uuid(),
    "show_id" uuid not null,
    "token" text not null,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."share_links" enable row level security;


  create table "public"."shows" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text,
    "show_date" date,
    "inputs" jsonb not null default '{}'::jsonb,
    "results" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."shows" enable row level security;

CREATE UNIQUE INDEX share_links_pkey ON public.share_links USING btree (id);

CREATE INDEX share_links_show_id_idx ON public.share_links USING btree (show_id);

CREATE UNIQUE INDEX share_links_token_key ON public.share_links USING btree (token);

CREATE UNIQUE INDEX shows_pkey ON public.shows USING btree (id);

CREATE INDEX shows_user_id_idx ON public.shows USING btree (user_id);

alter table "public"."share_links" add constraint "share_links_pkey" PRIMARY KEY using index "share_links_pkey";

alter table "public"."shows" add constraint "shows_pkey" PRIMARY KEY using index "shows_pkey";

alter table "public"."share_links" add constraint "share_links_show_id_fkey" FOREIGN KEY (show_id) REFERENCES public.shows(id) ON DELETE CASCADE not valid;

alter table "public"."share_links" validate constraint "share_links_show_id_fkey";

alter table "public"."share_links" add constraint "share_links_token_key" UNIQUE using index "share_links_token_key";

alter table "public"."shows" add constraint "shows_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."shows" validate constraint "shows_user_id_fkey";

grant delete on table "public"."share_links" to "anon";

grant insert on table "public"."share_links" to "anon";

grant references on table "public"."share_links" to "anon";

grant select on table "public"."share_links" to "anon";

grant trigger on table "public"."share_links" to "anon";

grant truncate on table "public"."share_links" to "anon";

grant update on table "public"."share_links" to "anon";

grant delete on table "public"."share_links" to "authenticated";

grant insert on table "public"."share_links" to "authenticated";

grant references on table "public"."share_links" to "authenticated";

grant select on table "public"."share_links" to "authenticated";

grant trigger on table "public"."share_links" to "authenticated";

grant truncate on table "public"."share_links" to "authenticated";

grant update on table "public"."share_links" to "authenticated";

grant delete on table "public"."share_links" to "service_role";

grant insert on table "public"."share_links" to "service_role";

grant references on table "public"."share_links" to "service_role";

grant select on table "public"."share_links" to "service_role";

grant trigger on table "public"."share_links" to "service_role";

grant truncate on table "public"."share_links" to "service_role";

grant update on table "public"."share_links" to "service_role";

grant delete on table "public"."shows" to "anon";

grant insert on table "public"."shows" to "anon";

grant references on table "public"."shows" to "anon";

grant select on table "public"."shows" to "anon";

grant trigger on table "public"."shows" to "anon";

grant truncate on table "public"."shows" to "anon";

grant update on table "public"."shows" to "anon";

grant delete on table "public"."shows" to "authenticated";

grant insert on table "public"."shows" to "authenticated";

grant references on table "public"."shows" to "authenticated";

grant select on table "public"."shows" to "authenticated";

grant trigger on table "public"."shows" to "authenticated";

grant truncate on table "public"."shows" to "authenticated";

grant update on table "public"."shows" to "authenticated";

grant delete on table "public"."shows" to "service_role";

grant insert on table "public"."shows" to "service_role";

grant references on table "public"."shows" to "service_role";

grant select on table "public"."shows" to "service_role";

grant trigger on table "public"."shows" to "service_role";

grant truncate on table "public"."shows" to "service_role";

grant update on table "public"."shows" to "service_role";


  create policy "share_links_manage_own"
  on "public"."share_links"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.shows s
  WHERE ((s.id = share_links.show_id) AND (s.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM public.shows s
  WHERE ((s.id = share_links.show_id) AND (s.user_id = auth.uid())))));



  create policy "shows_delete_own"
  on "public"."shows"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "shows_insert_own"
  on "public"."shows"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "shows_select_own"
  on "public"."shows"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "shows_update_own"
  on "public"."shows"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



