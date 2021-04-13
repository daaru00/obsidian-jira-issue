import * as os from 'os'
import { Plugin } from 'obsidian'
import JiraClient from './lib/jira'
import JiraIssuePluginSettings, { DEFAULT_SETTINGS } from './settings'
import JiraIssueSettingTab from './settings-tab'
import IssueWidget from './issue-widget'

interface OnTimerSaveEvent {
	detail: {
		id: string
	}
}

export default class JiraIssuePlugin extends Plugin {
	settings: JiraIssuePluginSettings
	jiraClient: JiraClient
	issuesWidgets: IssueWidget[]

	async onload(): Promise<void> {
		await this.loadSettings()
		this.addSettingTab(new JiraIssueSettingTab(this.app, this))
		
		this.registerMarkdownCodeBlockProcessor('jira', this.issueBlockProcessor.bind(this))

		this.initJiraClient()

		this.addCommand({
			id: 'app:refresh-jira-issues',
			name: 'Refresh Jira issues',
			callback: () => {
				document.querySelectorAll('.jira-issue').forEach(issue => issue.dispatchEvent(new CustomEvent('refresh')))
			},
			hotkeys: []
		})
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

			issueWidget.addEventListener('timersave', this.onSaveTimer.bind(this))

			new IssueWidget(this, issueWidget)
				.setIssueIdentifier(key)
		}
	}

	async onSaveTimer(event: OnTimerSaveEvent): Promise<void> {
		const timerElement = window.document.querySelector('.timer-control-container[data-identifier="'+event.detail.id+'"]')
		if (!timerElement) {
			return
		}

		timerElement.dispatchEvent(new CustomEvent('timersaved', event))
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings)

		this.initJiraClient()
	}
}
