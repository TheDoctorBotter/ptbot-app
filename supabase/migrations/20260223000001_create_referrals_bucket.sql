-- Create a private storage bucket for patient referral documents.
-- Files are stored at:  referrals/{user_id}/{timestamp}_{filename}
-- Patients can upload and read their own files only.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'referrals',
  'referrals',
  false,
  10485760, -- 10 MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Patients can upload files into their own sub-folder
CREATE POLICY "referrals: patients can upload own files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'referrals'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Patients can read files from their own sub-folder
CREATE POLICY "referrals: patients can read own files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'referrals'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Patients can delete their own files (e.g. to re-upload a corrected version)
CREATE POLICY "referrals: patients can delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'referrals'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
