// Roman Tech - Spain Technology News App
const API_TOKEN = 'SbOEe5InvpDhtdhBXbVFTqF7Ecu9EQXRrsYGPTK7';
const BASE_URL = 'https://api.thenewsapi.com/v1/news';

// State
const state = {
    view: 'tech',
    searchQuery: '',
    page: 1,
    limit: 6,
    language: 'es',
    dateAfter: ''
};

// Elements
const els = {
    navItems: document.querySelectorAll('.nav-item'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    results: document.getElementById('results-container'),
    viewTitle: document.getElementById('current-view-title'),
    pagination: document.getElementById('pagination-controls'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    pageInfo: document.getElementById('page-info'),
    modal: document.getElementById('modal'),
    modalBody: document.getElementById('modal-body'),
    closeModal: document.getElementById('close-modal'),
    loading: document.getElementById('loading-indicator'),
    langSelect: document.getElementById('lang-select'),
    dateSelect: document.getElementById('date-select'),
    applyFilters: document.getElementById('apply-filters')
};

// API Fetcher
async function fetchAPI(endpoint, params = {}) {
    params.api_token = API_TOKEN;
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
            url.searchParams.append(key, params[key]);
        }
    });

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Error al conectar con el servidor de noticias');
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Data Loader
async function loadData() {
    els.results.innerHTML = '';
    els.loading.classList.remove('hidden');
    els.pagination.style.display = 'none';

    try {
        let response;
        let params = {
            language: state.language,
            categories: 'tech',
            page: state.page,
            limit: state.limit
        };

        if (state.dateAfter) {
            params.published_after = state.dateAfter;
        }

        if (state.searchQuery) {
            response = await fetchAPI('/all', { ...params, search: state.searchQuery });
        } else {
            switch (state.view) {
                case 'tech':
                    response = await fetchAPI('/all', { ...params, search: 'tecnología españa innovación' });
                    break;
                case 'ai':
                    response = await fetchAPI('/all', { ...params, search: 'inteligencia artificial machine learning' });
                    break;
                case 'startups':
                    response = await fetchAPI('/all', { ...params, search: 'startups emprendimiento españa' });
                    break;
                case 'gadgets':
                    response = await fetchAPI('/all', { ...params, search: 'smartphones gadgets hardware review' });
                    break;
                case 'cyber':
                    response = await fetchAPI('/all', { ...params, search: 'ciberseguridad hacking seguridad informática' });
                    break;
                case 'gaming':
                    response = await fetchAPI('/all', { ...params, search: 'videojuegos gaming esports' });
                    break;
            }
        }

        renderGrid(response.data);
        if (response.meta) {
            updatePagination(response.meta);
        }
    } catch (error) {
        els.results.innerHTML = `<div class="status-message">⚠️ <b>Error:</b> ${error.message}</div>`;
    } finally {
        els.loading.classList.add('hidden');
    }
}

// Renderers
function renderGrid(articles) {
    if (!articles || articles.length === 0) {
        els.results.innerHTML = '<div class="status-message">No se encontraron noticias para esta sección. Intenta otra categoría o filtro.</div>';
        return;
    }

    els.results.innerHTML = articles.map(item => `
        <article class="card">
            <div class="card-img-container">
                <img src="${item.image_url || 'https://via.placeholder.com/400x200?text=Roman+Tech'}" alt="News Image" class="card-img" onerror="this.src='https://via.placeholder.com/400x200?text=Spain+Tech'">
            </div>
            <div class="card-body">
                <div class="card-meta">
                    <span>${new Date(item.published_at).toLocaleDateString()}</span>
                    <span>${item.source}</span>
                </div>
                <h3 class="card-title">${item.title}</h3>
                <p class="card-desc">${item.snippet || item.description || 'Haga clic para leer más sobre esta noticia tecnológica.'}</p>
                <div class="card-actions">
                    <a href="${item.url}" target="_blank" class="card-link">Leer Completo</a>
                    <button class="secondary-btn btn-similar" data-uuid="${item.uuid}" title="Noticias Similares">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7-7-7"></path><path d="M5 19l7-7-7-7"></path></svg>
                    </button>
                    <button class="secondary-btn btn-uuid" data-uuid="${item.uuid}" title="Detalles">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </button>
                </div>
            </div>
        </article>
    `).join('');

    // Attach events
    els.results.querySelectorAll('.btn-similar').forEach(b => b.addEventListener('click', (e) => loadSimilar(e.currentTarget.dataset.uuid)));
    els.results.querySelectorAll('.btn-uuid').forEach(b => b.addEventListener('click', (e) => loadUUID(e.currentTarget.dataset.uuid)));
}

