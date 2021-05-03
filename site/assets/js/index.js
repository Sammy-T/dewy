// Include external JavaScript
const anime = require('animejs');

// Add your JavaScript
function animateBoardBg() {
    anime({
        targets: '.billboard',
        backgroundImage: function() {
            const r = anime.random(50, 150);
            const g = anime.random(50, 150);
            const b = anime.random(50, 150);
            const color1 = `rgb(${r}, ${g}, ${b})`;

            const r2 = anime.random(50, 150);
            const g2 = anime.random(50, 150);
            const b2 = anime.random(50, 150);
            const color2 = `rgb(${r2}, ${g2}, ${b2})`;

            return `linear-gradient(45deg, ${color1}, ${color2})`;
        },
        easing: 'easeInOutSine',
        duration: 3000,
        complete: animateBoardBg
    });
}

console.log('Edit \'site/assets/js/index.js\' with your JavaScript.');
animateBoardBg();