let darkModeOn = false;

const main = document.querySelector('main');
const themeToggle = document.querySelector('#theme-toggle');

const templateMsgConnect = document.querySelector('#template-msg-connect');

function showConnectMsg() {
    const msgConnect = templateMsgConnect.content.firstElementChild.cloneNode(true);
    main.appendChild(msgConnect);
}

/** Apply a previously saved theme and respond to theme changes. */
function initTheme() {
    /** Refresh the layout and styles to reflect the current theme. */
    function refreshTheme() {
        const buttonIcon = themeToggle.querySelector('img');
        buttonIcon.src = (darkModeOn) ? 'img/brightness-4-dark.svg' : 'img/brightness-4.svg';
    
        if(darkModeOn) {
            document.body.classList.add('theme-dark');
        }else{
            document.body.classList.remove('theme-dark');
        }
    }

    // Toggle theme mode
    themeToggle.addEventListener('click', () => {
        darkModeOn = !darkModeOn;
        refreshTheme();

        // Store the selected theme mode
        localStorage.setItem('dewy.theme', (darkModeOn) ? 'dark' : 'light');
    });

    // Check for saved theme mode & update to saved value
    const savedTheme = localStorage.getItem('dewy.theme');

    if(savedTheme) {
        darkModeOn = (savedTheme === 'dark');
        refreshTheme();
    }
}

function init() {
    initTheme();
    showConnectMsg();
}

init();