// Modals
async function loadSimilar(uuid) {
    els.modal.classList.remove('hidden');
    els.modalBody.innerHTML = '<div class="status-message">Buscando noticias relacionadas...</div>';
    try {
        const res = await fetchAPI(`/similar/${uuid}`, { language: 'es', limit: 3 });
        if (res.data && res.data.length > 0) {
            els.modalBody.innerHTML = '<h3 style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem;">Noticias Relacionadas</h3><div class="results-grid" style="grid-template-columns: 1fr; gap: 1rem;" id="modal-grid"></div>';
            renderGridInModal(res.data, document.getElementById('modal-grid'));
        } else {
            els.modalBody.innerHTML = '<p>No se encontraron noticias similares.</p>';
        }
    } catch (err) {
        els.modalBody.innerHTML = `<p>Error: ${err.message}</p>`;
    }
}

function renderGridInModal(articles, container) {
    container.innerHTML = articles.map(item => `
        <div style="display: flex; gap: 1rem; background: var(--glass-bg); padding: 1rem; border-radius: 12px; border: 1px solid var(--glass-border);">
            <img src="${item.image_url || 'https://via.placeholder.com/100x100'}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
            <div>
                <h4 style="font-size: 1rem; margin-bottom: 0.5rem;">${item.title}</h4>
                <a href="${item.url}" target="_blank" style="color: var(--es-yellow); text-decoration: none; font-size: 0.85rem; font-weight: 600;">Leer más &rarr;</a>
            </div>
        </div>
    `).join('');
}

async function loadUUID(uuid) {
    els.modal.classList.remove('hidden');
    els.modalBody.innerHTML = '<div class="status-message">Cargando detalles técnicos...</div>';
    try {
        const item = await fetchAPI(`/uuid/${uuid}`);
        els.modalBody.innerHTML = `
            <h3 style="margin-bottom: 1rem; color: var(--accent);">${item.title}</h3>
            <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem;">
                <p style="font-size: 0.9rem; margin-bottom: 0.5rem;"><b>ID Único (UUID):</b> <code style="color: var(--es-yellow);">${item.uuid}</code></p>
                <p style="font-size: 0.9rem; margin-bottom: 0.5rem;"><b>Fuente:</b> ${item.source}</p>
                <p style="font-size: 0.9rem; margin-bottom: 0.5rem;"><b>Categoría:</b> ${item.categories.join(', ')}</p>
                <p style="font-size: 0.9rem;"><b>Publicado:</b> ${new Date(item.published_at).toLocaleString()}</p>
            </div>
            <img src="${item.image_url || ''}" style="width: 100%; border-radius: 12px; margin-bottom: 1.5rem;" onerror="this.style.display='none'">
            <p style="line-height: 1.8; color: var(--text-primary);">${item.description || item.snippet}</p>
            <div style="margin-top: 2rem; display: flex; justify-content: center;">
                <a href="${item.url}" target="_blank" class="card-link" style="max-width: 200px;">Ver en ${item.source}</a>
            </div>
        `;
    } catch (err) {
        els.modalBody.innerHTML = `<p>Error: ${err.message}</p>`;
    }
}

// Pagination
function updatePagination(meta) {
    els.pagination.style.display = 'flex';
    els.pageInfo.textContent = `Página ${meta.page}`;
    els.prevBtn.disabled = meta.page <= 1;
    els.nextBtn.disabled = meta.returned < state.limit;
}

// Events
function bindEvents() {
    els.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            els.navItems.forEach(nav => nav.classList.remove('active'));
            e.currentTarget.classList.add('active');
            state.view = e.currentTarget.dataset.view;
            state.page = 1;
            state.searchQuery = '';
            els.searchInput.value = '';
            els.viewTitle.textContent = e.currentTarget.textContent.trim() + ' España';
            loadData();
        });
    });

    els.searchBtn.addEventListener('click', () => {
        const query = els.searchInput.value.trim();
        if (query) {
            state.searchQuery = query;
            state.page = 1;
            els.viewTitle.textContent = `Resultados: ${query}`;
            els.navItems.forEach(nav => nav.classList.remove('active'));
            loadData();
        }
    });

    els.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') els.searchBtn.click();
    });

    els.prevBtn.addEventListener('click', () => { if (state.page > 1) { state.page--; loadData(); } });
    els.nextBtn.addEventListener('click', () => { state.page++; loadData(); });

    els.closeModal.addEventListener('click', () => {
        els.modal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === els.modal) els.modal.classList.add('hidden');
    });

    els.applyFilters.addEventListener('click', () => {
        state.language = els.langSelect.value;
        state.dateAfter = els.dateSelect.value;
        state.page = 1;
        loadData();
    });
}

// Init
bindEvents();
loadData();

// PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('Roman Tech SW Registered');
                reg.onupdatefound = () => {
                    const newWorker = reg.installing;
                    newWorker.onstatechange = () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('Nueva versión disponible. Recargando...');
                            window.location.reload();
                        }
                    };
                };
            })
            .catch(err => console.error('SW Error', err));
    });
}
