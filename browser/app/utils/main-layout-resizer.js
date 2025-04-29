const leftSide = document.getElementById('leftSide');
const resizer = document.getElementById('resizer');
const toggleButton = document.getElementById('toggleLeft');

let isResizing = false;
let lastUpdateTime = 0;
const updateInterval = 16; // ~60 fps

resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.classList.add('resizing');
    document.addEventListener('mousemove', throttledResize);
    document.addEventListener('mouseup', stopResize);
});

function throttledResize(e) {
    if (isResizing) {
        e.preventDefault();
        const currentTime = Date.now();
        if (currentTime - lastUpdateTime >= updateInterval) {
            requestAnimationFrame(() => {
                leftSide.style.width = `${e.clientX}px`;
            });
            lastUpdateTime = currentTime;
        }
    }
}

function stopResize() {
    isResizing = false;
    document.body.classList.remove('resizing');
    document.removeEventListener('mousemove', throttledResize);
}

toggleButton.addEventListener('click', () => {
    leftSide.classList.toggle('hidden');
});