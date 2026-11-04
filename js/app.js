(function () {
    "use strict";

    var $ = function (id) {
        return document.getElementById(id);
    };

    var historyItems = [];

    function showMessage(id, message, type) {
        var element = $(id);

        element.className = "message";

        if (type) {
            element.className += " " + type;
        }

        element.textContent = message;
    }

    function getConnection() {
        var ip = $("ps4ip").value.replace(/\s/g, "");
        var port = parseInt($("ps4port").value, 10);

        if (!ip) {
            throw new Error("Digite o IP do PS4.");
        }

        if (!port || port < 1 || port > 65535) {
            throw new Error("Digite uma porta válida.");
        }

        return {
            ip: ip,
            port: port
        };
    }

    function configureRPI() {
        var connection = getConnection();

        window.RPI.configure(connection.ip, connection.port);

        return connection;
    }

    function saveConnection() {
        try {
            var connection = getConnection();

            try {
                localStorage.setItem(
                    "ps4_rpi_ip",
                    connection.ip
                );

                localStorage.setItem(
                    "ps4_rpi_port",
                    String(connection.port)
                );
            } catch (storageError) {
                // O armazenamento pode estar desativado no navegador.
            }

            configureRPI();

            showMessage(
                "connectionMessage",
                "Endereço salvo: " + connection.ip +
                ":" + connection.port,
                "success"
            );

            addHistory("Endereço do console configurado.");
        } catch (error) {
            showMessage(
                "connectionMessage",
                error.message,
                "error"
            );
        }
    }

    function testConnection() {
        try {
            configureRPI();
        } catch (error) {
            showMessage(
                "connectionMessage",
                error.message,
                "error"
            );
            return;
        }

        showMessage(
            "connectionMessage",
            "Enviando teste ao RPI...",
            ""
        );

        $("connectionDot").className = "dot";
        $("connectionText").textContent = "TESTANDO";

        window.RPI.test(function (error, response) {
            if (error) {
                $("connectionDot").className = "dot";
                $("connectionText").textContent = "ERRO";

                showMessage(
                    "connectionMessage",
                    "Não foi possível confirmar a comunicação. " +
                    error.message,
                    "error"
                );

                addHistory("Teste de conexão falhou.");
                return;
            }

            $("connectionDot").className = "dot online";
            $("connectionText").textContent = "CONECTADO";

            showMessage(
                "connectionMessage",
                "O RPI respondeu à consulta. Comunicação confirmada.",
                "success"
            );

            addHistory("RPI respondeu ao teste.");
        });
    }

    function installPackage() {
        var pkgURL = $("pkgurl").value.replace(/^\s+|\s+$/g, "");

        if (!pkgURL) {
            showMessage(
                "installMessage",
                "Informe a URL direta do arquivo PKG.",
                "error"
            );
            return;
        }

        try {
            configureRPI();
        } catch (error) {
            showMessage(
                "installMessage",
                error.message,
                "error"
            );
            return;
        }

        if (!confirm(
            "Deseja enviar este pacote ao PS4?\n\n" +
            pkgURL
        )) {
            return;
        }

        $("installButton").disabled = true;
        $("installButton").textContent = "ENVIANDO...";

        showMessage(
            "installMessage",
            "Enviando solicitação ao Remote Package Installer...",
            ""
        );

        window.RPI.install(pkgURL, function (error, response) {
            $("installButton").disabled = false;
            $("installButton").textContent = "INICIAR INSTALAÇÃO";

            if (error) {
                showMessage(
                    "installMessage",
                    "A solicitação não foi confirmada. " +
                    error.message,
                    "error"
                );

                addHistory("Solicitação de instalação não confirmada.");
                return;
            }

            var result = "O RPI respondeu à solicitação.";

            if (response && response.task_id !== undefined) {
                result += " ID da tarefa: " + response.task_id;
            }

            if (response && response.success === false) {
                showMessage(
                    "installMessage",
                    "O RPI recusou a solicitação.",
                    "error"
                );

                addHistory("RPI recusou a solicitação.");
                return;
            }

            showMessage(
                "installMessage",
                result +
                " Isso confirma o recebimento da solicitação, " +
                "não a conclusão da instalação.",
                "success"
            );

            addHistory("Solicitação recebida pelo RPI.");
        });
    }

    function addHistory(message) {
        var now = new Date();

        historyItems.unshift({
            message: message,
            date: now.toLocaleString()
        });

        if (historyItems.length > 20) {
            historyItems.pop();
        }

        renderHistory();
    }

    function renderHistory() {
        var container = $("historyList");
        var html = "";
        var i;

        if (historyItems.length === 0) {
            container.innerHTML =
                '<p class="muted">Nenhuma operação registrada.</p>';
            return;
        }

        for (i = 0; i < historyItems.length; i++) {
            var item = document.createElement("div");
            var title = document.createElement("strong");
            var date = document.createElement("small");

            item.className = "history-item";
            title.textContent = historyItems[i].message;
            date.textContent = historyItems[i].date;

            item.appendChild(title);
            item.appendChild(date);
            container.appendChild(item);
        }
    }

    function renderCatalog(items) {
        var container = $("catalogList");
        var i;

        container.innerHTML = "";

        if (!items || items.length === 0) {
            container.innerHTML =
                '<p class="muted">Nenhum pacote cadastrado. ' +
                'Edite data/catalog.json para adicionar itens.</p>';
            return;
        }

        for (i = 0; i < items.length; i++) {
            (function (item) {
                var row = document.createElement("div");
                var info = document.createElement("div");
                var name = document.createElement("strong");
                var detail = document.createElement("small");
                var button = document.createElement("button");

                row.className = "catalog-item";
                name.textContent = item.name || "Pacote sem nome";
                detail.textContent = item.category || "PKG";

                info.appendChild(name);
                info.appendChild(detail);

                button.className = "small-button";
                button.textContent = "SELECIONAR";

                button.onclick = function () {
                    $("pkgurl").value = item.url || "";

                    showMessage(
                        "installMessage",
                        item.url
                            ? "Pacote selecionado. Confira a URL antes de instalar."
                            : "Este item ainda não possui uma URL cadastrada.",
                        ""
                    );
                };

                row.appendChild(info);
                row.appendChild(button);

                container.appendChild(row);
            })(items[i]);
        }
    }

    function loadCatalog() {
        var xhr = new XMLHttpRequest();

        xhr.open("GET", "data/catalog.json", true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) {
                return;
            }

            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    renderCatalog(data);
                } catch (error) {
                    $("catalogList").textContent =
                        "Não foi possível interpretar catalog.json.";
                }
            } else {
                $("catalogList").textContent =
                    "Não foi possível carregar o catálogo.";
            }
        };

        xhr.onerror = function () {
            $("catalogList").textContent =
                "Falha ao carregar o catálogo.";
        };

        xhr.send(null);
    }

    function loadSettings() {
        try {
            $("ps4ip").value =
                localStorage.getItem("ps4_rpi_ip") || "";

            $("ps4port").value =
                localStorage.getItem("ps4_rpi_port") || "12800";
        } catch (error) {
            $("ps4port").value = "12800";
        }
    }

    function clearHistory() {
        historyItems = [];
        renderHistory();
    }

    function start() {
        loadSettings();
        loadCatalog();

        $("saveConnection").onclick = saveConnection;
        $("testConnection").onclick = testConnection;
        $("installButton").onclick = installPackage;
        $("clearHistory").onclick = clearHistory;

        renderHistory();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
