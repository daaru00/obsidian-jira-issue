import * as os from 'os'
import { Plugin } from 'obsidian'
import JiraClient from './lib/jira'
import JiraIssuePluginSettings, { DEFAULT_SETTINGS } from './settings'
import JiraIssueSettingTab from './settings-tab'
import IssueWidget from './issue-widget'
import WorkLogSaveModal from './worklog-save-modal'
import { OnTimerSaveEvent } from './types'

const EVENT_BUS_NAME = 'jira-event-bus'

declare global {
	interface Window {
		jiraEventBus: Comment; 
		timeTrackerEventBus: Comment; 
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
			callback: this.refreshData.bind(this),
			hotkeys: []
		})
	}

	initJiraClient(): void {
		this.jiraClient = new JiraClient(this.settings)
		this.refreshData()

		window.jiraEventBus = document.createComment(EVENT_BUS_NAME)
		window.jiraEventBus.addEventListener('timersave', this.onSaveTimer.bind(this))
	}

	refreshData(): void {
		document.querySelectorAll('.jira-issue').forEach(issue => issue.dispatchEvent(new CustomEvent('refresh')))
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
			issueWidget.dataset.identifier = key
			issueWidget.dataset.type = 'jira'

			new IssueWidget(this, issueWidget)
				.setIssueIdentifier(key)
		}
	}

	async onSaveTimer(event: OnTimerSaveEvent): Promise<void> {
		new WorkLogSaveModal(this, event).open()
	}

	onTimerSaved(event: OnTimerSaveEvent): void {
		if (window.timeTrackerEventBus) {
			window.timeTrackerEventBus.dispatchEvent(new CustomEvent('timersaved', event))
		}
		
		this.refreshData()
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings)

		this.initJiraClient()
	}

	onunload(): void {
		delete window.jiraEventBus
	}
}
