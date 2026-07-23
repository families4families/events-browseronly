<!-- shared/sponsor-signup-common.js - defines all cross-event Sponsor Sign-Up logic
     (PostHog init, DocIDs machinery, search/render/submit). See families4families/events-browseronly
     on GitHub. This URL never changes - it's a stable redirect (via f4fevents backend) to
     whatever git tag is currently configured, so it never needs re-pasting into Tally. -->
<!-- TESTING ONLY: ?version= pins this to the refactor branch under test, bypassing the Global
     SharedLibraryVersion every production form resolves through. Remove this query param when
     this migration is done and ready to go through the real release/tagging process. -->
<script type="text/javascript" src="https://f4feventsserver-539935395831.us-east1.run.app/scripts/sponsor-signup-common.js?version=refactor/shared-library-migration" crossorigin="anonymous"></script>

<script type="text/javascript" src="https://unpkg.com/mustache@4.2.0"></script>

<!-- shared/sponsor-card-chrome.css - card border/radius, selected-state, badge, and button
     styling shared across every event's Sponsor Sign-Up results, via the same stable redirect
     as the shared JS library. Only Christmas-specific layout (per-member rows with gender icons,
     below) lives in this file's own <style> block. Matches BTS's card style (Option 1) rather
     than Christmas's old table-based look. -->
<link rel="stylesheet" href="https://f4feventsserver-539935395831.us-east1.run.app/scripts/sponsor-card-chrome.css">
<style>
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
                        <span class="f4f-member-detail">{{FMGender}}, age {{FMAge}} &middot; {{FMSizingType}}</span>
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
     * Binds to Tally form definition where PropertyName = FieldName in Tally.
     * initialize/findLabel/inputFields delegate to the shared sponsor-signup-common.js
     * implementations (docIdsInitialize/docIdsFindLabel/docIdsGetInputFields) so every event's
     * DocIDs shares the exact same behavior without copying the logic into each form. This also
     * gets Christmas the same CHOICE-OPTION fix BTS/Thanksgiving already have (matching on visible
     * label text - Tally dropped the hidden fieldName marker this file's old standalone version
     * still relied on).
     */
    const DocIDs = {
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

        SponsorFirstName: null,
        SponsorLastName: null,
        SponsorEmail: null,
        SponsorPhoneNumber: null,

        infoOnly: {
            SponsorPreviousFamilyY: null,
            SponsorPreviousFamilyN: null,
        },

        /**
         * Christmas searches on both Family Size and Gender, same as BTS.
         */
        search: {
            SearchClientFamilySize: null,
            SearchClientFamilyGender: null,
        },

        displayBlocks: {
            searchResultsDiv: '',
        },

        initialize: function (obj) { return docIdsInitialize(DocIDs, obj); },
        findLabel: function (searchVal, obj) { return docIdsFindLabel(DocIDs, searchVal, obj); },
        inputFields: function () { return docIdsGetInputFields(DocIDs); },
    };

    // SponsorAttendHolidayParty/SponsorHolidayPartyAttendeeCount have no custom logic handlers
    // (thus no meta blocks) - the value still needs to be captured and sent to the sheet at
    // submit time. "no-field-binding" causes docIdsInitialize to skip DOM binding for it (it's
    // read straight from the Tally submission payload by field title in submitSponsorForm, not
    // looked up in the DOM), while still being included by docIdsGetInputFields() since it's
    // non-null.
    DocIDs.SponsorAttendHolidayParty = "no-field-binding";
    DocIDs.SponsorHolidayPartyAttendeeCount = "no-field-binding";

    function genderIconClass(gender) {
        switch (gender) {
            case "Male": return "gender-male";
            case "Female": return "gender-female";
            case "Non-Binary": return "gender-nonbinary";
            default: return "gender-other";
        }
    }

    /**
     * The backend's own convertRowToObject (F4FEventsAPI.js) already derives FamilyMembers from
     * whatever FM<Attribute>1 columns exist on the row (generic, not Christmas-specific), so
     * every field this card needs - FMSizingType included - already arrives pre-built. Only
     * display-only augmentation (the gender icon color class) belongs here.
     */
    function convertRowToObject(row) {
        const tree = Object.assign({}, row);
        tree.FamilyMembers = (row.FamilyMembers || []).map((member) => {
            return Object.assign({}, member, { FMGenderClass: genderIconClass(member.FMGender) });
        });
        return tree;
    }

    // detectEventInfo reads Tally's own __NEXT_DATA__ script tag - deferred to DOMContentLoaded
    // (via ready()) since that tag can sit later in the document than this injected code, so
    // calling detectEventInfo() at top level can run before the tag has even been parsed yet.
    ready(function () {
        const { eventName, eventYear } = detectEventInfo('Sponsor');
        // f4fevents backend (replaces sheet.best) - see families4families/f4fevents on GitHub
        const apiBase = `https://f4feventsserver-539935395831.us-east1.run.app`;
        const searchUrl = `${apiBase}/${eventName}/${eventYear}`;

        initSponsorSignup(DocIDs, searchUrl);
    });

    //# sourceURL=christmas-sponsor-signup/main.js
</script>
