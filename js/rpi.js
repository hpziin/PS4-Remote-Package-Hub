(function () {
    "use strict";

    window.RPI = {
        ip: "",
        port: 12800,

        configure: function (ip, port) {
            this.ip = String(ip || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
            this.port = parseInt(port, 10) || 12800;
        },

        getBaseURL: function () {
            if (!this.ip) {
                throw new Error("Informe o endereço IP do PS4.");
            }

            return "http://" + this.ip + ":" + this.port;
        },

        request: function (endpoint, data, callback) {
            var xhr = new XMLHttpRequest();
            var url;

            try {
                url = this.getBaseURL() + endpoint;
            } catch (error) {
                callback(error, null);
                return;
            }

            xhr.open("POST", url, true);
            xhr.timeout = 12000;
            xhr.setRequestHeader("Content-Type", "application/json");

            xhr.onreadystatechange = function () {
                if (xhr.readyState !== 4) {
                    return;
                }

                if (xhr.status >= 200 && xhr.status < 300) {
                    var response;

                    try {
                        response = JSON.parse(xhr.responseText);
                    } catch (error) {
                        callback(
                            new Error("O RPI respondeu, mas o conteúdo não é JSON válido."),
                            null
                        );
                        return;
                    }

                    callback(null, response);
                } else {
                    callback(
                        new Error(
                            "HTTP " + xhr.status +
                            ". O servidor RPI respondeu com erro."
                        ),
                        null
                    );
                }
            };

            xhr.onerror = function () {
                callback(
                    new Error(
                        "Falha de rede ou bloqueio do navegador. Verifique HTTP, CORS e o IP."
                    ),
                    null
                );
            };

            xhr.ontimeout = function () {
                callback(
                    new Error("Tempo esgotado. O RPI não respondeu."),
                    null
                );
            };

            xhr.onabort = function () {
                callback(new Error("Requisição cancelada."), null);
            };

            try {
                xhr.send(JSON.stringify(data));
            } catch (error) {
                callback(error, null);
            }
        },

        test: function (callback) {
            this.request(
                "/api/is_exists",
                { title_id: "CUSA00000" },
                callback
            );
        },

        install: function (pkgURL, callback) {
            if (!pkgURL) {
                callback(new Error("Informe a URL do PKG."), null);
                return;
            }

            if (!/^https?:\/\//i.test(pkgURL)) {
                callback(
                    new Error("A URL precisa começar com http:// ou https://"),
                    null
                );
                return;
            }

            this.request(
                "/api/install",
                {
                    type: "direct",
                    packages: [pkgURL]
                },
                callback
            );
        }
    };
})();
