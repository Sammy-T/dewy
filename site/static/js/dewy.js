let darkModeOn = false;

let authLink;
let lastQuery;
let results;

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
const templateMsgLoading = document.querySelector('#template-msg-loading');
const templateModalLogout = document.querySelector('#template-modal-logout');
const templateMsgBarCookie = document.querySelector('#template-msg-bar-cookie');

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

/** Displays the 'loading' message. */
function showLoadingMsg() {
    container.innerHTML = ''; // Clear any previous content

    const msgLoading = templateMsgLoading.content.firstElementChild.cloneNode(true);
    container.appendChild(msgLoading);
}

/** Displays the 'cookie' message and stores the status when confirmed. */
function showCookieMsgBar() {
    const msgBarCookie = templateMsgBarCookie.content.firstElementChild.cloneNode(true);
    const confirmButton = msgBarCookie.querySelector('button');

    // Store the confirmation and dismiss the message
    confirmButton.addEventListener('click', () => {
        localStorage.setItem('dewy.consent', 'true');
        msgBarCookie.remove();
    });

    container.after(msgBarCookie); // Append the msg bar after the main container
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
    card.querySelector('.post-author').innerHTML = post.owner.display_name;
    card.querySelector('.post-date').innerText = postDate;
    card.querySelector('details').innerHTML += post.body;

    const tagContainer = card.querySelector('.tag-container');

    post.tags.forEach(tag => {
        const tagEl = templateTag.content.firstElementChild.cloneNode(true);
        tagEl.innerText = tag;

        // When clicked, append tag to query and search the bookmarks
        tagEl.addEventListener('click', (event) => {
            event.preventDefault();

            searchInput.value = `${searchInput.value} [${tag}]`.trim();
            const query = searchInput.value.toLowerCase();

            searchBookmarks(query);
        });

        tagContainer.appendChild(tagEl);
    });

    container.appendChild(card);
}

/**
 * Searches through bookmarked posts for matching query text.
 * Then, adds the matched posts to the container.
 * @param {string} query - A trimmed and lowercase query string.
 */
async function searchBookmarks(query) {
    if(results.length === 0) {
        console.warn('No results found.');
        return;
    }

    const exactRegex = /"(.*?)"/g; // Look for characters between quotes
    const exactTerms = [...query.matchAll(exactRegex)].map(match => match[1]);
    console.log('exact', exactTerms);

    const tagRegex = /\[(.*?)\]/g; // Look for characters between brackets
    const tagTerms = [...query.matchAll(tagRegex)].map(match => match[1]);
    console.log('tag', tagTerms);

    // Remove the exact and tag terms from the query
    query = query.replaceAll(exactRegex, '').replaceAll(tagRegex, '').trim();

    const queryTerms = (query.length > 0) ? query.split(/\s+/) : [];
    console.log('query', queryTerms);

    /**
     * A helper to search a post for the current query terms.
     * @param {*} post - A Stack Overflow post item.
     * @returns {boolean} Whether the post contains a query term.
     */
    function searchPost(post) {
        const tagSearch = term => {
            // Check if the term is in the tags
            return post.tags.some(tag => tag.toLowerCase() === term);
        };

        const querySearch = term => {
            // Check if the term is in the tags
            const foundInTags = post.tags.some(tag => tag.toLowerCase() === term);
            if(foundInTags) return true;

            // Check if the term is in the title
            const foundInTitlePos = post.title.toLowerCase().indexOf(term);
            if(foundInTitlePos > -1) return true;

            // Check if the term is in the body
            const foundInBodyPos = post.body.toLowerCase().indexOf(term);
            return (foundInBodyPos > -1);
        };

        const tagsMatch = (tagTerms.length > 0) ? tagTerms.every(tagSearch) : true;
        if(!tagsMatch) return false;

        const exactMatch = (exactTerms.length > 0) ? exactTerms.every(querySearch) : true;
        if(!exactMatch) return false;

        const queryMatch = (queryTerms.length > 0) ? queryTerms.some(querySearch) : true;
        return tagsMatch && exactMatch && queryMatch;
    }

    container.innerHTML = ''; // Clear any previous content

    results.forEach(post => {
        if(searchPost(post)) addCard(post);
    });
}

/** Requests bookmarked posts and stores the results in an array. */
async function fetchBookmarks() {
    showLoadingMsg()

    results = []; // Clear any previous results

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

            if(!response.ok) {
                showConnectMsg();
                throw new Error('Unable to fetch bookmarks');
            }
    
            const responseJson = await response.json();

            console.log(responseJson);

            results.push(...responseJson.items);

            // Continue requesting pages while each response indicates
            // that there are more results.
            hasMore = responseJson.has_more;

            logoutBtn.disabled = false; // Enable the logout button

        } catch(error) {
            console.error(error);
            break;
        }
        page++;
        
    } while(hasMore);
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

            if(!response.ok) throw new Error('Unable to check auth');

            const responseJson = await response.json();
            console.log(responseJson);

            localStorage.setItem('dewy.accessExpires', Date.parse(responseJson.expires));
        } catch(error) {
            console.error(error);
            return;
        }
    } else if(accessExpires < Date.now()) {
        return;
    }

    // Make an initial request for bookmarks and display the full results
    await fetchBookmarks();
    searchBookmarks('');
}

/** Fetches the link used to initiate auth. */
async function fetchAuthLink() {
    try {
        const response = await fetch('/.netlify/functions/fetch-auth-link');
        if(!response.ok) throw new Error('Unable to fetch auth link');

        const responseJson = await response.json();
        console.log(responseJson);

        authLink = responseJson.authLink;

    } catch(error) {
        console.error(error);
    }
}

/** Logs out the current user and refreshes the page. */
async function logout() {
    try {
        const response = await fetch('/.netlify/functions/logout');
        if(!response.ok) throw new Error('Unable to log out');

        const responseJson = await response.json();
        console.log(responseJson);

        location.reload(); // Refresh the page
    } catch(error) {
        console.error(error);
    }
}

/** Applies a previously saved theme and responds to theme changes. */
function initTheme() {
    /** Refreshes the layout and styles to reflect the current theme. */
    function refreshTheme() {    
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

    // Display the Cookie message if it's not already confirmed
    if(localStorage.getItem('dewy.consent') !== 'true') showCookieMsgBar();

    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const query = searchInput.value.trim().toLowerCase();

        // Perform a search if the query is not a duplicate of the last one
        if(query !== lastQuery) {
            searchBookmarks(query);
            lastQuery = query;
        }
    });

    sortBy.addEventListener('change', async () => {
        const query = searchInput.value.trim().toLowerCase();

        // Make a new request using the updated sort value then perform a search
        await fetchBookmarks();
        searchBookmarks(query);
        lastQuery = query;
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