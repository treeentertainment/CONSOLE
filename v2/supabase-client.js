const supabaseUrl = "https://juwfeuweabufcwnocwgh.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1d2ZldXdlYWJ1ZmN3bm9jd2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NjM0OTMsImV4cCI6MjA4NDAzOTQ5M30.3RQZXcHfCd35eY397YnhwD9HQDg0eoc6xzlYjo5sCnQ";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
