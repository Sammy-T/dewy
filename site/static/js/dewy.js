let darkModeOn = false;

let authLink;
let lastQuery;

const apiRoot = 'https://api.stackexchange.com/2.2';

const container = document.querySelector('main');
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const sortBy = document.querySelector('#sort-by');
const themeToggle = document.querySelector('#theme-toggle');
const logoutBtn = document.querySelector('#btn-logout');

const templateTag = document.querySelector('#template-tag');
const templateCard = document.querySelector('#template-card');
const templateMsgConnect = document.querySelector('#template-msg-connect');
const templateModalLogout = document.querySelector('#template-modal-logout');

/** 
 * Displays the 'connect' message. This includes a button which
 * triggers the access code request when clicked.
 */
function showConnectMsg() {
    if(!authLink) {
        console.error('Missing auth link');
        return;
    }

    container.innerHTML = ''; // Clear any previous content

    const msgConnect = templateMsgConnect.content.firstElementChild.cloneNode(true);
    const connectLink = msgConnect.querySelector('.connect');
    connectLink.href = authLink;
    container.appendChild(msgConnect);
}

/**
 * Adds a card populated with post data to the main container. 
 * @param {*} post - A Stack Overflow post item.
 */
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

    const tagContainer = card.querySelector('.tag-container');

    post.tags.forEach(tag => {
        const tagEl = templateTag.content.firstElementChild.cloneNode(true);
        tagEl.innerText = tag;

        // When clicked, append tag to query and search the bookmarks
        tagEl.addEventListener('click', (event) => {
            event.preventDefault();

            searchInput.value = `${searchInput.value} ${tag}`.trim();
            const query = searchInput.value.toLowerCase();

            searchBookmarks(query);
        });

        tagContainer.appendChild(tagEl);
    });

    container.appendChild(card);
}

/**
 * Requests and searches through bookmarked posts for matching query text.
 * Then, adds the matched posts to the container.
 * @param {string} query - A trimmed and lowercase query string.
 */
async function searchBookmarks(query) {
    const queryTerms = query.split(/\s+/);
    console.log(queryTerms);

    /**
     * A helper to search a post for the current query terms.
     * @param {*} post - A Stack Overflow post item.
     * @returns {boolean} Whether the post contains a query term.
     */
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

    container.innerHTML = ''; // Clear any previous content

    let page = 1;
    let hasMore = false;

    do {
        try {
            const response = await fetch('/.netlify/functions/fetch-bookmarks', {
                method: 'POST',
                body: JSON.stringify({
                    sort: sortBy.value, 
                    page: page, 
                    fullPages: true
                })
            });
    
            const responseJson = await response.json();
    
            if(!response.ok) {
                console.error('Error fetching bookmarks', responseJson);
                showConnectMsg();
                break;
            }
    
            console.log(responseJson);

            // Continue requesting pages while each response indicates
            // that there are more results.
            hasMore = responseJson.has_more;

            responseJson.items.forEach(post => {
                if(searchPost(post)) addCard(post);
            });

        } catch(error) {
            console.error(error);
            break;
        }
        page++;
        
    } while (hasMore);
}

/** Populates the page with an initial set of bookmarked posts. */
async function fetchBookmarks() {
    container.innerHTML = ''; // Clear any previous content
    
    try {
        const response = await fetch('/.netlify/functions/fetch-bookmarks', {
            method: 'POST',
            body: JSON.stringify({sort: sortBy.value})
        });

        const responseJson = await response.json();

        if(!response.ok) {
            console.error('Error fetching bookmarks', responseJson);
            showConnectMsg();
            return;
        }

        logoutBtn.disabled = false;

        console.log(responseJson);
        responseJson.items.forEach(post => addCard(post));

    } catch(error) {
        console.error(error);
    }
}

/** 
 * Triggers a token request if an access code is found in the url
 * parameters or checks the last token's expiration date stored
 * in the cookie. 
 * 
 * Then, attempts an initial request for bookmarked posts
 * if a valid token likely exists.
 */
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

    fetchBookmarks();
}

/** Fetches the link used to initiate auth. */
async function fetchAuthLink() {
    try {
        const response = await fetch('/.netlify/functions/fetch-auth-link');
        const responseJson = await response.json();
        console.log(responseJson);

        if(!response.ok) return;

        authLink = responseJson.authLink;

    } catch(error) {
        console.error(error);
    }
}

/** Logs out the current user and refreshes the page. */
async function logout() {
    try {
        const response = await fetch('/.netlify/functions/logout');
        const responseJson = await response.json();
        console.log(responseJson);

        if(!response.ok) return;

        location.reload(); // Refresh the page
    } catch(error) {
        console.error(error);
    }
}

/** Applies a previously saved theme and responds to theme changes. */
function initTheme() {
    /** Refreshes the layout and styles to reflect the current theme. */
    function refreshTheme() {
        const themBtnIcon = themeToggle.querySelector('img');
        themBtnIcon.src = (darkModeOn) ? 'img/brightness-4-dark.svg' : 'img/brightness-4.svg';

        const logoutBtnIcon = logoutBtn.querySelector('img');
        logoutBtnIcon.src = (darkModeOn) ? 'img/logout-dark.svg' : 'img/logout.svg';
    
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

async function init() {
    initTheme();
    await fetchAuthLink();
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

    logoutBtn.addEventListener('click', () => {
        // If there's already a modal being displayed, replace it
        const previousModal = container.querySelector('.modal');
        if(previousModal) previousModal.remove();

        // Set up the Logout modal and add it to the main container
        const logoutModal = templateModalLogout.content.firstElementChild.cloneNode(true);
        const modalFade = logoutModal.querySelector('.modal-fade');
        const logoutBtn = logoutModal.querySelector('.logout');
        const cancelBtn = logoutModal.querySelector('.cancel');

        const removeModal = () => logoutModal.remove();
        modalFade.addEventListener('click', removeModal);
        cancelBtn.addEventListener('click', removeModal);
        logoutBtn.addEventListener('click', logout);
        
        container.appendChild(logoutModal);
    });
}

init();