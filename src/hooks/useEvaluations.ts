import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { createNotification } from "@/hooks/useNotifications";

export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  sort_order: number;
}

export interface Evaluation {
  id: string;
  event_id: string | null;
  referee_id: string;
  evaluator_id: string | null;
  total_score: number | null;
  status: "draft" | "submitted" | "reviewed";
  notes: string | null;
  created_at: string;
  submitted_at: string | null;
  event?: {
    id: string;
    name: string;
    start_date: string | null;
    end_date: string | null;
    location: string | null;
  } | null;
  referee?: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  } | null;
  evaluator?: {
    id: string;
    full_name: string;
  } | null;
}

export interface EvaluationScore {
  id: string;
  evaluation_id: string;
  criteria_id: string;
  score: number;
  notes: string | null;
  criteria?: EvaluationCriteria;
}

export function useEvaluationCriteria() {
  return useQuery({
    queryKey: ["evaluation-criteria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_criteria")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      return data as EvaluationCriteria[];
    },
  });
}

export function useEvaluations(status?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["evaluations", status],
    queryFn: async () => {
      let query = supabase
        .from("evaluations")
        .select("*")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) return [] as Evaluation[];

      // Fetch related data separately
      const eventIds = [...new Set(data.filter(e => e.event_id).map(e => e.event_id!))];
      const refereeIds = [...new Set(data.map(e => e.referee_id))];
      const evaluatorIds = [...new Set(data.filter(e => e.evaluator_id).map(e => e.evaluator_id!))];

      const [eventsRes, refereesRes, evaluatorsRes] = await Promise.all([
        eventIds.length > 0
          ? supabase.from("events").select("id, name, start_date, end_date, location").in("id", eventIds)
          : { data: [] },
        supabase.from("profiles").select("id, full_name, profile_photo_url").in("id", refereeIds),
        evaluatorIds.length > 0
          ? supabase.from("profiles").select("id, full_name").in("id", evaluatorIds)
          : { data: [] },
      ]);

      const eventMap = new Map((eventsRes.data || []).map(e => [e.id, e]));
      const refereeMap = new Map((refereesRes.data || []).map(r => [r.id, r]));
      const evaluatorMap = new Map((evaluatorsRes.data || []).map(e => [e.id, e]));

      return data.map(evaluation => ({
        ...evaluation,
        event: evaluation.event_id ? eventMap.get(evaluation.event_id) || null : null,
        referee: refereeMap.get(evaluation.referee_id) || null,
        evaluator: evaluation.evaluator_id ? evaluatorMap.get(evaluation.evaluator_id) || null : null,
      })) as Evaluation[];
    },
    enabled: !!user,
  });
}

export function useEvaluation(id: string) {
  return useQuery({
    queryKey: ["evaluation", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Fetch related data
      const [eventRes, refereeRes, evaluatorRes] = await Promise.all([
        data.event_id
          ? supabase.from("events").select("id, name, start_date, end_date, location").eq("id", data.event_id).single()
          : { data: null },
        supabase.from("profiles").select("id, full_name, profile_photo_url").eq("id", data.referee_id).single(),
        data.evaluator_id
          ? supabase.from("profiles").select("id, full_name").eq("id", data.evaluator_id).single()
          : { data: null },
      ]);

      return {
        ...data,
        event: eventRes.data || null,
        referee: refereeRes.data || null,
        evaluator: evaluatorRes.data || null,
      } as Evaluation;
    },
    enabled: !!id,
  });
}

export function useEvaluationScores(evaluationId: string) {
  return useQuery({
    queryKey: ["evaluation-scores", evaluationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_scores")
        .select(`
          *,
          criteria:evaluation_criteria(*)
        `)
        .eq("evaluation_id", evaluationId);

      if (error) throw error;
      return data as EvaluationScore[];
    },
    enabled: !!evaluationId,
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      event_id: string;
      referee_id: string;
      evaluator_id: string;
    }) => {
      const { data: evaluation, error } = await supabase
        .from("evaluations")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return evaluation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
    },
  });
}

export function useSaveEvaluationScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      evaluationId,
      scores,
    }: {
      evaluationId: string;
      scores: { criteria_id: string; score: number; notes?: string }[];
    }) => {
      // Delete existing scores first
      await supabase
        .from("evaluation_scores")
        .delete()
        .eq("evaluation_id", evaluationId);

      // Insert new scores
      const { error } = await supabase
        .from("evaluation_scores")
        .insert(
          scores.map((s) => ({
            evaluation_id: evaluationId,
            criteria_id: s.criteria_id,
            score: s.score,
            notes: s.notes || null,
          }))
        );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["evaluation-scores", variables.evaluationId],
      });
    },
  });
}

export function useSubmitEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      evaluationId,
      totalScore,
      notes,
      refereeId,
    }: {
      evaluationId: string;
      totalScore: number;
      notes?: string;
      refereeId: string;
    }) => {
      const { error } = await supabase
        .from("evaluations")
        .update({
          status: "submitted",
          total_score: totalScore,
          notes: notes || null,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", evaluationId);

      if (error) throw error;
      return { refereeId, totalScore };
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });

      // Create notification for evaluated referee
      await createNotification({
        userId: data.refereeId,
        type: "evaluation",
        action: "submitted",
        title: "Evaluasi Baru",
        message: `Anda telah menerima evaluasi dengan skor ${data.totalScore}.`,
        entityType: "evaluations",
        entityId: variables.evaluationId,
      });
    },
  });
}

// Get events that can be evaluated (completed events with assigned referees)
export function useEvaluatableEvents() {
  return useQuery({
    queryKey: ["evaluatable-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, start_date, end_date, location")
        .eq("status", "SELESAI")
        .is("deleted_at", null)
        .order("start_date", { ascending: false });

      if (error) throw error;

      // Fetch assignments for these events
      const eventIds = data.map(e => e.id);
      const { data: assignments } = await supabase
        .from("event_assignments")
        .select("event_id, referee_id, status")
        .in("event_id", eventIds)
        .eq("status", "confirmed");

      // Fetch referee profiles
      const refereeIds = [...new Set((assignments || []).map(a => a.referee_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, profile_photo_url")
        .in("id", refereeIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return data.map(event => ({
        ...event,
        event_assignments: (assignments || [])
          .filter(a => a.event_id === event.id)
          .map(a => ({
            ...a,
            referee: profileMap.get(a.referee_id) || null,
          })),
      }));
    },
  });
}
