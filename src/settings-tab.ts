import { App, Notice, PluginSettingTab, Setting } from 'obsidian'
import JiraIssuePlugin from './main'

export default class JiraIssueSettingTab extends PluginSettingTab {
	plugin: JiraIssuePlugin;

	constructor(app: App, plugin: JiraIssuePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async display(): Promise<void> {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Jira host')
			.setDesc('The domain host of Jira instance')
			.addText(text => text
				.setValue(this.plugin.settings.host)
				.setPlaceholder("my-host.atlassian.net")
				.onChange(async (value) => {
					this.plugin.settings.host = value;
					await this.plugin.saveSettings();
				}));

    new Setting(containerEl)
      .setName('Email')
      .setDesc('The email used to log in to Jira')
      .addText(text => text
				.setValue(this.plugin.settings.email)
				.setPlaceholder("user@email.com")
				.onChange(async (value) => {
					this.plugin.settings.email = value;
					await this.plugin.saveSettings();
				}));
		
		new Setting(containerEl)
			.setName('API token')
			.setDesc('The API token generated from Atlassian account')
			.addText(text => {
				text.inputEl.type = 'password'
				text.setValue(this.plugin.settings.token)
					.setPlaceholder("xxxxxxxxxxxxxxxxxxxxx")
					.onChange(async (value) => {
						this.plugin.settings.token = value;
						await this.plugin.saveSettings();
					})
			})

		new Setting(containerEl)
			.setName('Test credentials')
			.setDesc('Retrieve current logged user')
			.addButton(button => button
				.setButtonText("test")
				.onClick(() => {
					button.setDisabled(true)
					this.plugin.jiraClient.getUser()
					.then(user => {
						new Notice(`Successfully logged in as ${user.displayName}`)
					})
					.catch(error => {
						new Notice(`Error: ${error}`)
					})
					.finally(() => {
						button.setDisabled(false)
					})
				}))
	}
}
