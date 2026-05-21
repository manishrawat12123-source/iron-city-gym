import React, { useState, useEffect } from 'react';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const res = await fetch('https://iron-city-gym.onrender.com/api/reviews');
    const data = await res.json();
    setReviews(data);
  };

  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!comment) return;

    await fetch('https://iron-city-gym.onrender.com/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment, rating: parseInt(rating) })
    });

    setComment('');
    fetchReviews();
  };

  return (
    <div className="reviews-section animate-fade">
      <div className="section-header">
        <h2 className="neon-text-blue">Gym Experience</h2>
        <p>What our community says about us</p>
      </div>

      <div className="reviews-grid">
        {reviews.map(review => (
          <div key={review.id} className="glass review-card">
            <div className="review-top">
              <div className="user-info">
                <strong>{review.name}</strong>
                <span>{review.date}</span>
              </div>
              <div className="rating">
                {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
              </div>
            </div>
            <p className="comment">"{review.comment}"</p>
          </div>
        ))}
      </div>

      <div className="glass add-review-card">
        <h3>Share Your Experience</h3>
        <form onSubmit={handlePostReview}>
          <textarea 
            placeholder="Write your review here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
          <div className="form-footer">
            <div className="rating-input">
              <span>Rating: </span>
              <select value={rating} onChange={(e) => setRating(e.target.value)}>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
              </select>
            </div>
            <button type="submit" className="btn-primary btn-sm">Post Review</button>
          </div>
        </form>
      </div>

      <style>{`
        .reviews-section { padding-top: 40px; }
        .section-header { text-align: center; margin-bottom: 40px; }
        .section-header h2 { font-size: 2.5rem; }
        
        .reviews-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        .review-card { padding: 25px; }
        .review-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
        }
        .user-info strong { display: block; color: var(--accent-primary); }
        .user-info span { font-size: 0.8rem; color: var(--text-muted); }
        .rating { color: #ffd700; letter-spacing: 2px; }
        .comment { font-style: italic; color: var(--text-muted); line-height: 1.6; }

        .add-review-card { padding: 30px; max-width: 800px; margin: 0 auto; }
        .add-review-card h3 { margin-bottom: 20px; }
        textarea {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          padding: 15px;
          border-radius: 10px;
          color: white;
          min-height: 100px;
          margin-bottom: 15px;
          resize: vertical;
        }
        .form-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        select {
          background: #1a1a1a;
          color: white;
          border: 1px solid var(--glass-border);
          padding: 5px 10px;
          border-radius: 5px;
        }
      `}</style>
    </div>
  );
};

export default Reviews;
