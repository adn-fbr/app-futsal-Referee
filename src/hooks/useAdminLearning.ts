import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LearningMaterial } from "./useLearning";

export interface LearningMaterialInput {
  title: string;
  description?: string;
  category: string;
  law_number?: string;
  content?: string;
  content_type?: string;
  content_url?: string;
  video_url?: string;
  pdf_url?: string;
  thumbnail_url?: string;
  duration_minutes?: number;
  difficulty_level?: string;
  sort_order?: number;
  is_published?: boolean;
}

// Admin: Get all materials (including unpublished)
export const useAdminLearningMaterials = (filters?: {
  category?: string;
  difficulty?: string;
  search?: string;
  is_published?: boolean;
}) => {
  return useQuery({
    queryKey: ["admin-learning-materials", filters],
    queryFn: async () => {
      let query = supabase
        .from("learning_materials")
        .select("*")
        .order("law_number", { ascending: true })
        .order("sort_order", { ascending: true });

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.difficulty) {
        query = query.eq("difficulty_level", filters.difficulty);
      }
      if (filters?.search) {
        query = query.ilike("title", `%${filters.search}%`);
      }
      if (filters?.is_published !== undefined) {
        query = query.eq("is_published", filters.is_published);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LearningMaterial[];
    },
  });
};

// Create material
export const useCreateMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LearningMaterialInput) => {
      const { data, error } = await supabase
        .from("learning_materials")
        .insert({
          title: input.title,
          description: input.description,
          category: input.category,
          law_number: input.law_number,
          content: input.content,
          content_type: input.content_type || "document",
          content_url: input.content_url,
          video_url: input.video_url,
          pdf_url: input.pdf_url,
          thumbnail_url: input.thumbnail_url,
          duration_minutes: input.duration_minutes,
          difficulty_level: input.difficulty_level || "basic",
          sort_order: input.sort_order || 0,
          is_published: input.is_published ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-learning-materials"] });
      queryClient.invalidateQueries({ queryKey: ["learning-materials"] });
    },
  });
};

// Update material
export const useUpdateMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: LearningMaterialInput & { id: string }) => {
      const { data, error } = await supabase
        .from("learning_materials")
        .update({
          title: input.title,
          description: input.description,
          category: input.category,
          law_number: input.law_number,
          content: input.content,
          content_type: input.content_type,
          content_url: input.content_url,
          video_url: input.video_url,
          pdf_url: input.pdf_url,
          thumbnail_url: input.thumbnail_url,
          duration_minutes: input.duration_minutes,
          difficulty_level: input.difficulty_level,
          sort_order: input.sort_order,
          is_published: input.is_published,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-learning-materials"] });
      queryClient.invalidateQueries({ queryKey: ["learning-materials"] });
      queryClient.invalidateQueries({ queryKey: ["learning-material"] });
    },
  });
};

// Delete material
export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("learning_materials")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-learning-materials"] });
      queryClient.invalidateQueries({ queryKey: ["learning-materials"] });
    },
  });
};

// Toggle publish status
export const useTogglePublish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      is_published,
    }: {
      id: string;
      is_published: boolean;
    }) => {
      const { error } = await supabase
        .from("learning_materials")
        .update({ is_published })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-learning-materials"] });
      queryClient.invalidateQueries({ queryKey: ["learning-materials"] });
    },
  });
};
