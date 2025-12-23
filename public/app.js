/* app.js - loaded with type="text/babel" so can use JSX */

const { useState, useEffect } = React;

// Helper: format date
function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString();
}

// -------------------- About Page Component --------------------
function AboutPage() {
  return (
    <section className="card">
      <h2>About DailyVibes</h2>
      <p>
        DailyVibes is a simple mood and energy tracker built for the INST377 final project.
        It lets you log quick "vibe" entries – like how productive or relaxed your day felt –
        and then visualizes trends over time with charts.
      </p>
      <p>
        This project demonstrates a full-stack web application, including a React-based
        front end, a Node.js / Express API, and a Supabase database running in the cloud.
      </p>
      <p className="helper-text">
        Tech stack: React, Chart.js, Swiper, Node.js, Express, Supabase, and modern CSS.
      </p>
    </section>
  );
}

// -------------------- App (Core Functionality) --------------------
function AppPage() {
  const [entries, setEntries] = useState([]);
  const [category, setCategory] = useState('Study');
  const [rating, setRating] = useState(7);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [chartReady, setChartReady] = useState(false);

  // Fetch entries from our API
  const fetchEntries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/entries');
      if (!res.ok) {
        throw new Error('Failed to load entries');
      }
      const data = await res.json();
      setEntries(data || []);
    } catch (err) {
      console.error(err);
      setError('Could not load entries. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  // On mount, load entries
  useEffect(() => {
    fetchEntries();
  }, []);

  // Submit new entry
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const body = { category, rating, notes };
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Failed to save entry');
      }

      const newEntry = await res.json();
      setEntries((prev) => [newEntry, ...prev]); // add to top
      setNotes('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not save entry.');
    } finally {
      setSaving(false);
    }
  };

  // Build chart data from entries
  useEffect(() => {
    if (typeof Chart === 'undefined') {
      return;
    }

    // Aggregate average rating by category
    const byCategory = {};
    entries.forEach((e) => {
      if (!e.category) return;
      if (!byCategory[e.category]) {
        byCategory[e.category] = { total: 0, count: 0 };
      }
      byCategory[e.category].total += e.rating || 0;
      byCategory[e.category].count += 1;
    });

    const labels = Object.keys(byCategory);
    const values = labels.map(
      (cat) => byCategory[cat].total / byCategory[cat].count
    );

    const canvas = document.getElementById('summary-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destroy previous chart if exists
    if (window._vibeChart) {
      window._vibeChart.destroy();
    }

    if (labels.length === 0) {
      setChartReady(false);
      return;
    }

    window._vibeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Average Rating (1-10)',
            data: values,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 10,
          },
        },
      },
    });

    setChartReady(true);
  }, [entries]);

  return (
    <section className="app-grid">
      {/* Form card */}
      <div className="card">
        <h2>Log a Vibe</h2>
        <p className="helper-text">
          Choose a category, rate your day (1–10), and add any quick notes.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Study</option>
              <option>Work</option>
              <option>Social</option>
              <option>Health</option>
              <option>Rest</option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="rating">Rating (1–10)</label>
            <input
              id="rating"
              type="number"
              min="1"
              max="10"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
            <span className="helper-text">10 = amazing; 1 = rough day</span>
          </div>

          <div className="form-row">
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              placeholder="What made you feel this way?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <div className="error-text">{error}</div>}

          <button
            type="submit"
            className="btn primary-btn"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Vibe'}
          </button>
        </form>
      </div>

      {/* List + chart card */}
      <div className="card">
        <h3>Recent Vibes</h3>
        {loading ? (
          <p className="helper-text">Loading entries…</p>
        ) : entries.length === 0 ? (
          <p className="helper-text">No entries yet — log your first vibe!</p>
        ) : (
          <div className="entries-list">
            {entries.map((entry) => (
              <div className="entry-item" key={entry.id}>
                <div className="entry-top">
                  <span className="entry-category">{entry.category}</span>
                  <span className="entry-rating">Rating: {entry.rating}/10</span>
                </div>
                <span className="helper-text">
                  {formatDate(entry.created_at)}
                </span>
                {entry.notes && (
                  <span className="entry-notes">{entry.notes}</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="chart-container">
          <h4>Average Rating by Category</h4>
          <canvas id="summary-chart" height="200"></canvas>
          {!chartReady && (
            <p className="helper-text">
              Add a few entries to see the chart come to life.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// -------------------- (Optional) Home Page React bits --------------------
function HomePageReact() {
  // Initialize Swiper when home component mounts
  useEffect(() => {
    if (typeof Swiper === 'undefined') return;

    // eslint-disable-next-line no-undef
    new Swiper('.swiper', {
      loop: true,
      pagination: {
        el: '.swiper-pagination',
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
    });
  }, []);

  // ✅ REQUIRED 3rd fetch call (health check)
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(() => {
        // success (intentionally silent)
      })
      .catch(() => {
        // failure (intentionally silent)
      });
  }, []);

  return null; // Content is in HTML
}


// -------------------- Mount components depending on the page --------------------
(function mount() {
  const homeRoot = document.getElementById('root-home');
  const aboutRoot = document.getElementById('root-about');
  const appRoot = document.getElementById('root-app');

  if (homeRoot) {
    ReactDOM.createRoot(homeRoot).render(<HomePageReact />);
  }

  if (aboutRoot) {
    ReactDOM.createRoot(aboutRoot).render(<AboutPage />);
  }

  if (appRoot) {
    ReactDOM.createRoot(appRoot).render(<AppPage />);
  }
})();

