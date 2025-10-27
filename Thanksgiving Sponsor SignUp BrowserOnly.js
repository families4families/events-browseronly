<script src="https://code.jquery.com/jquery-3.7.1.min.js"
        integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/mustache@4.2.0"></script>
<script src="https://unpkg.com/highlight.run"></script>
<script>
    H.init('1ep3rxjd', { // Get your project ID from https://app.highlight.io/setup
        environment: 'production',
        version: 'commit:abcdefg12345',
        networkRecording: {
            enabled: true,
            recordHeadersAndBody: true,
            urlBlocklist: [
                // insert full or partial urls that you don't want to record here
                // Out of the box, Highlight will not record these URLs (they can be safely removed):
                "https://www.googleapis.com/identitytoolkit",
                "https://securetoken.googleapis.com",
            ],
        },
    });

    window.onerror = function myErrorHandler(errorMsg) {
        console.error(`unhandled error: ${errorMsg}`);
        return false;
    }
</script>

<!--
<link rel="stylesheet" href="https://rnorian.github.io/F4F/css/sponsor-signup.css">
<script type="text/javascript" src="https://rnorian.github.io/F4F/src/modules/F4FShared.js"></script>
-->
<style>
    section.search-results-block {
        display: flex;
        flex-direction: column;
        align-content: flex-start;
        width: 500px;
        min-width: 150px;
        max-width: 90%;
        gap: 20px;
    }

    section.search-results-block div.f4f-client-card {
        width: 100%;
        min-width: 500px;
        padding: 10px;
        border-color: black;
        border-style: solid;
        border-radius: 25px;
        border-width: 1px;
        border-spacing: 10px;

        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    section.search-results-block .f4f-family-name {
        display: inline-block;
        margin: 10px 10px 10px 15px; /* top right bottom left */
        font-weight: bold;
    }

    section.search-results-block div.f4f-client-card table.f4f-family-members {
        width: 100%;
        max-width: 100%;
        padding-left: 10px;
        padding-right: 20px;
        padding-top: 10px;
        padding-bottom: 10px;

        border-spacing: 10px;
        white-space: pre-wrap;
    }

    section.search-results-block div.f4f-client-card table.f4f-family-members td {
        padding-right: 10px;
    }

    button.sponsor-button {
        margin: 30px 10px 10px 10px; /* top right bottom left */
        padding: 10px;
        border-color: black;
        border-width: 2px;
        width: 100px;
        border-radius: 25px;
        font-weight: 500;
        background-color: #EFEFEF;
    }

    span.f4f-no-search-results {
        width: 90%;
        display: inline-block;
        color: orange;
    }

    div.f4f-client-unselected {
        background-color: transparent;
    }

    /* requires most specific selector to override flex */
    div.f4f-client-card.f4f-client-unselected.f4f-client-unavailable.f4f-client-unavailable {
        display: none;
    }

    div.f4f-client-selected {
        display: inline;
        background-color: lightblue;
    }


    div.f4f-client-card {
        width: 100%;
    }
</style>

<script type="x-tmpl-mustache" id="SearchResultsDisplayCardTemplate">
    <section class="search-results-block">
        {{#.}}
        <div id='{{F4FNumber}}' class="f4f-client-card f4f-client-unselected">
            <span class="f4f-family-name">{{ClientFirstName}}'s Family</span>
            <table data-f4f-number="{{F4FNumber}}" class="f4f-family-members">
                <tbody>
                <tr>
                    <td nowrap>Family Size</td>
                    <td nowrap style='width: 99%'>{{ClientFamilySizeDescription}}</td></tr>
                <tr>
                    <td nowrap>Dietary Restrictions</td>
                    <td style='width: 99%; white-space:normal; word-wrap:break-word'>{{ClientDietaryRestrictionsDescription}}</td></tr>
                <tr>
                    <td nowrap style="vertical-align: text-top;">Special Requests</td>
                    <td style='width: 99%; white-space:normal; word-wrap:break-word' >{{ClientSpecialRequestsDescription}}</td></tr>
                </tbody>
            </table>
            <button id="btnSponsor-{{F4FNumber}}" type="button" class="sponsor-button"
                    onclick="setSelectedSponsorFamily('{{F4FNumber}}');">Select</button>
        </div>
        {{/.}}
        {{^.}}
        <span class="f4f-no-search-results">{{noResultsMessage}}</span>
        {{/.}}
    </section>
</script>
<script type="x-tmpl-mustache" id="ConfirmationEmailDisplayCardTemplate">
    <style>
        section.client-family h3.family-name{
            margin-bottom: 5px;
        }

        div.family-contact-block {
            display: flex;
            flex-direction: row;
        }

        section.client-family h4 {
            margin: 0px 0px 0px 0px;
            padding-top: 10px;
        }

        div.family-contact-methods table td {
            padding-left: 5px;
        }

        div.family-contact-times {
            margin-left: 50px;
        }

        div.family-contact-times table td {
            padding-left: 5px;
        }

        div.family-contact-times table td:nth-child(2) {
            padding-left: 15px;
        }
    </style>
        <section class="client-family">
        <h3 class="family-name">{{ClientFirstName}}'s Family</h3>
            <span class="f4f-family-name">{{ClientFirstName}}'s Family</span>
            <table data-f4f-number="{{F4FNumber}}" class="f4f-family-members">
                <tbody>
                <tr>
                    <td nowrap>Family Size</td>
                    <td nowrap style='width: 99%'>{{ClientFamilySizeDescription}}</td></tr>
                <tr>
                    <td nowrap>Dietary Restrictions</td>
                    <td style='width: 99%; white-space:normal; word-wrap:break-word'>{{ClientDietaryRestrictionsDescription}}</td></tr>
                <tr>
                    <td nowrap style="vertical-align: text-top;">Special Requests</td>
                    <td style='width: 99%; white-space:normal; word-wrap:break-word' >{{ClientSpecialRequestsDescription}}</td></tr>
                </tbody>
            </table>
        </div>
        </section>
</script>

<script type="text/javascript">
    /**
     *
     */
    function documentReady(fn) {
        if (document.readyState !== 'loading') {
            fn();
            return;
        }
        document.addEventListener('DOMContentLoaded', fn);
    }

    /**
     * get a field's value that only appears once on the form
     */
    function getFieldValue(fields, label) {
        let field = fields.find((e) => e.title === label);
        if (!field) {
            throw Error(`field ${label} not found`);
        }
        let val = field.answer.value;
        if (typeof val === "string") {
            val = val.trim();
        }
        return val;
    }

    /**
     * get a field's value from a set of field values; i.e the Nth family members Name if the family member block repeats
     * multiple times on the form
     */
    function getRFieldValue(fields, label, i) {
        let values = getFieldValues(fields, label).split("||");
        if (values.length < i) {
            throw new Error(`requested index position ${i} does not exist in field values set: ${values}`);
        }
        return values[i - 1];
    }

    /**
     * get a matrix field's value
     */
    function getMFieldValue(fields, label) {
        let filtered = fields.filter((field) => field.type === "MATRIX" && field.title.startsWith(label));
        if (filtered.length === 0) {
            throw Error(`matrix field starting with '${label}' not found`);
        }

        const contactTimes = {
            "9am - 12pm": [],
            "12pm - 3pm": [],
            "3pm - 6pm": [],
            "6pm - 9pm": [],
        };

        // go through all the answers
        // if the answer contacts the contactTimes.key value (Any Day, Thursday, etc)
        // ... add the matrix title slice to the value
        for (let key in contactTimes) {
            const matrixResponses = filtered.filter((field) => field.title.includes(key));
            if (matrixResponses.length === 1) {
                contactTimes[key] = matrixResponses[0].answer.value;
            } else if (matrixResponses.length > 1) {
                throw new Error("unexpected matrix response");
            }
        }

        return contactTimes;
    }

    /**
     * get a set of field values for a field appears multiple times on the form (i.e. if you collect multiple family members,
     * there will be N number of 'Name' fields
     *
     * @returns  a comma separated list of all the values
     */
    function getFieldValues(fields, label) {
        let filtered = fields.filter((field) => field.title === label);
        let values = filtered.map((field) => {
            let val = field.answer.value;
            if (val === "undefined" || val === null) {
                val = "";
            }
            if (typeof val === "string") {
                val = val.trim();
            }
            return val;
        });
        return values.join("||");
    }

    /**
     * Binds to Tally form definition where PropertyName = FieldName in Tally
     *
     * used to:
     *      auto-hook up change watching on search filters (DocIDs.search)
     *      define set of fields to be copied from Tally form to Google sheets (all capitalized properties on the root of DocIDs)
     *      add custom handling (toLowerCase, etc) on conversion of values from Tally inputs to Google sheet save
     * properties
     * @type {any}
     */
    const DocIDs = {
        /*
           SHORT ANSWER / LONG ANSWER
           1. find the input node with the label value the same as the key name

           DROPDOWN
           1.

           CHOICE-OPTION
           1. find the div node w/the field name 'sponsorPreviouslFamilyYN' and get its parent div block w/class attribute containing tally-multiple-choice-option
           2. find the label node w/the labelContent and then extract the label-for attribute value
        */
        meta: {
            SearchClientFamilySize: {
                type: "DROPDOWN",
                labelContent: "Family Size",
            },
            SearchClientFamilyGender: {
                type: "DROPDOWN",
                labelContent: "Genders",
            },
            SponsorPreviousFamilyY: {
                type: "CHOICE-OPTION",
                fieldName: "SponsorPreviousFamilyYN",
                labelContent: "Yes",
            },
            SponsorPreviousFamilyN: {
                type: "CHOICE-OPTION",
                fieldName: "SponsorPreviousFamilyYN",
                labelContent: "No",
            },
            SponsorEmail: {
                type: "INPUT",
                saveHandling: (text) => text !== "undefined" ? text.toLowerCase() : "",
            }
        },

        /**
         * Fields on the "root" of DocIDs are input form fields
         * the data from these fields is captured for saving to the spreadsheet
         * any field that is not a simple text input (short answer, long answer) ... i.e. a dropdown or choice of some sort will require meta information
         *
         * NOTE: fields that start with a lower case name are skipped during the ID search phase of initialization
         */
        SponsorFirstName: null,
        SponsorLastName: null,
        SponsorEmail: null,
        SponsorPhoneNumber: null,

        /***
         Fields that are attached to on the form, but that are ignored for saving (i.e. never get sent to spreadsheet)
         ***/
        infoOnly: {
            SponsorPreviousFamilyY: null,
            SponsorPreviousFamilyN: null,
        },

        /**
         * Fields that trigger searches, and the field values act as filters to the search sent to the spreadsheet.
         * These fields are ignored for saving
         */
        search: {
            SearchClientFamilySize: null, // drop-down
            /* SearchClientDietaryRestrictions: '6e209709-80c4-4a02-ab80-0cb7717799cf', // drop-down */
        },

        /**
         * fields that are captured for content attachment (i.e. we may inject HTML into these blocks) but have no other function
         */
        displayBlocks: {
            searchResultsDiv: '',
        },

        initialize: function (obj = DocIDs) {
            for (let key in obj) {

                if (key === "meta") {
                    continue;
                }

                let val = obj[key];
                if (val !== null && typeof val === 'object') {
                    this.initialize(val);
                }

                if (val !== null) {
                    // only auto-bind nulls (fields that are only used during save - i.e. looked up in the tally fields passed during submit - don't need to be bound)
                    continue;
                }

                if (key[0].toLowerCase() === key[0]) {
                    // keys that start w/a lower case is a signal to skip
                    continue;
                }

                const jElement = jQuery(`input[aria-label='${key}']`); // this works for standard text inputs
                if (jElement.length === 1) {
                    obj[key] = jElement[0].id;
                } else if (jElement.length === 0) {
                    // handle drop downs
                    // 1. search for the <label>[LabelContent]</label> and extract inputId from the for=<inputId> attribute
                    if (DocIDs.meta[key] && DocIDs.meta[key].type === "DROPDOWN") {
                        let labels = document.querySelectorAll("label");
                        let dropdownLabel = [].filter.call(labels, function (label) {
                            return label.innerHTML === DocIDs.meta[key].labelContent;
                        });
                        if (dropdownLabel.length !== 1) {
                            throw new Error(`could not find dropdown ${DocIDs.meta[key].labelContent}`);
                        }
                        dropdownLabel = dropdownLabel[0];

                        if (dropdownLabel.hasAttribute("for")) {
                            obj[key] = dropdownLabel.getAttribute("for");
                        } else {
                            throw new Error(`could not find attribute 'for' on dropdown label ${DocIDs.meta[key].labelContent}`);
                        }
                    } else if (DocIDs.meta[key] && DocIDs.meta[key].type === "CHOICE-OPTION") {
                        let optionChoiceBlocks = document.querySelectorAll(`div.tally-block-multiple-choice-option div`);
                        let choiceFieldNameDiv = [].filter.call(optionChoiceBlocks, function (div) {
                            if (div !== "undefined" && div !== null) {
                                return div.innerHTML === DocIDs.meta[key].fieldName;
                            } else {
                                console.error("could not find div for DocIDs.meta[key] = " + key);
                            }
                        });
                        if (choiceFieldNameDiv.length !== 1) {
                            throw new Error(`could not find ${DocIDs.meta[key].fieldName}`);
                        }
                        let legendId = choiceFieldNameDiv[0].id; // legend_XXX

                        let optionChoiceLabels = document.querySelectorAll(`input[aria-describedby='${legendId}'] + label`);
                        let optionChoice = [].filter.call(optionChoiceLabels, function (label) {
                            return label.innerHTML === DocIDs.meta[key].labelContent;
                        });
                        if (optionChoice.length !== 1) {
                            throw new Error(`could not find ${DocIDs.meta[key].fieldName} - ${DocIDs.meta[key].labelContent}`);
                        }

                        if (optionChoice[0].hasAttribute("for")) {
                            obj[key] = optionChoice[0].getAttribute("for");
                        } else {
                            throw new Error(`could not find attribute 'for' on option ${DocIDs.meta[key].fieldName} -> ${DocIDs.meta[key].labelContent}`);
                        }
                    } else {
                        throw new Error(`could not find element with label: ${key}`);
                    }
                }
            }
        },

        findLabel: function (searchVal, obj = DocIDs) {
            for (let key in obj) {
                let val = obj[key];

                if (typeof val === 'object') {
                    let label = this.findLabel(searchVal, val);
                    if (label !== null) return label;
                }

                if (val === searchVal) {
                    return key;
                }
            }
            return null;
        },

        inputFields: function () {
            let inputs = [];
            for (const field in this) {
                if (typeof this[field] === 'function' || typeof this[field] === 'object') {
                    continue;
                }
                if (this[field] === "undefined" || this[field] === null) {
                    continue;
                }
                inputs.push(field);
            }
            return inputs;
        }
    };
</script>

<script type="text/javascript">

    emailjs.init({publicKey: "ukws6XKmos438OOho",});

    /*****************
     *  CONFIGURATION
     *****************/
    const eventName = 'Thanksgiving';
    /** todo: read the sheet tab name (or the event name & year) from the URL **/
    const eventYear = new Date().getFullYear();
    const f4fSheet = `https://sheet.best/api/sheets/f1d55e40-55cb-4141-95d6-c43d1384c9d5`;
    const gEventSheet = `${f4fSheet}/tabs/${eventName}${eventYear}`
    const gEventSheetQuery = `${gEventSheet}/query`;

    //FUTURE: const gSponsorshipHistoryQuery = `${f4fSheet}/tabs/SponsorshipHistory/query`;
    //FUTURE: const gSponsorshipHistoryTabColumns = ["LockedTo", "Thanksgiving", "AdoptAStudent", "Christmas"];
    const gSponsorshipHistoryQuery = gEventSheetQuery;
    const gSponsorshipHistoryTabColumns = ["PreviousSponsorEmail"];

    // family results
    const resultsPlaceholderSelector = 'div > div.sc-1a5a54bd-0.cDDyID.tally-text:contains("client family search results")';
    const submitButtonSelector = 'button[type="submit"]';

    let gClientFamilyCache = null;

    /*****
     event specific customization

     1. Search: for any search filter control (typically Family Size, Gender, etc), there must be a property
     on DocIDs.search with the same name as the control. Optionally (but usually), the meta data for that
     control should be populated in DocIDs.meta (because these controls are almost always drop downs or
     radio buttons, etc.

     2. Sponsor specific fields outside of contact information capture (First Name, Last Name, Email, Phone)
     These fields should be defined (with their optional meta info in DocIDs.meta) on the DocIDs root and
     should begin with a capital letter IF the data needs to be captured and sent to the event spreadsheet.
     In these cases, the property name on DocIDs must match the field name on the Tally Form and that must
     also match the column header in the Google sheet
     *****/
    DocIDs.meta.SearchClientFamilyGender = null;

    // SponsorAttendHolidayParty has no custom logic handlers (thus no meta blocks for SponsorAttendHolidayPartyY / N,
    // But the value (answer) needs to be persisted during Submit (save)
    // setting a value "no-field-binding" causes it to be skipped during initalization binding
    //DocIDs.SponsorAttendHolidayParty = "no-field-binding";
    // standard field; can be bound during initialization even if we aren't using it
    //DocIDs.SponsorHolidayPartyAttendeeCount = "no-field-binding";

    const gConfigData = {};

    async function initializeConfiguration() {
        let url = `${f4fSheet}/tabs/EventConfiguration`;
        const configData = await fetchEventConfigurationData(url, eventName + eventYear);
        configData.forEach((row) => {
            let value = row["Value"];
            if (row["Type"] === "boolean") {
                value = JSON.parse(value);
            } else if (row["Type"] === "Number") {
                value = Number(value);
            }
            gConfigData[row["Key"]] = value;
        });

        // override with query string params for development testing
        if (window) {
            const urlParams = new URLSearchParams(window.location.search);
            Object.assign(gConfigData, Object.fromEntries(urlParams));
        }
    }

    window.addEventListener('Tally.FormSubmitted', (payload) => {
        submit(payload);
    });

    function getInputSearchControls() {

        let searchTriggeringControls = [];

        for (let key in DocIDs.search) {
            let ctrlId = DocIDs.search[key];
            let ctrl = document.getElementById(ctrlId);
            if (!ctrl) {
                console.error(`failed to find family search input control associated with id: ${ctrlId}`);
            }
            searchTriggeringControls.push(ctrl);
        }

        return searchTriggeringControls;
    }

    function getInputSearchIDs() {
        let searchTriggeringControlIDs = [];

        for (let key in DocIDs.search) {
            let ctrlId = DocIDs.search[key];
            searchTriggeringControlIDs.push(ctrlId);
        }

        return searchTriggeringControlIDs;
    }

    gSessionUserRecorded = false;
    function setupInputSearchTriggering(searchFunction) {
        // (note: this is to avoid inserting a React app into the page - i.e. keep it as simple as possible)
        // weird that tally controls aren't throwing input events
        jQuery('body').on('blur', 'input', function (event) {
            // because these controls are hidden/shown ... they can get recreated by React (Tally) and so references must be re-bound to ensure test below will succeed
            let searchTriggeringControls = getInputSearchIDs();

            if (searchTriggeringControls.includes(event.target.id)) {
                console.log(`input changed: ${event.target.id}`);
                setTimeout(searchFunction, 300); // crappy workaround to tally approach or my lack of understanding
            } else if (gSessionUserRecorded === false && event.target.id === DocIDs.SponsorEmail) {
                const email = document.getElementById(DocIDs.SponsorEmail).value;
                H.identify(email, {});
            }
        });
    }

    function setupSponsorSearchTriggering() {
        const prevSponsorYesCtrl = document.getElementById(DocIDs.infoOnly.SponsorPreviousFamilyY);
        const prevSponsorNoCtrl = document.getElementById(DocIDs.infoOnly.SponsorPreviousFamilyN);
        jQuery([prevSponsorNoCtrl, prevSponsorYesCtrl]).on('input', function (event) {
            if (event.target === prevSponsorYesCtrl) {
                // user switches to 'YES' > hide search inputs, refresh family results with new search w/prevSponsorEmail = <sponsor-email>
                const sponsorEmailVal = document.getElementById(DocIDs.SponsorEmail).value;
                fetchPrevSponsoredFamilies({prevSponsorEmail: sponsorEmailVal}, renderFamilyResults);
            } else if (event.target === prevSponsorNoCtrl) {
                // user switches to 'NO' > show search inputs, refresh family results with new search using existing search input values ... unless they've never selected any values
                if (getInputSearchControls().some((ctrl) => ctrl.value !== "")) {
                    setTimeout(refreshFamilyResults, 300);
                }
            }
        });
    }

    const gLastSearchInputs = {};

    function refreshFamilyResults() {
        //const searchInputs = [DocIDs.search.SearchClientFamilySize, DocIDs.search.SearchClientDietaryRestrictions];
        const searchInputs = Object.keys(DocIDs.search).map((key) => {
            return DocIDs.search[key]
        });

        // assess each search input and whether it has changed (storing some info for debugging/logging)
        let changedValues = searchInputs.map((ctrlId) => {
            const currentValue = document.getElementById(ctrlId).value;
            const lastValue = gLastSearchInputs[ctrlId];
            const lbl = DocIDs.findLabel(ctrlId);
            return {
                label: lbl,
                id: ctrlId,
                currentVal: currentValue,
                lastVal: lastValue,
                changed: currentValue !== lastValue,
            };
        });

        // save off current values
        changedValues.forEach((obj) => {
            gLastSearchInputs[obj.id] = obj.currentVal;
        });

        // if there have been changes, execute the search
        changedValues = changedValues.filter(obj => {
            return obj.changed
        });
        if (gConfigData["UseFamilyResultsCache"] || changedValues.length > 0) {

            // spit out logging on what control changed (Tally is finicky, so leave this helpful debugging in)
            let logStrs = changedValues.map((obj) => {
                return `${obj.label}(${obj.lastVal}  ->  ${obj.currentVal})`;
            });
            console.log(logStrs.join("   "));

            console.log("refreshing search results");
            const searchCriteria = {Sponsored: "No"};
            for (let key in DocIDs.search) {
                searchCriteria[key.slice("Search".length)] = translateSearchValue(document.getElementById(DocIDs.search[key]).value);
            }

            window.dispatchEvent(new CustomEvent("F4F.ClientFamilySearch", {detail: searchCriteria}));

            if (gConfigData.hasOwnProperty("AllowSignUpOfPreviouslySponsored") && gConfigData.AllowSignUpOfPreviouslySponsored === false) {
                searchCriteria["PreviousSponsorEmail"] = '';
            }
            renderFamilyResults.noResultsMessage = "No matching client families found. Please change your search criteria and try again.";

            if (gConfigData["UseFamilyResultsCache"]) {
                renderFamilyResults( applySearchCriteria(gClientFamilyCache, searchCriteria) );
            } else {
                fetchClientFamilyByCriteria(gEventSheetQuery, searchCriteria, renderFamilyResults);
            }
        }
    }

    function translateSearchValue(val) {
        if (val.includes("or more")) {
            let number = val.slice(0, val.indexOf("or more")).trim();
            val = `__gte(${number})`
        } else if (val.includes("All ")) {
            val = val.replaceAll("All ", "");
        }

        switch (val) {
            case "Any":
                return "*";
            case "None":
                return "";
            default:
                return val.trim();
        }
    }

    jQuery(document).ready(async function ($) {

        DocIDs.initialize();
        initializeConfiguration();

        setupInputSearchTriggering(refreshFamilyResults);
        setupSponsorSearchTriggering();

        // ensure that we have the search results placeholder div
        // jQuery version
        //const placeholderDiv =   jQuery(resultsPlaceholderSelector);
        //gClientFamilyResultsContainerDiv = placeholderDiv[0];
        // vanilla javascript version (but may break older browser)
        //if (!placeholderDiv || placeholderDiv.length !== 1) {
        //    throw Error("error: could not locate family results placeholder");
        //}
        const placeholderDiv = document.evaluate("//text()[contains(., 'client family search results')]/ancestor::div[1]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (!placeholderDiv) {
            throw Error("error: could not locate family results placeholder");
        }
        
        gClientFamilyResultsContainerDiv = placeholderDiv;

        // disable the submit button before a family is selected
        updateFormSubmitState(false);

        // parse to cache template for better performance on generation
        const templates = document.querySelectorAll('script[type="x-tmpl-mustache"]');
        templates.forEach((t) => {
            Mustache.parse(t.innerHTML);
            gConfigData[t.id] = t.innerHTML;
        });

        window.addEventListener("F4F.ClientFamilySearch", () => updateFormSubmitState(false));

        const response = await fetchClientFamilyByCriteriaEx(gEventSheetQuery, {Sponsored: 'No',});
        if (response.ok) {
            response.json().then((json) => {
                gClientFamilyCache = json;
            });
        }
    });

    function updateFormSubmitState(enabled) {
        if (enabled) {
            jQuery(submitButtonSelector).removeAttr('disabled').removeAttr('style');
        } else {
            jQuery(submitButtonSelector).prop('disabled', true).attr('style', 'color:gray');
        }
    }

    async function fetchEventConfigurationData(configSheetUrl, eventScope) {
        let criteria = `/EventTabName/${eventScope}`;
        const request = new Request(configSheetUrl + criteria, {
            method: "GET",
            headers: {'Content-Type': 'application/json;charset=utf-8'},
        })

        const response = await fetch(request);
        if (!response.ok) {
            throw Error('could not load event configuration data');
        }

        const responseData = await response.json();
        return responseData;
    }

    function fetchPrevSponsoredFamilies(criteria, renderFunction) {
        let sponsorEmail = document.getElementById(DocIDs.SponsorEmail).value;
        if (!sponsorEmail || sponsorEmail.trim() === "") {
            alert("You must enter your email address first.");
            throw new Error('Sponsor Email must be provided to search for previously sponsored families');
        }

        let searchCriteria = {Sponsored: 'No',};
        gSponsorshipHistoryTabColumns.forEach(col => {
            searchCriteria[col] = "*" + sponsorEmail.trim().toLowerCase() + "*";
        });
        renderFunction.noResultsMessage = "If you are looking for a family you previously sponsored, it is possible they have not signed up for this event. Please change your selection to 'No' and use the search below.";

        if (gConfigData["UseFamilyResultsCache"]) {
            renderFunction(applySearchCriteria(gClientFamilyCache, searchCriteria));
        } else {
            fetchClientFamilyByCriteria(gSponsorshipHistoryQuery, searchCriteria, renderFunction);
        }
    }

    function applySearchCriteria(clientDataRows, criteria) {
        const filters = {};
        for (let key in criteria) {
            let searchValue = criteria[key];

            if (searchValue.includes("__gte")) {
                let filterVal = searchValue.replaceAll("__gte(", "").replaceAll(")", "");
                filterVal = Number(filterVal);
                filters[key] = {
                    "filter" : function(value, criteriaVal) { return Number(value) >= criteriaVal; },
                    "filterValue": filterVal,
                };
            } else if (searchValue.includes("__eq")) {
                let filterVal = searchValue.replaceAll("__eq(", "").replaceAll(")", "");
                filterVal = Number(filterVal);
                filters[key] = {
                    "filter": function (value, criteriaVal) {
                        return Number(value) === criteriaVal;
                    },
                    "filterValue": filterVal,
                };
            }
            else {
                if (searchValue) searchValue = searchValue.replace(/[.+?^${}()|[\]\\]/g, '\\$&'); // escape regex characters *except* asterisk
                searchValue = searchValue.replaceAll("*", ".*");
                if (searchValue === "") {
                    searchValue = "^$"; // special case, empty string
                } else {
                    searchValue = `^${searchValue}$`; // exact match
                }
                filters[key] = {
                    "filter": function(value, filterVal) { return new RegExp(filterVal).test(value); },
                    "filterValue": searchValue,
                };
            }
        }

        return clientDataRows.filter((row) => {
            return Object.keys(filters).every((key) => {
                return filters[key].filter(row[key], filters[key].filterValue);
            });
        });
    }

    async function fetchClientFamilyByCriteriaEx(sheetUrl, criteria) {
        window.dispatchEvent(new CustomEvent("F4F.ClientFamilySearch", {detail: criteria}));
        console.log("search criteria" + JSON.stringify(criteria));

        const queryParams = new URLSearchParams(criteria);
        const response = await fetch(`${sheetUrl}?${queryParams}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            response.text().then((text) => {
                console.error(`fetch error url=${sheetUrl}  body=${JSON.stringify(criteria)}  response=${response.status}   responseText=${response.statusText}   responseBody=${text}`);
                throw new Error(`Fetch Response Status: ${sheetUrl} --- ${response.status}`);
            });
        }

        return response;
    }

    function fetchClientFamilyByCriteria(sheetUrl, criteria, renderFunction) {
        window.dispatchEvent(new CustomEvent("F4F.ClientFamilySearch", {detail: criteria}));
        console.log("search criteria" + JSON.stringify(criteria));
        let clientFamilyData;
        jQuery.ajax({
            url: gEventSheetQuery,
            data: criteria,
            type: "GET",
            dataType: "json",
            cache: false,
            async: true,
            timeout: 4000,
        })
        .done(function (json) {
            console.log(json);
            clientFamilyData = json;
            gClientFamilyCache = clientFamilyData;
            renderFunction(clientFamilyData);
        })
        .fail(function (xhr, status, errorThrown) {
            console.log("Error: " + errorThrown);
            console.log("Status: " + status);
            console.log("Detail:" + xhr.responseTaxt);
            console.dir(xhr);
        });
    }

    function convertRowToObject(row) {

        const repeatingBlocksConfig = {
            "FM": {
                "columns": ["FMName", "FMGender", "FMAge", "FMGrade"],
                "required": ["FMName"],
                "maxRepetitions": 10,
                "outputTo": "FamilyMembers",
            }
        }
        const allRepeatingColumns = [];
        const tree = {};

        /****
         * repeating blocks
         */
        // 1. convert denormalized blocks (i.e. Xxx1, Yyyy1, Xxx2, Yyyy2) into array of objects [{Xxx, Yyy},{Xxx, Yyy}]
        // 2. filter out those that don't meet required field restrictions
        for (const blockKey in repeatingBlocksConfig) {
            const blockConfig = repeatingBlocksConfig[blockKey];
            tree[blockConfig.outputTo] = [];
            // convert to a set of arrays (1 entry for each block)
            for (let i = 1; i <= blockConfig.maxRepetitions; i++) {
                const block = {};
                blockConfig.columns.forEach((c) => {
                    allRepeatingColumns.push(c + i);
                    block[c] = row[c + i];
                });
                tree[blockConfig.outputTo].push(block);
            }

            tree[blockConfig.outputTo] = tree[blockConfig.outputTo].filter((block) => {
                return blockConfig.required.every((r) => {
                    return Object.hasOwn(block, r)
                        && block[r] !== undefined
                        && block[r] !== null && block[r] !== "";
                });
            });
        }

        /******
         * standard columns
         */
        Object.keys(row).forEach((key) => {
            if (allRepeatingColumns.includes(key) === false) {
                tree[key] = row[key];
            }
        });


        return tree;
    }

    function renderFamilyResults(familiesDataRows) {
        // filter out rows that shouldn't be allowed for selection
        familiesDataRows = familiesDataRows.filter((r) => {
            if (r["Sponsored"] && r["Sponsored"] === "Yes") return false;   // prevent catastrophe
            if (!r["F4FNumber"] || r["F4FNumber"] === "") return false;     // required fields
            //TODO: add required field list in configuration
            return true;
        });

        // transform from row to tree to support looping during template execution
        const familiesData = familiesDataRows.map((row) => convertRowToObject(row));
        if (familiesData.length === 0) {
            familiesData.noResultsMessage = renderFamilyResults.noResultsMessage;
        }

        // THANKSGIVING SPECIFIC NONSENSE
        familiesData.forEach(e => {
            e["ClientFamilySizeDescription"] = function() {
                return e.ClientFamilySize + " (" + e.ClientAdultCount + " adult" + (e.ClientAdultCount > 1 ? 's' : "") + ", " 
                        + (e.ClientChildAges ? e.ClientChildAges.split(",").length : 0) + " " + (e.ClientChildAges ? (e.ClientChildAges.split(",").length === 1 ? 'child' : 'children') : 'children')
                        + (e.ClientChildAges ? (e.ClientChildAges.split(",").length > 0 ? " - age(s): " + e.ClientChildAges : "") : "") + ")";
            }();
            e["ClientDietaryRestrictionsDescription"] = function() {
                return (!e.ClientDietaryRestrictions || e.ClientDietaryRestrictions.length === 0 || e.ClientDietaryRestrictions.startsWith("None") ? "None" : e.ClientDietaryRestrictions );
            }();
            e["ClientSpecialRequestsDescription"] = function() {
                return (!e.ClientSpecialRequests || e.ClientSpecialRequests.length === 0 ? "None" : e.ClientSpecialRequests);
            }();

        });


        const searchResultsTemplate = gConfigData["SearchResultsDisplayCardTemplate"];
        const html = Mustache.render(searchResultsTemplate, familiesData);
        gClientFamilyResultsContainerDiv.innerHTML = html;

        // until we can migrate from Mutache to Handlebars, add JSON via code versus template
        // simulate code from page
        const familyCardNodeList = gClientFamilyResultsContainerDiv.querySelectorAll("section div.f4f-client-card");
        for (let i = 0; i < familyCardNodeList.length; i++) {
            const famCard = familyCardNodeList[i];
            const f4fNumber = famCard.id;
            const familyData = familiesData.find((f) => f.F4FNumber === f4fNumber);
            famCard.dataset.f4fFamily = JSON.stringify(familyData);
        }

    }

    function setSelectedSponsorFamily(targetFamilyId) {
        const F4FNumber = targetFamilyId;

        const familyCard = document.querySelector(`#${F4FNumber}`);
        familyCard.classList.remove("f4f-client-unselected");
        familyCard.classList.add("f4f-client-selected");

        // hide all others client cards
        document.querySelectorAll(".f4f-client-card.f4f-client-unselected").forEach((card) => {
            card.classList.add("f4f-client-unavailable");
        });

        // update button from Sponsor to Deselect
        const btnSponsor = document.querySelector(`#btnSponsor-${F4FNumber}`);
        btnSponsor.onclick = () => {
        }; // unbind
        btnSponsor.removeAttribute("onclick");
        console.log(`updated selected sponsor family: ${F4FNumber}`);

        // enable form Submit
        updateFormSubmitState(true);

        btnSponsor.innerHTML = "Deselect";
        btnSponsor.onclick = () => {
            console.log(`de-selecting: ${F4FNumber}`);
            const familyCard = document.querySelector(`#${F4FNumber}`);
            familyCard.classList.remove("f4f-client-selected");
            familyCard.classList.add("f4f-client-unselected");

            document.querySelectorAll(".f4f-client-card.f4f-client-unselected.f4f-client-unavailable").forEach((card) => {
                card.classList.remove("f4f-client-unavailable");
            });

            btnSponsor.innerHTML = "Select";
            btnSponsor.onclick = () => {
                setSelectedSponsorFamily(F4FNumber);
            };

            console.log(`de-selected sponsor family: ${F4FNumber}`);

            updateFormSubmitState(false);
        }
    }

    const gSystemFailureErrorMsg = `There was a problem with the web page. While your data has been saved, you have not been successfully assigned a client family.\n\nPlease contact Families 4 Families via email or phone to correct this.\n\nWe apologize for the inconvenience and thank you for your support.`;

    function submit(payload) {
        // 2 steps:
        //   (1) update master sheet to mark Client family as sponsored by Sponsor email address
        //   (2) send email to Sponsor w/relevant information re: Client family and what they need to do to fulfill sponsorship
        const fields = payload.detail.fields;

        const selectedCards = document.querySelectorAll(".f4f-client-selected");
        if (selectedCards.length !== 1) {
            alert(gSystemFailureErrorMsg)
            return;
        }

        const selectedCard = selectedCards[0];
        const f4fNumber = selectedCard.id;
        if (f4fNumber === undefined || f4fNumber.trim() === "") {
            alert(gSystemFailureErrorMsg);
            return;
        }

        const queryParams = {
            "F4FNumber": f4fNumber, // scope update to the selected family
            "Sponsored": "No",  // light-weight (and not foolproof) concurrency (change to an integer value)
        };
        const queryString = new URLSearchParams(queryParams).toString();

        const bodyData = {
            "Sponsored": "Yes",
            "SponsorSignUpDate": new Date().toLocaleString().split(',').join(' '),
        };

        let inputFields = DocIDs.inputFields();
        inputFields.forEach((fieldName) => {
            let value = getFieldValue(fields, fieldName);

            let meta = DocIDs.meta[fieldName] ? DocIDs.meta[fieldName] : null;
            if (meta && meta.saveHandling) {
                value = meta.saveHandling(value);
            }

            bodyData[fieldName] = value;
        });

        const url = `${gEventSheet}/search?${queryString}`
        fetch(url, {
            method: "PATCH",
            mode: "cors",
            headers: {"Content-Type": "application/json",},
            body: JSON.stringify(bodyData),
        })
            .then((r) => {
                if (r.status === 200) {
                    const familyData = JSON.parse(selectedCard.dataset.f4fFamily);
                    //const dropOffDateTime = gConfigData[`${familyData.ReferringAgency} DropOffDayTime`];
                    const dropOffDateTime = gConfigData[`DropOffDayTime`];
                    const familyTemplate = gConfigData["ConfirmationEmailDisplayCardTemplate"];
                    const familyHtml = Mustache.render(familyTemplate, familyData);

                    // package all the field data plus HTML generated table for the family, and send for use in email template
                    const templateParams = Object.assign({}, bodyData, {
                        FamilyHtml: familyHtml,
                        DropOffDateTime: dropOffDateTime,
                    });

                    //return;
                    // emailjs.send('<YOUR_SERVICE_ID>','<YOUR_TEMPLATE_ID>', templateParams, '<YOUR_PUBLIC_KEY>')
                    // f4f servide-id: service_y7z7za8
                    // raffi service-id: service_7pz9wh6
                    emailjs.send("service_y7z7za8", "2025_bts_sponsor_confirm", templateParams, "ukws6XKmos438OOho")
                        .then(
                            (response) => {
                                //alert('Thank you! Your sign up was successful! Please check your inbox for a confirmation email. If you do not see it, please check your spam folder.')
                                console.log('Thank you! Your sign up was successful! Please check your inbox for a confirmation email. If you do not see it, please check your spam folder.');
                            },
                            (err) => {
                                console.log('FAILED...', err);
                                alert('Error! \n\nWe tried to send you an email with your sponsorship details, but something failed on our side! Please try filling out the form again or email Families for Families if the problem continues');
                            }
                        )
                } else if (r.status !== 200) {
                    let msg = "failure during save to Google Sheets: " + r.statusText;
                    msg += `\n\n${JSON.stringify(bodyData)}\n\n`
                    r.text().then((text) => msg += `   ${text}`);
                    console.error(msg);
                    alert("There was a problem signing up");
                }
            })
            .catch((error) => {
                console.log(error.message);
            });
    }

</script>
