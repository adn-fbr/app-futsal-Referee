import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RefereeWithStats {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  license_level: string | null;
  afk_origin: string | null;
  avg_rating: number;
  total_reviews: number;
}

interface Review {
  id: string;
  referee_id: string;
  reviewer_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function usePublicReferees(search?: string, afkFilter?: string) {
  return useQuery({
    queryKey: ["public-referees", search, afkFilter],
    queryFn: async (): Promise<RefereeWithStats[]> => {
      // Public-safe referees (server filters approved + complete + wasit)
      const { data: referees, error: refError } = await supabase
        .rpc("get_public_referees", {
          _search: search || null,
          _is_active: true,
        });

      if (refError) throw refError;

      // Filter by afk_origin if needed
      let filteredReferees = referees || [];
      if (afkFilter && afkFilter !== "all") {
        filteredReferees = filteredReferees.filter(
          (r: { afk_origin: string | null }) => r.afk_origin === afkFilter
        );
      }

      // Get review stats for all referees
      const refereeIds = filteredReferees.map((r: { id: string }) => r.id);
      
      if (refereeIds.length === 0) return [];

      const { data: stats } = await supabase
        .from("referee_review_stats")
        .select("*")
        .in("referee_id", refereeIds);

      const statsMap = new Map(
        (stats || []).map((s) => [s.referee_id, s])
      );

      return filteredReferees.map((referee: { 
        id: string; 
        full_name: string; 
        profile_photo_url: string | null; 
        license_level: string | null; 
        afk_origin: string | null;
      }) => {
        const refStats = statsMap.get(referee.id);
        return {
          id: referee.id,
          full_name: referee.full_name,
          profile_photo_url: referee.profile_photo_url,
          license_level: referee.license_level,
          afk_origin: referee.afk_origin,
          avg_rating: refStats?.avg_rating ? Number(refStats.avg_rating) : 0,
          total_reviews: refStats?.total_reviews || 0,
        };
      });
    },
  });
}

export function useRefereeForReview(id: string) {
  return useQuery({
    queryKey: ["referee-for-review", id],
    queryFn: async () => {
      const { data: rows, error: profileError } = await supabase
        .rpc("get_public_referee", {
          _referee_id: id,
        });

      if (profileError) throw profileError;

      const profile = rows?.[0];
      if (!profile) throw new Error("Wasit tidak ditemukan");

      const { data: stats } = await supabase
        .from("referee_review_stats")
        .select("*")
        .eq("referee_id", id)
        .maybeSingle();

      return {
        ...profile,
        avg_rating: stats?.avg_rating ? Number(stats.avg_rating) : 0,
        total_reviews: stats?.total_reviews || 0,
      };
    },
    enabled: !!id,
  });
}

export function useRefereeReviews(refereeId: string) {
  return useQuery({
    queryKey: ["referee-reviews", refereeId],
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase
        .from("referee_reviews")
        .select("*")
        .eq("referee_id", refereeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!refereeId,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      refereeId,
      rating,
      reviewerName,
      comment,
    }: {
      refereeId: string;
      rating: number;
      reviewerName?: string;
      comment?: string;
    }) => {
      const { data, error } = await supabase
        .from("referee_reviews")
        .insert({
          referee_id: refereeId,
          rating,
          reviewer_name: reviewerName || null,
          comment: comment || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["public-referees"] });
      queryClient.invalidateQueries({
        queryKey: ["referee-for-review", variables.refereeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["referee-reviews", variables.refereeId],
      });
    },
  });
}

export function useAfkOrigins() {
  return useQuery({
    queryKey: ["afk-origins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_public_referees", {
          _search: null,
          _is_active: true,
        });

      if (error) throw error;

      // Get unique afk_origin values
      const uniqueOrigins = [
        ...new Set(
          (data || [])
            .map((d: { afk_origin: string | null }) => d.afk_origin)
            .filter(Boolean)
        ),
      ] as string[];

      return uniqueOrigins.sort();
    },
  });
}
