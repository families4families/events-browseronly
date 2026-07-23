<!-- shared/client-signup-common.js - defines all cross-event Client Sign-Up logic (PostHog
     init, field helpers, submit/error handling). See families4families/events-browseronly on
     GitHub. This URL never changes - it's a stable redirect (via f4fevents backend) to
     whatever git tag is currently configured, so it never needs re-pasting into Tally. -->
<!-- TESTING ONLY: ?version= pins this to the refactor branch under test, bypassing the Global
     SharedLibraryVersion every production form resolves through. Remove this query param when
     this migration is done and ready to go through the real release/tagging process. -->
<script type="text/javascript" src="https://f4feventsserver-539935395831.us-east1.run.app/scripts/client-signup-common.js?version=refactor/shared-library-migration"></script>

<script type="text/javascript">

    const { eventName, eventYear } = detectEventInfo('Client');
    // f4fevents backend (replaces sheet.best) - see families4families/f4fevents on GitHub
    const apiBase = `https://f4feventsserver-539935395831.us-east1.run.app`;
    const searchUrl = `${apiBase}/${eventName}/${eventYear}`;

    ready(function(){
        window.addEventListener('Tally.FormSubmitted', (payload) => onSubmit(payload));
    })

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

                /** BTS specific **/
                "ClientFamilyMemberSignUpCount": getFieldValue(fields, "ClientFamilyMemberSignUpCount"),
            };

            const familyMemberCount = Number(clientData.ClientFamilyMemberSignUpCount);
            for (let i = 1; i <= familyMemberCount; i++) {
                const familyMemberData = {
                    [`FMName${i}`]: getRFieldValue(fields, `Name`, i),
                    [`FMAge${i}`]: getRFieldValue(fields, `Age`, i),
                    [`FMGender${i}`]: getRFieldValue(fields, `Gender`, i),
                    [`FMGrade${i}`]: getRFieldValue(fields, `Grade`, i),
                    /** BTS 2026 sizing fields **/
                    [`FMSchoolName${i}`]: getRFieldValue(fields, `SchoolName`, i),
                    [`FMShirt${i}`]: getRFieldValue(fields, `Shirt`, i),
                    [`FMPant${i}`]: getRFieldValue(fields, `Pant`, i),
                    [`FMShoeSize${i}`]: getRFieldValue(fields, `ShoeSize`, i),
                    //[`FMComments${i}`]: getRFieldValue(fields, `FMComments`, i),
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

    //# sourceURL=bts-client-signup/main.js
</script>
