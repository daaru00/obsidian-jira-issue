import JiraIssuePlugin from './main'
import {JiraIssue} from './lib/jira'
import { ButtonComponent } from 'obsidian'
import TransitionModal from './transition-modal'
import * as path from 'path'

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
    this.el.addEventListener('refresh', this.loadIssue.bind(this))
  }

  getIssueIdentifier(): string {
    return this.jiraIssueKey
  }

  setIssueIdentifier(jiraIssueKey: string): IssueWidget {
    this.el.dataset.identifier = jiraIssueKey

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

    //await this.loadIssueTransitions()
  }

  showIssueDetails(): void {
    if (!this.issue) {
      return
    }

    this.el.createDiv({
      text: `${this.issue.summary}`,
      cls: ['jira-issue-title']
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
    subheader.createEl('a', {
      attr: {
        rel: 'noopener',
        target: '_blank',
        href: path.join('https://'+this.plugin.settings.host, 'browse', this.issue.key),
      },
      cls: ['external-link']
    })
  }

  showTimeStats(): void {
    const container = this.el.createDiv({ cls: ['jira-issue-time-bar-container'] })
    const bar = container.createDiv({ cls: ['jira-issue-time-bar'] })

    const { originalEstimateSeconds, timeSpentSeconds } = this.issue.timeTracking
    if (!originalEstimateSeconds || !timeSpentSeconds) {
      return
    }

    const percentage = timeSpentSeconds / originalEstimateSeconds * 100
    bar.style.width = Math.ceil(percentage) + '%'
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
}
