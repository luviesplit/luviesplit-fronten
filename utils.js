// Utility functions for LuvieSplit
function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.classList.add('show');
    element.style.color = isError ? '#dc3545' : '#28a745';
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function formatLVT(amount) {
    return parseFloat(amount).toFixed(2) + ' LVT';
}

function formatEcoImpact(lvt) {
    const trees = (lvt * 0.01).toFixed(2); // 1 LVT = 0.01 tree/zone
    return `${trees} trees/zones`;
}

export { showMessage, validateEmail, validatePassword, formatLVT, formatEcoImpact };