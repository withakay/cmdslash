// Keyboard test
console.log('🎹 Keyboard handler loaded');

// Try multiple ways to capture the keyboard event
document.addEventListener('keydown', (event) => {
    console.log('Key pressed:', {
        key: event.key,
        code: event.code,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey
    });
    
    // Test for Cmd+/ (Mac)
    if (event.metaKey && event.key === '/') {
        event.preventDefault();
        event.stopPropagation();
        console.log('✅ Cmd+/ detected!');
        alert('Cmd+/ pressed!');
        return false;
    }
    
    // Test for Ctrl+/
    if (event.ctrlKey && event.key === '/') {
        event.preventDefault();
        event.stopPropagation();
        console.log('✅ Ctrl+/ detected!');
        alert('Ctrl+/ pressed!');
        return false;
    }
}, true); // Use capture phase

// Also try on window
window.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        console.log('✅ Window level: Shortcut detected!');
    }
}, true);