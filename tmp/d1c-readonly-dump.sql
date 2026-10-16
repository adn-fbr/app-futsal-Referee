


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'referee'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  
  -- Default role is referee
  insert into public.user_roles (user_id, role)
  values (new.id, 'referee');
  
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."event_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "referee_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'referee'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_assignments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'declined'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."event_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "date" "date" NOT NULL,
    "location" "text",
    "category" "text",
    "status" "text" DEFAULT 'upcoming'::"text",
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "events_status_check" CHECK (("status" = ANY (ARRAY['upcoming'::"text", 'ongoing'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."honors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referee_id" "uuid" NOT NULL,
    "event_id" "uuid",
    "amount" integer NOT NULL,
    "notes" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "honors_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'verified'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."honors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "birth_date" "date",
    "afk_origin" "text",
    "occupation" "text",
    "license_level" "text",
    "profile_photo_url" "text",
    "license_photo_url" "text",
    "ktp_photo_url" "text",
    "is_profile_complete" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_license_level_check" CHECK (("license_level" = ANY (ARRAY['level_1'::"text", 'level_2'::"text", 'level_3'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referee_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referee_id" "uuid" NOT NULL,
    "reviewer_name" "text",
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "referee_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."referee_reviews" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."referee_review_stats" WITH ("security_invoker"='true') AS
 SELECT "referee_id",
    ("count"(*))::integer AS "total_reviews",
    "round"("avg"("rating"), 1) AS "avg_rating"
   FROM "public"."referee_reviews"
  GROUP BY "referee_id";


ALTER VIEW "public"."referee_review_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."event_assignments"
    ADD CONSTRAINT "event_assignments_event_id_referee_id_key" UNIQUE ("event_id", "referee_id");



ALTER TABLE ONLY "public"."event_assignments"
    ADD CONSTRAINT "event_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."honors"
    ADD CONSTRAINT "honors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referee_reviews"
    ADD CONSTRAINT "referee_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



CREATE OR REPLACE TRIGGER "update_event_assignments_updated_at" BEFORE UPDATE ON "public"."event_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_events_updated_at" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_honors_updated_at" BEFORE UPDATE ON "public"."honors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."event_assignments"
    ADD CONSTRAINT "event_assignments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_assignments"
    ADD CONSTRAINT "event_assignments_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."honors"
    ADD CONSTRAINT "honors_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."honors"
    ADD CONSTRAINT "honors_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."honors"
    ADD CONSTRAINT "honors_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referee_reviews"
    ADD CONSTRAINT "referee_reviews_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can create events" ON "public"."events" FOR INSERT WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can delete events" ON "public"."events" FOR DELETE USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can manage assignments" ON "public"."event_assignments" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can manage roles" ON "public"."user_roles" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can update all honors" ON "public"."honors" FOR UPDATE USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can update all profiles" ON "public"."profiles" FOR UPDATE USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can update events" ON "public"."events" FOR UPDATE USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can view all assignments" ON "public"."event_assignments" FOR SELECT USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can view all honors" ON "public"."honors" FOR SELECT USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can view all roles" ON "public"."user_roles" FOR SELECT USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Anyone can submit reviews" ON "public"."referee_reviews" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can view reviews" ON "public"."referee_reviews" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Everyone can view events" ON "public"."events" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Public can view referee profiles" ON "public"."profiles" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Referees can create their own honors" ON "public"."honors" FOR INSERT WITH CHECK (("auth"."uid"() = "referee_id"));



CREATE POLICY "Referees can delete their own draft honors" ON "public"."honors" FOR DELETE USING ((("auth"."uid"() = "referee_id") AND ("status" = 'draft'::"text")));



CREATE POLICY "Referees can update their own draft honors" ON "public"."honors" FOR UPDATE USING ((("auth"."uid"() = "referee_id") AND ("status" = 'draft'::"text")));



CREATE POLICY "Referees can view their own assignments" ON "public"."event_assignments" FOR SELECT USING (("auth"."uid"() = "referee_id"));



CREATE POLICY "Referees can view their own honors" ON "public"."honors" FOR SELECT USING (("auth"."uid"() = "referee_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."event_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."honors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referee_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."event_assignments" TO "anon";
GRANT ALL ON TABLE "public"."event_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."event_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."honors" TO "anon";
GRANT ALL ON TABLE "public"."honors" TO "authenticated";
GRANT ALL ON TABLE "public"."honors" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."referee_reviews" TO "anon";
GRANT ALL ON TABLE "public"."referee_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."referee_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."referee_review_stats" TO "anon";
GRANT ALL ON TABLE "public"."referee_review_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."referee_review_stats" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







