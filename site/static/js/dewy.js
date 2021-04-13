let darkModeOn = false;

let token;

const apiRoot = 'https://api.stackexchange.com/2.2';

const main = document.querySelector('main');
const themeToggle = document.querySelector('#theme-toggle');

const templateChip = document.querySelector('#template-chip');
const templateCard = document.querySelector('#template-card');
const templateMsgConnect = document.querySelector('#template-msg-connect');

function showConnectMsg() {
    const msgConnect = templateMsgConnect.content.firstElementChild.cloneNode(true);
    main.appendChild(msgConnect);
}

function addCard(post) {
    const card = templateCard.content.firstElementChild.cloneNode(true);

    const postDate = new Intl.DateTimeFormat().format(new Date(post.creation_date * 1000));

    if(post.is_answered) card.querySelector('.metric-answers').classList.add('answered');

    card.querySelector('.post-score').innerText = post.score;
    card.querySelector('.post-answers').innerText = post.answer_count;
    card.querySelector('.post-link').href = post.link;
    card.querySelector('.post-title').innerHTML = post.title;
    card.querySelector('.post-author').innerText = post.owner.display_name;
    card.querySelector('.post-date').innerText = postDate;
    card.querySelector('details').innerHTML += post.body;

    const chipContainer = card.querySelector('.chip-container');

    post.tags.forEach(tag => {
        const chip = templateChip.content.firstElementChild.cloneNode(true);
        chip.innerText = tag;

        chipContainer.appendChild(chip);
    });

    main.appendChild(card);
}

async function fetchBookmarks() {
    const endpoint = `${apiRoot}/me/favorites?order=desc&sort=added&site=stackoverflow&filter=!9_bDDxJY5&access_token=${token}&key=${dewy.key}`;
    
    try {
        // const response = await fetch(endpoint);
        // const responseJson = await response.json();
        const responseJson = dummyResponse; //// TODO: TEMP
        console.log(responseJson);

        responseJson.items.forEach(post => addCard(post));
    } catch(err) {
        console.error(err);
    }
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