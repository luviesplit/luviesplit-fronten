function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.classList.add('show');
    if (isError) {
        element.style.color = '#dc3545';
    } else {
        element.style.color = '#28a745';
    }
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

