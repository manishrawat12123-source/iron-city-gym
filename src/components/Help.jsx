import React from 'react';

const Help = () => {
  const faqs = [
    { q: "How do I renew my membership?", a: "You can renew directly from your dashboard or visit the front desk." },
    { q: "Can I change my diet plan?", a: "Yes, our trainers update diet plans every 2 weeks based on your progress." },
    { q: "What are the guest policies?", a: "Pro members can bring 1 guest per month for free." }
  ];

  return (
    <div className="help-container animate-fade">
      <div className="section-header">
        <h2 className="neon-text-red">Support Center</h2>
        <p>How can we assist you today?</p>
      </div>

      <div className="help-grid">
        <div className="glass help-card contact-us">
          <h3>Direct Support</h3>
          <p>Need immediate help? Reach out to our team.</p>
          <div className="contact-methods">
            <div className="method">📧 support@ironcitygym.com</div>
            <div className="method">📞 +1 (555) 000-1234</div>
            <div className="method">💬 Live Chat (Available 9am-6pm)</div>
          </div>
          <button className="btn-primary w-full">Start Live Chat</button>
        </div>

        <div className="glass help-card faq-section">
          <h3>Common Questions</h3>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <div className="question">{faq.q}</div>
                <div className="answer">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .help-container { padding-top: 40px; }
        .help-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 30px;
          margin-top: 40px;
        }
        .help-card { padding: 35px; }
        .contact-methods { margin: 25px 0; }
        .method { margin-bottom: 12px; color: var(--text-muted); }
        
        .faq-list { margin-top: 20px; }
        .faq-item { margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px; }
        .question { font-weight: 600; color: var(--accent-primary); margin-bottom: 8px; }
        .answer { color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; }
      `}</style>
    </div>
  );
};

export default Help;
