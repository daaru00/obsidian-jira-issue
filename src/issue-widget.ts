import JiraIssuePlugin from './main'
import {JiraIssue} from './lib/jira'
import { ButtonComponent } from 'obsidian'
import TransitionModal from './transition-modal';

export default class IssueWidget {
  el: HTMLElement;
  plugin: JiraIssuePlugin;
  jiraIssueKey: string;
  issue: JiraIssue;
  timerControlContainer: HTMLDivElement;
  issueTransitions: import("/home/fabio/Obsidian/Bitbull/.obsidian/plugins/obsidian-jira-issue/src/lib/jira").JiraIssueTransitions[];
  transitionControlContainer: HTMLDivElement;

  constructor(plugin: JiraIssuePlugin, el: HTMLElement) {
    this.plugin = plugin
    this.el = el
    this.plugin.timeManager.on('timer-start', this.showTimerControl.bind(this))
    this.plugin.timeManager.on('timer-paused', this.showTimerControl.bind(this))
    this.plugin.timeManager.on('timer-resumed', this.showTimerControl.bind(this))
    this.plugin.timeManager.on('timer-reset', this.showTimerControl.bind(this))
    this.plugin.timeManager.on('timer-deleted', this.showTimerControl.bind(this))
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
    } catch ({ errorMessages }) {
      this.el.innerHTML = errorMessages.join(' ')
      this.el.addClass('in-error')
      return
    }

    this.el.empty()
    this.showIssueDetails()
    this.showTimeStats()

    await this.loadIssueTransitions()

    this.showTimerControl()

    //await this.loadTimeSpent()
  }

  showIssueDetails(): void {
    if (!this.issue) {
      return
    }

    this.el.createSpan({
      text: `${this.issue.summary}`
    })

    const subheader = this.el.createDiv({ cls: ['jira-issue-details'] })
    subheader.createSpan({
      text: `${this.issue.key}`
    })
    subheader.createSpan({
      text: `${this.issue.project.name}`
    })
    subheader.createSpan({
      text: `${this.issue.status}`
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
    if (!this.issue) {
      return
    }
    
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
        })
    } else {
      if (timer.isRunning) {
        new ButtonComponent(this.timerControlContainer)
          .setButtonText("pause")
          .onClick(() => {
            timer.pause()
          })
      } else {
        new ButtonComponent(this.timerControlContainer)
          .setButtonText("resume")
          .onClick(() => {
            timer.resume()
          })
      }
      new ButtonComponent(this.timerControlContainer)
        .setButtonText("reset")
        .onClick(() => {
          timer.reset()
        })
      new ButtonComponent(this.timerControlContainer)
        .setButtonText("save")
        .onClick(() => {
          timer.save()
        })
    }
  }

  async loadIssueTransitions(): Promise<void> {
    try {
      this.issueTransitions = await this.plugin.jiraClient.getIssueTransitions(this.jiraIssueKey)
    } catch ({ errorMessages }) {
      return
    }

    if (this.issueTransitions.length === 0) {
      return
    }

    this.showTransitionControl()
  }

  showTransitionControl(): void {
    if (!this.issue) {
      return
    }
    
    if (!this.transitionControlContainer) {
      this.transitionControlContainer = this.el.createDiv({ cls: ['jira-issue-transition-control'] })
    } else {
      this.transitionControlContainer.empty()
    }

    new ButtonComponent(this.transitionControlContainer)
      .setButtonText("change status")
      .onClick(() => {
        const modal = new TransitionModal(this.plugin, this.jiraIssueKey)
        modal.open()
      })
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
