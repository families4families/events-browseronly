<script>
    // PostHog error tracking - lets us get alerted when a submission silently fails
    // (see families4families201@gmail.com / raffi: configure an Alert under
    // PostHog > Error tracking > Alerting, or an email trend-alert on the
    // client_signup_failed event, so failures actually reach a person).
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
</script>

<script type="text/javascript">

    /** todo: read the sheet tab name (or the event name & year) from the form **/
    const eventName = 'BTS';
    const eventYear = new Date().getFullYear();
    // f4fevents backend (replaces sheet.best) - see families4families/f4fevents on GitHub
    const apiBase = `https://f4feventsserver-539935395831.us-east1.run.app`;
    const searchUrl = `${apiBase}/${eventName}/${eventYear}`;

    function ready(fn) {
      if (document.readyState !== 'loading') {
        fn();
        return;
      }
      document.addEventListener('DOMContentLoaded', fn);
    }
    
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

            // ties this PostHog session/replay to the submitting parent instead of staying anonymous
            safePostHog((ph) => ph.identify(clientData.ClientEmail, {
                email: clientData.ClientEmail,
                first_name: clientData.ClientFirstName,
                last_name: clientData.ClientLastName,
            }));

            const familyMemberCount = Number(clientData.ClientFamilyMemberSignUpCount);
            for (let i = 1; i <= familyMemberCount; i++) {
                const familyMemberData = {
                    [`FMName${i}`]: getRFieldValue(fields, `Name`, i),
                    [`FMAge${i}`]: getRFieldValue(fields, `Age`, i),
                    [`FMGender${i}`]: getRFieldValue(fields, `Gender`, i),
                    [`FMGrade${i}`]: getRFieldValue(fields, `Grade`, i),
                    //[`FMComments${i}`]: getRFieldValue(fields, `FMComments`, i),
                };

                Object.assign(clientData, familyMemberData);
            }

            post(clientData)
                .then((data) => {
                    console.log(`submit response: ${data}`);
                })
                .catch((error) => {
                    console.error('Submit Failure', error);
                    safePostHog((ph) => ph.captureException(error, { event: 'client_signup_failed', step: 'post', email: emailForLogging }));
                    alert("There was an error during save. Please try again and if this message repeats, please contact Families4Families. We apologize for the error.");
                });
        } catch (error) {
            console.error('Submit Setup Failure', error);
            safePostHog((ph) => ph.captureException(error, { event: 'client_signup_failed', step: 'setup', email: emailForLogging }));
            alert("There was an error during save. Please try again and if this message repeats, please contact Families4Families. We apologize for the error.");
        }
    }

    // best-effort email lookup for error context - must never itself throw
    function safeGetEmail(fields) {
        try {
            return getFieldValue(fields, "ClientEmail");
        } catch (e) {
            return "unknown";
        }
    }
    
    async function post(clientData) {
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
     * get a field's value that only appears once on the form
     */
    function getFieldValue(fields, label) {
        let field = fields.find((e)=> e.title === label);
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
        let filtered = fields.filter((field)=> field.type === "MATRIX" && field.title.startsWith(label));
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
    
    </script>
