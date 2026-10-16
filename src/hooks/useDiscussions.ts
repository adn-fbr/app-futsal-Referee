import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { createNotification } from "@/hooks/useNotifications";

export interface DiscussionTopic {
  id: string;
  title: string;
  content: string;
  category: string;
  law_reference: string | null;
  author_id: string;
  is_pinned: boolean;
  is_locked: boolean;
  views_count: number;
  replies_count: number;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  } | null;
}

export interface DiscussionReply {
  id: string;
  topic_id: string;
  parent_reply_id: string | null;
  author_id: string;
  content: string;
  is_solution: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  } | null;
}

export const DISCUSSION_CATEGORIES = [
  { value: "lotg", label: "Laws of the Game" },
  { value: "interpretation", label: "Interpretasi Aturan" },
  { value: "case_study", label: "Studi Kasus" },
  { value: "general", label: "Diskusi Umum" },
];

export const getCategoryLabel = (category: string) => {
  const found = DISCUSSION_CATEGORIES.find((c) => c.value === category);
  return found?.label || category;
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case "lotg":
      return "bg-blue-500/10 text-blue-600";
    case "interpretation":
      return "bg-purple-500/10 text-purple-600";
    case "case_study":
      return "bg-orange-500/10 text-orange-600";
    case "general":
      return "bg-gray-500/10 text-gray-600";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const useDiscussionTopics = (filters?: {
  category?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["discussion-topics", filters],
    queryFn: async () => {
      let query = supabase
        .from("discussion_topics")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("last_activity_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.search) {
        query = query.ilike("title", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch authors separately
      if (data && data.length > 0) {
        const authorIds = [...new Set(data.map(t => t.author_id))];
        const { data: authors } = await supabase
          .from("profiles")
          .select("id, full_name, profile_photo_url")
          .in("id", authorIds);

        const authorMap = new Map(authors?.map(a => [a.id, a]) || []);
        return data.map(topic => ({
          ...topic,
          author: authorMap.get(topic.author_id) || null
        })) as DiscussionTopic[];
      }

      return data as DiscussionTopic[];
    },
  });
};

export const useDiscussionTopic = (id: string) => {
  useEffect(() => {
    if (id) {
      supabase.rpc("increment_view_count", { topic_id: id }).then();
    }
  }, [id]);

  return useQuery({
    queryKey: ["discussion-topic", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discussion_topics")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Fetch author
      if (data) {
        const { data: author } = await supabase
          .from("profiles")
          .select("id, full_name, profile_photo_url")
          .eq("id", data.author_id)
          .single();

        return { ...data, author } as DiscussionTopic;
      }

      return data as DiscussionTopic;
    },
    enabled: !!id,
  });
};

export const useDiscussionReplies = (topicId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!topicId) return;

    const channel = supabase
      .channel(`replies-${topicId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "discussion_replies",
          filter: `topic_id=eq.${topicId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["discussion-replies", topicId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [topicId, queryClient]);

  return useQuery({
    queryKey: ["discussion-replies", topicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discussion_replies")
        .select("*")
        .eq("topic_id", topicId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch authors
      if (data && data.length > 0) {
        const authorIds = [...new Set(data.map(r => r.author_id))];
        const { data: authors } = await supabase
          .from("profiles")
          .select("id, full_name, profile_photo_url")
          .in("id", authorIds);

        const authorMap = new Map(authors?.map(a => [a.id, a]) || []);
        return data.map(reply => ({
          ...reply,
          author: authorMap.get(reply.author_id) || null
        })) as DiscussionReply[];
      }

      return data as DiscussionReply[];
    },
    enabled: !!topicId,
  });
};

export const useCreateTopic = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      category: string;
      law_reference?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data: topic, error } = await supabase
        .from("discussion_topics")
        .insert({
          title: data.title,
          content: data.content,
          category: data.category,
          law_reference: data.law_reference || null,
          author_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return topic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussion-topics"] });
    },
  });
};

export const useCreateReply = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      topic_id: string;
      content: string;
      parent_reply_id?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data: reply, error } = await supabase
        .from("discussion_replies")
        .insert({
          topic_id: data.topic_id,
          content: data.content,
          parent_reply_id: data.parent_reply_id || null,
          author_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch topic author for notification
      const { data: topic } = await supabase
        .from("discussion_topics")
        .select("author_id, title")
        .eq("id", data.topic_id)
        .single();

      return { ...reply, topicAuthorId: topic?.author_id, topicTitle: topic?.title };
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["discussion-replies", variables.topic_id],
      });
      queryClient.invalidateQueries({ queryKey: ["discussion-topics"] });

      // Notify topic author if they're not the one replying
      if (data.topicAuthorId && data.topicAuthorId !== data.author_id) {
        await createNotification({
          userId: data.topicAuthorId,
          type: "discussion",
          action: "replied",
          title: "Balasan Baru",
          message: `Ada balasan baru di diskusi "${data.topicTitle || "Anda"}".`,
          entityType: "discussion_topics",
          entityId: variables.topic_id,
        });
      }

      // Notify parent reply author if this is a nested reply
      if (variables.parent_reply_id) {
        const { data: parentReply } = await supabase
          .from("discussion_replies")
          .select("author_id")
          .eq("id", variables.parent_reply_id)
          .single();

        if (parentReply?.author_id && parentReply.author_id !== data.author_id) {
          await createNotification({
            userId: parentReply.author_id,
            type: "discussion",
            action: "replied",
            title: "Balasan untuk Komentar Anda",
            message: `Ada balasan untuk komentar Anda di diskusi "${data.topicTitle || ""}".`,
            entityType: "discussion_replies",
            entityId: data.id,
          });
        }
      }
    },
  });
};

