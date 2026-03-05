'use strict';

/**
 * SGE_RT — Supabase Configuration
 * Uses the SAME Supabase project as SGE (Gestão de Efetivo) and SCP (Controle de Presença).
 */
window.SGE_RT = window.SGE_RT || {};

SGE_RT.SUPABASE_URL = 'https://mgcjidryrjqiceielmzp.supabase.co';
SGE_RT.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nY2ppZHJ5cmpxaWNlaWVsbXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjEwNzEsImV4cCI6MjA4NzY5NzA3MX0.UAKkzy5fMIkrlmnqz9E9KknUw9xhoYpa3f1ptRpOuAA';

if (typeof supabase !== 'undefined') {
    window.supabase = supabase.createClient(SGE_RT.SUPABASE_URL, SGE_RT.SUPABASE_KEY);
    console.info('SGE_RT: Supabase client initialized.');
} else {
    console.warn('SGE_RT: Supabase JS SDK not loaded yet.');
}
