let darkModeOn = false;

function init() {
    // Toggle dark mode
    document.querySelector('#mode-toggle').addEventListener('click', function() {
        darkModeOn = !darkModeOn;
    
        const buttonIcon = this.querySelector('img');
        buttonIcon.src = (darkModeOn) ? 'img/brightness-4-dark.svg' : 'img/brightness-4.svg';
    
        if(darkModeOn) {
            document.body.classList.add('theme-dark');
        }else{
            document.body.classList.remove('theme-dark');
        }
    });
}

init();