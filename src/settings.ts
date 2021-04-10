export default interface JiraIssuePluginSettings {
	email: string;
	token: string;
	host: string;
}

export const DEFAULT_SETTINGS: JiraIssuePluginSettings = {
	email: '',
	token: '',
	host: '',
}
