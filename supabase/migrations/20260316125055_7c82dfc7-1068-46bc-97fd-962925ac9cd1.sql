
-- Enable realtime on traffic_data and intersections tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.traffic_data;
ALTER PUBLICATION supabase_realtime ADD TABLE public.intersections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_suggestions;
