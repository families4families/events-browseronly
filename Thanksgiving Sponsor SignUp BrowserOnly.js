<script type="text/javascript" src="https://unpkg.com/mustache@4.2.0"></script>
<!-- shared/sponsor-signup-common.js - defines all cross-event Sponsor Sign-Up logic
     (PostHog init, DocIDs machinery, search/render/submit). See families4families/events-browseronly
     on GitHub. This URL never changes - it's a stable redirect (via f4fevents backend) to
     whatever git tag is currently configured, so it never needs re-pasting into Tally. -->
<script type="text/javascript" src="https://f4feventsserver-539935395831.us-east1.run.app/scripts/sponsor-signup-common.js" crossorigin="anonymous"></script>

<!--
<link rel="stylesheet" href="https://rnorian.github.io/F4F/css/sponsor-signup.css">
<script type="text/javascript" src="https://rnorian.github.io/F4F/src/modules/F4FShared.js"></script>
-->
<style>
    section.search-results-block {
        display: flex;
        flex-direction: column;
        align-content: flex-start;
        width: 100%;
        max-width: 500px;
        gap: 20px;
    }

    section.search-results-block div.f4f-client-card {
        width: 100%;
        box-sizing: border-box;
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

<script type="text/javascript">

    /*****************
     *  CONFIGURATION
     *****************/
    const eventName = 'Thanksgiving';
    const eventYear = new Date().getFullYear();
    // f4fevents backend (replaces sheet.best) - see families4families/f4fevents on GitHub
    const apiBase = `https://f4feventsserver-539935395831.us-east1.run.app`;
    const searchUrl = `${apiBase}/${eventName}/${eventYear}`;

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
     * Thanksgiving has no repeating family-member block (no FM<Attribute><N> columns at all -
     * just aggregate ClientAdultCount/ClientChildAges), so most of the row can be used as-is.
     * The derived "Description" fields below are Thanksgiving-specific display formatting for
     * SearchResultsDisplayCardTemplate, computed here (not in renderFamilyResults) so that
     * function stays identical across every event.
     */
    function convertRowToObject(row) {
        const tree = Object.assign({}, row);

        tree["ClientFamilySizeDescription"] = function() {
            return tree.ClientFamilySize + " (" + tree.ClientAdultCount + " adult" + (tree.ClientAdultCount > 1 ? 's' : "") + ", "
                    + (tree.ClientChildAges ? tree.ClientChildAges.split(",").length : 0) + " " + (tree.ClientChildAges ? (tree.ClientChildAges.split(",").length === 1 ? 'child' : 'children') : 'children')
                    + (tree.ClientChildAges ? (tree.ClientChildAges.split(",").length > 0 ? " - age(s): " + tree.ClientChildAges : "") : "") + ")";
        }();
        tree["ClientDietaryRestrictionsDescription"] = function() {
            return (!tree.ClientDietaryRestrictions || tree.ClientDietaryRestrictions.length === 0 || tree.ClientDietaryRestrictions.startsWith("None") ? "None" : tree.ClientDietaryRestrictions);
        }();
        tree["ClientSpecialRequestsDescription"] = function() {
            return (!tree.ClientSpecialRequests || tree.ClientSpecialRequests.length === 0 ? "None" : tree.ClientSpecialRequests);
        }();

        return tree;
    }

    initSponsorSignup(DocIDs, searchUrl);

    //# sourceURL=thanksgiving-sponsor-signup/main.js
</script>
