import React, { useState } from 'react';
import { Tab, Nav, Form } from 'react-bootstrap';

const MockPaymentGateway = ({ totalAmount, onSubmit, isProcessing }) => {
  const [method, setMethod] = useState('card');
  const [forceFail, setForceFail] = useState(false);

  // Card State
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardHolder, setCardHolder] = useState('AMAN SHARMA');
  const [expiry, setExpiry] = useState('08/29');
  const [cvv, setCvv] = useState('789');

  // UPI State
  const [upiId, setUpiId] = useState('amansharma@oksbi');

  // Netbanking State
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  const fillTestCard = () => {
    setCardNumber('4532 8920 1192 8821');
    setCardHolder('AMAN SHARMA');
    setExpiry('12/28');
    setCvv('321');
  };

  const fillTestUpi = () => {
    setUpiId('imovies.demo@okhdfcbank');
  };

  const handlePay = (e) => {
    e.preventDefault();
    onSubmit({
      paymentMethod: method,
      forceFail,
      cardDetails: method === 'card' ? { cardNumber, cardHolder, expiry } : {},
      upiId: method === 'upi' ? upiId : '',
      bank: method === 'netbanking' ? selectedBank : '',
    });
  };

  return (
    <div className="p-4 rounded-4 cinema-card-plain" style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <h5 className="fw-bold text-white mb-1">
            <i className="bi bi-shield-lock-fill text-success me-2"></i>
            IMovies Mock Checkout
          </h5>
          <div className="text-secondary small">
            Built-in Sandbox Gateway • ~90% simulated success rate
          </div>
        </div>

        <div className="text-end">
          <div className="text-secondary text-uppercase small" style={{ fontSize: '0.75rem' }}>
            TOTAL PAYABLE
          </div>
          <div className="fw-bold text-warning fs-4">₹{totalAmount}</div>
        </div>
      </div>

      {/* Tabs */}
      <Tab.Container activeKey={method} onSelect={(k) => setMethod(k)}>
        <Nav variant="pills" className="nav-fill mb-4 bg-dark p-1 rounded-3">
          <Nav.Item>
            <Nav.Link eventKey="card" className="py-2 text-white small">
              <i className="bi bi-credit-card-2-front me-2"></i>
              Card
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="upi" className="py-2 text-white small">
              <i className="bi bi-qr-code-scan me-2"></i>
              UPI / QR
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="netbanking" className="py-2 text-white small">
              <i className="bi bi-bank me-2"></i>
              Net Banking
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Form onSubmit={handlePay}>
          <Tab.Content className="mb-4">
            {/* Card Form */}
            <Tab.Pane eventKey="card">
              <div className="mb-3 d-flex justify-content-between align-items-center">
                <span className="small text-muted">Credit / Debit Card</span>
                <button
                  type="button"
                  onClick={fillTestCard}
                  className="btn btn-sm btn-outline-info py-0 px-2"
                  style={{ fontSize: '0.75rem' }}
                >
                  <i className="bi bi-lightning-fill me-1"></i> Fill Test Card
                </button>
              </div>

              <div className="mb-3">
                <Form.Label className="small text-secondary">Card Number</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary text-light">
                    <i className="bi bi-credit-card"></i>
                  </span>
                  <Form.Control
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="bg-dark text-light border-secondary"
                    required
                  />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-8">
                  <Form.Label className="small text-secondary">Cardholder Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="bg-dark text-light border-secondary"
                    required
                  />
                </div>
                <div className="col-4">
                  <Form.Label className="small text-secondary">Valid Thru</Form.Label>
                  <Form.Control
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="bg-dark text-light border-secondary text-center"
                    required
                  />
                </div>
              </div>
            </Tab.Pane>

            {/* UPI Form */}
            <Tab.Pane eventKey="upi">
              <div className="mb-3 d-flex justify-content-between align-items-center">
                <span className="small text-muted">UPI ID / VPA</span>
                <button
                  type="button"
                  onClick={fillTestUpi}
                  className="btn btn-sm btn-outline-info py-0 px-2"
                  style={{ fontSize: '0.75rem' }}
                >
                  <i className="bi bi-lightning-fill me-1"></i> Fill Test UPI
                </button>
              </div>

              <div className="mb-3">
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary text-light">@</span>
                  <Form.Control
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@bank"
                    className="bg-dark text-light border-secondary"
                    required
                  />
                </div>
                <div className="form-text text-muted small mt-1">
                  Supported: Google Pay, PhonePe, Paytm, BHIM, Cred
                </div>
              </div>
            </Tab.Pane>

            {/* Net Banking Form */}
            <Tab.Pane eventKey="netbanking">
              <Form.Label className="small text-secondary">Select Your Bank</Form.Label>
              <div className="d-grid gap-2">
                {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra'].map((b) => (
                  <div
                    key={b}
                    onClick={() => setSelectedBank(b)}
                    className={`p-3 rounded border text-light d-flex align-items-center justify-content-between ${
                      selectedBank === b ? 'border-danger bg-danger bg-opacity-10' : 'border-secondary bg-dark'
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    <span>{b}</span>
                    <input
                      type="radio"
                      name="bank"
                      checked={selectedBank === b}
                      onChange={() => setSelectedBank(b)}
                    />
                  </div>
                ))}
              </div>
            </Tab.Pane>
          </Tab.Content>

          {/* QA / Testing Controls */}
          <div className="p-3 mb-4 rounded bg-dark border border-secondary border-opacity-50">
            <div className="form-check form-switch d-flex align-items-center justify-content-between ps-0">
              <label className="form-check-label text-warning small fw-semibold" htmlFor="forceFailToggle">
                <i className="bi bi-bug-fill me-1"></i> Force Payment Failure (Test Rollback)
              </label>
              <input
                className="form-check-input ms-auto"
                type="checkbox"
                id="forceFailToggle"
                checked={forceFail}
                onChange={(e) => setForceFail(e.target.checked)}
              />
            </div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
              When enabled, simulates bank decline to verify seat unlocking and transaction rollback.
            </div>
          </div>

          {/* Pay Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className={`btn w-100 py-3 fw-bold fs-5 shadow ${
              forceFail ? 'btn-warning text-dark' : 'btn-cinema'
            }`}
          >
            {isProcessing ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <span className="spinner-border spinner-border-sm" role="status"></span>
                Processing Payment...
              </span>
            ) : forceFail ? (
              <span>Simulate Failed Payment ₹{totalAmount}</span>
            ) : (
              <span>
                <i className="bi bi-lock-fill me-1"></i> Pay Securely ₹{totalAmount}
              </span>
            )}
          </button>
        </Form>
      </Tab.Container>
    </div>
  );
};

export default MockPaymentGateway;
