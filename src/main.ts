import * as os from 'os'
import { Plugin } from 'obsidian'
import JiraClient from './lib/jira'
import JiraIssuePluginSettings, { DEFAULT_SETTINGS } from './settings'
import JiraIssueSettingTab from './settings-tab'
import IssueWidget from './issue-widget'

export default class JiraIssuePlugin extends Plugin {
	settings: JiraIssuePluginSettings
	jiraClient: JiraClient
	issuesWidgets: IssueWidget[]

	async onload(): Promise<void> {
		await this.loadSettings()
		this.addSettingTab(new JiraIssueSettingTab(this.app, this))
		
		this.registerMarkdownCodeBlockProcessor('jira', this.issueBlockProcessor.bind(this))

		this.initJiraClient()
	}

	initJiraClient(): void {
		this.jiraClient = new JiraClient(this.settings)
	}

	async issueBlockProcessor(content: string, el: HTMLElement): Promise<void> {
		el.empty()

		const container = el.createDiv()
		container.addClass('jira-issues-grid')

		const issues = content.split(os.EOL).filter(key => key.trim().length > 0)
		for (const key of issues) {
			const issueWidgetContainer = container.createDiv()
			issueWidgetContainer.addClass('jira-issue-grid-item')
			
			const issueWidget = issueWidgetContainer.createDiv()
			issueWidget.addClass('jira-issue')
			issueWidget.addClass('timer-tracker-compatible')

			new IssueWidget(this, issueWidget)
				.setIssueIdentifier(key)
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings)

		this.initJiraClient()
	}
}
