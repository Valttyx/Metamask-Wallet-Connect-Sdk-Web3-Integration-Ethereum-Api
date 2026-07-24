document.addEventListener('DOMContentLoaded', function () {
    $(document).ready(function () {
        //-----------------------------------------------------VARIABLES----------------------------------------------------
        const url = window.location.href;
        let currentActiveTab,
            percentage_settings = {
                publisher_id: null,
                percentage_authors: 0,
                percentage_reviewers: 0,
                percentage_publisher: 0,
            },
            reviewersData = [],
            username = null,
            wallet_address = null,
            server = getServerFromUrl(url),
            path = getUrlBeforeIndexPhp(url),
            buttonClicked = "";


        // ---------------------------------------------------- FUNCTIONS --------------------------------------------------
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

        // function getUrlBeforeIndexPhp(url) {
        //     var regex = /^(?:https?:\/\/[^/]+)?(.*?)(?=\/?index\.php)/;
        //     var matches = url.match(regex);
        //     if (matches && matches.length > 1) {
        //         return matches[1];
        //     }
        //     return url;
        // }

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

        // Get percentage setting by publisher id
        async function getPercentageSettings() {
            try {
                await fetch(server + path + '/plugins/generic/DonateButtonPlugin/request/percentage_settings.php?publisher_id=' + percentage_settings.publisher_id)
                    .then(response => response.json())
                    .then(data => {
                        percentage_settings.percentage_authors = data.data[0].percentage_authors
                        percentage_settings.percentage_reviewers = data.data[0].percentage_reviewers
                        percentage_settings.percentage_publisher = data.data[0].percentage_publisher
                        // percentage_settings.percentage_editors = data.data[0].percentage_editors
                        // console.log(publications);
                    })
                    .catch(error => {
                        console.log(error);
                    });
            } catch (error) {
                console.log(error);
            }
        }

        // Function to update percentage settings
        async function updatePercentageSettings() {
            try {
                await fetch(server + path + '/plugins/generic/DonateButtonPlugin/request/percentage_settings.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(percentage_settings)
                })
                    .then(response => response.json())
                    .then(data => {
                        // console.log(data)
                        if (data.success) {
                            createToast("success", "Success", "Settings saved", "#00b09b");
                        }
                    })
                    .catch(error => {
                        console.log(error);
                    });
            } catch (error) {
                console.log(error);
            }
        }

        // Function to get all user with Role reviewer
        async function getAllReviewerRole() {
            try {
                await fetch(server + path + '/plugins/generic/DonateButtonPlugin/request/reviewers.php?type=getReviewerRole')
                    .then(response => response.json())
                    .then(data => {
                        // console.log(data)
                        reviewersData = data.data
                    })
                    .catch(error => {
                        console.log(error);
                    });
            } catch (error) {
                console.log(error)
            }
        }

        /**
       * Function to get a fragment from the URL
       * Example : #setup
       */
        function getFragment() {
            var urlFragment = window.location.hash;
            var setupFragment = urlFragment.split('/')[0];
            // console.log(setupFragment)
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

        // Function to make a list with id "information button" is show first when page load
        function defaultSetting() {
            //make information button select by default
            $("#information-button").addClass('pkpTab--isActive');
            $("#information-button").attr('aria-selected', true);

            //show information panel
            $("#information").addClass('pkpTab--isActive');
            $("#information").removeAttr('hidden');

            //hide smartcontract panel
            hideSmartContract();
        }

        function showSmartContract() {
            //show smartcontract panel
            $("#smartcontract").addClass('pkpTab--isActive');
            $("#smartcontract").removeAttr('hidden');
        }

        function hideSmartContract() {
            //hide smartcontract panel
            $("#smartcontract").removeClass('pkpTab--isActive');
            $("#smartcontract").attr('hidden', 'hidden');
        }

        /**
       * Function to validate total percentage
       * The percentage cannot exceed 100
       * @returns 
       */
        function validateTotal() {
            const percentageInputs = $('.percentage_field');
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


        // Function to show a list of reviewers
        function showTable() {
            $("table#reviewer_table tbody").empty();
            for (let i = 0; i < reviewersData.length; i++) {
                let tr = `
                <tr class="gridRow">
                <td class="first_column">
                    <span class="gridCellContainer">
                        ${i + 1}
                    </span>
                </td>
                <td>
                    <span>
                        ${reviewersData[i].username}
                    </span>
                </td>
                <td>
                    <span>
                        ${reviewersData[i].email}
                    </span>
                </td>
                <td>
                    <span class="wallet-text">
                        ${reviewersData[i].wallet_address != null ? reviewersData[i].wallet_address : ''}
                    </span>
                </td>
            </tr>
                `

                $("table#reviewer_table tbody").append(tr)
            }

        }


        // Function to disable all role except reviewer
        // This is needed when user want to add a user with reviewer role
        function observeParentElement() {
            var userRoleForm = document.querySelector('#userRoleForm');

            if (userRoleForm) {
                var parentElement = userRoleForm.querySelector('.checkbox_and_radiobutton');

                if (parentElement) {
                    var checkboxes = parentElement.querySelectorAll('input[type="checkbox"]');
                    if (buttonClicked == "reviewer") {
                        checkboxes.forEach(function (checkbox) {
                            if (checkbox.value !== '33') {
                                checkbox.disabled = true;
                            }
                        });
                    }
                    if (buttonClicked == "editor") {
                        checkboxes.forEach(function (checkbox) {
                            if (checkbox.value !== '24') {
                                checkbox.disabled = true;
                            }
                        });
                    }
                } else {
                    console.log('Checkbox element not found');
                }

                $(".submitFormButton").on('click', function () {
                    setTimeout(async function () {
                        await getAllReviewerRole();
                        showTable();
                        observeParentElement();
                    }, 2000)
                })

            } else {
                setTimeout(observeParentElement, 100);
            }
        }

        /**
         * Function to update user wallet address
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
         * Function to get user wallet address and user id by username
         * @param {*} username 
         */
        async function getUserAddress(username) {
            try {
                await fetch(server + path + "/plugins/generic/DonateButtonPlugin/request/users.php?type=getUserAddress&username=" + username)
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.data.length > 0) {
                            wallet_address = data.data[0].wallet_address
                            percentage_settings.publisher_id = data.data[0].user_id
                            // console.log(percentage_settings.publisher_id)
                            $("#publisher_wallet").val(wallet_address);
                            getPercentageSettings();
                        }
                    })
                    .catch((error) => {
                        console.log(error)
                    })
            } catch (error) {
                createToast("error", "Error", error.message, "#ff5f6d");
            }
        }

        /**
        * Function to check current metamask Address is valid or not
        * @param {*} address 
        * @param {*} index 
        * @returns 
        */
        async function checkMetamaskAddress(address, label) {
            const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/7662a41850704f0f878a91a9ccf408a3');

            try {
                // Validate the address format
                if (!ethers.utils.isAddress(address)) {
                    // console.log('Invalid Ethereum address');
                    label.text('Invalid Ethereum address');
                    label.addClass('invalid');
                    return;
                }

                // Use Etherscan API to verify the address
                const etherscanApiKey = 'AGG2XS154PTEHCPNV6Y24ZPIAE7K8VRUS3';
                const etherscanUrl = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${etherscanApiKey}`;

                const response = await fetch(etherscanUrl);
                const data = await response.json();

                if (data.status === '1') {
                    label.text('Valid Ethereum address');
                    if (address !== wallet_address) await updateAddress(address)
                } else {
                    label.text('No user found from this address');
                    label.addClass('invalid');
                    invalidList.push({
                        'index': index,
                        status: 'invalid'
                    });
                }

                label.text('Valid Ethereum address');
                // Additional logic if needed
            } catch (error) {
                console.log('Error:', error.message);
            }
        }

        // ------------------------------------------------------------------------------------------------

        // Call the function to watch current fragment
        watchCurrentFragment(async value => {
            if (value == "#setup") {
                // await getPercentageSettings();
                await getAllReviewerRole();
                defaultSetting();

                setTimeout(async () => {
                    //Get username from this
                    var span = $(".-screenReader").eq(1);
                    var text = span.text();
                    username = text;
                    if (username != "") {
                        await getUserAddress(username);
                    }
                }, 500)

                //load tpl file to show in the page
                $.get(server + path + '/plugins/generic/DonateButtonPlugin/templates/smart_contract_settings.tpl', function (data) {
                    var content = $(data);

                    $("#dateTime").after(content)
                })

                var tabListContainer = $('#setup .pkpTabs--side .pkpTabs__buttons');

                //check if button is exist or not
                if ($('#smart-contract-button').length === 0) {
                    let smartContractButton = `
                        <button aria-controls="smartContract" id="smart-contract-button" role="tab" tabindex="-1" class="pkpTabs__button">
                            Smart Contract
                        </button>`;

                    // append button if the button is not exist
                    tabListContainer.append(smartContractButton);
                }

                var buttons = tabListContainer.find('.pkpTabs__button');
                buttons.each(function () {
                    $(this).on('click', function () {
                        if ($(this).attr('id') == "smart-contract-button") {

                            //make this button selected
                            $(this).attr('aria-selected', 'true');

                            //make all button not selected
                            tabListContainer.find('.pkpTabs__button').not(this).removeAttr('aria-selected');

                            //find all div with role tabpanel and make it hidden
                            var tabPanelDiv = $('#setup .pkpTabs--side div[role="tabpanel"]');
                            tabPanelDiv.removeClass('pkpTab--isActive');
                            tabPanelDiv.attr('hidden', 'hidden');

                            //update url to /smartContract
                            var currentUrl = window.location.href;
                            var newUrl = currentUrl.replace(/#setup\/.*/, '#setup/smartContract');
                            history.pushState(null, '', newUrl);

                            //show the div with id #smartcontract
                            showSmartContract();

                            showTable();
                        } else {
                            //make smart contract button not selected
                            $("button#smart-contract-button").removeAttr('aria-selected');

                            //find a panel using button id and show the panel
                            var ariaLabelledByValue = $(this).attr('id');
                            var element = $("div[aria-labelledby='" + ariaLabelledByValue + "']");
                            element.addClass('pkpTab--isActive')
                            element.removeAttr('hidden')

                            //hide the div with id #smartcontract
                            hideSmartContract();
                        }
                    });
                })

                // when click "Settings" button show a modal
                $(document).on('click', "#settings", () => {
                    $.get(server + path + '/plugins/generic/DonateButtonPlugin/templates/settings.tpl', function (data) {
                        var modalContent = $(data);
                        Swal.fire({
                            width: "1000",
                            html: modalContent,
                            allowOutsideClick: false,
                            showConfirmButton: true,
                            confirmButtonText: "Submit",
                            allowEscapeKey: false,
                            showCancelButton: true,
                            cancelButtonText: "Cancel",
                            customClass: {
                                confirmButton: "submit_button pkp_button",
                                cancelButton: "cancel_button pkp_button",
                            },
                            preConfirm: () => {
                                percentage_settings.percentage_authors = $("#authors_percentage").val()
                                percentage_settings.percentage_reviewers = $("#reviewers_percentage").val()
                                percentage_settings.percentage_publisher = $("#publishers_percentage").val()
                                // percentage_settings.percentage_editors = $("#editors_percentage").val()
                                return validateTotal();
                            },
                            didOpen: () => {
                                $("#authors_percentage").val(percentage_settings.percentage_authors)
                                $("#reviewers_percentage").val(percentage_settings.percentage_reviewers)
                                $("#publishers_percentage").val(percentage_settings.percentage_publisher)
                                // $("#editors_percentage").val(percentage_settings.percentage_editors)
                            }
                        }).then((result) => {
                            if (result.isConfirmed) {
                                updatePercentageSettings();
                            }
                        })
                    })
                })

                //validate the smart contract
                $(document).on('click', '#validate_address', async function () {
                    let wallet_address = $("#publisher_wallet").val();
                    let error_label = $(".input_section .sub_label");

                    if (wallet_address === "") {
                        error_label.addClass('invalid');
                        error_label.text("Wallet Address is required")
                    } else if (wallet_address !== "") {
                        error_label.removeClass('invalid');
                        error_label.text("Checking...")
                        await checkMetamaskAddress(wallet_address, error_label)
                    } else {
                        error_label.text("")
                    }
                })

                function checkButton() {
                    let addReviewerButton = $("#add_reviewer_button");
                    // let addEditorButton = $("#add_editor_button");

                    if (addReviewerButton.length) {
                        addReviewerButton.on('click', () => {
                            buttonClicked = "reviewer"
                            // console.log(buttonClicked)
                        })

                        // addEditorButton.on('click', () => {
                        //     buttonClicked = "editor"
                        //     // console.log(buttonClicked)
                        // })
                    } else {
                        setTimeout(checkButton, 100);
                    }
                }
                checkButton()

                observeParentElement();
            } else {
                $("#smart-contract-button").remove();
            }
        })

        setInterval(() => {
            getFragment();
        }, 100)
    })

});