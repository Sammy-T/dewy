let darkModeOn = false;

let token;

const apiRoot = 'https://api.stackexchange.com/2.2';

const main = document.querySelector('main');
const themeToggle = document.querySelector('#theme-toggle');

const templateMsgConnect = document.querySelector('#template-msg-connect');

async function fetchBookmarks() {
    const endpoint = `${apiRoot}/me/favorites?order=desc&sort=added&site=stackoverflow&access_token=${token}&key=${dewy.key}`;
    
    try {
        const response = await fetch(endpoint);
        const responseJson = await response.json();

        console.log(responseJson);
    } catch(err) {
        console.error(err);
    }
}

function showConnectMsg() {
    const msgConnect = templateMsgConnect.content.firstElementChild.cloneNode(true);
    main.appendChild(msgConnect);
}

function checkToken() {
    // Check for token in the hash
    const hash = location.hash;
    const hashParams = new URLSearchParams(hash.substring(1));

    if(hashParams.has('access_token')) {
        token = hashParams.get('access_token');
        //// TODO: Store token
    } else {
        //// TODO: Check stored
    }

    if(token) {
        fetchBookmarks();
    } else {
        showConnectMsg();
    }
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
    checkToken();
}

init();