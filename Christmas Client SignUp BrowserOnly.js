<!-- shared/client-signup-common.js - defines all cross-event Client Sign-Up logic (PostHog
     init, field helpers, submit/error handling). See families4families/events-browseronly on
     GitHub. This URL never changes - it's a stable redirect (via f4fevents backend) to
     whatever git tag is currently configured, so it never needs re-pasting into Tally. -->
<!-- TESTING ONLY: ?version= pins this to the refactor branch under test, bypassing the Global
     SharedLibraryVersion every production form resolves through. Remove this query param when
     this migration is done and ready to go through the real release/tagging process. -->
<script type="text/javascript" src="https://f4feventsserver-539935395831.us-east1.run.app/scripts/client-signup-common.js?version=refactor/shared-library-migration"></script>

<script type="text/javascript">

    // assigned inside ready() below, but declared here (not with const/let inside that
    // callback) so onSubmit - a separate top-level function - can still read it via closure
    let searchUrl;

    // detectEventInfo reads Tally's own __NEXT_DATA__ script tag - deferred to DOMContentLoaded
    // (via ready()) since that tag can sit later in the document than this injected code, so
    // calling detectEventInfo() at top level can run before the tag has even been parsed yet.
    ready(async function(){
        const { eventName, eventYear } = await waitForDetectEventInfo('Client');
        // f4fevents backend (replaces sheet.best) - see families4families/f4fevents on GitHub
        const apiBase = `https://f4feventsserver-539935395831.us-east1.run.app`;
        searchUrl = `${apiBase}/${eventName}/${eventYear}`;

        window.addEventListener('Tally.FormSubmitted', (payload) => onSubmit(payload));
    })

    /**
     * get a matrix field's value - Christmas-specific (no other event's Client form uses a
     * MATRIX-type field), so this stays local rather than living in shared/client-signup-common.js.
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

    async function onSubmit(payload) {
        // any failure below - including a field-title mismatch or a network error in post() -
        // gets logged to PostHog with enough context (which email, which step) to actually
        // act on, instead of silently vanishing with no record anywhere
        const fields = payload.detail.fields;
        const emailForLogging = safeGetEmail(fields);

        try {
            // F4FNumber is looked up (returning client) or assigned server-side now - see createClientEntry
            const clientData = {
                "ClientFirstName": getFieldValue(fields, "ClientFirstName"),
                "ClientLastName": getFieldValue(fields, "ClientLastName"),
                "ClientAddress": getFieldValue(fields, "ClientAddressLine"),
                "ClientCity": getFieldValue(fields,"ClientCity"),
                "ClientZipCode": getFieldValue(fields,"ClientZipCode"),
                "ClientPhoneNumber": getFieldValue(fields, "ClientPhoneNumber"),
                "ClientEmail": getFieldValue(fields, "ClientEmail").trim().toLowerCase(),
                "ReferringAgency": getFieldValue(fields, "ReferringAgency"),
                "Sponsored": 'No',
                "SignUpDate": new Date().toISOString(),

                /** Christmas specific **/
                "ClientOKSponsorReachOut": getFieldValue(fields, "ClientOKSponsorReachOut"),
                "ClientContactMethods": getFieldValue(fields, "ClientContactMethods"),
                "ClientFamilyMemberSignUpCount": getFieldValue(fields, "ClientFamilyMemberSignUpCount"),
            };

            // special matrix handling - merges "9am - 12pm"/"12pm - 3pm"/etc columns straight
            // onto clientData, matching the raw sheet column names the backend's ContactDayTime
            // derivation (F4FEventsAPI.js's convertRowToObject) reads by the same literal keys
            Object.assign(clientData, getMFieldValue(fields, "ClientContactDayTime"));

            const familyMemberCount = Number(clientData.ClientFamilyMemberSignUpCount);
            for (let i = 1; i <= familyMemberCount; i++) {
                const familyMemberData = {
                    [`FMName${i}`]: getRFieldValue(fields, `FMName`, i),
                    [`FMGender${i}`]: getRFieldValue(fields, `FMGender`, i),
                    [`FMAge${i}`]: getRFieldValue(fields, `FMAge`, i),
                    [`FMSizingType${i}`]: getRFieldValue(fields, `FMSizingType`, i),
                    [`FMShirtSize${i}`]: getRFieldValue(fields, `FMShirtSize`, i),
                    [`FMPantSize${i}`]: getRFieldValue(fields, `FMPantSize`, i),
                    [`FMShoeSize${i}`]: getRFieldValue(fields, `FMShoeSize`, i),
                    [`FMMostNeededItems${i}`]: getRFieldValue(fields, `FMMostNeededItems`, i),
                    [`FMFavoriteCustomization${i}`]: getRFieldValue(fields, `FMFavoriteCustomization`, i),
                    [`FMSantaWishList${i}`]: getRFieldValue(fields, `FMSantaWishList`, i),
                    [`FMComments${i}`]: getRFieldValue(fields, `FMComments`, i),
                };

                Object.assign(clientData, familyMemberData);
            }

            submitClientForm(searchUrl, clientData, emailForLogging);
        } catch (error) {
            console.error('Submit Setup Failure', error);
            safePostHog((ph) => ph.captureException(error, { event: 'client_signup_failed', step: 'setup', email: emailForLogging }));
            alert("There was an error during save. Please try again and if this message repeats, please contact Families4Families. We apologize for the error.");
        }
    }

    //# sourceURL=christmas-client-signup/main.js
</script>
