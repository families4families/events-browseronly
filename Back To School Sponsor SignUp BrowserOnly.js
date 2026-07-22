<script src="https://code.jquery.com/jquery-3.7.1.min.js"
        integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>
<script type="text/javascript" src="https://unpkg.com/mustache@4.2.0"></script>
<script>
    // PostHog error tracking + product analytics (replaces Highlight.io).
    // Loader is async and self-contained; wrapped in try/catch so any init failure
    // here can never break the sign-up page.
    try {
        !function (t, e) {
            var o, n, p, r;
            e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) {
                function g(t, e) {
                    var o = e.split(".");
                    2 == o.length && (t = t[o[0]], e = o[1]), t[e] = function () {
                        t.push([e].concat(Array.prototype.slice.call(arguments, 0)))
                    }
                }
                (p = t.createElement("script")).type = "text/javascript", p.crossOrigin = "anonymous", p.async = !0, p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js", (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r);
                var u = e;
                for (void 0 !== a ? u = e[a] = [] : a = "posthog", u.people = u.people || [], u.toString = function (t) {
                    var e = "posthog";
                    return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e
                }, u.people.toString = function () {
                    return u.toString(1) + ".people (stub)"
                }, o = "init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing reset debug getPageViewId captureException isFeatureEnabled".split(" "), n = 0; n < o.length; n++) g(u, o[n]);
                e._i.push([i, s, a])
            }, e.__SV = 1)
        }(document, window.posthog || []);

        // TODO: replace with your PostHog Project API Key + API host (from Project Settings after signup at posthog.com)
        posthog.init('phc_zD9wo5zTiFQhH3FRtmthPVXoqR5M8NVYAZ47uYtbjD3k', {
            api_host: 'https://us.i.posthog.com',
            person_profiles: 'identified_only',
            capture_exceptions: true, // autocapture uncaught errors + unhandled promise rejections
            enable_recording_console_log: true, // show console logs during session replay playback
            session_recording: {
                recordHeaders: true, // capture network request/response headers during replay
                recordBody: true, // capture network request/response bodies during replay
            },
        });
    } catch (e) {
        console.error('PostHog failed to initialize (ignored):', e);
    }

    /**
     * Wraps a PostHog call so a failure inside PostHog (missing lib, thrown error, etc.)
     * can never propagate and break the page.
     */
    function safePostHog(fn) {
        try {
            if (typeof posthog !== "undefined") {
                fn(posthog);
            }
        } catch (e) {
            console.error('PostHog call failed (ignored):', e);
        }
    }

    // PostHog's exception autocapture (capture_exceptions: true, above) reports uncaught
    // errors and unhandled promise rejections on its own via a chained window.onerror /
    // window.onunhandledrejection wrapper, so this handler just logs and does not
    // double-report to PostHog.
    window.onerror = function myErrorHandler(errorMsg) {
        console.error(`unhandled error: ${errorMsg}`);
        return false;
    }
    //# sourceURL=bts-sponsor-signup/posthog-init.js
</script>

