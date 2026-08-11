CREATE POLICY "Users read own trade attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'trade-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own trade attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'trade-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own trade attachments" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'trade-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own trade attachments" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'trade-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);