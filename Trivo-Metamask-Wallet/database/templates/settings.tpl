<style scoped>
    .container {
        margin: 0 auto;
        padding: 10px;
        text-align: left;
    }

    .container h2 {
        text-align: left;
        margin-top: 0px;
    }
</style>
<div id="modal">
    <div class="container">
        <h2>Settings</h2>
        <div class="content settings" id="content">
            <div class="input_section">
                <div>
                    <label for="authors_percentage" class="dp-label">Authors Percentage (%)</label>
                    <input type="number" placeholder="Input authors percentage" id="authors_percentage"
                        name="authors_percentage" class="authors_percentage percentage_field number" />
                </div>
                <div>
                    <label for="reviewers_percentage" class="dp-label">Reviewers Percentage (%)</label>
                    <input type="number" placeholder="Input reviewers percentage" id="reviewers_percentage"
                        name="reviewers_percentage" class="reviewers_percentage percentage_field number" />
                </div>
                <div>
                    <label for="publishers_percentage" class="dp-label">Publishers Percentage (%)</label>
                    <input type="number" placeholder="Input publishers percentage" id="publishers_percentage"
                        name="publishers_percentage" class="publishers_percentage percentage_field number" />
                </div>
            </div>
        </div>
        <div class="error_field">
            <p></p>
        </div>
    </div>
</div>