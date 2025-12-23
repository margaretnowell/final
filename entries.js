import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: "Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables",
      });
    }

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) return res.status(500).json({ error: "Error fetching entries" });
      return res.status(200).json(data || []);
    }

    if (req.method === "POST") {
      const { category, rating, notes } = req.body || {};

      if (!category || rating === undefined || rating === null) {
        return res.status(400).json({ error: "category and rating are required" });
      }

      const numericRating = Number(rating);
      if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 10) {
        return res.status(400).json({ error: "rating must be a number between 1 and 10" });
      }

      const { data, error } = await supabase
        .from("entries")
        .insert([{ category, rating: numericRating, notes }])
        .select()
        .single();

      if (error) return res.status(500).json({ error: "Error inserting entry" });
      return res.status(201).json(data);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
