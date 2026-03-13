
-- Add image_url column to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS image_url text;

-- Create chat_summaries table
CREATE TABLE public.chat_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  summary text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view summaries"
  ON public.chat_summaries FOR SELECT TO authenticated
  USING (conversation_id IN (
    SELECT id FROM chat_conversations
    WHERE participant_a = auth.uid() OR participant_b = auth.uid()
  ));

CREATE POLICY "Participants can insert summaries"
  ON public.chat_summaries FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    conversation_id IN (
      SELECT id FROM chat_conversations
      WHERE participant_a = auth.uid() OR participant_b = auth.uid()
    )
  );

-- Create chat-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can upload
CREATE POLICY "Authenticated users can upload chat images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-images');

-- Storage RLS: public can view
CREATE POLICY "Anyone can view chat images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'chat-images');