<!--
<link rel="stylesheet" href="https://rnorian.github.io/F4F/css/sponsor-signup.css">
<script type="text/javascript" src="https://rnorian.github.io/F4F/src/modules/F4FShared.js"></script>
-->
<style>
    section.search-results-block {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        max-width: 420px;
    }

    div.f4f-client-card {
        width: 100%;
        box-sizing: border-box;
        padding: 16px 20px;
        border: 1px solid #D8D8D8;
        border-radius: 12px;
        background-color: transparent;

        display: flex;
        flex-direction: column;
    }

    div.f4f-client-card .f4f-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
    }

    div.f4f-client-card .f4f-family-name {
        font-weight: 600;
        font-size: 16px;
    }

    .f4f-selected-check {
        display: none;
        vertical-align: -3px;
        margin-right: 4px;
        color: #378ADD;
    }

    div.f4f-client-card .f4f-member-count {
        font-size: 12px;
        color: #0C447C;
        background-color: #E6F1FB;
        padding: 2px 10px;
        border-radius: 4px;
        white-space: nowrap;
    }

    div.f4f-family-members {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
    }

    div.f4f-family-member-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
    }

    div.f4f-family-member-row .f4f-member-name {
        flex: 1;
        min-width: 0;
        overflow-wrap: break-word;
    }

    div.f4f-family-member-row .f4f-member-detail {
        color: #666666;
        white-space: nowrap;
    }

    .f4f-gender-icon {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
    }

    /* male=blue, female=pink, non-binary=purple (a blend of the two),
       agender/unspecified stays muted/gray - same as before this redesign */
    .gender-male .f4f-gender-icon { color: #378ADD; }
    .gender-female .f4f-gender-icon { color: #D4537E; }
    .gender-nonbinary .f4f-gender-icon { color: #7F77DD; }
    .gender-other .f4f-gender-icon { color: #999999; }

    button.sponsor-button {
        width: 100%;
        box-sizing: border-box;
        padding: 10px;
        border: 1px solid #333333;
        border-radius: 8px;
        font-weight: 500;
        background-color: #EFEFEF;
        cursor: pointer;
    }

    span.f4f-no-search-results {
        width: 100%;
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
        background-color: #F3F8FE;
        border: 2px solid #378ADD;
        padding: 15px 19px; /* 1px less than the default 16px 20px, to offset the thicker border */
    }

    div.f4f-client-selected .f4f-member-count {
        background-color: #FFFFFF;
        border: 1px solid #D8D8D8;
    }

    div.f4f-client-selected .f4f-selected-check {
        display: inline;
    }

    div.f4f-client-selected button.sponsor-button {
        background-color: #378ADD;
        border-color: #378ADD;
        color: #FFFFFF;
    }

</style>

<script type="x-tmpl-mustache" id="SearchResultsDisplayCardTemplate">
    <section class="search-results-block">
        {{#.}}
        <div id='{{F4FNumber}}' class="f4f-client-card f4f-client-unselected">
            <div class="f4f-card-header">
                <span class="f4f-family-name"><svg class="f4f-selected-check" viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6l-1.3-1.3a1 1 0 10-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clip-rule="evenodd"></path></svg>{{ClientFirstName}}'s Family</span>
                <span class="f4f-member-count">{{FamilyMembers.length}} members</span>
            </div>
            <div class="f4f-family-members" data-f4f-number="{{F4FNumber}}">
                {{#FamilyMembers}}
                    <div class="f4f-family-member-row {{FMGenderClass}}">
                        <svg class="f4f-gender-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21v-1a8 8 0 0 1 16 0v1"></path></svg>
                        <span class="f4f-member-name">{{FMName}}</span>
                        <span class="f4f-member-detail">{{FMGender}}, age {{FMAge}}</span>
                    </div>
                {{/FamilyMembers}}
            </div>
            <button id="btnSponsor-{{F4FNumber}}" type="button" class="sponsor-button"
                    onclick="setSelectedSponsorFamily('{{F4FNumber}}');">Select</button>
        </div>
        {{/.}}
        {{^.}}
        <span class="f4f-no-search-results">{{noResultsMessage}}</span>
        {{/.}}
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
            SearchClientFamilyGender: null, // drop-down */
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
                        // Tally used to render the internal field name (e.g. "SponsorPreviousFamilyYN") as
                        // hidden text inside the choice block, letting us scrape our way to the right radio
                        // group before matching on the visible label. Tally has since dropped that hidden
                        // text entirely, which broke this lookup in production ("could not find
                        // SponsorPreviousFamilyYN"). The visible label text is unique enough on this form to
                        // match directly, so the fieldName/legend indirection is no longer needed.
                        let optionChoiceLabels = document.querySelectorAll(`div.tally-block-multiple-choice-option label`);
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
    //# sourceURL=bts-sponsor-signup/docids.js
</script>

<script type="text/javascript">

    /*****************
     *  CONFIGURATION
     *****************/
    const eventName = 'BTS';
    /** todo: read the sheet tab name (or the event name & year) from the URL **/
    const eventYear = new Date().getFullYear();
    // f4fevents backend (replaces sheet.best) - see families4families/f4fevents on GitHub
    const apiBase = `https://f4feventsserver-539935395831.us-east1.run.app`;
    const searchUrl = `${apiBase}/${eventName}/${eventYear}`;

    //FUTURE: const gSponsorshipHistoryTabColumns = ["LockedTo", "Thanksgiving", "AdoptAStudent", "Christmas"];
    const gSponsorshipHistoryTabColumns = ["PreviousSponsorEmail"];

    // family results
    // no sc-XXXXXXXX-N hash here on purpose - that's a per-build styled-components hash Tally
    // regenerates on every frontend deploy (cDDyID as of a previous deploy, eXRVHL as of this one);
    // tally-text is Tally's own stable semantic class and is enough to match uniquely on this page
    const resultsPlaceholderSelector = 'div > div.tally-text:contains("client family search results")';
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
    DocIDs.search.SearchClientFamilyGender = null;

    // SponsorAttendHolidayParty has no custom logic handlers (thus no meta blocks for SponsorAttendHolidayPartyY / N,
    // But the value (answer) needs to be persisted during Submit (save)
    // setting a value "no-field-binding" causes it to be skipped during initalization binding
    //DocIDs.SponsorAttendHolidayParty = "no-field-binding";
    // standard field; can be bound during initialization even if we aren't using it
    //DocIDs.SponsorHolidayPartyAttendeeCount = "no-field-binding";

    const gConfigData = {};

    async function initializeConfiguration() {
        // backend already returns a fully-typed {Key: Value} map (booleans/numbers coerced server-side)
        const response = await fetch(`${searchUrl}/config`, {
            method: "GET",
            headers: {'Content-Type': 'application/json;charset=utf-8'},
        });
        if (!response.ok) {
            throw Error('could not load event configuration data');
        }
        const configData = await response.json();
        Object.assign(gConfigData, configData);

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

    function setupInputSearchTriggering(searchFunction) {
        // (note: this is to avoid inserting a React app into the page - i.e. keep it as simple as possible)
        // weird that tally controls aren't throwing input events
        jQuery('body').on('blur', 'input', function (event) {
            // because these controls are hidden/shown ... they can get recreated by React (Tally) and so references must be re-bound to ensure test below will succeed
            let searchTriggeringControls = getInputSearchIDs();

            if (searchTriggeringControls.includes(event.target.id)) {
                console.log(`input changed: ${event.target.id}`);
                setTimeout(searchFunction, 300); // crappy workaround to tally approach or my lack of understanding
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
                // user switches to 'NO' > show search inputs, refresh family results with new search
                // always refresh here - refreshFamilyResults() itself now safely defaults any
                // not-yet-rendered search control to "Any" rather than needing a pre-check
                setTimeout(refreshFamilyResults, 300);
            }
        });
    }

    const gLastSearchInputs = {};

    function refreshFamilyResults() {
        //const searchInputs = [DocIDs.search.SearchClientFamilySize, DocIDs.search.SearchClientDietaryRestrictions];
        const searchInputs = Object.keys(DocIDs.search).map((key) => {
            return DocIDs.search[key]
        });

        // these controls can be legitimately absent from the DOM - Tally conditionally hides
        // the Family Size/Gender dropdowns until the "previously sponsored?" question is
        // answered, so on a true first page load (before that's answered) they may not exist
        // yet at all. Default a missing control to "Any" (its own normal default) rather than
        // crash on a null lookup or skip the refresh entirely - the previously-sponsored
        // (PreviousSponsorEmail) filter below is independent of these and should still apply.
        function getSearchControlValue(ctrlId) {
            const ctrl = document.getElementById(ctrlId);
            return ctrl ? ctrl.value : "Any";
        }

        // assess each search input and whether it has changed (storing some info for debugging/logging)
        let changedValues = searchInputs.map((ctrlId) => {
            const currentValue = getSearchControlValue(ctrlId);
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
                searchCriteria[key.slice("Search".length)] = translateSearchValue(getSearchControlValue(DocIDs.search[key]));
            }

            window.dispatchEvent(new CustomEvent("F4F.ClientFamilySearch", {detail: searchCriteria}));

            if (gConfigData.hasOwnProperty("AllowSignUpOfPreviouslySponsored") && gConfigData.AllowSignUpOfPreviouslySponsored === false) {
                searchCriteria["PreviousSponsorEmail"] = '';
            }
            renderFamilyResults.noResultsMessage = "No matching client families found. Please change your search criteria and try again.";

            if (gConfigData["UseFamilyResultsCache"]) {
                if (gClientFamilyCache === null) {
                    // the initial family-list fetch (kicked off in jQuery(document).ready) hasn't
                    // resolved yet - ignore this trigger rather than crash on a null cache; the
                    // ready handler renders the initial result set itself once that fetch lands
                    console.log("family cache not yet loaded; ignoring search trigger");
                    return;
                }
                const matchedFamilies = applySearchCriteria(gClientFamilyCache, searchCriteria);
                console.log(`refreshFamilyResults: criteria=${JSON.stringify(searchCriteria)} cacheSize=${gClientFamilyCache.length} matched=${matchedFamilies.length}`);
                renderFamilyResults( matchedFamilies );
            } else {
                fetchClientFamilyByCriteria(searchUrl, searchCriteria, renderFamilyResults);
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
        await initializeConfiguration();

        setupInputSearchTriggering(refreshFamilyResults);
        setupSponsorSearchTriggering();

        // ensure that we have the search results placeholder div
        const placeholderDiv = jQuery(resultsPlaceholderSelector);
        if (!placeholderDiv || placeholderDiv.length !== 1) {
            throw Error("error: could not locate family results placeholder");
        }
        // Render results into our own sibling div, never into the placeholder's own children.
        // The placeholder is a node Tally's React created and still owns; repeatedly overwriting
        // its innerHTML fights with React's own reconciliation of that same node whenever Tally
        // later re-renders nearby form state, and that mismatch is what caused a real production
        // stack overflow (React's reconciler recursing on children it no longer recognizes).
        // Hiding the placeholder (a style change, not a child mutation) and inserting a wrapper
        // div we fully own as its sibling keeps React's view of the placeholder's own children
        // untouched forever, so it has nothing to get confused about on a later re-render.
        placeholderDiv[0].style.display = 'none';
        const resultsWrapperDiv = document.createElement('div');
        placeholderDiv[0].insertAdjacentElement('afterend', resultsWrapperDiv);
        gClientFamilyResultsContainerDiv = resultsWrapperDiv;

        // disable the submit button before a family is selected
        updateFormSubmitState(false);

        // parse to cache template for better performance on generation
        const templates = document.querySelectorAll('script[type="x-tmpl-mustache"]');
        templates.forEach((t) => {
            Mustache.parse(t.innerHTML);
            gConfigData[t.id] = t.innerHTML;
        });

        window.addEventListener("F4F.ClientFamilySearch", () => updateFormSubmitState(false));

        const response = await fetchClientFamilyByCriteriaEx(searchUrl, {Sponsored: 'No',});
        if (response.ok) {
            // must be awaited (not a bare .then()) - this used to resolve after ready() had already
            // returned, so any search trigger that fired before it landed hit a null gClientFamilyCache
            // and crashed in applySearchCriteria's clientDataRows.filter(...)
            gClientFamilyCache = await response.json();
            // nothing ever rendered the initial result set before - the family list stayed
            // empty until the user touched a search filter. Render it now that the cache is
            // ready, using the same refreshFamilyResults() every other search goes through
            // (not a hand-rolled {Sponsored:"No"}-only criteria) so the initial list respects
            // AllowSignUpOfPreviouslySponsored/PreviousSponsorEmail the same as every other search -
            // a bypass here previously showed every family regardless of prior-sponsor history.
            if (gConfigData["UseFamilyResultsCache"]) {
                refreshFamilyResults();
            }
        }
    });

    function updateFormSubmitState(enabled) {
        const btn = jQuery(submitButtonSelector)[0];
        if (!btn) {
            return; // matches jQuery's silent no-op when the selector matches nothing
        }

        // One-time: add a caption as the button's sibling, rather than repeatedly touching the
        // button's own children - inserting next to a Tally-owned node instead of mutating its
        // contents avoids fighting Tally's own React reconciliation of that node.
        let caption = btn.nextElementSibling;
        if (!caption || !caption.classList || !caption.classList.contains('f4f-submit-caption')) {
            caption = document.createElement('div');
            caption.className = 'f4f-submit-caption';
            caption.style.textAlign = 'left';
            caption.style.fontSize = '13px';
            caption.style.marginTop = '6px';
            // The button's own parent is one of Tally's flex rows (flex-direction: row), so a
            // plain sibling sits *beside* the button instead of below it. flex-wrap on the parent
            // (a style property, not a child-list change, so it doesn't risk the same
            // React-reconciliation conflict as mutating Tally-owned children) plus
            // flex-basis:100% on this caption makes it wrap onto its own full-width line under
            // the button, left-aligned to match the button's own left edge.
            btn.parentElement.style.flexWrap = 'wrap';
            caption.style.flexBasis = '100%';
            btn.insertAdjacentElement('afterend', caption);
        }

        // Tally's own markup colors the button's inner <span>/<i> (text/icon) directly,
        // independent of any color set on the <button> element itself - a color override on just
        // the button has no visible effect, so the span/icon need to be targeted explicitly too.
        const innerSpan = btn.querySelector('span');
        const innerIcon = btn.querySelector('i');

        if (enabled) {
            // Keep Tally's own default button color untouched (only sizing is ours) - so "ready"
            // reads as its own distinct primary action, rather than reusing the same blue already
            // used for a family card's Select/Deselect toggle, which read as confusingly similar.
            jQuery(btn).removeAttr('disabled').attr('style', 'width:100%;box-sizing:border-box;opacity:1;');
            if (innerSpan) innerSpan.style.removeProperty('color');
            if (innerIcon) innerIcon.style.removeProperty('color');
            caption.textContent = '✓ Ready to submit';
            caption.style.color = '#3B6D11';
        } else {
            // Dimmed fill (matching the border/text colors already used for an unselected family
            // card) plus a real opacity reduction and not-allowed cursor. Legible text color
            // alone still read as "maybe clickable" - the faded-relative-to-the-page look is what
            // actually signals "inactive", without resorting to low-contrast (unreadable) text.
            jQuery(btn).prop('disabled', true).attr('style', 'width:100%;box-sizing:border-box;background-color:#EFEFEF;border:1px solid #D8D8D8;color:#5F5E5A;cursor:not-allowed;opacity:0.55;');
            if (innerSpan) innerSpan.style.color = '#5F5E5A';
            if (innerIcon) innerIcon.style.color = '#5F5E5A';
            caption.textContent = 'Select a family above to enable';
            caption.style.color = '#888888';
        }
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
            if (gClientFamilyCache === null) {
                console.log("family cache not yet loaded; ignoring search trigger");
                return;
            }
            renderFunction(applySearchCriteria(gClientFamilyCache, searchCriteria));
        } else {
            fetchClientFamilyByCriteria(searchUrl, searchCriteria, renderFunction);
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
            url: sheetUrl,
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

    function genderIconClass(gender) {
        switch (gender) {
            case "Male": return "gender-male";
            case "Female": return "gender-female";
            case "Non-Binary": return "gender-nonbinary";
            default: return "gender-other";
        }
    }

    function convertRowToObject(row) {
        // the backend already flattens FM<Attribute><N> columns into row.FamilyMembers
        // (see F4FEventsAPI.js's own convertRowToObject) - this used to redo that same
        // flattening client-side from raw columns, back when the client fetched
        // unprocessed sheet rows directly. Since the migration to the f4fevents backend,
        // row.FamilyMembers already arrives fully built, so re-deriving it from flat
        // FMName1/FMName2/... columns that no longer exist always produced an empty
        // array; only display-only augmentation (the gender icon color class) belongs here now.
        const tree = Object.assign({}, row);
        tree.FamilyMembers = (row.FamilyMembers || []).map((member) => {
            return Object.assign({}, member, { FMGenderClass: genderIconClass(member.FMGender) });
        });
        return tree;
    }

    function renderFamilyResults(familiesDataRows) {
        const searchedCount = familiesDataRows.length;

        // filter out rows that shouldn't be allowed for selection
        let droppedAlreadySponsored = 0;
        let droppedMissingF4FNumber = 0;
        familiesDataRows = familiesDataRows.filter((r) => {
            if (r["Sponsored"] && r["Sponsored"] === "Yes") {              // prevent catastrophe
                droppedAlreadySponsored++;
                return false;
            }
            if (!r["F4FNumber"] || r["F4FNumber"] === "") {                // required fields
                droppedMissingF4FNumber++;
                return false;
            }
            //TODO: add required field list in configuration
            return true;
        });

        // transform from row to tree to support looping during template execution
        const familiesData = familiesDataRows.map((row) => convertRowToObject(row));
        if (familiesData.length === 0) {
            familiesData.noResultsMessage = renderFamilyResults.noResultsMessage;

            // distinguish "genuinely no matching families" from "matches exist but can't be shown"
            // so this doesn't require another round of live debugging next time it comes up -
            // F4FNumber is assigned in an external system we don't have API access to, so a family
            // missing one can't be auto-fixed here; it needs a human to assign one
            if (searchedCount > 0 && droppedMissingF4FNumber > 0) {
                console.warn(`Search Returned No Results - available clients do not have F4FNumber assigned (${droppedMissingF4FNumber} of ${searchedCount})`);
                safePostHog((ph) => ph.capture('sponsor_search_no_results', {
                    reason: 'missing_f4fnumber',
                    searchedCount,
                    droppedMissingF4FNumber,
                }));
            } else if (searchedCount > 0 && droppedAlreadySponsored === searchedCount) {
                console.warn('Search Returned No Results - all available clients have a previously assigned Sponsor');
                safePostHog((ph) => ph.capture('sponsor_search_no_results', {
                    reason: 'all_already_sponsored',
                    searchedCount,
                }));
            } else if (searchedCount === 0) {
                safePostHog((ph) => ph.capture('sponsor_search_no_results', { reason: 'no_matches' }));
            }
        }

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

        const bodyData = {
            "Sponsored": "Yes",
            "SponsorSignUpDate": new Date().toISOString(),
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

        // ties this PostHog session/replay to the submitting sponsor instead of staying anonymous
        safePostHog((ph) => ph.identify(bodyData.SponsorEmail, {
            email: bodyData.SponsorEmail,
            first_name: bodyData.SponsorFirstName,
            last_name: bodyData.SponsorLastName,
        }));

        // backend matches on F4FNumber + Sponsored=No (same optimistic-concurrency check sheet.best did)
        // and, in this same call, also renders + sends the confirmation email server-side
        const url = `${searchUrl}/${f4fNumber}/sponsor`;
        fetch(url, {
            method: "PATCH",
            mode: "cors",
            headers: {"Content-Type": "application/json",},
            body: JSON.stringify(bodyData),
        })
            .then((r) => {
                if (r.status === 200) {
                    r.json().then((updateResults) => {
                        if (updateResults.emailSent) {
                            console.log('Thank you! Your sign up was successful! Please check your inbox for a confirmation email. If you do not see it, please check your spam folder.');
                        } else {
                            console.log('FAILED to send confirmation email...');
                            alert('Error! \n\nWe tried to send you an email with your sponsorship details, but something failed on our side! Please try filling out the form again or email Families for Families if the problem continues');
                        }
                    });
                } else {
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

    //# sourceURL=bts-sponsor-signup/main.js
</script>