import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeDocumentHash } from "@/lib/officialDocument";

export type OfficialDocumentIssueInput = {
  documentType: string;
  sourceEntityType: string;
  sourceEntityId: string;
  snapshot: Record<string, unknown>;
  issuedBy?: string | null;
};

export function useVerifyOfficialDocument(token: string) {
  return useQuery({
    queryKey: ["official-document-verify", token],
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase.rpc("verify_official_document", {
        p_verification_token: token,
      });

      if (error) throw error;
      return data as {
        valid: boolean;
        status: string;
        message: string;
        document?: {
          id: string;
          document_number: string;
          document_type: string;
          issued_at: string;
          status: string;
          content_hash: string;
        };
      } | null;
    },
    enabled: !!token,
  });
}

export function useIssueOfficialDocument() {
  return useMutation({
    mutationFn: async (input: OfficialDocumentIssueInput) => {
      const contentHash = await computeDocumentHash({
        document_type: input.documentType,
        source_entity_type: input.sourceEntityType,
        source_entity_id: input.sourceEntityId,
        snapshot: input.snapshot,
      });

      const { data, error } = await supabase.rpc("issue_official_document", {
        p_document_type: input.documentType,
        p_source_entity_type: input.sourceEntityType,
        p_source_entity_id: input.sourceEntityId,
        p_snapshot: input.snapshot,
        p_content_hash: contentHash,
        p_issued_by: input.issuedBy ?? null,
      });

      if (error) throw error;
      return data;
    },
  });
}
