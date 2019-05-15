// addon title
var ADDON_TITLE = 'Mailchimp Integration';

// script constants
var PROTOCOL = 'https';
var ENDPOINT = 'api.mailchimp.com/';
var API_VER = '3.0';

// custom menu to show the add-on sidebar
function onOpen(e) {
	FormApp.getUi()
			.createAddonMenu()
			.addItem('Configure Mailchimp', 'showSidebar')
			.addToUi();
}

// run onOpen when add-on is installed
function onInstall(e) {
	onOpen(e);
}

// opens a sidebar to configure Mailchimp integration
function showSidebar() {
	var ui = HtmlService.createHtmlOutputFromFile('Sidebar')
			.setTitle('Configure Mailchimp');
	FormApp.getUi().showSidebar(ui);
}

// opens the help dialog explaining how to get Mailchimp Api Key and List ID
function showHelp() {
    var ui = HtmlService.createHtmlOutputFromFile('Help')
        .setWidth(420)
        .setHeight(320);
    FormApp.getUi().showModalDialog(ui, 'How to find your Audience ID and API Key');
}

// save settings to this form's properties & adjust form triggers
function saveSettings(settings) {
	PropertiesService.getDocumentProperties().setProperties(settings);
    adjustFormSubmitTrigger();
}

// gets a collection of property values used to fill the sidebar
function getSettings() {
	var settings = PropertiesService.getDocumentProperties().getProperties();
	
	// get a list of text field items in the form
	var form = FormApp.getActiveForm();
	var textItems = form.getItems(FormApp.ItemType.TEXT);
	
	settings.textItems = [];
	
	textItems.forEach(function(textItem) {
		settings.textItems.push({
			title: textItem.getTitle(),
			id: textItem.getId()
		});
	});
	return settings;
}

// adjust onFormSubmit trigger
function adjustFormSubmitTrigger() {
	var form = FormApp.getActiveForm();
	var triggers = ScriptApp.getUserTriggers(form);

	var existingTrigger = null;

	// check if there's already an existing onSubmit trigger
    for (var i = 0; i < triggers.length; i++) {
    	// onSubmit trigger exists
        if (triggers[i].getEventType() == ScriptApp.EventType.ON_FORM_SUBMIT) {
            existingTrigger = triggers[i];
            Logger.log('Existing onSubmit trigger found, no need to create one');
            break;
        }
    }

    // if no onSubmit trigger yet, create it
	if (!existingTrigger) {
        Logger.log('No onSubmit trigger found, creating one');
        var trigger = ScriptApp.newTrigger('onSubmit')
            .forForm(form)
            .onFormSubmit()
            .create();
	}
}

// process form response
function onSubmit(e) {

	// response from form submit event
	var response = e.response;

	// get current settings
	var settings = getSettings();

	Logger.log('response: ');
    Logger.log(response);

	// respondent email
	var email = response.getRespondentEmail();

    Logger.log('email: ' + email);

	// response items
	var items = response.getItemResponses();

    // object of parsed (key-value) response data
    var parsedData = {};

    Logger.log('Looping through response items');

    for (i in items){
        var key = items[i].getItem().getId();
        var val = items[i].getResponse();
        Logger.log(key + ': ' + val);
        parsedData[key] = val;
    }

    Logger.log('parsed data: ' + parsedData);

    var data = {
        "email_address" : email,
        "status" : "subscribed",
        "merge_fields" : {
            "FNAME" : parsedData[settings['firstName']],
            "LNAME" : parsedData[settings['lastName']],
            "PHONE" : parsedData[settings['phoneNumber']]
        }
    };

    Logger.log('data: ' + data);

    Logger.log('calling sendData()');
    // perform ajax request
    sendData(data, settings);
}

// sends data to Mailchimp API
function sendData(data, settings){

    // save endpoint in settings if not saved yet
    if (settings['endpoint'] == '') {
        Logger.log('endpoint is empty, building it');
        var endpoint  = PROTOCOL + '://' + settings['dataCenter'] + '.' + ENDPOINT + API_VER + '/';
        Logger.log('endpoint: ' + endpoint);
        settings['endpoint'] = endpoint;
        Logger.log('saving settings');
        saveSettings(settings);
    }

    // build url to make the request to
    var url = settings['endpoint'] + 'lists/' + settings['listId'] + '/members/';

    // username could be anything
    var username = 'forms';


    var auth = Utilities.base64Encode(username+':'+settings['apiKey'], Utilities.Charset.UTF_8);
    var option = {
        headers: {
            'Authorization' : 'Basic ' + auth,
            'contentType' : 'application/json',
        },
        'method' : 'post',
        'payload' : JSON.stringify(data)
    };

    Logger.log('About to perform a '+ option.headers['method'] + ' request to ' + url);

    // perform request
    var response = UrlFetchApp.fetch(url, option);
    response2 = JSON.parse(response);

    Logger.log('Request complete');

    // Logger.log('Logging response: ' + response.getContentText());
}