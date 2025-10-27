<script type="text/javascript">

    /** todo: read the sheet tab name (or the event name & year) from the form **/
    const eventName = 'Christmas';
    const eventYear = new Date().getFullYear();
    const f4fSheet = `https://sheet.best/api/sheets/f1d55e40-55cb-4141-95d6-c43d1384c9d5`;
    const gEventSheet = `${f4fSheet}/tabs/${eventName}${eventYear}`
    const gEventSheetQuery = `${gEventSheet}/query`;
    
    const gClientMasterTab = `${f4fSheet}/tabs/ClientFamilyMaster`
    
    
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
      
    async function lookupF4FNumber(emailAddress) {
        if (emailAddress === "undefined" || !emailAddress) {
            return "";
        }
        let email = emailAddress;
        email = email.trim().toLowerCase();

        const searchCriteria = `/ClientEmail/${email}`;
        const url = `${gClientMasterTab}${searchCriteria}`;
    
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`F4FNumberLookup: failed to lookup F4FNumber for client email address ${email}; ignoring.\n\tStatus: ${response.status}\n\tDetail: ${response.statusText}`);
            return "";
        }
    
        let f4fNumber = "";
        const records = await response.json();
        if (records.length === 0) {
            console.info(`F4FNumberLookup: no F4FNumber found for email address ${email}`);
        } else if (records.length > 1) {
            console.warn(`F4FNumberLookup: multiple records found for email address ${email} ... cannot assign`);
        } else if (records.length === 1) {
            f4fNumber = records[0].F4FNumber;
        }
    
        return f4fNumber;
    }
    
    async function onSubmit(payload) {
    
        const fields = payload.detail.fields;
    
        let f4fNumber = await lookupF4FNumber(getFieldValue(fields, "ClientEmail").trim().toLowerCase())
    
        const clientData = {
            "F4FNumber": f4fNumber,
            "ClientFirstName": getFieldValue(fields, "ClientFirstName"),
            "ClientLastName": getFieldValue(fields, "ClientLastName"),        
            "ClientAddress": getFieldValue(fields, "ClientAddressLine"),  
            "ClientCity": getFieldValue(fields,"ClientCity"),
            "ClientZipCode": getFieldValue(fields,"ClientZipCode"),
            "ClientPhoneNumber": getFieldValue(fields, "ClientPhoneNumber"),
            "ClientEmail": getFieldValue(fields, "ClientEmail").trim().toLowerCase(),
            "ReferringAgency": getFieldValue(fields, "ReferringAgency"),
            "Sponsored": 'No',        
            "SignUpDate": new Date().toLocaleString().split(',').join(' '),
            
            /** Christmas specific **/
            "ClientOKSponsorReachOut": getFieldValue(fields, "ClientOKSponsorReachOut"),
            "ClientContactMethods": getFieldValue(fields, "ClientContactMethods"),
            "ClientFamilyMemberSignUpCount": getFieldValue(fields, "ClientFamilyMemberSignUpCount"),
        };

        // special matrix handling
        Object.assign(clientData, getMFieldValue(fields, "ClientContactDayTime"));

        // more Christmas specific
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
        
        post(clientData)
            .then((data) => {
                console.log(`submit response: ${data}`);
            })
            .catch((error) => {
                /** this is malpractice.... need to send an email or something **/
                console.error('Submit Failure', error);
                alert("There was an error during save. Please try again and if this message repeats, please contact Families4Families. We apologize for the error.");
            });
    }
    
    async function post(clientData) {
        const request = new Request(gEventSheet, {
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
