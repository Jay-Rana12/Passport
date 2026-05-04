const PaymentGateway = {
    init: function(options) {
        this.options = {
            amount: options.amount || 0,
            currency: options.currency || 'INR',
            onSuccess: options.onSuccess || (() => {}),
            onCancel: options.onCancel || (() => {}),
            itemName: options.itemName || 'Visa Processing'
        };
        this.render();
    },

    render: function() {
        const modalHtml = `
        <div id="premiumPaymentModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(10, 25, 47, 0.85); z-index:10000; justify-content:center; align-items:center; backdrop-filter:blur(8px); font-family:'Outfit', sans-serif;">
            <div style="background:white; width:450px; max-width:95%; border-radius:24px; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,0.3); animation:paymentSlideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                <!-- Header -->
                <div style="background:#0a192f; padding:25px; color:white; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:40px; height:40px; background:white; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-plane-departure" style="color:#0a192f; font-size:1.2rem;"></i>
                        </div>
                        <div>
                            <h4 style="margin:0; font-size:1.1rem; font-weight:800;">BorderBridge</h4>
                            <p style="margin:0; font-size:0.75rem; color:rgba(255,255,255,0.6);">Secure Payment Gateway</p>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <p style="margin:0; font-size:0.7rem; text-transform:uppercase; letter-spacing:1px; color:rgba(255,255,255,0.6);">Amount Payable</p>
                        <h3 style="margin:0; font-size:1.4rem; font-weight:900;">₹${this.options.amount.toLocaleString()}</h3>
                    </div>
                </div>

                <!-- Payment Body -->
                <div style="padding:30px;">
                    <div id="payment-step-1">
                        <p style="font-weight:700; color:#1e293b; margin-bottom:20px; font-size:0.95rem;">Select Payment Method</p>
                        
                        <div class="payment-method-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:25px;">
                            <div onclick="PaymentGateway.showStep(2)" style="border:2px solid #f1f5f9; padding:20px; border-radius:16px; cursor:pointer; text-align:center; transition:all 0.3s;" onmouseover="this.style.borderColor='#ff8c00'; this.style.background='#fff8ed'" onmouseout="this.style.borderColor='#f1f5f9'; this.style.background='white'">
                                <i class="fas fa-qrcode" style="font-size:2rem; color:#ff8c00; margin-bottom:10px; display:block;"></i>
                                <span style="font-weight:700; font-size:0.9rem;">UPI / QR</span>
                            </div>
                            <div onclick="PaymentGateway.showStep(3)" style="border:2px solid #f1f5f9; padding:20px; border-radius:16px; cursor:pointer; text-align:center; transition:all 0.3s;" onmouseover="this.style.borderColor='#ff8c00'; this.style.background='#fff8ed'" onmouseout="this.style.borderColor='#f1f5f9'; this.style.background='white'">
                                <i class="fas fa-credit-card" style="font-size:2rem; color:#3b82f6; margin-bottom:10px; display:block;"></i>
                                <span style="font-weight:700; font-size:0.9rem;">Cards</span>
                            </div>
                        </div>

                        <div style="background:#f8fafc; padding:15px; border-radius:12px; display:flex; align-items:center; gap:12px;">
                            <i class="fas fa-shield-halved" style="color:#10b981;"></i>
                            <p style="margin:0; font-size:0.8rem; color:#64748b; font-weight:600;">256-bit SSL Encrypted Secure Payment</p>
                        </div>
                    </div>

                    <!-- Step 2: QR Code -->
                    <div id="payment-step-2" style="display:none; text-align:center;">
                        <button onclick="PaymentGateway.showStep(1)" style="float:left; border:none; background:none; color:#64748b; cursor:pointer;"><i class="fas fa-arrow-left"></i></button>
                        <p style="font-weight:800; color:#0a192f; margin-bottom:20px;">Scan QR to Pay</p>
                        <div onclick="PaymentGateway.handleSuccess()" style="background:#f8fafc; padding:20px; border-radius:20px; display:inline-block; margin-bottom:20px; border:1px solid #e2e8f0; cursor:pointer;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=j.r818430@okicici&pn=BorderBridge&am=${this.options.amount}&cu=INR" style="width:200px; height:200px; display:block;">
                            <p style="font-size:0.6rem; color:#ff8c00; margin-top:10px; font-weight:800;">[CLICK QR TO SIMULATE SCAN]</p>
                        </div>
                        <div style="display:flex; justify-content:center; gap:15px; align-items:center; margin-bottom:20px;">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" style="height:20px;">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Pay_Logo.svg/1200px-Google_Pay_Logo.svg.png" style="height:20px;">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/PhonePe_Logo.svg/1200px-PhonePe_Logo.svg.png" style="height:20px;">
                        </div>
                        <p style="font-size:0.85rem; color:#64748b; margin-bottom:25px;">Waiting for payment confirmation...</p>
                    </div>

                    <!-- Step 3: Card -->
                    <div id="payment-step-3" style="display:none;">
                         <button onclick="PaymentGateway.showStep(1)" style="float:left; border:none; background:none; color:#64748b; cursor:pointer;"><i class="fas fa-arrow-left"></i></button>
                         <p style="font-weight:800; color:#0a192f; margin-bottom:20px; text-align:center;">Pay with Card</p>
                         <div style="display:flex; flex-direction:column; gap:15px;">
                            <div>
                                <label style="display:block; font-size:0.75rem; font-weight:700; color:#94a3b8; margin-bottom:5px;">CARD NUMBER</label>
                                <input type="text" id="cardNum" placeholder="XXXX XXXX XXXX XXXX" class="form-control" style="font-size:1.1rem; letter-spacing:2px;">
                            </div>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                                <div>
                                    <label style="display:block; font-size:0.75rem; font-weight:700; color:#94a3b8; margin-bottom:5px;">EXPIRY</label>
                                    <input type="text" id="cardExp" placeholder="MM / YY" class="form-control">
                                </div>
                                <div>
                                    <label style="display:block; font-size:0.75rem; font-weight:700; color:#94a3b8; margin-bottom:5px;">CVV</label>
                                    <input type="password" id="cardCvv" placeholder="***" class="form-control">
                                </div>
                            </div>
                            <button id="payWithCardBtn" onclick="PaymentGateway.processCard()" class="btn-gradient" style="width:100%; justify-content:center; margin-top:10px;">Pay ₹${this.options.amount.toLocaleString()}</button>
                         </div>
                    </div>
                    
                    <!-- Success Step -->
                    <div id="payment-success" style="display:none; text-align:center; padding:30px 0;">
                        <div style="width:80px; height:80px; background:#f0fdf4; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; color:#10b981; font-size:2.5rem; animation: successBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                            <i class="fas fa-check"></i>
                        </div>
                        <h2 style="color:#0a192f; margin:0;">Success!</h2>
                        <p style="color:#64748b; font-size:0.9rem;">Processing your application...</p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background:#f1f5f9; padding:15px; text-align:center;">
                    <button onclick="PaymentGateway.close()" style="border:none; background:none; color:#64748b; font-weight:700; cursor:pointer; font-size:0.85rem;">CANCEL PAYMENT</button>
                </div>
            </div>
        </div>

        <style>
            @keyframes paymentSlideIn {
                from { opacity:0; transform:scale(0.8) translateY(50px); }
                to { opacity:1; transform:scale(1) translateY(0); }
            }
            @keyframes successBounce {
                0% { transform: scale(0); }
                60% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
        </style>
        `;

        if (!document.getElementById('premiumPaymentModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        } else {
            document.getElementById('premiumPaymentModal').outerHTML = modalHtml;
        }

        document.getElementById('premiumPaymentModal').style.display = 'flex';
    },

    showStep: function(step) {
        document.getElementById('payment-step-1').style.display = step === 1 ? 'block' : 'none';
        document.getElementById('payment-step-2').style.display = step === 2 ? 'block' : 'none';
        document.getElementById('payment-step-3').style.display = step === 3 ? 'block' : 'none';
    },

    processCard: function() {
        const num = document.getElementById('cardNum').value;
        const exp = document.getElementById('cardExp').value;
        const cvv = document.getElementById('cardCvv').value;
        if(!num || !exp || !cvv) return alert('Enter full card details');
        
        const btn = document.getElementById('payWithCardBtn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authorizing...';
        btn.disabled = true;
        setTimeout(() => this.handleSuccess(), 1500);
    },

    handleSuccess: function() {
        document.getElementById('payment-step-2').style.display = 'none';
        document.getElementById('payment-step-3').style.display = 'none';
        document.getElementById('payment-success').style.display = 'block';
        
        setTimeout(() => {
            this.close();
            this.options.onSuccess();
        }, 2000);
    },

    close: function() {
        const modal = document.getElementById('premiumPaymentModal');
        if (modal) modal.style.display = 'none';
    }
};

window.PaymentGateway = PaymentGateway;
