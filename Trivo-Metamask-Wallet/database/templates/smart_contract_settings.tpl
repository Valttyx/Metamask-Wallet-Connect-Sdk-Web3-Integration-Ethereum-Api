<div role="tabpanel" id="smartcontract" aria-labelledby="smart-contract-button" class="pkpTab" hidden="hidden">
    <div id="smartContractContainer" style="">
        <div class="title_section">
            <h3>Smart Contract</h3>
            <div>
                <button type="button" class="pkp_button" id="settings">Settings</button>
            </div>
        </div>

        <div class="input_section">
            <h3>Publisher - Wallet Address</h3>
            <div style="display: flex; gap: 20px; align-items: flex-start;">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <input type="text" placeholder="Input wallet address" id="publisher_wallet"
                        class="publisher_wallet field text" />
                    <span class="sub_label" style="margin-left: 5px;"></span>
                </div>
                <button class="pkp_button" id="validate_address" class="validate">
                    Validate
                </button>
            </div>
        </div>

        <div>
            <h3>Reviewer</h3>
            <table style="width: 100%" id="reviewer_table">
                <colgroup>
                    <col class="grid-column" style="width: 7%" />
                    <col class="grid-column" style="width: 20%" />
                    <col class="grid-column" style="width: 33%" />
                    <col class="grid-column" style="width: 40%" />
                </colgroup>
                <thead>
                    <tr>
                        <th scope="col" style="text-align: left">No</th>
                        <th scope="col" style="text-align: left">Reviewer</th>
                        <th scope="col" style="text-align: left">Email</th>
                        <th scope="col" style="text-align: left">Wallet Address</th>
                    </tr>
                </thead>
                <tbody>

                </tbody>
            </table>
        </div>

        <div class="add_reviewer_section">
            <div>
                <a href="#  "
                    id="component-grid-settings-user-usergrid-addUser-button"
                    class="pkp_controllers_linkAction pkp_linkaction_addUser pkp_linkaction_icon_add_user">
                    <button class="pkp_button" id="add_reviewer_button">Add Reviewer</button>
                </a>
                <script>
                    $(function() {
                        var url = window.location.href;
                        // var url = "http://localhost:8081/journal_it/$$$call$$$/grid/settings/user/user-grid/add-user"

                        var server = getServerFromUrl(url);
                        var journalName = getDynamicJournalPart(url);
                        var path = getUrlBeforeIndexPhp(url);

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

                            // If the dynamic part is not found, return empty string or any other appropriate value
                            return "";
                        }

                        function getUrlBeforeIndexPhp(url) {
                            if (url.includes("/index.php")) {
                                var regex = /^(?:https?:\/\/[^/]+)?(.*?\/index\.php)/;
                                var matches = url.match(regex);
                                if (matches && matches.length > 1) {
                                    return matches[1];
                                }
                            } else {
                                // For other cases, return the whole URL
                                return "";
                            }
                        }

                        let completeUrl = `${server}${path}/${journalName}/$$$call$$$/grid/settings/user/user-grid/add-user`;

                        $('#component-grid-settings-user-usergrid-addUser-button').attr("href", completeUrl)
                            .pkpHandler(
                                '$.pkp.controllers.linkAction.LinkActionHandler', {
                                    staticId: "component-grid-settings-user-usergrid-addUser-button",
                                    actionRequest: "$.pkp.classes.linkAction.ModalRequest",
                                    actionRequestOptions: {
                                        "title": "Add Reviewer",
                                        "titleIcon": "modal_add_user",
                                        "canClose": "0",
                                        "closeOnFormSuccessId": null,
                                        "closeCleanVueInstances": [],
                                        "closeButtonText": "Close Panel",
                                        "modalHandler": "$.pkp.controllers.modal.AjaxModalHandler",
                                        "url": completeUrl,
                                    }
                                }
                            );
                    });
                </script>
            </div>
        </div>
    </div>
</div>