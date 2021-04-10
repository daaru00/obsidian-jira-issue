import { App, PluginSettingTab, Setting } from 'obsidian'
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
			.setName('Jira Host')
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
		
		let apiTokenInput: HTMLInputElement
		new Setting(containerEl)
			.setName('API Token')
			.setDesc('The API token generated from Atlassian account')
			.addText(text => {
				apiTokenInput = text.inputEl
				apiTokenInput.type = 'password'
				text.setValue(this.plugin.settings.token)
					.setPlaceholder("xxxxxxxxxxxxxxxxxxxxx")
					.onChange(async (value) => {
						this.plugin.settings.token = value;
						await this.plugin.saveSettings();
					})
			})
			.addExtraButton(button => button
				.onClick(() => {
					if (apiTokenInput.type === 'text') {
						apiTokenInput.type = 'password'
					} else {
						apiTokenInput.type = 'text'
					}
				}))
	}
}