export const useDeleteTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (topicId: string) => {
      const { error } = await supabase
        .from("discussion_topics")
        .delete()
        .eq("id", topicId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussion-topics"] });
    },
  });
};

export const useDeleteReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      replyId,
      topicId,
    }: {
      replyId: string;
      topicId: string;
    }) => {
      const { error } = await supabase
        .from("discussion_replies")
        .delete()
        .eq("id", replyId);

      if (error) throw error;
      return topicId;
    },
    onSuccess: (topicId) => {
      queryClient.invalidateQueries({
        queryKey: ["discussion-replies", topicId],
      });
      queryClient.invalidateQueries({ queryKey: ["discussion-topics"] });
    },
  });
};

export const useTogglePinTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      topicId,
      isPinned,
    }: {
      topicId: string;
      isPinned: boolean;
    }) => {
      const { error } = await supabase
        .from("discussion_topics")
        .update({ is_pinned: isPinned })
        .eq("id", topicId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussion-topics"] });
    },
  });
};

export const useToggleLockTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      topicId,
      isLocked,
    }: {
      topicId: string;
      isLocked: boolean;
    }) => {
      const { error } = await supabase
        .from("discussion_topics")
        .update({ is_locked: isLocked })
        .eq("id", topicId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussion-topics"] });
    },
  });
};

export const useMarkAsSolution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      replyId,
      topicId,
      isSolution,
    }: {
      replyId: string;
      topicId: string;
      isSolution: boolean;
    }) => {
      const { error } = await supabase
        .from("discussion_replies")
        .update({ is_solution: isSolution })
        .eq("id", replyId);

      if (error) throw error;

      // Fetch reply author for notification
      const { data: reply } = await supabase
        .from("discussion_replies")
        .select("author_id")
        .eq("id", replyId)
        .single();

      return { topicId, replyAuthorId: reply?.author_id, isSolution };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({
        queryKey: ["discussion-replies", data.topicId],
      });

      // Notify reply author that their answer was marked as solution
      if (data.isSolution && data.replyAuthorId) {
        await createNotification({
          userId: data.replyAuthorId,
          type: "discussion",
          action: "marked_solution",
          title: "Jawaban Ditandai Solusi",
          message: "Jawaban Anda telah ditandai sebagai solusi!",
          entityType: "discussion_topics",
          entityId: data.topicId,
        });
      }
    },
  });
};
