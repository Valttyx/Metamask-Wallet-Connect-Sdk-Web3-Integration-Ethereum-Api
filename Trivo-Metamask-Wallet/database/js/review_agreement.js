document.addEventListener('DOMContentLoaded', function () {
    $(document).ready(function () {
        //-----------------------------------------------------VARIABLES----------------------------------------------------
        const url = window.location.href;
        let reviewerAssignmentData = {
            submission_id: window.location.href.split('/').pop(),
            reviewer_id: 0,
            wallet_address: '',
        },
            currentActiveTab = { value: null },
            agreed = false,
            publications = [],
            username = null,
            wallet_address = null,
            isValid = false;
        server = getServerFromUrl(url),
            path = getUrlBeforeIndexPhp(url);

        //-----------------------------------------------------FUNCTIONS----------------------------------------------------

        /**
      * get protocol and server information from url. ex: http://localhost or https://openjournalsystem.com
      * @param {*} url 
      * @returns 
      */
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

        /**
        * get path information from url.
        * Example : the url is http://localhost/ojs/index.php/
        * get the url before the index.php --> /ojs (my current folder name)
        * so it will get the user ojs path
        * @param {*} url 
        * @returns 
        */
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
                        title: "Processing donation...",
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

        //Function to get publication data by submission id
        async function getPublications() {
            try {
                await fetch(server + path + '/plugins/generic/DonateButtonPlugin/request/publications.php?submissionId=' + reviewerAssignmentData.submission_id)
                    .then(response => response.json())
                    .then(data => {
                        publications = data.data[0]
                        // console.log(publications);
                    })
                    .catch(error => {
                        console.log(error);
                    });
            } catch (error) {
                console.log(error)
            }
        }

        /**
         * Function to get user id and user wallet_address by username
         * @param {*} username 
         */
        async function getUserAddress(username) {
            try {
                await fetch(server + path + "/plugins/generic/DonateButtonPlugin/request/users.php?type=getUserId&username=" + username)
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.data.length > 0) {
                            reviewerAssignmentData.reviewer_id = data.data[0].user_id;
                            reviewerAssignmentData.wallet_address = data.data[0].wallet_address;
                            wallet_address = data.data[0].wallet_address;
                        }
                    })
                    .catch((error) => {
                        console.log(error)
                    })
            } catch (error) {
                // createToast("error", "Error", error.message, "#ff5f6d");
                console.log(error)
            }
        }

        /**
         * Function to update user agreement
         * @param {*} agree 
         * @param {*} submissionId 
         */
        async function updateAgreement(agree, submissionId) {
            try {
                await fetch(server + path + '/plugins/generic/DonateButtonPlugin/request/publications.php?type=updateReviewerAgreement', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        submissionId: submissionId,
                        agreement: agree,
                    })
                })
                    .then(response => response.json())
                    .then(data => {
                        // console.log(data);
                    })
                    .catch(error => {
                        console.log(error);
                    });
            } catch (error) {
                console.log(error);
            }
        }

        // Function to get current active tab
        function getActiveTab() {
            var listItems = $("ul.ui-tabs-nav li");

            listItems.each(function (index, listItem) {
                var tabindexValue = $(listItem).attr("tabindex");
                if (tabindexValue >= 0) {
                    currentActiveTab.value = index;
                }
            });
        }

        /**
      * Function to watch if the tab active is changing
      * For example current active is 1 and the user change tab to 2
      * this function will update current active tab to 2
      * @param {*} callback 
      */
        function watchCurrentActiveTab(callback) {
            // console.log(currentActiveTab.value)
            let currentValue = currentActiveTab.value;

            setInterval(() => {
                if (currentActiveTab.value !== currentValue) {
                    currentValue = currentActiveTab.value;
                    callback(currentValue);
                }
            }, 1000);
        }

        // Function to show input field for user to input their wallet address
        function showInput() {
            let target = $(".flag-agreement")
            let input = `
            <div class="dp-wallet-address">
                <label for="walletAddress" class="dp-label">Wallet Address</label>
                <div style="display: flex; gap: 20px; align-items: flex-start;">
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <input type="text" id="walletAddress" class="wallet-address-input" required="required" placeholder="Insert Wallet Address">
                        <span class="sub_label" style="margin-left: 5px;"></span>
                    </div>
                    <div>
                        <button type="button" class="pkp_button" id="validate_address" style="margin-top: 10px;">Validate</button>
                    </div>
                </div>
            </div>
            `
            // prevent the user from add a space
            $("input#walletAddress").on('keydown', function (event) {
                if (event.key === ' ') {
                    event.preventDefault();
                }
            });

            if (!target.next('.dp-wallet-address').length) {
                target.after(input);
            }

            $("input#walletAddress").on('input', function () {
                wallet_address = $(this).val()
            });
        }

        /**
      * Function to check current metamask Address is valid or not
      * @param {*} address 
      * @param {*} index 
      * @returns 
      */
        async function checkMetamaskAddress(address, label) {
            const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/7662a41850704f0f878a91a9ccf408a3');

            let submitButton = $(".pkp_button.submitFormButton:contains('Submit Review')");
            let saveButton = $(".pkp_button.saveFormButton");

            try {
                // Validate the address format
                if (!ethers.utils.isAddress(address)) {
                    // console.log('Invalid Ethereum address');
                    label.text('Invalid Ethereum address');
                    label.addClass('invalid');
                    if (submitButton.length > 0) {
                        submitButton.prop('disabled', true);
                    }

                    if (saveButton.length > 0) {
                        saveButton.prop('disabled', true);
                    }
                    return;
                }

                // Use Etherscan API to verify the address
                const etherscanApiKey = 'AGG2XS154PTEHCPNV6Y24ZPIAE7K8VRUS3';
                const etherscanUrl = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${etherscanApiKey}`;

                const response = await fetch(etherscanUrl);
                const data = await response.json();

                if (data.status === '1') {
                    label.text('Valid Ethereum address');
                    checkValidWalletAddress();
                    isValid = true;
                    if (submitButton.length > 0) {
                        submitButton.prop('disabled', false);
                    }

                    if (saveButton.length > 0) {
                        saveButton.prop('disabled', false);
                    }
                    if (address !== reviewerAssignmentData.wallet_address) await updateAddress(address)
                } else {
                    label.text('No user found from this address');
                    label.addClass('invalid');
                    invalidList.push({
                        'index': index,
                        status: 'invalid'
                    });
                    if (submitButton.length > 0) {
                        submitButton.prop('disabled', true);
                    }

                    if (saveButton.length > 0) {
                        saveButton.prop('disabled', true);
                    }
                }
            } catch (error) {
                console.log('Error:', error.message);
            }
        }

        /**
         * Function to update the user wallet address
         * @param {*} address 
         */
        async function updateAddress(address) {
            try {
                await fetch(server + path + "/plugins/generic/DonateButtonPlugin/request/users.php?type=updateUserWallet", {
                    method: 'POST',
                    headers: {
                        'Content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        wallet_address: address
                    })
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.success) {
                            createToast("success", "Success", "Address updated successfully", "#00b09b");
                        }
                    })
                    .catch((error) => {
                        console.log(error)
                    })

            } catch (error) {
                console.log(error)
            }
        }

        /**
         * Function to showing a modal
         * The modal will contain an EULA (End User Agreement License)
         * @param {*} checkbox 
         */
        function showModal(checkbox) {
            $.get(server + path + '/plugins/generic/DonateButtonPlugin/templates/modal.tpl', function (data) {
                var modalContent = $(data);
                Swal.fire({
                    html: modalContent,
                    allowOutsideClick: false,
                    width: '50%',
                    confirmButtonText: "Confirm",
                    confirmButtonColor: "#006798",
                    didOpen: function () {
                        var agreeCheckbox = document.getElementById('agree-checkbox');
                        agreeCheckbox.checked = agreed;
                        agreeCheckbox.addEventListener('change', function () {
                            var agree = agreeCheckbox.checked;
                            if (agree) {
                                agreed = true;
                            } else {
                                agreed = false;
                            }

                        });

                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        let submitButton = $(".pkp_button.submitFormButton:contains('Submit Review')");
                        let saveButton = $(".pkp_button.saveFormButton");

                        if (agreed) {
                            checkbox.prop('checked', true);

                            if (submitButton.length > 0) {
                                submitButton.prop('disabled', true);
                            }

                            if (saveButton.length > 0) {
                                saveButton.prop('disabled', true);
                            }
                            showInput();
                            checkWalletAddress();
                        } else {
                            checkbox.prop('checked', false);

                            $(".dp-wallet-address").remove();

                            if (saveButton.length > 0) {
                                saveButton.prop('disabled', false);
                            }
                        }
                        checkValidWalletAddress();
                    }
                })
            })
        } //end

        // Function to insert a wallet address to the input field
        function checkWalletAddress() {
            let walletAddress = $("input#walletAddress");
            if (walletAddress.length && reviewerAssignmentData.wallet_address !== null) {
                walletAddress.val(reviewerAssignmentData.wallet_address)
            } else {
                setTimeout(checkWalletAddress, 100)
            }
        }


        setTimeout(async () => {
            //Get username from this
            var span = $(".-screenReader").eq(1);
            var text = span.text();
            username = text;
            if (username != "") {
                await getUserAddress(username);
            }
            checkWalletAddress();
        }, 500)

        function checkValidWalletAddress() {
            let submitButton = $(".pkp_button.submitFormButton:contains('Submit Review')");
            let saveButton = $(".pkp_button.saveFormButton");

            if (!isValid && agreed) {
                if (submitButton.length > 0) {
                    submitButton.prop('disabled', true);
                }

                if (saveButton.length > 0) {
                    saveButton.prop('disabled', true);
                }
                setTimeout(checkValidWalletAddress, 100);
            } else {
                if (submitButton.length > 0) {
                    submitButton.prop('disabled', false);
                }

                if (saveButton.length > 0) {
                    saveButton.prop('disabled', false);
                }
            }
        }

        //Add a agreement checkbox before a form button
        function checkFormButton() {
            console.log("Checking")
            var parentContainer = $('fieldset#reviewStep3');

            var submitSection = parentContainer.find('div.section.formButtons.form_buttons');

            if (parentContainer.length && submitSection.length) {
                console.log(parentContainer)
                console.log(submitSection)
                let flagAgreement = $('<div>').addClass('flag-agreement');
                let checkbox = $('<input>').attr({
                    type: 'checkbox',
                    id: 'flagAgreementCheckbox',
                    class: 'flag-agreement-checkbox'
                });
                let label = $('<span>').attr({
                    'for': 'flagAgreementCheckbox', 'class': 'dp-span'
                }).text('I agree about the monetization of this journal');

                flagAgreement.append(checkbox, label.append("<span class='read_terms'>Read terms</span>"));
                submitSection.before(flagAgreement)

                checkbox.on('click', function () {
                    showModal($(this))
                    if ($(this).is(":checked")) {
                        checkbox.prop('checked', false)
                    } else {
                        checkbox.prop('checked', true)
                    }
                });

                // if publications data is available
                if (publications) {
                    // if publication review agreement is true or 1 then check the agreement checkbox
                    if (publications.reviewer_agreement == "1") {
                        checkbox.prop('checked', true);
                        if (checkbox.is(":checked")) {
                            agreed = true;
                            let submitButton = $(".pkp_button.submitFormButton:contains('Submit Review')");
                            let saveButton = $(".pkp_button.saveFormButton");

                            if (agreed) {
                                checkbox.prop('checked', true);

                                if (submitButton.length > 0) {
                                    submitButton.prop('disabled', true);
                                }

                                if (saveButton.length > 0) {
                                    saveButton.prop('disabled', true);
                                }
                                showInput();
                            }
                        } else {
                            checkbox.prop('checked', false);
                            agreed = false;
                        }
                    }
                }
            } else {
                setTimeout(checkFormButton, 100)
            }
        }

        /**
         * Call the function for watch current active tab
         */
        watchCurrentActiveTab(async value => {
            if (value === 2) {
                await getPublications();
                checkValidWalletAddress();

                checkFormButton();

                // Add a click event listener to button with id "validate_address" to validate address in input fieldl
                $(document).on('click', '#validate_address', async function () {
                    let error_label = $(".dp-wallet-address .sub_label");

                    if (wallet_address === "") {
                        // if input is empty
                        error_label.addClass('invalid');
                        error_label.text("Wallet Address is required")
                    } else if (wallet_address !== "") {
                        // if input is not empty then check the address
                        error_label.removeClass('invalid');
                        error_label.text("Checking...")
                        await checkMetamaskAddress(wallet_address, error_label)
                    } else {
                        error_label.text("")
                    }
                })

                // Add a click event listener to button "Save For Later" to save current agreement
                $(document).on('click', 'button.saveFormButton', function () {
                    console.log("click save")
                    updateAgreement(agreed, reviewerAssignmentData.submission_id)
                })

                // Add a click event listener to button "Submit Review" to save current agreement
                $(document).on('click', "button.ok.pkpModalConfirmButton", function () {
                    console.log("click submit")
                    updateAgreement(agreed, reviewerAssignmentData.submission_id)
                })
            }
        })

        setInterval(() => {
            getActiveTab();
        }, 100);

    })
})

