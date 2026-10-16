import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Extract the file path from a full Supabase storage URL
 */
function extractPathFromUrl(fullUrl: string, bucket: string): string {
  // Handle URLs like: https://xxx.supabase.co/storage/v1/object/public/documents/path/to/file.jpg
  const publicPattern = `/storage/v1/object/public/${bucket}/`;
  const signedPattern = `/storage/v1/object/sign/${bucket}/`;
  
  if (fullUrl.includes(publicPattern)) {
    return fullUrl.split(publicPattern)[1]?.split('?')[0] || '';
  }
  if (fullUrl.includes(signedPattern)) {
    return fullUrl.split(signedPattern)[1]?.split('?')[0] || '';
  }
  
  // If it's already just a path, return as is
  return fullUrl;
}

/**
 * Hook to generate signed URLs for private bucket files
 */
export function useSignedUrl(bucketPath: string | null, bucket: string = 'documents') {
  return useQuery({
    queryKey: ['signed-url', bucket, bucketPath],
    queryFn: async () => {
      if (!bucketPath) return null;
      
      const path = extractPathFromUrl(bucketPath, bucket);
      if (!path) return null;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // Valid for 1 hour
      
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!bucketPath,
    staleTime: 1000 * 60 * 50, // Cache for 50 minutes (before 1 hour expiry)
  });
}

/**
 * Create a signed URL for download
 */
export async function createSignedDownloadUrl(
  bucketPath: string, 
  bucket: string = 'documents'
): Promise<string | null> {
  const path = extractPathFromUrl(bucketPath, bucket);
  if (!path) return null;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60); // Short-lived for download
  
  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
  
  return data.signedUrl;
}
