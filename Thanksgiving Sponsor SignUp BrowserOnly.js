<script type="text/javascript" src="https://unpkg.com/mustache@4.2.0"></script>
<!-- shared/sponsor-signup-common.js - defines all cross-event Sponsor Sign-Up logic
     (PostHog init, DocIDs machinery, search/render/submit). See families4families/events-browseronly
     on GitHub. This URL never changes - it's a stable redirect (via f4fevents backend) to
     whatever git tag is currently configured, so it never needs re-pasting into Tally. -->
<!-- TESTING ONLY: ?version= pins this to the refactor branch under test, bypassing the Global
     SharedLibraryVersion every production form resolves through. Remove this query param when
     this migration is done and ready to go through the real release/tagging process. -->
<script type="text/javascript" src="https://f4feventsserver-539935395831.us-east1.run.app/scripts/sponsor-signup-common.js?version=refactor/shared-library-migration" crossorigin="anonymous"></script>

<!--
<link rel="stylesheet" href="https://rnorian.github.io/F4F/css/sponsor-signup.css">
<script type="text/javascript" src="https://rnorian.github.io/F4F/src/modules/F4FShared.js"></script>
-->
<!-- shared/sponsor-card-chrome.css - card border/radius, selected-state, badge, and button
     styling shared across every event's Sponsor Sign-Up results, via the same stable redirect
     as the shared JS library. Only Thanksgiving-specific layout (the label/value detail rows
     below) lives in this file's own <style> block. -->
<link rel="stylesheet" href="https://f4feventsserver-539935395831.us-east1.run.app/scripts/sponsor-card-chrome.css">
<style>
    div.f4f-family-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
        font-size: 14px;
    }

    div.f4f-detail-row {
        display: flex;
        gap: 8px;
    }

    div.f4f-detail-row .f4f-detail-label {
        color: #666666;
        min-width: 130px;
        flex-shrink: 0;
    }

    div.f4f-detail-row .f4f-detail-value {
        overflow-wrap: break-word;
    }
</style>

<script type="x-tmpl-mustache" id="SearchResultsDisplayCardTemplate">
    <section class="search-results-block">
        {{#.}}
        <div id='{{F4FNumber}}' class="f4f-client-card f4f-client-unselected">
            <div class="f4f-card-header">
                <span class="f4f-family-name"><svg class="f4f-selected-check" viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6l-1.3-1.3a1 1 0 10-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clip-rule="evenodd"></path></svg>{{ClientFirstName}}'s family</span>
                <span class="f4f-member-count">{{ClientFamilyMemberCount}} people</span>
            </div>
            <div class="f4f-family-details" data-f4f-number="{{F4FNumber}}">
                <div class="f4f-detail-row"><span class="f4f-detail-label">Family</span><span class="f4f-detail-value">{{ClientFamilyCompositionDescription}}</span></div>
                <div class="f4f-detail-row"><span class="f4f-detail-label">Dietary restrictions</span><span class="f4f-detail-value">{{ClientDietaryRestrictionsDescription}}</span></div>
                <div class="f4f-detail-row"><span class="f4f-detail-label">Special requests</span><span class="f4f-detail-value">{{ClientSpecialRequestsDescription}}</span></div>
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
     * Binds to Tally form definition where PropertyName = FieldName in Tally.
     * initialize/findLabel/inputFields delegate to the shared sponsor-signup-common.js
     * implementations (docIdsInitialize/docIdsFindLabel/docIdsGetInputFields) so every event's
     * DocIDs shares the exact same behavior without copying the logic into each form.
     */
    const DocIDs = {
        meta: {
            SearchClientFamilySize: {
                type: "DROPDOWN",
                labelContent: "Family Size",
            },
            SearchClientFamilyGender: null,
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

        SponsorFirstName: null,
        SponsorLastName: null,
        SponsorEmail: null,
        SponsorPhoneNumber: null,

        infoOnly: {
            SponsorPreviousFamilyY: null,
            SponsorPreviousFamilyN: null,
        },

        /**
         * Fields that trigger searches, and the field values act as filters to the search sent
         * to the backend. Thanksgiving only searches on Family Size - Gender is deliberately
         * left out (nulled above in meta), unlike BTS which does search on Gender.
         */
        search: {
            SearchClientFamilySize: null,
        },

        displayBlocks: {
            searchResultsDiv: '',
        },

        initialize: function (obj) { return docIdsInitialize(DocIDs, obj); },
        findLabel: function (searchVal, obj) { return docIdsFindLabel(DocIDs, searchVal, obj); },
        inputFields: function () { return docIdsGetInputFields(DocIDs); },
    };

    /**
     * "2 adults, 2 children (ages: 23, 25)" - singular/plural handled here instead of the
     * old "adult(s)"/"age(s)" text, and the age list only appears at all when there are children.
     */
    function describeFamilyComposition(adultCount, childAges) {
        const adults = Number(adultCount) || 0;
        const ages = (childAges || "").split(",").map((s) => s.trim()).filter(Boolean);
        const childCount = ages.length;

        const adultPart = `${adults} adult${adults === 1 ? '' : 's'}`;
        const childPart = `${childCount} child${childCount === 1 ? '' : 'ren'}`;
        const agesPart = childCount > 0 ? ` (age${childCount === 1 ? '' : 's'}: ${ages.join(', ')})` : '';

        return { text: `${adultPart}, ${childPart}${agesPart}`, totalPeople: adults + childCount };
    }

    /**
     * Thanksgiving has no repeating family-member block (no FM<Attribute><N> columns at all -
     * just aggregate ClientAdultCount/ClientChildAges), so most of the row can be used as-is.
     * The derived fields below are Thanksgiving-specific display formatting for
     * SearchResultsDisplayCardTemplate, computed here (not in renderFamilyResults) so that
     * function stays identical across every event.
     */
    function convertRowToObject(row) {
        const tree = Object.assign({}, row);

        const composition = describeFamilyComposition(tree.ClientAdultCount, tree.ClientChildAges);
        tree["ClientFamilyCompositionDescription"] = composition.text;
        tree["ClientFamilyMemberCount"] = composition.totalPeople;

        tree["ClientDietaryRestrictionsDescription"] = (!tree.ClientDietaryRestrictions || tree.ClientDietaryRestrictions.length === 0 || tree.ClientDietaryRestrictions.startsWith("None") ? "None" : tree.ClientDietaryRestrictions);
        tree["ClientSpecialRequestsDescription"] = (!tree.ClientSpecialRequests || tree.ClientSpecialRequests.length === 0 ? "None" : tree.ClientSpecialRequests);

        return tree;
    }

    // detectEventInfo reads Tally's own __NEXT_DATA__ script tag - deferred to DOMContentLoaded
    // (via ready()) since that tag can sit later in the document than this injected code, so
    // calling detectEventInfo() at top level can run before the tag has even been parsed yet.
    ready(async function () {
        const { eventName, eventYear } = await waitForDetectEventInfo('Sponsor');
        // f4fevents backend (replaces sheet.best) - see families4families/f4fevents on GitHub
        const apiBase = `https://f4feventsserver-539935395831.us-east1.run.app`;
        const searchUrl = `${apiBase}/${eventName}/${eventYear}`;

        initSponsorSignup(DocIDs, searchUrl);
    });

    //# sourceURL=thanksgiving-sponsor-signup/main.js
</script>
