document.addEventListener('DOMContentLoaded', () => {
    const bgColorPicker = document.getElementById('bg-color-picker');
    const resetBtn = document.getElementById('reset-os-btn');

    // --- API to communicate with parent OS ---
    function postToOS(type, payload) {
        window.parent.postMessage({ source: 'ligos-app', type, payload }, '*');
    }

    // --- Load initial value ---
    const initialColor = window.parent.document.body.style.backgroundColor;
    if (initialColor) {
        bgColorPicker.value = initialColor;
    }

    // --- Event Listeners ---
    bgColorPicker.addEventListener('input', (e) => {
        postToOS('os:setConfig', { key: 'backgroundColor', value: e.target.value });
    });

    resetBtn.addEventListener('click', () => {
        const confirmation = prompt('This will delete all apps and files. Type "RESET" to confirm.');
        if (confirmation === 'RESET') {
            postToOS('os:reset', null);
        } else {
            alert('Reset cancelled.');
        }
    });
}); 