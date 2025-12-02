document.addEventListener('DOMContentLoaded', function () {
    $(document).ready(function () {
        //-------------------------------------------VARIABLES  --------------------------------
        let currentActiveTab,
            submission_id,
            url = window.location.href,
            publisher_id,
            publisher_wallet,
            server = getServerFromUrl(url),
            path = getUrlBeforeIndexPhp(url),
            journalName = getDynamicJournalPart(url),
            pathWithIndex = getUrlBeforeAndTheIndex(url),
            publications = [],
            percentage_settings = {
                percentage_authors: null,
                percentage_reviewers: null,
                percentage_publisher: null,
            };


        //-------------------------------------------FUNCTIONS --------------------------------
        // Function to create a toast notification
        const createToast = (type, title, message, color) => {
            const toastOptions = {
                title: title,
                message: message,
                position: "topRight",
                timeout: 3000,
                progressBarColor: color,
            };

            switch (type) {
                case "info":
                    return iziToast.info(toastOptions);
                case "success":
                    return iziToast.success(toastOptions);
                case "error":
                    return iziToast.error(toastOptions);
                case "loading":
                    return iziToast.info({
                        id: "loading-toast",
                        title: "Creating Smart Contract...",
                        message: "Don't close this window!",
                        position: "topRight",
                        timeout: false,
                        close: false,
                        progressBar: false,
                        overlay: true,
                        zindex: 9999,
                    });
                default:
                    return;
            }
        };

        // Get percentage setting by publisher id
        async function getPercentageSettings() {
            try {
                await fetch(server + path + '/plugins/generic/DonateButtonPlugin/request/percentage_settings.php?publisher_id=' + publisher_id)
                    .then(response => response.json())
                    .then(data => {
                        percentage_settings.percentage_authors = data.data[0].percentage_authors
                        percentage_settings.percentage_reviewers = data.data[0].percentage_reviewers
                        percentage_settings.percentage_publisher = data.data[0].percentage_publisher
                        // percentage_settings.percentage_editors = data.data[0].percentage_editors
                    })
                    .catch(error => {
                        console.log(error);
                    });
            } catch (error) {
                console.log(error);
            }
        }

        /**
         * Function to get a fragment from the URL
         * Example : #publication
         */
        function getFragment() {
            var urlFragment = window.location.hash;
            var setupFragment = urlFragment.split('/')[0];
            currentActiveTab = setupFragment;
        }

        /**
         * Function to watch current active tab
         * @param {*} callback 
         */
        function watchCurrentFragment(callback) {
            let currentValue = currentActiveTab;

            setInterval(() => {
                if (currentActiveTab !== currentValue) {
                    currentValue = currentActiveTab;
                    callback(currentValue);
                }
            }, 0);
        }

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
        
        function getUrlBeforeAndTheIndex(url) {
            // console.log(url)
            if (url.includes("/index.php")) {
                var regex = /^(?:https?:\/\/[^/]+)?(.*?\/index\.php)/;
                var matches = url.match(regex);
                if (matches && matches.length > 1) {
                    // console.log(matches[1])
                    return matches[1];
                }
            } else {
                // For other cases, return the whole URL
                return "";
            }
        }

        function getDynamicJournalPart(url) {
            var regexWithIndexPhp = /\/(?:[^/]+\/)?index.php\/([^/$]+)\//;
            var regexWithoutIndexPhp = /\/(?:[^/]+\/)?([^/$]+)\//;

            if (url.includes("/index.php")) {
                var matches = url.match(regexWithIndexPhp);
                if (matches && matches.length > 1) {
                    return matches[1];
                }
            } else {
                var matches = url.match(regexWithoutIndexPhp);
                if (matches && matches.length > 1) {
                    return matches[1];
                }
            }
        }


        /**
         * Function to create a smart contract when publish button clicked
         */
        async function createSmartContract() {
            // Show a loading toast notification
            createToast("loading");

            try {
                await fetch(server + path + '/plugins/generic/DonateButtonPlugin/request/processGetData.php?type=createSmartContract&id_submission=' + submission_id + "&publisher_id=" + publisher_id)
                    .then((response) => response.json())
                    .then((data) => {
                        // console.log(data);
                        if (data.status) {
                            iziToast.destroy();
                            createToast("success", "Success", "Smart Contract created", "#00b09b");
                        } else if (!data.status) {
                            iziToast.destroy();
                            createToast("error", "Error", data.message, "#ff5f6d");
                        }
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            } catch (error) {
                console.log(error)
            }
        }

        /**
        * function to get publication data by submission id
        * @param {*} submissionId 
        */
        async function getPublications() {
            try {
                await fetch(server + path + '/plugins/generic/DonateButtonPlugin/request/publications.php?submissionId=' + submission_id)
                    .then(response => response.json())
                    .then(data => {
                        publications = data.data[0]
                        // console.log(publications)
                    })
                    .catch(error => {
                        console.log(error);
                    });
            } catch (error) {
                console.log(error)
            }
        }

        /**
         * Function to get publisher id by username
         * @param {*} username 
         */
        async function getPublisherId(username) {
            try {
                await fetch(server + path + "/plugins/generic/DonateButtonPlugin/request/users.php?type=getUserAddress&username=" + username)
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.data.length > 0) {
                            publisher_id = data.data[0].user_id;
                            publisher_wallet = data.data[0].wallet_address
                        }
                    })
                    .catch((error) => {
                        console.log(error)
                    })
            } catch (error) {
                createToast("error", "Error", error.message, "#ff5f6d");
            }
        }

        function checkForNullAndZero(obj) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    var value = obj[key];
                    if (value === null || value === 0 || value === "0") {
                        return false; // Found a null or 0 value, return false
                    }
                }
            }
            return true; // No null or 0 values found, return true
        }

        // Call the function to watch current fragment
        watchCurrentFragment(async value => {
            if (value === "#publication") {
                
                let url = window.location.href;
                const pattern = /\/workflow\/index\/(\d+)\/(\d+)/;

                const matches = url.match(pattern);
                if (matches) {
                    //Get username from this
                    setTimeout(async () => {
                        var span = $(".-screenReader").eq(1);
                        var text = span.text();
                        username = text;
                        if (username != "") {
                            await getPublisherId(username);
                        }
                        submission_id = matches[1];
                        // console.log(submission_id)
                        await getPublications();
                        await getPercentageSettings();
                    }, 500)
                }

                let scheduleButton = $("button.pkpButton:contains('Schedule For Publication')");
                scheduleButton.on("click", function () {
                    if (publications.author_agreement == 1 && publications.publisher_agreement == 1 && publications.reviewer_agreement == 1) {
                        checkPublishButton();
                    }
                })


                // Check publish function is available at DOM or not
                function checkPublishButton() {
                    let publishButton = $("button.pkpButton:contains('Publish')");

                    if (publishButton.length) {
                        console.log("Ada")
                        let isValid = checkForNullAndZero(percentage_settings);
                        let fieldset = $(".pkp_modal_panel").find("fieldset.pkpFormGroup.-pkpClearfix")
                        let error = `
                        <div class="error_field" 
                            style="
                                font-size: .875rem;
                                line-height: 1.5rem;
                                font-weight: 400;
                                color: #d00a6c;
                                font-weight: 600;
                                margin-top: 5px;
                                padding-left: 32px;
                                ">
                            <p>
                                Error : 
                                <ul class="error_list">

                                </ul>
                                <br />
                                <a href='${server}${pathWithIndex}/${journalName}/management/settings/website#setup/smartContract' style="text-decoration: none; font-weight: 500;">
                                    Click here to go to setting and go to Smart Contract tab
                                </a>
                            </p>
                        </div>
                        `

                        if (!isValid || publisher_wallet == "" || publisher_wallet == null) {
                            if ($(".error_field").length == 0) {
                                fieldset.after(error)
                                $("ul.error_field").empty();
                            }
                            if (!isValid) {
                                $("ul.error_list").append("<li>The percentage setting is not set properly!</li>")
                            }

                            if (publisher_wallet == "" || publisher_wallet == null) {
                                $("ul.error_list").append("<li>Publisher wallet is not set properly!</li>")
                            }
                            publishButton.prop('disabled', true);
                        } else {
                            publishButton.prop('disabled', false);

                            // IF available then add a click to that button to create smart contract
                            publishButton.on('click', async function () {
                                // console.log("Publish")
                                await createSmartContract();
                            })

                        }

                    } else {
                        setTimeout(checkPublishButton, 100)
                    }
                }

                // checkPublishButton();
            }
        })

        setInterval(() => {
            getFragment();
        }, 100)
    })
})