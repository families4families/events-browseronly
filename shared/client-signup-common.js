// Shared logic for every event's Client Sign-Up form (BTS, Thanksgiving, Christmas, ...).
// Loaded via <script src> before the per-event inline <script> block, which must define
// eventName, apiBase, searchUrl, and an onSubmit(payload) that builds clientData and calls
// submitClientForm(searchUrl, clientData).

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

    posthog.init('phc_zD9wo5zTiFQhH3FRtmthPVXoqR5M8NVYAZ47uYtbjD3k', {
        api_host: 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_exceptions: true,
    });
} catch (e) {
    console.error('PostHog failed to initialize (ignored):', e);
}

function safePostHog(fn) {
    try {
        if (typeof posthog !== "undefined") {
            fn(posthog);
        }
    } catch (e) {
        console.error('PostHog call failed (ignored):', e);
    }
}

function ready(fn) {
    if (document.readyState !== 'loading') {
        fn();
        return;
    }
    document.addEventListener('DOMContentLoaded', fn);
}

// Maps a Tally form's tallyLabel (used in the form name, e.g. "26 BTS - Client Sign-Up") to
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
 * get a set of field values for a field appears multiple times on the form (i.e. if you collect
 * multiple family members, there will be N number of 'Name' fields)
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

// best-effort email lookup for error context - must never itself throw
function safeGetEmail(fields) {
    try {
        return getFieldValue(fields, "ClientEmail");
    } catch (e) {
        return "unknown";
    }
}

async function postClientData(searchUrl, clientData) {
    const request = new Request(`${searchUrl}/client`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(clientData),
    })
    const response = await fetch(request);
    const responseData = await response.json();
    if (!response.ok) {
        throw Error('Client Submit did not process successfully');
    }
    return responseData;
}

/**
 * Submits an already-built clientData object: posts it, identifies the sponsor's session in
 * PostHog, and handles/reports any failure. Call this from the per-event onSubmit(payload)
 * once clientData has been assembled from that event's specific fields.
 */
function submitClientForm(searchUrl, clientData, emailForLogging) {
    // ties this PostHog session/replay to the submitting parent instead of staying anonymous
    safePostHog((ph) => ph.identify(clientData.ClientEmail, {
        email: clientData.ClientEmail,
        first_name: clientData.ClientFirstName,
        last_name: clientData.ClientLastName,
    }));

    postClientData(searchUrl, clientData)
        .then((data) => {
            console.log(`submit response: ${data}`);
        })
        .catch((error) => {
            console.error('Submit Failure', error);
            safePostHog((ph) => ph.captureException(error, { event: 'client_signup_failed', step: 'post', email: emailForLogging }));
            alert("There was an error during save. Please try again and if this message repeats, please contact Families4Families. We apologize for the error.");
        });
}
