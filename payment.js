document.addEventListener('DOMContentLoaded', function () {
    const stripe = Stripe('pk_test_51RNLxE4P7WBOXyuuGFhHP9jRfomKL3mkohcNCkRXvP4uh7hj1CkCGyVIazHIeJdFISqhx4pCQjyW10PNiZfy8FdD00DHp6Lbb6');
    const elements = stripe.elements();
    const cardElement1 = elements.create('card');
    const cardElement2 = elements.create('card');
    cardElement1.mount('#card-element1');
    cardElement2.mount('#card-element2');

    const authForm = document.getElementById('auth-form');
    const paymentForm = document.getElementById('payment-form');
    const logoutButton = document.getElementById('logout-button');
    const authMessage = document.getElementById('auth-message');
    const feeMessage = document.getElementById('fee-message');
    const errorMessage = document.getElementById('error-message');
    const tokensSection = document.getElementById('tokens-section');
    const marsSection = document.getElementById('mars-section');
    const lvtBalance = document.getElementById('lvt-balance');
    const ecoImpact = document.getElementById('eco-impact');
    const exchangeLvtButton = document.getElementById('exchange-lvt');
    const donateLvtButton = document.getElementById('donate-lvt');
    const marsPaymentButton = document.getElementById('mars-payment');

    let isAuthenticated = false;
    let userLvtBalance = 0; // Simulated LVT balance
    let userEcoImpact = 0; // Simulated eco impact
    let achievements = []; // Simulated achievements

    // Import utilities
    const { showMessage, validateEmail, validatePassword, formatLVT, formatEcoImpact, signLuvieChainTransaction } = window;

    // Check authentication
    fetch('https://luviesplit-backend.herokuapp.com/check-auth', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        isAuthenticated = true;
        authForm.style.display = 'none';
        paymentForm.style.display = 'block';
        tokensSection.style.display = 'block';
        marsSection.style.display = 'block';
        logoutButton.style.display = 'block';
        if (data.access_token) {
            localStorage.setItem('access_token', data.access_token);
        }
        userLvtBalance = data.lvt_balance || 0;
        userEcoImpact = data.eco_impact || 0;
        lvtBalance.textContent = formatLVT(userLvtBalance);
        ecoImpact.textContent = formatEcoImpact(userEcoImpact);
    })
    .catch(error => {
        authForm.style.display = 'block';
        paymentForm.style.display = 'none';
        tokensSection.style.display = 'none';
        marsSection.style.display = 'none';
        logoutButton.style.display = 'none';
        showMessage(authMessage, `Please login to continue. Error: ${error.message}`, true);
    });

    // Handle form submission (login/register)
    authForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const isRegister = event.submitter.id === 'register-button';
        const endpoint = isRegister ? 'register' : 'login';

        if (!validateEmail(email)) {
            showMessage(authMessage, 'Please enter a valid email address.', true);
            return;
        }
        if (!validatePassword(password)) {
            showMessage(authMessage, 'Password must be at least 6 characters.', true);
            return;
        }

        try {
            const response = await fetch(`https://luviesplit-backend.herokuapp.com/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            if (data.success) {
                if (isRegister) {
                    showMessage(authMessage, 'Registration successful! Please login.');
                } else {
                    isAuthenticated = true;
                    localStorage.setItem('access_token', data.access_token);
                    authForm.style.display = 'none';
                    paymentForm.style.display = 'block';
                    tokensSection.style.display = 'block';
                    marsSection.style.display = 'block';
                    logoutButton.style.display = 'block';
                    userLvtBalance = data.lvt_balance || 0;
                    userEcoImpact = data.eco_impact || 0;
                    lvtBalance.textContent = formatLVT(userLvtBalance);
                    ecoImpact.textContent = formatEcoImpact(userEcoImpact);
                    showMessage(authMessage, '');
                }
            } else {
                showMessage(authMessage, data.error || 'Unknown error', true);
            }
        } catch (error) {
            showMessage(authMessage, `Error: ${error.message}`, true);
        }
    });

    // Handle logout
    logoutButton.addEventListener('click', async function () {
        try {
            const response = await fetch('https://luviesplit-backend.herokuapp.com/logout', {
                method: 'POST',
                credentials: 'include'
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            isAuthenticated = false;
            localStorage.removeItem('access_token');
            authForm.style.display = 'block';
            paymentForm.style.display = 'none';
            tokensSection.style.display = 'none';
            marsSection.style.display = 'none';
            logoutButton.style.display = 'none';
            showMessage(authMessage, 'Logged out successfully.');
        } catch (error) {
            showMessage(authMessage, `Error: ${error.message}`, true);
        }
    });

    // Handle payment
    paymentForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const amount = parseFloat(document.getElementById('amount').value);
        const card1Amount = parseFloat(document.getElementById('card1-amount').value);
        const card2Amount = parseFloat(document.getElementById('card2-amount').value);
        const lvtAmount = parseFloat(document.getElementById('lvt-amount').value) || 0;

        if (isNaN(amount) || isNaN(card1Amount) || isNaN(card2Amount)) {
            showMessage(errorMessage, 'Please enter valid amounts.', true);
            return;
        }

        if (card1Amount + card2Amount + lvtAmount !== amount) {
            showMessage(errorMessage, 'The sum of amounts must equal the total amount.', true);
            return;
        }
        if (lvtAmount > userLvtBalance) {
            showMessage(errorMessage, 'Insufficient LVT balance.', true);
            return;
        }

        try {
            const result1 = await stripe.createToken(cardElement1);
            if (result1.error) {
                showMessage(errorMessage, result1.error.message, true);
                return;
            }

            const result2 = await stripe.createToken(cardElement2);
            if (result2.error) {
                showMessage(errorMessage, result2.error.message, true);
                return;
            }

            const cards = [
                { amount: card1Amount * 100, token: result1.token.id },
                { amount: card2Amount * 100, token: result2.token.id }
            ];
            const response = await fetch('https://luviesplit-backend.herokuapp.com/split_payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ amount: amount * 100, cards, lvt_amount: lvtAmount * 100 })
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            if (data.success) {
                const lvtEarned = amount * 0.01; // 1% cashback
                userLvtBalance += lvtEarned;
                userEcoImpact += lvtEarned * 0.1; // 10% to eco
                lvtBalance.textContent = formatLVT(userLvtBalance);
                ecoImpact.textContent = formatEcoImpact(userEcoImpact);
                // Check for achievements
                if (!achievements.includes('split-master') && amount >= 100) {
                    achievements.push('split-master');
                    userLvtBalance += 5; // Bonus 5 LVT for achievement
                    lvtBalance.textContent = formatLVT(userLvtBalance);
                    showMessage(feeMessage, 'Achievement unlocked: Split Master! +5 LVT');
                }
                showMessage(feeMessage, `Payment successful! Fee: $${(data.fee / 100).toFixed(2)}. Earned ${formatLVT(lvtEarned)}!`);
            } else {
                showMessage(errorMessage, data.error || 'Payment failed', true);
            }
        } catch (error) {
            showMessage(errorMessage, `Error: ${error.message}`, true);
        }
    });

    // Handle LVT exchange (placeholder)
    exchangeLvtButton.addEventListener('click', function () {
        showMessage(feeMessage, 'LVT exchange coming soon with LuvieChain!', false);
    });

    // Handle LVT donation (placeholder)
    donateLvtButton.addEventListener('click', function () {
        showMessage(feeMessage, 'LVT donation to eco projects coming soon!', false);
    });

    // Handle Mars payment (placeholder)
    marsPaymentButton.addEventListener('click', function () {
        const mockTx = signLuvieChainTransaction(1, 'mars-colony');
        showMessage(feeMessage, `Mars Mode payment queued: ${mockTx.txId}. Coming soon with LuvieChain!`, false);
    });
});