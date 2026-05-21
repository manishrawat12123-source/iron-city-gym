import React, { useState, useEffect } from 'react';

const Payment = ({ onPaymentSuccess }) => {
  const [duration, setDuration] = useState(1); // months
  const [discount, setDiscount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      name: 'Basic',
      price: 1000,
      features: ['Full Gym Access', 'Locker Facility', 'Basic Equipment', 'Changing Rooms'],
      color: '#00f5ff'
    },
    {
      name: 'Pro',
      price: 2500,
      features: ['Everything in Basic', 'Personalized Diet Plan', 'Dedicated Trainer', 'Progress Tracking', 'Supplement Guidance'],
      color: '#ff2d6b',
      popular: true
    },
    {
      name: 'Premium',
      price: 5000,
      features: ['Everything in Pro', '1-on-1 Personal Training', 'Body Composition Analysis', 'Priority Booking', 'Spa & Recovery Access', 'Nutrition Counseling'],
      color: '#ffd700'
    }
  ];

  useEffect(() => {
    if (duration === 3) setDiscount(10);
    else if (duration === 6) setDiscount(20);
    else if (duration === 12) setDiscount(30);
    else setDiscount(0);
  }, [duration]);

  // Ensure scroll is always restored
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, []);

  const calculateTotal = (basePrice) => {
    const total = basePrice * duration;
    const discounted = total - (total * discount) / 100;
    return Math.round(discounted);
  };

  const handlePayment = (plan) => {
    const finalAmount = calculateTotal(plan.price);
    setSelectedPlan(plan);

    const options = {
      key: 'YOUR_RAZORPAY_KEY_ID',
      amount: finalAmount * 100, // in paise
      currency: 'INR',
      name: 'IRON CITY GYM',
      description: `${plan.name} Plan - ${duration} Months`,
      theme: { color: '#00f5ff' },
      handler: async function (response) {
        setPaymentId(response.razorpay_payment_id);
        setShowModal(true);
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="payment-page animate-fade">
      <div className="grid-bg"></div>
      
      <div className="payment-container container">
        <header className="payment-header">
          <h1 className="bebas-heading">CHOOSE YOUR POWER</h1>
          <p className="subheading">Unlock your potential with our elite membership plans.</p>
        </header>

        <div className="duration-toggle glass">
          <button className={duration === 1 ? 'active' : ''} onClick={() => setDuration(1)}>1 Month</button>
          <button className={duration === 3 ? 'active' : ''} onClick={() => setDuration(3)}>
            3 Months <span className="discount-badge">10% OFF</span>
          </button>
          <button className={duration === 6 ? 'active' : ''} onClick={() => setDuration(6)}>
            6 Months <span className="discount-badge">20% OFF</span>
          </button>
          <button className={duration === 12 ? 'active' : ''} onClick={() => setDuration(12)}>
            1 Year <span className="discount-badge">30% OFF</span>
          </button>
        </div>

        <div className="plans-grid">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`plan-card glass ${plan.popular ? 'popular' : ''}`}
              style={{ 
                '--accent': plan.color,
                animationDelay: `${index * 0.2}s`
              }}
            >
              {plan.popular && <div className="popular-badge">MOST POPULAR</div>}
              <h2 className="plan-name bebas-heading">{plan.name}</h2>
              
              <div className="price-box">
                {discount > 0 && (
                  <span className="original-price">₹{plan.price * duration}</span>
                )}
                <div className="main-price">
                  <span className="currency">₹</span>
                  <span className="amount">{calculateTotal(plan.price)}</span>
                </div>
                <p className="period">
                  {duration === 1 ? 'per month' : `for ${duration} months`}
                </p>
                {discount > 0 && (
                  <div className="savings-badge">SAVE ₹{(plan.price * duration * discount) / 100}</div>
                )}
              </div>

              <ul className="features-list">
                {plan.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>

              <button 
                className="get-plan-btn" 
                onClick={() => handlePayment(plan)}
              >
                GET {plan.name.toUpperCase()}
              </button>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="success-modal glass animate-scale">
            <div className="checkmark-circle">✓</div>
            <h2 className="bebas-heading">You're In!</h2>
            <p className="modal-info">Welcome to the IRON CITY elite.</p>
            <div className="payment-details">
              <p>Plan: <strong>{selectedPlan?.name} ({duration} Mo)</strong></p>
              <p>ID: <span>{paymentId}</span></p>
            </div>
            <button className="btn-primary w-full" onClick={() => {
              document.body.style.overflow = 'auto';
              onPaymentSuccess();
            }}>
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      <style>{`
        .payment-page {
          min-height: 100vh;
          background: #0a0a0a;
          color: white;
          padding: 40px 0 100px;
          position: relative;
          font-family: 'DM Sans', sans-serif;
        }
        .grid-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(0, 245, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 245, 255, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
          z-index: 0;
        }
        .payment-container { position: relative; z-index: 1; }
        .bebas-heading { font-family: 'Bebas Neue', cursive; letter-spacing: 2px; }
        
        .payment-header { text-align: center; margin-bottom: 50px; }
        .payment-header h1 { font-size: 4rem; color: #00f5ff; text-shadow: 0 0 20px rgba(0, 245, 255, 0.3); }
        .subheading { color: #888; font-size: 1.1rem; }

        .duration-toggle {
          display: flex;
          justify-content: center;
          gap: 10px;
          padding: 8px;
          max-width: 800px;
          margin: 0 auto 60px;
          border-radius: 100px;
        }
        .duration-toggle button {
          flex: 1;
          background: transparent;
          border: none;
          color: #888;
          padding: 12px 20px;
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.3s;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .duration-toggle button.active {
          background: #00f5ff;
          color: #000;
          box-shadow: 0 0 20px rgba(0, 245, 255, 0.4);
        }
        .discount-badge {
          background: #ff2d6b;
          color: white;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          align-items: flex-start;
        }
        .plan-card {
          padding: 40px;
          border-radius: 24px;
          position: relative;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          opacity: 0;
          transform: translateY(30px);
          animation: fadeUp 0.6s forwards;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }
        .plan-card:hover {
          transform: translateY(-10px);
          border-color: var(--accent);
          box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(var(--accent-rgb), 0.2);
        }
        .plan-card.popular {
          transform: translateY(-8px);
          border: 2px solid #ff2d6b;
          background: rgba(255, 45, 107, 0.05);
          backdrop-filter: blur(20px);
        }
        .popular-badge {
          position: absolute;
          top: -15px;
          left: 50%;
          transform: translateX(-50%);
          background: #ff2d6b;
          color: white;
          padding: 6px 16px;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .plan-name { font-size: 2.5rem; color: var(--accent); margin-bottom: 25px; }
        
        .price-box { margin-bottom: 35px; }
        .original-price { color: #555; text-decoration: line-through; display: block; }
        .main-price { display: flex; align-items: baseline; gap: 5px; }
        .currency { font-size: 1.5rem; color: var(--accent); }
        .amount { font-size: 3.5rem; font-weight: 800; font-family: 'Bebas Neue'; }
        .period { color: #888; font-size: 0.9rem; }
        .savings-badge {
          display: inline-block;
          background: rgba(255, 45, 107, 0.2);
          color: #ff2d6b;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.8rem;
          margin-top: 10px;
          font-weight: 600;
        }

        .features-list {
          list-style: none;
          margin-bottom: 40px;
          min-height: 250px;
        }
        .features-list li {
          margin-bottom: 12px;
          color: #bbb;
          position: relative;
          padding-left: 25px;
        }
        .features-list li::before {
          content: '✔';
          position: absolute;
          left: 0;
          color: var(--accent);
        }

        .get-plan-btn {
          width: 100%;
          background: transparent;
          border: 2px solid var(--accent);
          color: var(--accent);
          padding: 16px;
          border-radius: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s;
          font-family: 'Bebas Neue';
          font-size: 1.2rem;
          letter-spacing: 1px;
        }
        .get-plan-btn:hover {
          background: var(--accent);
          color: #000;
          box-shadow: 0 0 20px var(--accent);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(10px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
        }
        .success-modal {
          max-width: 400px;
          width: 90%;
          padding: 40px;
          text-align: center;
          border-color: #00f5ff;
        }
        .checkmark-circle {
          width: 80px;
          height: 80px;
          background: rgba(0, 245, 255, 0.1);
          border: 2px solid #00f5ff;
          color: #00f5ff;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 2.5rem;
          margin: 0 auto 20px;
          box-shadow: 0 0 20px rgba(0, 245, 255, 0.2);
        }
        .modal-info { color: #888; margin-bottom: 25px; }
        .payment-details {
          background: rgba(255, 255, 255, 0.05);
          padding: 15px;
          border-radius: 12px;
          margin-bottom: 30px;
          text-align: left;
          font-size: 0.9rem;
        }
        .payment-details span { color: #555; word-break: break-all; }
        
        .animate-scale {
          animation: scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 768px) {
          .payment-header h1 { font-size: 2.5rem; }
          .duration-toggle { flex-direction: column; border-radius: 20px; }
          .duration-toggle button { border-radius: 15px; }
        }
      `}</style>
    </div>
  );
};

export default Payment;
