import JiraIssuePlugin from './main'
import {JiraIssue} from './lib/jira'
import { ButtonComponent } from 'obsidian';

export default class IssueWidget {
  el: HTMLElement;
  plugin: JiraIssuePlugin;
  jiraIssueKey: string;
  issue: JiraIssue;
  timerControlContainer: HTMLDivElement;

  constructor(plugin: JiraIssuePlugin, el: HTMLElement) {
    this.plugin = plugin
    this.el = el
    this.plugin.timeManager.on('timer-start', this.showTimerControl.bind(this))
    this.plugin.timeManager.on('timer-paused', this.showTimerControl.bind(this))
    this.plugin.timeManager.on('timer-resumed', this.showTimerControl.bind(this))
    this.plugin.timeManager.on('timer-reset', this.showTimerControl.bind(this))
  }

  getIssueIdentifier(): string {
    return this.jiraIssueKey
  }

  setIssueIdentifier(jiraIssueKey: string): IssueWidget {
    this.el.empty()
    this.el.innerHTML = 'loading..'

    this.jiraIssueKey = jiraIssueKey
    this.loadIssue()

    return this
  }

  async loadIssue(): Promise<void> {
    try {
      this.issue = await this.plugin.jiraClient.getIssueDetails(this.jiraIssueKey)
    } catch (error) {
      this.el.innerHTML = error.toString()
      return
    }

    this.el.empty()
    this.showIssueDetails()
    this.showTimeStats()
    this.showTimerControl()

    //await this.loadTimeSpent()
  }

  showIssueDetails(): void {
    this.el.createSpan({
      text: `${this.issue.summary}`
    })

    const subheader = this.el.createDiv({ cls: ['jira-issue-details'] })
    subheader.createSpan({
      text: `${this.issue.key}`
    })
    subheader.createSpan({
      text: '\u2022'
    })
    subheader.createSpan({
      text: `${this.issue.project.name}`
    })
  }

  showTimeStats(): void {
    const container = this.el.createDiv({ cls: ['jira-issue-time-bar-container'] })
    const { originalEstimateSeconds, timeSpentSeconds } = this.issue.timeTracking
    const percentage = originalEstimateSeconds / (100 * timeSpentSeconds)

    const bar = container.createDiv({ cls: ['jira-issue-time-bar'] })
    bar.style.width = Math.ceil(percentage) + '%'
  }

  showTimerControl(): void {
    if (!this.timerControlContainer) {
      this.timerControlContainer = this.el.createDiv({ cls: ['jira-issue-timer-control'] })
    } else {
      this.timerControlContainer.empty()
    }

    const timer = this.plugin.timeManager.getById(this.jiraIssueKey)
    if (!timer) {
      new ButtonComponent(this.timerControlContainer)
        .setButtonText("start")
        .onClick(() => {
          const timer = this.plugin.timeManager.createNew(this.jiraIssueKey)
          timer.start()
          this.showTimerControl()
        })
    } else {
      if (timer.isRunning) {
        new ButtonComponent(this.timerControlContainer)
          .setButtonText("pause")
          .onClick(() => {
            timer.pause()
            this.showTimerControl()
          })
      } else {
        new ButtonComponent(this.timerControlContainer)
          .setButtonText("resume")
          .onClick(() => {
            timer.resume()
            this.showTimerControl()
          })
      }
      new ButtonComponent(this.timerControlContainer)
        .setButtonText("reset")
        .onClick(() => {
          timer.reset()
          this.showTimerControl()
        })
    }
  }

  async loadTimeSpent(): Promise<void> {
    const worklogs = await this.plugin.jiraClient.getIssueWorkLogs(this.issue.id)
    const list = this.el.createEl('ul')

    for (const worklog of worklogs) {
      list.createEl('li', {
        text: worklog.timeSpent
      })
    }
  }
}
