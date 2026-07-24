document.addEventListener('DOMContentLoaded', function () {
    $(document).ready(function () {
        //-------------------------------------- VARIABLES -------------------------------------
        const url = window.location.href;
        let currentActiveTab = { value: 0 },
            modal_visible = false,
            interval,
            author = {
                author_id: null,
                email: null,
                publication_id: getUrlParameter('submissionId'),
                wallet_address: null,
            },
            pkpGridInterval,
            isCheckPKPCalled = false,
            agreed = false,
            isValidate = false,
            allAuthorData = {
                authors: 0,
                authorData: [],
                authorDataSettings: [],
            },
            invalidList = [],
            publications = [],
            server = getServerFromUrl(url),
            path = getUrlBeforeIndexPhp(url);
        const submissionId = getUrlParameter('submissionId');


        //-------------------------------------------FUNCTIONS-----------------------------------------

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
            let currentValue = currentActiveTab.value;

            setInterval(() => {
                if (currentActiveTab.value !== currentValue) {
                    currentValue = currentActiveTab.value;
                    callback(currentValue);
                }
            }, 1000);
        }

        /**
         * function to get publication data by submission id
         * @param {*} submissionId 
         */
        async function getPublications(submissionId) {
            try {
                await fetch(server + path + '/plugins/generic/DonateButtonPlugin/request/publications.php?submissionId=' + submissionId)
                    .then(response => response.json())
                    .then(data => {
                        publications = data.data[0]
                    })
                    .catch(error => {
                        console.log(error);
                    });
            } catch (error) {
                console.log(error)
            }
        }

        //function to get author wallet by author_id in tables authors
        async function getAuthorWallet() {
            try {
                await fetch(server + path + '/plugins/generic/DonateButtonPlugin/request/authors.php?author_id=' + author.author_id + '&type=getById')
                    .then(response => response.json())
                    .then(data => {
                        let authors = data.data[0]
                        author.wallet_address = authors.wallet_address;
                    })
                    .catch(error => {
                        console.log(error);
                    });

            } catch (error) {
                console.log(error)
            }
        }

        /**
         * function to edit the author data
         * @param {*} type 
         * @param {*} data 
         */
        async function editAuthorWallet(type, data) {
            try {
                data.type = type;
                await fetch(server + path + '/plugins/generic/DonateButtonPlugin/request/authors.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                })
                    .then(response => response.json())
                    .then(async data => {
                        if (data.success) {
                            isCheckPKPCalled = false;
                            await getAllAuthorData();
                        }
                    })
                    .catch(error => {
                        console.log(error);
                    });
            } catch (error) {
                console.log(error)
            }
        }

        // function to get authors in this submissiob by submission id
        async function getAllAuthorData() {
            try {
                await fetch(server + path + '/plugins/generic/DonateButtonPlugin/request/authors.php?author_id=' + author.author_id + '&submission_id=' + submissionId + '&type=getAllAuthorData')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            allAuthorData.authors = data.data.length
                            allAuthorData.authorData = data.data;
                        }
                    })
                    .catch(error => {
                        console.log(error);
                    });
            } catch (error) {
                console.log(error)
            }
        }

        /**
         * function to get authos settings
         * authors settings contain author given name and author family name
         * @param {*} author_id 
         */
        async function getAuthorSettings(author_id) {
            try {
                await fetch(server + path + '/plugins/generic/DonateButtonPlugin/request/authors.php?author_id=' + author_id + '&submission_id=' + submissionId + '&type=getAuthorSettings')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            var combinedData = {};

                            data.data.forEach(function (obj) {
                                var key = obj.author_id + '-' + obj.locale;
                                if (!combinedData[key]) {
                                    combinedData[key] = {
                                        author_id: obj.author_id,
                                        locale: obj.locale
                                    };
                                }
                                combinedData[key][obj.setting_name] = obj.setting_value;
                            });

                            var combinedArray = Object.values(combinedData);
                            combinedArray.filter(function (value) {
                                if (value.locale === "en_US") {
                                    allAuthorData.authorDataSettings.push(value);
                                }
                            })
                        }
                    })
                    .catch(error => {
                        console.log(error);
                    });
            } catch (error) {
                console.log(error)
            }
        }

        /**
         * Function to update user agreement status
         * @param {*} agree 
         * @param {*} submissionId 
         */
        async function updateAgreement(agree, submissionId) {
            try {
                await fetch(server + path + '/plugins/generic/DonateButtonPlugin/request/publications.php?type=updateAuthorAgreement', {
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

        /**
         * Function to get return author full name from author data settings
         * @param {*} author_id 
         * @returns 
         */
        function getAuthorName(author_id) {
            var authorData = allAuthorData.authorDataSettings.find(function (value) {
                // console.log(value.author_id)
                return value.author_id == author_id.toString();
            });
            // console.log(author_id)

            if (authorData) {
                // console.log(authorData);
                return authorData.givenName + " " + authorData.familyName;
            } else {
                return "";
            }
        }

        /**
         * Function to check current metamask Address is valid or not
         * @param {*} address 
         * @param {*} index 
         * @returns 
         */
        async function checkMetamaskAddress(address, index) {
            const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/7662a41850704f0f878a91a9ccf408a3');
            let label = $("#label_valid_display_" + index);

            try {
                // Validate the address format
                if (!ethers.utils.isAddress(address)) {
                    // console.log('Invalid Ethereum address');
                    label.text('Invalid Ethereum address');
                    label.addClass('invalid');
                    invalidList.push({
                        'index': index,
                        status: 'invalid'
                    });
                    return;
                }

                // Use Etherscan API to verify the address
                const etherscanApiKey = 'AGG2XS154PTEHCPNV6Y24ZPIAE7K8VRUS3';
                const etherscanUrl = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${etherscanApiKey}`;

                const response = await fetch(etherscanUrl);
                const data = await response.json();

                if (data.status === '1') {
                    label.text('Valid Ethereum address');
                } else {
                    label.text('No user found from this address');
                    label.addClass('invalid');
                    invalidList.push({
                        'index': index,
                        status: 'invalid'
                    });
                }

                // Additional logic if needed
            } catch (error) {
                console.log('Error:', error.message);
            }
        }

        // Function to add validate button to the page
        function addValidateButton() {
            //Disable the submit button and the user must validate first
            let saveButton = $(".pkp_button.submitFormButton");
            isValidate = false;
            checkValidateStatus(saveButton);

            saveButton.before("<button type='button' class='pkp_button' id='validate_button'>Validate</button>")

            $(document).on('click', '#validate_button', async function () {
                //fetch all author data
                await getAllAuthorData();

                var authorPromises = [];

                allAuthorData.authorData.forEach(function (data) {
                    // Create a promise for each getAuthorSettings call
                    var promise = new Promise(function (resolve) {
                        getAuthorSettings(data.author_id)
                            .then(function () {
                                resolve();
                            });
                    });

                    authorPromises.push(promise);
                });

                // Wait for all promises to resolve
                await Promise.all(authorPromises);

                //fetch validate.tpl file to show in the modal
                $.get(server + path + '/plugins/generic/DonateButtonPlugin/templates/validate.tpl', function (data) {
                    var modalContent = $(data);
                    Swal.fire({
                        width: "1000",
                        html: modalContent,
                        allowOutsideClick: false,
                        showConfirmButton: true,
                        confirmButtonText: "Submit",
                        allowEscapeKey: false,
                        customClass: {
                            confirmButton: "validate_button_submit pkp_button",
                            cancelButton: "cancel_button_submit pkp_button",
                        },
                        showCancelButton: true,
                        cancelButtonText: "Cancel",
                        didOpen: function () {
                            invalidList = []

                            //empty content when modal open
                            $("#content").empty();

                            allAuthorData.authorData.forEach((data, index) => {
                                let authorDataHtml = `
                                <div class="author_data author_data_${index}">
                                    <div class="author_info">
                                        <div>
                                            <h4>Author ${index + 1}</h4>
                                            <span>${getAuthorName(data.author_id)}</span>
                                        </div>
                                        <div>
                                            <h4>Email</h4>
                                            <span>${data.email}</span>
                                        </div>
                                    </div>
                                    <div class="author_wallet">
                                        <div>
                                            <h4>Wallet Address</h4>
                                            <div class="author_wallet_address">${data.wallet_address == null ? "(Empty)" : data.wallet_address}</div>
                                            <span class="sub_label" id="label_valid_display_${index}">
                                                Checking...
                                            </span>
                                        </div>
                                        <div>
                                            <h4>Coin split percentage</h4>
                                            <input type="number" value="${data.percentage}" class="percentage percentage-${index} field text" id="percentage-${index}" min="0" max="100" placeholder="Input percentage" data-author-id="${data.author_id}">
                                        </div>
                                    </div>
                                </div>
                                `

                                $("#content").append(authorDataHtml)

                                //Check metamask address
                                checkMetamaskAddress(data.wallet_address, index).then(() => {
                                    if (invalidList.length > 0) {
                                        Swal.getConfirmButton().setAttribute('disabled', 'true');
                                    }
                                })

                                // Validate the percentage split
                                $('.percentage-' + index).on('input', function () {
                                    var percentage = parseInt($(this).val());

                                    if (isNaN(percentage) || percentage < 0) {
                                        $(this).val(0);
                                    } else if (percentage > 100) {
                                        $(this).val(100);
                                    } else if (percentage < 10 || percentage >= 100) {
                                        $(this).val(percentage);
                                    } else if (percentage >= 10 && percentage <= 99) {
                                        $(this).val(percentage);
                                    }
                                });


                                $('.percentage-' + index).on('change', function () {
                                    var authorId = $(this).data('author-id');
                                    var percentage = $(this).val();

                                    updateAuthorPercentage(authorId, percentage);
                                });
                                // Validate total percentage
                                validateTotal();

                            })
                        },
                        preConfirm: function () {
                            return validateTotal();
                        }
                    }).then((result) => {
                        // if user confirmed
                        if (result.isConfirmed) {
                            //edit all author percentage
                            allAuthorData.authorData.forEach(function (authorData) {
                                editAuthorWallet("update_percentage", authorData)
                            })
                            isValidate = true;
                            let saveButton = $(".pkp_button.submitFormButton");
                            checkValidateStatus(saveButton)
                        }
                    })
                })
            }) // end
        }

        /**
         * Function to validate total percentage
         * The percentage cannot exceed 100
         * @returns 
         */
        function validateTotal() {
            const percentageInputs = $('.percentage');
            let error_field = $('.error_field');
            error_field.empty();
            // percentageInputs.on('input', validateTotal);

            const total = Array.from(percentageInputs).reduce((sum, input) => sum + Number(input.value), 0);

            if (total > 100) {
                error_field.append("<p class='invalid sub_label'>*Cannot exceed 100 percent.</p>")
                return false;
            }

            if (total < 100 && total != 0) {
                error_field.append("<p class='invalid sub_label'>*Please divide the percent up to a total of 100.</p>")
                return false;
            }

            if (total == 0) {
                error_field.append("<p class='invalid sub_label'>*Percentage total cannot be 0.</p>")
                return false;
            }

            return true;
        }

        /**
         * Function to update author percentage in variable
         * @param {*} authorId 
         * @param {*} percentage 
         */
        function updateAuthorPercentage(authorId, percentage) {
            // Find the corresponding author object in the data
            var author = allAuthorData.authorData.find(function (a) {
                return a.author_id === authorId.toString();
            });

            if (author) {
                author.percentage = percentage;
            }
        }

        /**
         * Function to check PKPGrid
         * If PKPGrid is available then add a clickEventListener to tag a href
         */
        function checkPKPGrid() {
            isCheckPKPCalled = true;
            if (pkpGridInterval == true) {
                let editButtons = $('a').filter(function () {
                    return /^component-grid-users-author-authorgrid-row-\d+-editAuthor-button-\w+$/.test(this.id);
                });

                editButtons.each(function (index, editButton) {
                    if (!editButton.hasEventListener) {
                        editButton.addEventListener('click', function () {
                            author.author_id = this.id.match(/row-(\d+)/)[1];
                            if (author.author_id !== null) {
                                getAuthorWallet();
                                checkModalVisibility();
                            }
                        });
                        editButton.hasEventListener = true;
                    }
                })

                let addButton = $('.pkp_controllers_linkAction.pkp_linkaction_addAuthor.pkp_linkaction_icon_add_user')

                addButton.click(() => {
                    author.author_id = null;
                    author.wallet_address = null;
                    checkModalVisibility();
                })
            }
        }

        /**
         * Function to check if modal popup is visible or not
         * if the modal is visible then add an input to the modal
         * The input is for wallet address
         */
        function checkModalVisibility() {
            let target = $("#userGroupId")

            if (target.length) {
                if (modal_visible && agreed) {
                    let div = $("<div>").attr("class", "dp-wallet-address");
                    let walletAddressLabel = $("<label>").attr({
                        'for': 'walletAddress', 'class': 'dp-label'
                    }).text('Wallet Address');
                    let walletAddressInput = $('<input>').attr({
                        type: 'text',
                        id: 'walletAddress',
                        class: 'wallet-address-input',
                        'required': true
                    });

                    walletAddressInput.on('keydown', function (event) {
                        if (event.key === ' ') {
                            event.preventDefault();
                        }
                    });

                    if (!target.next('.dp-wallet-address').length) {
                        target.after(div.append(walletAddressLabel, walletAddressInput));
                    }

                    walletAddressInput.val(author.wallet_address);

                    walletAddressInput.on('input', function () {
                        author.wallet_address = $(this).val()
                    });


                    let saveButton = $(".pkp_button.submitFormButton");
                    if (!saveButton.hasEventListener) {
                        saveButton.click(function () {
                            // author.wallet_address = walletAddressInput.val();
                            author.email = $(".field.text.required.email").val();
                            if (author.wallet_address !== "" && author.wallet_address !== null) {
                                setTimeout(() => {
                                    editAuthorWallet("update_wallet", author);
                                }, 1000)
                            }
                        })
                        saveButton.hasEventListener = true;
                    }
                }
            } else {
                setTimeout(checkModalVisibility, 100)
            }
        }

        /**
         * Function to get parameter from the URL
         * @param {*} name 
         * @returns 
         */
        function getUrlParameter(name) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name);
        }

        /**
         * Function to disabled or enabled save button based on isValidate 
         * @param {*} button 
         */
        function checkValidateStatus(button) {
            isValidate ? button.prop('disabled', false) : button.prop('disabled', true);
        }

        /**
         * Call the function for watch current active tab
         * If tab is 2 (Enter Metadata Tab)
         */
        watchCurrentActiveTab(async updatedValue => {
            if (updatedValue === 2) {
                checkModalVisibility();
                getPublications(submissionId);

                //Add checkbox for agreement
                function addAgreementCheckbox() {
                    const authorGrid = $("#authorsGridContainer");

                    // console.log(authorGrid)
                    if (authorGrid.length) {
                        let flagAgreement = $('<div>').addClass('flag-agreement');
                        let checkbox = $('<input>').attr({
                            type: 'checkbox',
                            id: 'flagAgreementCheckbox',
                            class: 'flag-agreement-checkbox'
                        });
                        let label = $('<span>').attr({
                            'for': 'flagAgreementCheckbox', 'class': 'dp-span'
                        }).text('I agree that my journal will be monetized');

                        flagAgreement.append(checkbox, label.append("<span class='read_terms'>Read terms</span>"));
                        authorGrid.before(flagAgreement)

                        checkbox.on('click', function () {
                            showModal()
                            if ($(this).is(":checked")) {
                                checkbox.prop('checked', false)
                            } else {
                                checkbox.prop('checked', true)
                            }
                        });

                        // Function to show a modal
                        function showModal() {
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
                                        let saveButton = $(".pkp_button.submitFormButton");

                                        if (agreed) {
                                            checkbox.prop('checked', true);

                                            addValidateButton()
                                        } else {
                                            $("#validate_button").remove();
                                            checkbox.prop('checked', false);
                                            isValidate = true;
                                            checkValidateStatus(saveButton)
                                        }
                                    }
                                })
                            })
                        } //end

                        // Check the checkbox if author_agreement from database is 1 (true)
                        if (publications) {
                            if (publications.author_agreement == "1") {
                                checkbox.prop('checked', true);
                                if (checkbox.is(":checked")) {
                                    agreed = true;
                                    addValidateButton()
                                }
                            } else {
                                checkbox.prop('checked', false);
                                agreed = false;
                            }
                        }

                        let submitButton = $("button.pkp_button.submitFormButton");

                        submitButton.click(() => {
                            updateAgreement(agreed, submissionId);
                        })

                        isCheckPKPCalled = false;

                        interval = setInterval(() => {
                            if ($('body').hasClass('modal_is_visible')) {
                                modal_visible = true
                            } else {
                                modal_visible = false;
                            }
                        }, 100)

                        pkpGridInterval = setInterval(() => {
                            if ($('div').hasClass('pkp_controllers_grid')) {
                                pkpGridInterval = true
                                if (!isCheckPKPCalled) {
                                    checkPKPGrid();
                                }
                            } else {
                                pkpGridInterval = false
                            }
                        }, 100)
                    } else {
                        setTimeout(addAgreementCheckbox, 100)
                    }
                }

                addAgreementCheckbox();
            } else {
                clearInterval(interval)
                clearInterval(pkpGridInterval)
            }
        })

        setInterval(() => {
            getActiveTab();
        }, 100);

    })
})