<script>
    // Function to create a link element and append it to head 
    function loadCSS(url) {
        var linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = url;
        document.head.appendChild(linkElement);
    }

    let url = window.location.href;

    function getServerFromUrl(url) {
        var parser = document.createElement('a');
        parser.href = url;
        var protocol = parser.protocol;
        var server = parser.hostname;
        var port = parser.port;
        if (port) {
            var result = protocol + '//' + server + ":" + port;
        } else {
            var result = protocol + '//' + server;
        }
        return result;
    }

    function getUrlBeforeIndexPhp(url) {
        if (url.includes("/index.php")) {
            var regex = /^(?:https?:\/\/[^/]+)?(.*?)(?=\/?index\.php)/;
            var matches = url.match(regex);
            if (matches && matches.length > 1) {
                return matches[1];
            }
        } else {
            // For other cases, return the whole URL
            return "";
        }
    }

    var server = getServerFromUrl(url);
    var path = getUrlBeforeIndexPhp(url);

    // Call the loadCSS function to load the CSS files
    loadCSS('https://cdn.jsdelivr.net/npm/izitoast/dist/css/iziToast.min.css');
    loadCSS(server + path + '/plugins/generic/DonateButtonPlugin/css/style.css');
    loadCSS(server + path + '/plugins/generic/DonateButtonPlugin/css/index-cfec9cd2.css');
</script>


<section class="item">
    <div class="root" id="root"></div>
    <button class="metamask-donate" id="metamask-donate-button">
        Donate with Crypto
    </button>
</section>