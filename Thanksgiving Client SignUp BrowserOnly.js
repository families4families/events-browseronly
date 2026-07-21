<!-- shared/client-signup-common.js - defines all cross-event Client Sign-Up logic (PostHog
     init, field helpers, submit/error handling). See families4families/events-browseronly on
     GitHub. This URL never changes - it's a stable redirect (via f4fevents backend) to
     whatever git tag is currently configured, so it never needs re-pasting into Tally. -->
<script type="text/javascript" src="https://f4feventsserver-539935395831.us-east1.run.app/scripts/client-signup-common.js"></script>

<script type="text/javascript">

    /** todo: read the sheet tab name (or the event name & year) from the form **/
    const eventName = 'Thanksgiving';
    const eventYear = new Date().getFullYear();
    // f4fevents backend (replaces sheet.best) - see families4families/f4fevents on GitHub
    const apiBase = `https://f4feventsserver-539935395831.us-east1.run.app`;
    const searchUrl = `${apiBase}/${eventName}/${eventYear}`;

    ready(function(){
        window.addEventListener('Tally.FormSubmitted', (payload) => onSubmit(payload));
    })

    async function onSubmit(payload) {
        // any failure below - including a field-title mismatch - gets logged to PostHog with
        // enough context (which email, which step) to actually act on, instead of silently
        // vanishing with no record anywhere
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

                /** Thanksgiving specific **/
                "ClientAdultCount": getFieldValue(fields, "ClientAdultCount"),
                "ClientChildAges": getFieldValue(fields, "ClientChildAges"),
                "ClientDietaryRestrictions": getFieldValue(fields, "ClientDietaryRestrictions"),
                "ClientSpecialRequests": getFieldValue(fields, "ClientSpecialRequests"),
            };

            submitClientForm(searchUrl, clientData, emailForLogging);
        } catch (error) {
            console.error('Submit Setup Failure', error);
            safePostHog((ph) => ph.captureException(error, { event: 'client_signup_failed', step: 'setup', email: emailForLogging }));
            alert("There was an error during save. Please try again and if this message repeats, please contact Families4Families. We apologize for the error.");
        }
    }

</script>
