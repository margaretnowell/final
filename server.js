// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars. Check SUPABASE_URL and SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/entries  --> retrieve data from DB (required API #1)
app.get('/api/entries', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Supabase select error:', error);
      return res.status(500).json({ error: 'Error fetching entries' });
    }

    res.json(data);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/entries  --> write data to DB (required API #2)
app.post('/api/entries', async (req, res) => {
  try {
    const { category, rating, notes } = req.body;

    if (!category || !rating) {
      return res.status(400).json({ error: 'category and rating are required' });
    }

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 10) {
      return res.status(400).json({ error: 'rating must be a number between 1 and 10' });
    }

    const { data, error } = await supabase
      .from('entries')
      .insert([{ category, rating: numericRating, notes }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Error inserting entry' });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => res.sendFile('index.html', { root: 'public' }));
app.get('/about.html', (req, res) => res.sendFile('about.html', { root: 'public' }));
app.get('/app.html', (req, res) => res.sendFile('app.html', { root: 'public' }));

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
