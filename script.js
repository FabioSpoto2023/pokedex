let pokemons = [];
let pokemonsDetails = [];
let nextPage = '';
let lastSearch = '';

async function init() {
    let _pokemons = await getPokemons();

    for (let i = 0; i < _pokemons['results'].length; i++) {
        let pokemon = _pokemons['results'][i];
        pokemons.push(pokemon);
    }

    lockScreen();

    renderTitle(_pokemons['count']);

    await renderPokedex(pokemons, 0);
    await loadMore();
    searchEventListener();
    unlockScreen();
}

function renderTitle(pokemonsLength) {
    document.getElementById('title').innerHTML = `Pokedex (${pokemonsLength})`;
}

async function renderPokedex(_pokemons, renderStart) {
    let searchInput = document.getElementById('search');
    searchInput.style = 'display: none';

    let container = document.getElementById('container');

    if (renderStart < 1) {
        container.innerHTML = '';
    }

    destroyLoadMore();

    for (let i = renderStart; i < _pokemons.length; i++) {
        renderLoader(container);

        let name = _pokemons[i]['name'];

        let pokemonSpecies = await getPokemonSpecies(name);
        let pokemon = await getPokemon(name);

        let color = pokemonSpecies['color']['name'];
        let image = pokemon['sprites']['front_default'];
        let types = pokemon['types'];
        let id = pokemon['id'];

        destroyLoader();
        renderCard(container, id, name, color, image);

        for (let ii = 0; ii < types.length; ii++) {
            let typesContainer = document.querySelector(`div[id="card-${id}"] > div[class="card-content"] > div[class="types"]`);
            let typeName = types[ii]['type']['name'];

            renderTypes(typesContainer, typeName);
        }
    }

    renderLoadMore(container);
    searchInput.style = '';
    searchInput.focus();
}

function searchEventListener() {
    let searchInput = document.getElementById('search');

    if (lastSearch) {
        searchInput.value = lastSearch;
    }

    searchInput.addEventListener('input', (event) => {
        search(event.target.value);
    });

    if (searchInput.value) {
        searchInput.focus();
    }
}

function destroyLoadMore() {
    let loadMoreElement = document.getElementById('load-more');
    if (loadMoreElement) {
        loadMoreElement.remove();
    }
}

function renderLoader(container) {
    container.innerHTML += `
        <div class='loader'></div>
    `;
}

function destroyLoader() {
    let loaders = document.getElementsByClassName('loader');
    if (loaders.length > 0) {
        loaders[0].remove();
    }
}

function renderCard(container, id, name, color, image) {
    name = capitalizeFirstLetter(name);
    container.innerHTML += `
        <div id='card-${id}' class='card ${color}' onclick='showDialog(this)'>
            <div class='card-content'>
                <span class='card-name'>${name}</span>
                <div class='types'></div>
            </div>
            <img src='${image}'></img>
            <span class='card-id'>#${formatPokemonIdNumber(id)}</span>
        </div>
    `;
}

function renderTypes(typesContainer, typeName) {
    typeName = capitalizeFirstLetter(typeName);
    typesContainer.innerHTML += `
        <span class='type'>${typeName}</span>
    `;
}

function renderLoadMore(container) {
    container.innerHTML += `<button id='load-more' onclick='loadMore()'>Load More</button>`;
}

async function getPokemons() {
    let url = '';
    if (!nextPage) {
        url = `https://pokeapi.co/api/v2/pokemon`;
    } else {
        url = nextPage;
    }
    let response = await fetch(url);
    let data = await response.json();
    nextPage = data['next'];
    return data
}

async function getPokemon(name) {
    let url = `https://pokeapi.co/api/v2/pokemon/${name}`;
    let response = await fetch(url);
    let data = await response.json();
    return data
}

async function getPokemonSpecies(name) {
    let url = `https://pokeapi.co/api/v2/pokemon-species/${name}`;
    let response = await fetch(url);
    let data = await response.json();
    return data
}

async function loadMore() {
    let url = nextPage;
    let response = await fetch(url);
    let data = await response.json();
    nextPage = data['next'];

    for (let i = 0; i < data['results'].length; i++) {
        let pokemon = data['results'][i];
        pokemons.push(pokemon);
    }

    let renderStart = pokemons.length - 20;
    lockScreen();
    await renderPokedex(pokemons, renderStart);
    unlockScreen();
}

function lockScreen() {
    let dialog = document.getElementById('dialog');
    dialog.style.display = '';
    dialog.innerHTML = '';
}

