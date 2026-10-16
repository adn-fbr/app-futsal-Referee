-- Create public view for referees with review stats
CREATE OR REPLACE VIEW public.public_referees AS
SELECT 
  p.id,
  p.full_name,
  p.profile_photo_url,
  p.license_level,
  p.afk_origin,
  COALESCE(rs.avg_rating, 0) as avg_rating,
  COALESCE(rs.total_reviews, 0) as total_reviews
FROM public.profiles p
INNER JOIN public.user_roles ur ON ur.user_id = p.id
LEFT JOIN public.referee_review_stats rs ON rs.referee_id = p.id
WHERE ur.role = 'wasit'
  AND p.is_profile_complete = true
  AND p.deleted_at IS NULL;

-- Grant access to anonymous and authenticated users
GRANT SELECT ON public.public_referees TO anon, authenticated;