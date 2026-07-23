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

// window.onerror only catches synchronous throws - a rejected promise with no .catch() (e.g.
// an async function passed to ready() throwing before its first await) is invisible to it and
// fails completely silently otherwise. Same guard rationale as above.
window.onunhandledrejection = function myUnhandledRejectionHandler(event) {
    try {
        console.error(`unhandled promise rejection: ${event.reason}`);
    } catch (e) {
        // swallow - nothing more we can safely do here
    }
}

function ready(fn) {
    if (document.readyState !== 'loading') {
        fn();
        return;
    }
    document.addEventListener('DOMContentLoaded', fn);
}

// Maps a Tally form's tallyLabel (used in the form name, e.g. "26 BTS - Sponsor Sign-Up") to
// the internal eventName used everywhere else (sheet tabs, apiBase paths, etc). Mirrors the
// tallyLabel convention the Apps Script "Setup Event" wizard uses when creating forms
// (F4F_SpreadsheetAutomation.gs) - "Thanks"/"Holiday" instead of "Thanksgiving"/"Christmas"
// because Tally's own form-name panel can't be resized (long names don't fit) and "Holiday"
// avoids assuming every client/sponsor is Christian.
const TALLY_LABEL_TO_EVENT_NAME = {
    'BTS': 'BTS',
    'Thanks': 'Thanksgiving',
    'Holiday': 'Christmas',
};

/**
 * Detects which event and Client/Sponsor variant this page is by reading the Tally form's
 * internal name out of the page's embedded __NEXT_DATA__ (present in Tally's server-rendered
 * HTML, so it's readable before any client-side hydration finishes). Throws - rather than
 * guessing - if the form isn't named per the "<2-digit-year> <tallyLabel> - <Client|Sponsor>
 * Sign-Up" convention, or if it doesn't match expectedVariant: either case means this script is
 * loaded on the wrong form, which needs a human to fix, not a silent fallback.
 */
function detectEventInfo(expectedVariant) {
    const nextDataTag = document.getElementById('__NEXT_DATA__');
    if (!nextDataTag) {
        throw new Error('detectEventInfo: could not find Tally\'s __NEXT_DATA__ script tag on this page');
    }

    let formName;
    try {
        formName = JSON.parse(nextDataTag.textContent).props.pageProps.name;
    } catch (e) {
        throw new Error(`detectEventInfo: failed to parse __NEXT_DATA__ (${e.message})`);
    }

    const match = /^\d{2}\s+(.+?)\s+-\s+(Client|Sponsor)\s+Sign-Up$/.exec(formName || '');
    if (!match) {
        throw new Error(`detectEventInfo: form name "${formName}" does not match the "<year> <label> - <Client|Sponsor> Sign-Up" convention`);
    }

    const [, tallyLabel, variant] = match;
    if (expectedVariant && variant !== expectedVariant) {
        throw new Error(`detectEventInfo: this is a "${variant}" form ("${formName}") but ${expectedVariant.toLowerCase()}-signup-common.js was loaded`);
    }

    const eventName = TALLY_LABEL_TO_EVENT_NAME[tallyLabel];
    if (!eventName) {
        throw new Error(`detectEventInfo: unrecognized tallyLabel "${tallyLabel}" in form name "${formName}"`);
    }

    return { eventName, eventYear: new Date().getFullYear(), variant };
}