function unlockScreen() {
    let dialog = document.getElementById('dialog');
    dialog.style.display = 'none';
    window.scrollTo(0, document.body.scrollHeight);
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatPokemonIdNumber(number) {
    var numString = String(number);
    var paddedString = '0000' + numString;
    return paddedString.slice(-4);
}

async function showDialog(card) {
    let dialog = document.getElementById('dialog')
    dialog.style = '';
    document.body.style.overflow = 'hidden';

    let cardId = parseInt(card.id.replace('card-', ''));
    let cardColor = card.className.replace('card ', '');

    let _pokemon = await getPokemon(cardId);
    let name = capitalizeFirstLetter(_pokemon['name']);
    let image = _pokemon['sprites']['front_default'];
    let types = _pokemon['types'];

    currentCardId = cardId;
    renderDialog(dialog, name, cardColor, cardId, image);

    let _types = document.querySelector('div[class="_types"]');

    for (let i = 0; i < types.length; i++) {
        let type = types[i]['type']['name'];
        type = capitalizeFirstLetter(type);
        _types.innerHTML += `<div class='type'>${type}</div>`;
    }

    let statsName = getStats(_pokemon)[0];
    let statsValue = getStats(_pokemon)[1];

    renderChart(statsName, statsValue);    
    renderArrows();
}

function renderArrows() {
    let arrows = document.querySelectorAll('img[class*="arrow-"]');
    if (lastSearch && arrows) {
        for (let i = 0; i < arrows.length; i++) {
            let arrow = arrows[i];
            arrow.style = 'display: none';
        }
    }
}

function getStats(pokemonsDetails) {
    let statsName = [];
    let statsValue = [];

    for (let i = 0; i < pokemonsDetails['stats'].length; i++) {
        let name = pokemonsDetails['stats'][i]['stat']['name'];
        let value = pokemonsDetails['stats'][i]['base_stat'];

        if (name.includes('-')) {
            name = capitalizeFirstLetter(name.split('-')[0]) + ' ' + capitalizeFirstLetter(name.split('-')[1])
        }

        statsName.push(capitalizeFirstLetter(name));
        statsValue.push(value);
    }

    return [statsName, statsValue];
}

function renderDialog(dialog, name, cardColor, cardId, image) {
    dialog.innerHTML = `
        <img class='arrow-left' src="images/arrow-back-outline.svg" onclick='backPokemon(${cardId - 1})'>
        <div class="dialog ${cardColor}">
            <header>
                <h2>${name}</h2>
                <h3 class='card-id'>#${formatPokemonIdNumber(cardId)}</h3>
                <img class='image-close' src='images/close-outline.svg' onclick='closeDialog()'></img>
            </header>
            <div class='_types'></div>
            <div class='dialog-image-container'><img src='${image}'></img></div>
            <div class='chart'><canvas id="chart-stats"></canvas></div>
        </div>
        <img class='arrow-right' src="images/arrow-forward-outline.svg" onclick='nextPokemon(${cardId})'>
    `;
}

function closeDialog() {
    document.getElementById('dialog').style = 'display: none';
    document.body.style.overflow = '';
}

function renderChart(statsName, statsValue) {
    const ctx = document.getElementById('chart-stats');

    new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: statsName,
            datasets: [{
                label: 'Stats',
                data: statsValue,
                backgroundColor: [
                    'rgba(245, 81, 95, 0.5)',
                    'rgba(200, 166, 132, 0.5)',
                    'rgba(250, 217, 97, 0.5)',
                    'rgba(3, 110, 216, 0.5)',
                    'rgba(194, 236, 81, 0.5)',
                    'rgba(120, 75, 160, 0.5)'
                ],
                borderWidth: 0,
            }]
        },
        options: {
            layout: {
                padding: {
                    left: 8,
                    right: 8,
                    top: 8,
                    bottom: 16
                }
            },
            color: '#10121c',
            scales: {
                y: {
                    beginAtZero: true
                }
            },
        }
    });
}

function nextPokemon(cardId) {
    if (cardId > pokemons.length - 1) {
        cardId = 0;
    }

    let card = document.getElementById(`card-${cardId + 1}`);
    if (card) {
        showDialog(card);
    }
}

function backPokemon(cardId) {
    if (cardId <= 0) {
        cardId = pokemons.length;
    }

    let card = document.getElementById(`card-${cardId}`);
    if (card) {
        showDialog(card);
    }
}

async function search(value) {
    let found = [];

    if (value.length == 0) {
        lastSearch = '';
        await renderPokedex(pokemons, 0)
    }

    if (value.length >= 3) {
        lastSearch = value;
        for (let i = 0; i < pokemons.length; i++) {
            let pokemon = pokemons[i];
            let name = pokemons[i]['name']
            if (name.includes(value) && !found.includes(name)) {
                found.push(pokemon);
            }
        }

        await renderPokedex(found, 0)
        destroyLoadMore();
    }
}