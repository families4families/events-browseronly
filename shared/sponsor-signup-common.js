// Shared logic for every event's Sponsor Sign-Up form (BTS, Thanksgiving, Christmas, ...).
// Loaded via <script src> before the per-event inline <script> block, which must define:
//   eventName, apiBase, searchUrl, DocIDs, convertRowToObject(row), and the
//   SearchResultsDisplayCardTemplate + its CSS.
// Everything here is plain global-scope code (no ES modules) to match how Tally's custom
// code panel works - the per-event script can reference every function/variable below
// directly, with no import/namespace needed.

// PostHog error tracking + product analytics. Loader is async and self-contained; wrapped in
// try/catch so any init failure here can never break the sign-up page.
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

    // recordHeaders/recordBody and console-log recording were deliberately removed: session
    // replay would otherwise capture full request/response bodies (sponsor/client PII) verbatim,
    // and enabling console-log recording alongside our own window.onerror handler below created
    // a feedback loop - our handler logs via console.error, PostHog's console-recording plugin
    // intercepts that same call to record it, and if that interception itself throws, it's a new
    // uncaught error that re-enters window.onerror, recursing until the stack overflows.
    posthog.init('phc_zD9wo5zTiFQhH3FRtmthPVXoqR5M8NVYAZ47uYtbjD3k', {
        api_host: 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_exceptions: true,
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

window.onerror = function myErrorHandler(errorMsg) {
    // guarded so a failure in logging itself (e.g. a monitoring SDK's own instrumentation
    // throwing while intercepting this console.error call) can never produce a new uncaught
    // error that re-enters this same handler and recurses
    try {
        console.error(`unhandled error: ${errorMsg}`);
    } catch (e) {
        // swallow - nothing more we can safely do here
    }
    return false;
}

// family results - matches on the visible text content, not any Tally CSS class, since
// Tally regenerates per-build styled-components hash classes on every frontend deploy
const resultsPlaceholderSelector = 'div > div.tally-text:contains("client family search results")';
const submitButtonSelector = 'button[type="submit"]';

const gSystemFailureErrorMsg = `There was a problem with the web page. While your data has been saved, you have not been successfully assigned a client family.\n\nPlease contact Families 4 Families via email or phone to correct this.\n\nWe apologize for the inconvenience and thank you for your support.`;

const gConfigData = {};
let gClientFamilyCache = null;
let gClientFamilyResultsContainerDiv = null;
const gLastSearchInputs = {};
const gSponsorshipHistoryTabColumns = ["PreviousSponsorEmail"];

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
 * DocIDs.initialize()'s actual implementation, extracted as a free function so it's defined
 * once here rather than copied into every event's DocIDs object. The per-event DocIDs object
 * wires this in as `initialize: function(obj) { return docIdsInitialize(DocIDs, obj); }`, so
 * every existing call site (DocIDs.initialize()) keeps working unchanged.
 */
function docIdsInitialize(root, node) {
    node = node || root;
    for (let key in node) {

        if (key === "meta") {
            continue;
        }

        let val = node[key];
        if (val !== null && typeof val === 'object') {
            docIdsInitialize(root, val);
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
            node[key] = jElement[0].id;
        } else if (jElement.length === 0) {
            // handle drop downs
            // 1. search for the <label>[LabelContent]</label> and extract inputId from the for=<inputId> attribute
            if (root.meta[key] && root.meta[key].type === "DROPDOWN") {
                let labels = document.querySelectorAll("label");
                let dropdownLabel = [].filter.call(labels, function (label) {
                    return label.innerHTML === root.meta[key].labelContent;
                });
                if (dropdownLabel.length !== 1) {
                    throw new Error(`could not find dropdown ${root.meta[key].labelContent}`);
                }
                dropdownLabel = dropdownLabel[0];

                if (dropdownLabel.hasAttribute("for")) {
                    node[key] = dropdownLabel.getAttribute("for");
                } else {
                    throw new Error(`could not find attribute 'for' on dropdown label ${root.meta[key].labelContent}`);
                }
            } else if (root.meta[key] && root.meta[key].type === "CHOICE-OPTION") {
                // Tally used to render the internal field name (e.g. "SponsorPreviousFamilyYN") as
                // hidden text inside the choice block, letting us scrape our way to the right radio
                // group before matching on the visible label. Tally has since dropped that hidden
                // text entirely, which broke this lookup in production on the BTS form ("could not
                // find SponsorPreviousFamilyYN"). The visible label text is unique enough on this
                // form to match directly, so the fieldName/legend indirection is no longer needed.
                let optionChoiceLabels = document.querySelectorAll(`div.tally-block-multiple-choice-option label`);
                let optionChoice = [].filter.call(optionChoiceLabels, function (label) {
                    return label.innerHTML === root.meta[key].labelContent;
                });
                if (optionChoice.length !== 1) {
                    throw new Error(`could not find ${root.meta[key].fieldName} - ${root.meta[key].labelContent}`);
                }

                if (optionChoice[0].hasAttribute("for")) {
                    node[key] = optionChoice[0].getAttribute("for");
                } else {
                    throw new Error(`could not find attribute 'for' on option ${root.meta[key].fieldName} -> ${root.meta[key].labelContent}`);
                }
            } else {
                throw new Error(`could not find element with label: ${key}`);
            }
        }
    }
}

/**
 * DocIDs.findLabel()'s actual implementation - see docIdsInitialize for why this is a free function.
 */
function docIdsFindLabel(root, searchVal, node) {
    node = node || root;
    for (let key in node) {
        let val = node[key];

        if (typeof val === 'object') {
            let label = docIdsFindLabel(root, searchVal, val);
            if (label !== null) return label;
        }

        if (val === searchVal) {
            return key;
        }
    }
    return null;
}

/**
 * DocIDs.inputFields()'s actual implementation - see docIdsInitialize for why this is a free function.
 */
function docIdsGetInputFields(root) {
    let inputs = [];
    for (const field in root) {
        if (typeof root[field] === 'function' || typeof root[field] === 'object') {
            continue;
        }
        if (root[field] === "undefined" || root[field] === null) {
            continue;
        }
        inputs.push(field);
    }
    return inputs;
}

function getInputSearchControls(docIds) {
    let searchTriggeringControls = [];

    for (let key in docIds.search) {
        let ctrlId = docIds.search[key];
        let ctrl = document.getElementById(ctrlId);
        if (!ctrl) {
            console.error(`failed to find family search input control associated with id: ${ctrlId}`);
        }
        searchTriggeringControls.push(ctrl);
    }

    return searchTriggeringControls;
}

function getInputSearchIDs(docIds) {
    let searchTriggeringControlIDs = [];

    for (let key in docIds.search) {
        let ctrlId = docIds.search[key];
        searchTriggeringControlIDs.push(ctrlId);
    }

    return searchTriggeringControlIDs;
}

function setupInputSearchTriggering(docIds, searchFunction) {
    // (note: this is to avoid inserting a React app into the page - i.e. keep it as simple as possible)
    // weird that tally controls aren't throwing input events
    jQuery('body').on('blur', 'input', function (event) {
        // because these controls are hidden/shown ... they can get recreated by React (Tally) and so references must be re-bound to ensure test below will succeed
        let searchTriggeringControls = getInputSearchIDs(docIds);

        if (searchTriggeringControls.includes(event.target.id)) {
            console.log(`input changed: ${event.target.id}`);
            setTimeout(searchFunction, 300); // crappy workaround to tally approach or my lack of understanding
        }
    });
}

function setupSponsorSearchTriggering(docIds, searchUrl) {
    const prevSponsorYesCtrl = document.getElementById(docIds.infoOnly.SponsorPreviousFamilyY);
    const prevSponsorNoCtrl = document.getElementById(docIds.infoOnly.SponsorPreviousFamilyN);
    jQuery([prevSponsorNoCtrl, prevSponsorYesCtrl]).on('input', function (event) {
        if (event.target === prevSponsorYesCtrl) {
            // user switches to 'YES' > hide search inputs, refresh family results with new search w/prevSponsorEmail = <sponsor-email>
            const sponsorEmailVal = document.getElementById(docIds.SponsorEmail).value;
            fetchPrevSponsoredFamilies(docIds, searchUrl, {prevSponsorEmail: sponsorEmailVal}, renderFamilyResults);
        } else if (event.target === prevSponsorNoCtrl) {
            // user switches to 'NO' > show search inputs, refresh family results with new search
            // always refresh here - refreshFamilyResults() itself safely defaults any
            // not-yet-rendered search control to "Any" rather than needing a pre-check
            setTimeout(() => refreshFamilyResults(docIds, searchUrl), 300);
        }
    });
}

function refreshFamilyResults(docIds, searchUrl) {
    const searchInputs = Object.keys(docIds.search).map((key) => {
        return docIds.search[key]
    });

    // these controls can be legitimately absent from the DOM - Tally conditionally hides some
    // search dropdowns until the "previously sponsored?" question is answered, so on a true
    // first page load (before that's answered) they may not exist yet at all. Default a missing
    // control to "Any" (its own normal default) rather than crash on a null lookup or skip the
    // refresh entirely - the previously-sponsored (PreviousSponsorEmail) filter below is
    // independent of these and should still apply.
    function getSearchControlValue(ctrlId) {
        const ctrl = document.getElementById(ctrlId);
        return ctrl ? ctrl.value : "Any";
    }

    // assess each search input and whether it has changed (storing some info for debugging/logging)
    let changedValues = searchInputs.map((ctrlId) => {
        const currentValue = getSearchControlValue(ctrlId);
        const lastValue = gLastSearchInputs[ctrlId];
        const lbl = docIdsFindLabel(docIds, ctrlId);
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
        for (let key in docIds.search) {
            searchCriteria[key.slice("Search".length)] = translateSearchValue(getSearchControlValue(docIds.search[key]));
        }

        window.dispatchEvent(new CustomEvent("F4F.ClientFamilySearch", {detail: searchCriteria}));

        if (gConfigData.hasOwnProperty("AllowSignUpOfPreviouslySponsored") && gConfigData.AllowSignUpOfPreviouslySponsored === false) {
            searchCriteria["PreviousSponsorEmail"] = '';
        }
        renderFamilyResults.noResultsMessage = "No matching client families found. Please change your search criteria and try again.";

        if (gConfigData["UseFamilyResultsCache"]) {
            if (gClientFamilyCache === null) {
                // the initial family-list fetch (kicked off in initSponsorSignup) hasn't
                // resolved yet - ignore this trigger rather than crash on a null cache; that
                // init sequence renders the initial result set itself once that fetch lands
                console.log("family cache not yet loaded; ignoring search trigger");
                return;
            }
            renderFamilyResults( applySearchCriteria(gClientFamilyCache, searchCriteria) );
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

function updateFormSubmitState(enabled) {
    if (enabled) {
        jQuery(submitButtonSelector).removeAttr('disabled').removeAttr('style');
    } else {
        jQuery(submitButtonSelector).prop('disabled', true).attr('style', 'color:gray');
    }
}

async function fetchEventConfiguration(searchUrl) {
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

function fetchPrevSponsoredFamilies(docIds, searchUrl, criteria, renderFunction) {
    let sponsorEmail = document.getElementById(docIds.SponsorEmail).value;
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

// filled in by initSponsorSignup(); the per-event convertRowToObject(row) function is called
// here to transform each raw sheet row (including any per-event derived/description fields)
// before rendering
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
        // so this doesn't require live debugging next time it comes up - F4FNumber is
        // assigned in an external system we don't have API access to, so a family missing
        // one can't be auto-fixed here; it needs a human to assign one
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

function submitSponsorForm(docIds, searchUrl, payload) {
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

    let inputFields = docIds.inputFields();
    inputFields.forEach((fieldName) => {
        let value = getFieldValue(fields, fieldName);

        let meta = docIds.meta[fieldName] ? docIds.meta[fieldName] : null;
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

/**
 * Full page bootstrap, shared across every event's Sponsor Sign-Up form. Call this from the
 * per-event inline script after DocIDs/eventName/apiBase/searchUrl/convertRowToObject are defined.
 */
function initSponsorSignup(docIds, searchUrl) {
    window.addEventListener('Tally.FormSubmitted', (payload) => {
        submitSponsorForm(docIds, searchUrl, payload);
    });

    jQuery(document).ready(async function ($) {

        docIds.initialize();
        await fetchEventConfiguration(searchUrl);

        setupInputSearchTriggering(docIds, () => refreshFamilyResults(docIds, searchUrl));
        setupSponsorSearchTriggering(docIds, searchUrl);

        // ensure that we have the search results placeholder div
        const placeholderDiv = jQuery(resultsPlaceholderSelector);
        if (!placeholderDiv || placeholderDiv.length !== 1) {
            throw Error("error: could not locate family results placeholder");
        }
        gClientFamilyResultsContainerDiv = placeholderDiv[0];

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
            // must be awaited (not a bare .then()) - a bare .then() here resolves after ready()
            // has already returned, so any search trigger that fires before it lands would hit
            // a null gClientFamilyCache and crash in applySearchCriteria's clientDataRows.filter(...)
            gClientFamilyCache = await response.json();
            // render the initial result set now that the cache is ready, using the same
            // refreshFamilyResults() every other search goes through (not a hand-rolled
            // {Sponsored:"No"}-only criteria) so it respects AllowSignUpOfPreviouslySponsored/
            // PreviousSponsorEmail the same as every other search
            if (gConfigData["UseFamilyResultsCache"]) {
                refreshFamilyResults(docIds, searchUrl);
            }
        }
    });
}
