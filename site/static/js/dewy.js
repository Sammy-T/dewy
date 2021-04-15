let darkModeOn = false;

let token;
let lastQuery;

const apiRoot = 'https://api.stackexchange.com/2.2';

const container = document.querySelector('main');
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const sortBy = document.querySelector('#sort-by');
const themeToggle = document.querySelector('#theme-toggle');

const templateChip = document.querySelector('#template-chip');
const templateCard = document.querySelector('#template-card');
const templateMsgConnect = document.querySelector('#template-msg-connect');

function showConnectMsg() {
    container.innerHTML = ''; // Clear any previous content

    const msgConnect = templateMsgConnect.content.firstElementChild.cloneNode(true);
    container.appendChild(msgConnect);
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

    container.appendChild(card);
}

async function searchBookmarks(query) {
    const queryTerms = query.toLowerCase().trim().split(/\s+/);
    console.log(queryTerms);

    function searchPost(post) {
        return queryTerms.some(term => {
            // Check tags
            const foundInTags = post.tags.some(tag => tag.toLowerCase() === term);
            if(foundInTags) return true;

            // Check title
            const foundInTitlePos = post.title.toLowerCase().indexOf(term);
            if(foundInTitlePos > -1) return true;

            // Check body
            const foundInBodyPos = post.body.toLowerCase().indexOf(term);
            return (foundInBodyPos > -1);
        });
    }

    const endpoint = `${apiRoot}/me/favorites?order=desc&sort=${sortBy.value}&site=stackoverflow&filter=!9_bDDxJY5&pagesize=100&access_token=${token}&key=${dewy.key}`;

    container.innerHTML = ''; // Clear any previous content

    let i = 1;
    let hasMore = false;

    do {
        let request = (i > 1) ? `${endpoint}&page=${i}` : endpoint;
        console.log(request);

        try {
            // const response = await fetch(request);
            // const responseJson = await response.json();
            const responseJson = dummyResponse; //// TODO: TEMP
            console.log(responseJson);

            // hasMore = responseJson.has_more; //// TODO: TEMP

            responseJson.items.forEach(post => {
                if(searchPost(post)) addCard(post);
            });
        } catch(error) {
            console.error(error);
            break;
        }

        i++;
    } while (hasMore);
}

async function fetchBookmarks() {
    const endpoint = `${apiRoot}/me/favorites?order=desc&sort=${sortBy.value}&site=stackoverflow&filter=!9_bDDxJY5&access_token=${token}&key=${dewy.key}`;

    container.innerHTML = ''; // Clear any previous content
    
    try {
        // const response = await fetch(endpoint);
        // const responseJson = await response.json();
        const responseJson = dummyResponse; //// TODO: TEMP
        console.log(responseJson);

        responseJson.items.forEach(post => addCard(post));
    } catch(error) {
        console.error(error);
    }
}

async function checkAuth() {
    const params = new URLSearchParams(location.search);
    const accessExpires = localStorage.getItem('dewy.accessExpires');

    if(params.has('code')) {
        const code = params.get('code');

        try {
            const response = await fetch('/.netlify/functions/authenticate', {
                method: 'POST',
                body: JSON.stringify({code: code})
            });

            const responseJson = await response.json();
            console.log(responseJson);

            if(!response.ok) return;

            localStorage.setItem('dewy.accessExpires', Date.parse(responseJson.expires));
        } catch(error) {
            console.error(error);
            return;
        }
    } else if(accessExpires < Date.now()) {
        return;
    }

    console.log('fetch');
    // fetchBookmarks(); //// TODO: TEMP
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
    checkAuth();

    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const query = searchInput.value.trim().toLowerCase();

        // Perform a search if the query is valid
        // and not a duplicate of the last one
        if(query !== '' && query !== lastQuery) {
            searchBookmarks(query);
            lastQuery = query;
        }
    });

    sortBy.addEventListener('change', () => {
        // Perform another search if there's already a query value entered
        const query = searchInput.value.trim().toLowerCase();
        if(query !== '') searchBookmarks(lastQuery);
    });
}

init();