import * as os from 'os'
import { Plugin, WorkspaceLeaf } from 'obsidian'
import JiraClient from './lib/jira'
import JiraIssuePluginSettings, { DEFAULT_SETTINGS } from './settings'
import JiraIssueSettingTab from './settings-tab'
import IssueWidget from './issue-widget'
import TimerManager from './lib/timer'
import TimerView, { VIEW_TYPE_OUTPUT } from './timer-view'
import SaveModal from './save-modal'

export default class JiraIssuePlugin extends Plugin {
	settings: JiraIssuePluginSettings
	jiraClient: JiraClient
	issuesWidgets: IssueWidget[]
	timeManager: TimerManager
	timerView: TimerView

	async onload(): Promise<void> {
		await this.loadSettings()
		this.addSettingTab(new JiraIssueSettingTab(this.app, this))
		
		this.registerMarkdownCodeBlockProcessor('jira', this.issueBlockProcessor.bind(this))

		this.initTimerManager()
		this.initJiraClient()

		this.registerView(
			VIEW_TYPE_OUTPUT,
			(leaf: WorkspaceLeaf) => {
				this.timerView = new TimerView(leaf, this)
				return this.timerView
			}
		)

		this.addCommand({
			id: 'app:show-jira-timers',
			name: 'Show Jira timers',
			callback: () => this.initLeaf(),
			hotkeys: []
		});
	}

	initLeaf(): void {
		const { workspace } = this.app

		if (workspace.getLeavesOfType(VIEW_TYPE_OUTPUT).length > 0) {
			return
		}

		const leaf = workspace.getRightLeaf(false)
		if (!leaf) {
			return
		}

		leaf.setViewState({
			type: VIEW_TYPE_OUTPUT,
			active: true
		});
	}

	initTimerManager(): void {
		this.timeManager = new TimerManager()
		this.timeManager.on('timer-save', (event) => {
			new SaveModal(this, event.timer).open()
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
