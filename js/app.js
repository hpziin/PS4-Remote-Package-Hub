
(() => {
    const $ = selector => document.querySelector(selector);
    const $$ = selector => [...document.querySelectorAll(selector)];

    const store = {
        get(key, fallback) {
            try {
                return JSON.parse(localStorage.getItem('rph_' + key)) ?? fallback;
            } catch {
                return fallback;
            }
        },

        set(key, value) {
            localStorage.setItem('rph_' + key, JSON.stringify(value));
        }
    };

    window.Hub = { $, $$, store };

    let catalog = store.get('catalog', []);
    let queue = store.get('queue', []);
    let history = store.get('history', []);

    let config = store.get('config', {
        ip: '',
        port: 12800
    });

    let kind = 'direct';

    const pages = {
        dashboard: 'Dashboard',
        installer: 'PKG Installer',
        catalog: 'Catálogo',
        queue: 'Fila de envio',
        history: 'Histórico',
        console: 'Console / RPI',
        settings: 'Configurações'
    };

    function navigate(name) {
        $$('.page').forEach(page => {
            page.classList.toggle(
                'active',
                page.id === 'page-' + name
            );
        });

        $$('.nav').forEach(button => {
            button.classList.toggle(
                'active',
                button.dataset.page === name
            );
        });

        $('#page-title').textContent = pages[name];
    }

    function endpoint() {
        if (!config.ip) return '';

        return `http://${config.ip}:${config.port || 12800}`;
    }

    function draft() {
        if (kind === 'manifest') {
            return {
                kind,
                url: $('#manifest-url').value.trim(),
                label: $('#pkg-label').value.trim() || 'Manifesto JSON'
            };
        }

        const urls = [
            $('#pkg-url').value.trim(),
            ...$('#pkg-extra').value
                .split(/\r?\n/)
                .map(url => url.trim())
                .filter(Boolean)
        ].filter(Boolean);

        return {
            kind,
            urls,
            label: $('#pkg-label').value.trim() || 'Pacote PKG'
        };
    }

    function valid(item) {
        if (item.kind === 'manifest') {
            return /^https?:\/\//i.test(item.url);
        }

        return item.urls.length > 0 &&
            item.urls.every(url => /^https?:\/\//i.test(url));
    }

    function updateStats() {
        $('#dash-console').textContent =
            config.ip || 'Não configurado';

        $('#dash-queue').textContent = queue.length;
        $('#dash-history').textContent = history.length;

        $('#dash-connection').textContent =
            $('#connection-label').textContent.includes('respondendo')
                ? 'Online'
                : 'Pendente';

        $('#endpoint-preview').textContent =
            endpoint() || 'Informe o IP do PS4';
    }

    function addHistory(label, status, detail) {
        history.unshift({
            label,
            status,
            detail,
            time: new Date().toLocaleString('pt-BR')
        });

        history = history.slice(0, 100);

        store.set('history', history);

        renderHistory();
        updateStats();
    }

    function renderCatalog() {
        const search = $('#catalog-search').value.toLowerCase();

        const list = $('#catalog-list');
        list.innerHTML = '';

        const filtered = catalog.filter(item =>
            (item.name + ' ' + item.url).toLowerCase().includes(search)
        );

        $('#catalog-empty').hidden = filtered.length > 0;

        filtered.forEach(item => {
            const element = document.createElement('div');
            element.className = 'item';

            const main = document.createElement('div');
            main.className = 'item-main';

            const title = document.createElement('strong');
            title.textContent = item.name + ' · ' + item.type;

            const url = document.createElement('small');
            url.textContent = item.url;

            main.append(title, url);

            const actions = document.createElement('div');
            actions.className = 'item-actions';

            const send = document.createElement('button');
            send.className = 'mini';
            send.textContent = 'Enviar';

            send.onclick = () => {
                navigate('installer');
                kind = 'direct';
                selectKind();

                $('#pkg-url').value = item.url;
                $('#pkg-label').value = item.name;
            };

            const remove = document.createElement('button');
            remove.className = 'mini danger';
            remove.textContent = 'Excluir';

            remove.onclick = () => {
                catalog = catalog.filter(x => x.id !== item.id);
                store.set('catalog', catalog);
                renderCatalog();
            };

            actions.append(send, remove);
            element.append(main, actions);
            list.append(element);
        });
    }

    function renderQueue() {
        const list = $('#queue-list');
        list.innerHTML = '';

        $('#queue-empty').hidden = queue.length > 0;

        queue.forEach((item, index) => {
            const element = document.createElement('div');
            element.className = 'item';

            const main = document.createElement('div');
            main.className = 'item-main';

            const title = document.createElement('strong');
            title.textContent = item.label;

            const detail = document.createElement('small');
            detail.textContent = item.kind === 'manifest'
                ? item.url
                : item.urls.join(' · ');

            main.append(title, detail);

            const actions = document.createElement('div');
            actions.className = 'item-actions';

            const send = document.createElement('button');
            send.className = 'mini';
            send.textContent = 'Enviar agora';
            send.onclick = () => window.RPI.send(item);

            const remove = document.createElement('button');
            remove.className = 'mini danger';
            remove.textContent = 'Remover';

            remove.onclick = () => {
                queue.splice(index, 1);
                store.set('queue', queue);
                renderQueue();
                updateStats();
            };

            actions.append(send, remove);
            element.append(main, actions);
            list.append(element);
        });
    }

    function renderHistory() {
        const list = $('#history-list');
        list.innerHTML = '';

        $('#history-empty').hidden = history.length > 0;

        history.forEach(item => {
            const element = document.createElement('div');
            element.className = 'item';

            const main = document.createElement('div');
            main.className = 'item-main';

            const title = document.createElement('strong');
            title.textContent = item.label + ' · ' + item.status;

            const detail = document.createElement('small');
            detail.textContent = item.time + ' — ' + item.detail;

            main.append(title, detail);
            element.append(main);
            list.append(element);
        });
    }

    function selectKind() {
        $$('.seg').forEach(button => {
            button.classList.toggle(
                'active',
                button.dataset.kind === kind
            );
        });

        $('#direct-fields').hidden = kind !== 'direct';
        $('#manifest-fields').hidden = kind !== 'manifest';
    }

    $$('.nav').forEach(button => {
        button.onclick = () => navigate(button.dataset.page);
    });

    $$('[data-go]').forEach(button => {
        button.onclick = () => navigate(button.dataset.go);
    });

    $$('.seg').forEach(button => {
        button.onclick = () => {
            kind = button.dataset.kind;
            selectKind();
        };
    });

    $('#ps4-ip').value = config.ip;
    $('#ps4-port').value = config.port || 12800;

    $('#ps4-ip').addEventListener('input', () => {
        config.ip = $('#ps4-ip').value.trim();
        updateStats();
    });

    $('#ps4-port').addEventListener('input', () => {
        config.port = Number($('#ps4-port').value) || 12800;
        updateStats();
    });

    $('#save-console').onclick = () => {
        config = {
            ip: $('#ps4-ip').value.trim(),
            port: Number($('#ps4-port').value) || 12800
        };

        store.set('config', config);

        updateStats();

        $('#connection-feedback').textContent =
            'Configuração salva neste navegador.';
    };

    $('#send-now').onclick = () => {
        const item = draft();

        if (!config.ip) {
            $('#send-feedback').textContent =
                'Configure o IP do PS4 primeiro.';

            navigate('console');
            return;
        }

        if (!valid(item)) {
            $('#send-feedback').textContent =
                'Informe uma URL HTTP ou HTTPS válida.';
            return;
        }

        window.RPI.send(item);
    };

    $('#add-queue').onclick = () => {
        const item = draft();

        if (!valid(item)) {
            $('#send-feedback').textContent =
                'Informe uma URL válida.';
            return;
        }

        queue.push(item);

        store.set('queue', queue);

        renderQueue();
        updateStats();

        $('#send-feedback').textContent =
            'Item adicionado à fila local.';
    };

    $('#new-catalog').onclick = () => {
        $('#catalog-dialog').showModal();
    };

    $('#catalog-form').addEventListener('submit', event => {
        event.preventDefault();

        const item = {
            id: crypto.randomUUID(),
            name: $('#catalog-name').value.trim(),
            url: $('#catalog-url').value.trim(),
            type: $('#catalog-type').value
        };

        if (!item.name || !/^https?:\/\//i.test(item.url)) {
            return;
        }

        catalog.push(item);

        store.set('catalog', catalog);
        renderCatalog();

        $('#catalog-dialog').close();
        event.target.reset();
    });

    $('#catalog-search').oninput = renderCatalog;

    $('#export-catalog').onclick = () => {
        const blob = new Blob(
            [JSON.stringify(catalog, null, 2)],
            { type: 'application/json' }
        );

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'ps4-catalog.json';
        link.click();

        URL.revokeObjectURL(link.href);
    };

    $('#import-catalog').onchange = async event => {
        try {
            const data = JSON.parse(
                await event.target.files[0].text()
            );

            if (!Array.isArray(data)) {
                throw new Error('Formato inválido');
            }

            catalog = [
                ...catalog,
                ...data.filter(item => item.name && item.url)
            ];

            store.set('catalog', catalog);
            renderCatalog();

        } catch (error) {
            alert('Erro ao importar: ' + error.message);
        }

        event.target.value = '';
    };

    $('#clear-queue').onclick = () => {
        queue = [];
        store.set('queue', queue);
        renderQueue();
        updateStats();
    };

    $('#clear-history').onclick = () => {
        history = [];
        store.set('history', history);
        renderHistory();
        updateStats();
    };

    $('#send-mode').value = store.get('sendMode', 'auto');

    $('#send-mode').onchange = event => {
        store.set('sendMode', event.target.value);
    };

    $('#clear-local').onclick = () => {
        if (confirm('Apagar todos os dados locais?')) {
            ['catalog', 'queue', 'history', 'config', 'sendMode']
                .forEach(key => localStorage.removeItem('rph_' + key));

            location.reload();
        }
    };

    window.Hub.addHistory = addHistory;
    window.Hub.endpoint = endpoint;
    window.Hub.getConfig = () => config;

    renderCatalog();
    renderQueue();
    renderHistory();
    updateStats();

})();