// detectEventInfo() throws if Tally's __NEXT_DATA__ tag isn't in the DOM yet - confirmed live
// (2026-07-22) that even after document.readyState reaches "complete", this tag can still be
// transiently missing (Tally appears to remount/re-render around when the page settles), so a
// single readyState check is not enough - retry for a while instead of giving up on the first
// attempt, same reasoning/pattern as waitForDocIdsInitialize below.
async function waitForDetectEventInfo(expectedVariant, timeoutMs = 10000, intervalMs = 150) {
    const start = Date.now();
    let lastError;
    while (Date.now() - start < timeoutMs) {
        try {
            return detectEventInfo(expectedVariant);
        } catch (e) {
            lastError = e;
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
    }
    throw lastError || new Error('detectEventInfo() timed out waiting for __NEXT_DATA__');
}

// family results - matches on the visible text content, not any Tally CSS class, since
// Tally regenerates per-build styled-components hash classes on every frontend deploy
const resultsPlaceholderContainerSelector = 'div > div.tally-text';
const resultsPlaceholderText = 'client family search results';
const submitButtonSelector = 'button[type="submit"]';

// plain-JS substitute for jQuery's :contains() pseudo-selector (a jQuery extension, not
// standard CSS) - finds every element matching selector whose text content includes text
function findElementsContainingText(selector, text) {
    return Array.from(document.querySelectorAll(selector)).filter((el) => el.textContent.includes(text));
}

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

// Tally used to render each field's internal name (e.g. "SponsorPreviousFamilyYN") as hidden
// text inside its choice/dropdown block, letting DocIDs binding scrape its way to the right
// element before matching on the visible label. Tally has since dropped that hidden text
// entirely (confirmed live, 2026-07-22 - no fieldName marker anywhere in the DOM, and the
// radio/dropdown inputs' aria-describedby is null), which broke this in production on BTS
// originally, then again on Christmas when its Holiday Party question turned out to share
// identical "Yes"/"No" wording with its own sponsor-search gate question - matching on visible
// label text alone can't tell two same-labeled questions apart, no matter how it's scoped.
//
// The field's internal name is still there, though - just moved. Tally's own __NEXT_DATA__
// payload (props.pageProps.blocks) carries every block's payload.name (the internal field name)
// and payload.text (its visible option text, for choice/dropdown options), keyed by a uuid that
// matches this block's own DOM class (tally-block-<uuid>) - a direct, unambiguous identity
// match pulled from Tally's own authoritative data, not a text-matching heuristic at all.
//
// DROPDOWN_OPTION blocks share one groupUuid across all their options - that groupUuid is what
// the actual <select>/combobox DOM element binds to (there's one input per dropdown, not per
// option), so field-name matching alone is enough. MULTIPLE_CHOICE_OPTION blocks bind
// individually - each option (Yes/No/etc) is its own DOM element - so matching also requires
// the specific option's visible text via optionText.
function findTallyBlockElement(fieldName, optionText) {
    const nextDataTag = document.getElementById('__NEXT_DATA__');
    if (!nextDataTag) {
        return null;
    }

    let blocks;
    try {
        blocks = JSON.parse(nextDataTag.textContent).props.pageProps.blocks;
    } catch (e) {
        return null;
    }

    const match = blocks.find((b) => b.payload && b.payload.name === fieldName
        && (optionText === undefined || b.payload.text === optionText));
    if (!match) {
        return null;
    }

    const blockUuid = match.groupType === 'DROPDOWN' ? match.groupUuid : match.uuid;
    return document.querySelector(`.tally-block-${blockUuid} input, .tally-block-${blockUuid} [role="combobox"]`);
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

        const matches = document.querySelectorAll(`input[aria-label='${key}']`); // this works for standard text inputs
        if (matches.length === 1) {
            node[key] = matches[0].id;
        } else if (matches.length === 0) {
            // handle drop downs
            // 1. search for the <label>[LabelContent]</label> and extract inputId from the for=<inputId> attribute
            if (root.meta[key] && root.meta[key].type === "DROPDOWN") {
                const input = findTallyBlockElement(key, undefined);
                if (!input) {
                    throw new Error(`could not find dropdown ${root.meta[key].labelContent} (field name "${key}")`);
                }
                node[key] = input.id;
            } else if (root.meta[key] && root.meta[key].type === "CHOICE-OPTION") {
                const input = findTallyBlockElement(root.meta[key].fieldName, root.meta[key].labelContent);
                if (!input) {
                    throw new Error(`could not find ${root.meta[key].fieldName} - ${root.meta[key].labelContent}`);
                }
                node[key] = input.id;
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
    // `node === undefined` (not `node || root`) matters: some DocIDs.meta entries are legitimately
    // `null` (e.g. Thanksgiving's SearchClientFamilyGender, which has no gender data to search on).
    // `typeof null === 'object'` sends recursion in with node=null; `null || root` then falls back
    // to root instead of stopping, sending the very next call right back into the same null entry
    // - infinite recursion. Only the initial (no third argument) call should default to root.
    node = node === undefined ? root : node;
    for (let key in node) {
        let val = node[key];

        if (typeof val === 'object' && val !== null) {
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
    // Reverted back to 'focusout' (native equivalent of delegated 'blur') after direct,
    // unfiltered console verification in real desktop Safari (2026-07-22): blur/focusout DO fire
    // reliably on this control, with the fully-updated value by the second firing per selection -
    // 'change' never fires at all for this widget. An earlier attempt to switch to 'change' was
    // based on an AI-summarized reading of a mobile replay's console tab that turned out to be
    // unreliable - don't trust that method again; read the raw console output directly.
    document.body.addEventListener('focusout', function (event) {
        let searchTriggeringControls = getInputSearchIDs(docIds);

        if (searchTriggeringControls.includes(event.target.id)) {
            console.log(`input changed: ${event.target.id}`);
            setTimeout(searchFunction, 300); // crappy workaround to tally approach or my lack of understanding
        }
    });
}

// Confirmed via direct testing (2026-07-22) that on real mobile Safari, Tally's dropdown widget
// never fires blur/focusout/change/input at all when a selection is made (broad event logging
// showed only pointer/touch/click on the control itself, never on an actual value change) - yet
// setupInputSearchTriggering's blur/focusout listener above IS confirmed working on desktop
// Safari. Rather than chase whichever single DOM event this widget's mobile variant may or may
// not bother to dispatch, this observes the control's own DOM subtree directly: showing a new
// selection necessarily mutates *something* in there (confirmed: 8 real mutations recorded for
// one selection, on a wrapper div under Tally's own stable `.tally-block` class), regardless of
// which event (if any) accompanies it. This runs alongside the existing listener, not instead of
// it - each platform ends up using whichever signal actually fires for it.
function setupMutationObserverTriggering(docIds, searchFunction) {
    let debounceTimer = null;

    getInputSearchIDs(docIds).forEach((ctrlId) => {
        const ctrl = document.getElementById(ctrlId);
        const wrapper = ctrl ? ctrl.closest('.tally-block') : null;
        if (!wrapper) {
            console.error(`could not find .tally-block wrapper for search control ${ctrlId} - mutation-based triggering skipped for it`);
            return;
        }

        // Opening/closing the dropdown mutates the DOM just as much as an actual selection does,
        // so without this check every open+close would also schedule a redundant refresh. Only
        // reschedule when this control's own value has genuinely changed since the last mutation
        // we looked at, so a mutation with no real value change (e.g. just opening the list) is a
        // no-op instead of an extra unnecessary re-render.
        let lastKnownValue = ctrl.value;
        new MutationObserver(() => {
            const currentCtrl = document.getElementById(ctrlId);
            const currentValue = currentCtrl ? currentCtrl.value : lastKnownValue;
            if (currentValue !== lastKnownValue) {
                lastKnownValue = currentValue;
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(searchFunction, 300);
            }
        }).observe(wrapper, {childList: true, subtree: true, attributes: true, characterData: true});
    });
}

function setupSponsorSearchTriggering(docIds, searchUrl) {
    // delegated on body and matched by id (not by a cached element reference) for the same
    // reason as setupInputSearchTriggering above - Tally can recreate these radio inputs, and a
    // reference captured once via getElementById would silently go stale when that happens
    document.body.addEventListener('input', function (event) {
        if (event.target.id === docIds.infoOnly.SponsorPreviousFamilyY) {
            // user switches to 'YES' > hide search inputs, refresh family results with new search w/prevSponsorEmail = <sponsor-email>
            const sponsorEmailVal = document.getElementById(docIds.SponsorEmail).value;
            fetchPrevSponsoredFamilies(docIds, searchUrl, {prevSponsorEmail: sponsorEmailVal}, renderFamilyResults);
        } else if (event.target.id === docIds.infoOnly.SponsorPreviousFamilyN) {
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
    const btn = document.querySelector(submitButtonSelector);
    if (!btn) {
        return; // matches jQuery's silent no-op when the selector matches nothing
    }

    // One-time: add a caption as the button's sibling, rather than repeatedly touching the
    // button's own children - same reasoning as the results-wrapper fix elsewhere in this file,
    // insert next to Tally-owned nodes instead of mutating their contents.
    let caption = btn.nextElementSibling;
    if (!caption || !caption.classList || !caption.classList.contains('f4f-submit-caption')) {
        caption = document.createElement('div');
        caption.className = 'f4f-submit-caption';
        caption.style.textAlign = 'left';
        caption.style.fontSize = '13px';
        caption.style.marginTop = '6px';
        // The button's own parent is one of Tally's flex rows (flex-direction: row), so a plain
        // sibling sits *beside* the button instead of below it. flex-wrap on the parent (a style
        // property, not a child-list change, so it doesn't risk the same React-reconciliation
        // conflict as mutating Tally-owned children) plus flex-basis:100% on this caption makes
        // it wrap onto its own full-width line under the button, left-aligned to match the
        // button's own left edge.
        btn.parentElement.style.flexWrap = 'wrap';
        caption.style.flexBasis = '100%';
        btn.insertAdjacentElement('afterend', caption);
    }

    // Tally's own markup colors the button's inner <span>/<i> (text/icon) directly, independent
    // of any color set on the <button> element itself - a color override on just the button has
    // no visible effect, so the span/icon need to be targeted explicitly too.
    const innerSpan = btn.querySelector('span');
    const innerIcon = btn.querySelector('i');

    if (enabled) {
        btn.removeAttribute('disabled');
        // Keep Tally's own default button color untouched (only sizing is ours) - so "ready"
        // reads as its own distinct primary action, rather than reusing the same blue already
        // used for a family card's Select/Deselect toggle, which read as confusingly similar.
        btn.setAttribute('style', 'width:100%;box-sizing:border-box;opacity:1;');
        if (innerSpan) innerSpan.style.removeProperty('color');
        if (innerIcon) innerIcon.style.removeProperty('color');
        // Checkmark written as a JS unicode escape, not a literal character - a raw
        // multi-byte UTF-8 character here got mangled into mojibake somewhere in the
        // clipboard/Tally paste pipeline (confirmed live: source bytes were correct UTF-8, so
        // this was a paste artifact, not a code bug). The escape is plain ASCII in the source, so
        // it survives any paste channel intact and produces the identical character at runtime.
        caption.textContent = '\u2713 Ready to submit';
        caption.style.color = '#3B6D11';
    } else {
        btn.setAttribute('disabled', 'disabled');
        // Dimmed fill (matching the border/text colors already used for an unselected family
        // card) plus a real opacity reduction and not-allowed cursor. Legible text color alone
        // still read as "maybe clickable" - the faded-relative-to-the-page look is what actually
        // signals "inactive", without resorting to low-contrast (and so unreadable) text.
        btn.setAttribute('style', 'width:100%;box-sizing:border-box;background-color:#EFEFEF;border:1px solid #D8D8D8;color:#5F5E5A;cursor:not-allowed;opacity:0.55;');
        if (innerSpan) innerSpan.style.color = '#5F5E5A';
        if (innerIcon) innerIcon.style.color = '#5F5E5A';
        caption.textContent = 'Select a family above to enable';
        caption.style.color = '#888888';
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

// this same wildcard/regex matching logic is independently duplicated in buildFilter in
// families4families/f4fevents (api/SheetsAPI.js), used server-side whenever an event's
// UseFamilyResultsCache config is false. They can't easily share code - that file is
// Node/ES-modules on the Cloud Run backend, this one is plain global-scope browser script
// with no bundler, per Tally's custom-code constraint. If you change the matching rules
// here, update that copy too.
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

    // cache: 'no-store' is fetch's own no-cache instruction - unlike jQuery's {cache: false},
    // it does not append a "_=<timestamp>" query param to achieve the same thing, so this also
    // sidesteps the whole class of bug where a stray query param got treated as a search filter
    const queryParams = new URLSearchParams(criteria);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    fetch(`${sheetUrl}?${queryParams}`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Fetch Response Status: ${sheetUrl} --- ${response.status}`);
            }
            return response.json();
        })
        .then((json) => {
            console.log(json);
            gClientFamilyCache = json;
            renderFunction(json);
        })
        .catch((error) => {
            console.log("Error: " + error.message);
            console.dir(error);
        })
        .finally(() => {
            clearTimeout(timeoutId);
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

// docIds.initialize() throws if it can't find one of Tally's own form fields in the DOM yet.
// ready() fires at DOMContentLoaded, which can land before Tally's own
// client-rendered React form has actually mounted those fields - a race, not a hard failure -
// so retry for a while instead of giving up on the first attempt. Without this, the whole
// bootstrap below (including the Yes/No search wiring) can silently abort: initialize() throwing
// inside this async ready callback is an unhandled promise rejection, which window.onerror does
// not catch, so it fails with no visible error at all.
async function waitForDocIdsInitialize(docIds, timeoutMs = 10000, intervalMs = 150) {
    const start = Date.now();
    let lastError;
    while (Date.now() - start < timeoutMs) {
        try {
            docIds.initialize();
            return;
        } catch (e) {
            lastError = e;
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
    }
    throw lastError || new Error('docIds.initialize() timed out waiting for Tally form fields');
}

/**
 * Full page bootstrap, shared across every event's Sponsor Sign-Up form. Call this from the
 * per-event inline script after DocIDs/eventName/apiBase/searchUrl/convertRowToObject are defined.
 */
function initSponsorSignup(docIds, searchUrl) {
    window.addEventListener('Tally.FormSubmitted', (payload) => {
        submitSponsorForm(docIds, searchUrl, payload);
    });

    ready(async function () {

        await waitForDocIdsInitialize(docIds);
        await fetchEventConfiguration(searchUrl);

        setupInputSearchTriggering(docIds, () => refreshFamilyResults(docIds, searchUrl));
        setupMutationObserverTriggering(docIds, () => refreshFamilyResults(docIds, searchUrl));
        setupSponsorSearchTriggering(docIds, searchUrl);

        // ensure that we have the search results placeholder div
        const placeholderMatches = findElementsContainingText(resultsPlaceholderContainerSelector, resultsPlaceholderText);
        if (placeholderMatches.length !== 1) {
            throw Error("error: could not locate family results placeholder");
        }
        // Render results into our own sibling div, never into the placeholder's own children.
        // The placeholder is a node Tally's React created and still owns; repeatedly overwriting
        // its innerHTML fights with React's own reconciliation of that same node whenever Tally
        // later re-renders nearby form state - that mismatch is what caused the production stack
        // overflow this shared library previously worked around by disabling console-log
        // recording (2026.Thanksgiving.1.0.2) rather than fixing the actual conflict. Hiding the
        // placeholder (a style change, not a child mutation) and inserting a wrapper div we fully
        // own as its sibling keeps React's view of the placeholder's own children untouched
        // forever, so it has nothing to get confused about on a later re-render.
        placeholderMatches[0].style.display = 'none';
        const resultsWrapperDiv = document.createElement('div');
        placeholderMatches[0].insertAdjacentElement('afterend', resultsWrapperDiv);
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
            // must be awaited (not a bare .then()) - a bare .then() here resolves after ready()
            // has already returned, so any search trigger that fires before it lands would hit
            // a null gClientFamilyCache and crash in applySearchCriteria's clientDataRows.filter(...)
            gClientFamilyCache = await response.json();
            // render the initial result set now that the cache is ready, using the same
            // refreshFamilyResults() every other search goes through (not a hand-rolled
            // {Sponsored:"No"}-only criteria) so it respects AllowSignUpOfPreviouslySponsored/
            // PreviousSponsorEmail the same as every other search. This must run regardless of
            // UseFamilyResultsCache - that flag only controls *how* refreshFamilyResults searches
            // (local cache filter vs. server fetch), not *whether* the first render happens. Events
            // using the server-search path (UseFamilyResultsCache: false, e.g. Thanksgiving) were
            // never rendering an initial result set at all before this - nothing showed up until
            // the user touched a search field, since gLastSearchInputs starts empty and every
            // control naturally counts as "changed" on this first call regardless of the flag.
            refreshFamilyResults(docIds, searchUrl);
        }
    });
}
