<script type="text/javascript">

/** todo: read the sheet tab name (or the event name & year) from the form **/
const eventName = 'Thanksgiving';
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
    const emailInput = document.querySelector("input[aria-label='ClientEmail']");
    if (!emailInput) {
        console.error("could not find client email input");
        // don't abort, F4FNumber can be entered after the fact
    }
    emailInput.addEventListener("change", (event) => {
        onEmailAddressEntered(emailInput.value);
    });

    window.addEventListener('Tally.FormSubmitted', (payload) => onSubmit(payload));
})

function onEmailAddressEntered(emailAddress) {
    let f4fNumber = lookupF4FNumber(emailAddress);
    // poke into hidden field
}

async function lookupF4FNumber(emailAddress) {
    if (emailAddress === "undefined" || !emailAddress) {
        return "";
    }
    let email = emailAddress;
    email = email.trim();

    const clientFamilyMasterTab = "/tabs/ClientFamilyMaster";
    const searchCriteria = `/ClientEmail/${email}`;
    const url = `${f4fSheet}${clientFamilyMasterTab}${searchCriteria}`;

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
        
        /** thanksgiving specific **/
        "ClientAdultCount": getFieldValue(fields, "ClientAdultCount"),
        "ClientChildAges": getFieldValue(fields, "ClientChildAges"),
        "ClientDietaryRestrictions": getFieldValue(fields, "ClientDietaryRestrictions"),
        "ClientSpecialRequests": getFieldValue(fields, "ClientSpecialRequests"),
    };
    
    post(clientData)
        .then((data) => {
            console.log(`submit response: ${data}`);
        })
        .catch((error) => 
            /** this is malpractice.... need to send an email or something **/
            console.error('Submit Failure', error)
        );
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

function getFieldValues(fields, label) {
    let filtered = fields.filter((field) => 
                field.title === label 
                && (field.answer.value != null && field.answer.value != "undefined" && field.answer.value != ""));
    let values = filtered.map((field) => { 
        let val = field.answer.value;
        if (typeof val === "string") {
            val = val.trim();
        }
        return val;
    });
    return values.join(",");
}

</script>
