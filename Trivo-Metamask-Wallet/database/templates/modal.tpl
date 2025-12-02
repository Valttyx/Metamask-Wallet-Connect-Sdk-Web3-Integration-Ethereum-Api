<style scoped>
    .eula-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 5px;
        background-color: #f9f9f9;
        text-align: left;
    }

    .checkbox-container {
        margin-top: 20px;
        text-align: center;
    }

    .eula-container h2:first-child {
        text-align: center !important;
        text-transform: uppercase;
        margin-top: 0px;
    }

    .eula-container p,
    .agree-checkbox {
        font-size: 16px;
    }

    .agree-checkbox {
        margin-left: 5px;
    }

    #modal {
        margin-top: 40px;
    }
</style>
<div id="modal">
    <div class="eula-container">
        <h2>End User License Agreement</h2>
        <p>Please read this End User License Agreement (the "Agreement") carefully before using the software.</p>

        <p>
            By using the software, you are agreeing to be bound by the terms and conditions of this Agreement.
            If you do not agree to the terms of this Agreement, do not use the software.
        </p>

        <h3>1. License Grant</h3>
        <p>The software is licensed, not sold, to you by the licensor for use strictly in accordance with the terms of
            this Agreement.</p>

        <h3>2. Restrictions</h3>
        <p>You shall not:</p>
        <ul>
            <li>Copy the software.</li>
            <li>Modify or create derivative works based upon the software.</li>
            <li>Reverse engineer, decompile, or disassemble the software.</li>
        </ul>

        <h3>3. Termination</h3>
        <p>This Agreement is effective until terminated. Your rights under this Agreement will terminate automatically
            without notice from the licensor if you fail to comply with any term(s) of this Agreement.</p>

        <div class="checkbox-container">
            <input type="checkbox" id="agree-checkbox">
            <label for="agree-checkbox" class="agree-checkbox">I agree to the terms and conditions of this
                Agreement.</label>
        </div>

    </div>
</div>