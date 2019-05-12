/* addon title */
var ADDON_TITLE = 'Mailchimp Integration';

/* custom menu to show the addon sidebar */
function onOpen(e) {
	FormApp.getUi()
			.createAddonMenu()
			.addItem('Configure Mailchimp', 'showSidebar')
			.addToUi();
}

/* run onOpen when addon is installed */
function onInstall(e) {
	onOpen(e);
}

/* opens a sidebar to configure Mailchimp integration */
function showSidebar() {
	var ui = HtmlService.createHtmlOutputFromFile('Sidebar')
			.setTitle('Configure Mailchimp');
	FormApp.getUi().showSidebar(ui);
}

/* opens the help dialog explaining how to get Mailchimp Api Key and List ID */
function showHelp() {
    var ui = HtmlService.createHtmlOutputFromFile('Help')
        .setWidth(420)
        .setHeight(320);
    FormApp.getUi().showModalDialog(ui, 'How to find your Audience ID and API Key');
}

/* save settings to this form's properties */
function saveSettings(settings) {
	PropertiesService.getDocumentProperties().setProperties(settings);
}

/* gets a collection of property values used to fill the sidebar */
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