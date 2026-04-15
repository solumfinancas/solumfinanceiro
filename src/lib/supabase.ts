import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fxhqyfwsbqylvooglcrb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aHF5ZndzYnF5bHZvb2dsY3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjUxMjcsImV4cCI6MjA5MDk0MTEyN30.BbzJbkLggmnkEKHmvRw1pHEqGnqD2RFyh8reyToXy60';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
