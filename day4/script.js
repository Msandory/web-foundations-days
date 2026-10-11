const noteText = document.getElementById('note-text');
const charCount = document.getElementById('char-count');
const wordCount = document.getElementById('word-count');
const clearBtn = document.getElementById('clear-btn');
const themeToggle = document.getElementById('theme-toggle');

function updateCounts() {
    const text = noteText.value;
    const length = text.length;
    // Count words accurately by splitting whitespace
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

    // Display counts
    charCount.textContent = `${length} / 200 characters`;
    wordCount.textContent = `${words} words`;

    // Manage warning and over classes
    charCount.classList.remove('warning', 'over');
    if (length > 200) {
        charCount.classList.add('over');
    } else if (length > 180) {
        charCount.classList.add('warning');
    }
}

function saveDraft() {
    localStorage.setItem('noteDraft', noteText.value);
}

noteText.addEventListener('input', () => {
    updateCounts();
    saveDraft();
});

// Clear button functionality
clearBtn.addEventListener('click', () => {
    noteText.value = '';
    localStorage.removeItem('noteDraft');
    updateCounts();
    noteText.focus();
});

// Escape key inside textarea clears it
noteText.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        noteText.value = '';
        localStorage.removeItem('noteDraft');
        updateCounts();
    }
});

themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    if (isDark) {
        themeToggle.textContent = 'Light mode';
        localStorage.setItem('theme', 'dark');
    } else {
        themeToggle.textContent = 'Dark mode';
        localStorage.setItem('theme', 'light');
    }
});

window.addEventListener('DOMContentLoaded', () => {
    // Restore saved draft
    const savedDraft = localStorage.getItem('noteDraft');
    if (savedDraft !== null) {
        noteText.value = savedDraft;
    }

    // Restore saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        themeToggle.textContent = 'Light mode';
    } else {
        themeToggle.textContent = 'Dark mode';
    }

    // Call updateCounts on load
    updateCounts();
});