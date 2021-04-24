import JiraIssuePlugin from './main'
import {JiraIssue} from './lib/jira'
import TransitionModal from './transition-modal'
import * as path from 'path'

export default class IssueWidget {
  el: HTMLElement;
  plugin: JiraIssuePlugin;
  jiraIssueKey: string;
  issue: JiraIssue;
  timerControlContainer: HTMLDivElement;
  issueTransitions: import('/home/fabio/Obsidian/Bitbull/.obsidian/plugins/obsidian-jira-issue/src/lib/jira').JiraIssueTransitions[];
  transitionControlContainer: HTMLDivElement;

  constructor(plugin: JiraIssuePlugin, el: HTMLElement) {
    this.plugin = plugin
    this.el = el
    this.el.addEventListener('refresh', this.loadIssue.bind(this))
    this.el.addClass('loading')
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
      this.el.innerHTML = error.errorMessages ? error.errorMessages.join(' ') : error 
      this.el.addClass('in-error')
      return
    } finally {
      this.el.removeClass('loading')
    }
    this.el.removeClass('in-error')

    this.el.empty()
    this.showIssueDetails()
    this.showTimeStats()

    await this.loadIssueTransitions()
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

    if (this.issue.status) {
      subheader.createSpan({
        text: `${this.issue.status}`,
        cls: ['jira-issue-details-action']
      }).onclick = this.openTransitionModal.bind(this)
    }

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
    const timeBar = container.createDiv({ cls: ['jira-issue-time-bar'] })

    const { originalEstimateSeconds, timeSpentSeconds, remainingEstimateSeconds } = this.issue.timeTracking
    
    let percentage = 0 
    if (!remainingEstimateSeconds && originalEstimateSeconds) {
      percentage = Math.ceil((timeSpentSeconds || 0) / originalEstimateSeconds * 100)
    } else if (remainingEstimateSeconds === 0) {
      percentage = 100
    } else if (timeSpentSeconds && remainingEstimateSeconds) {
      percentage = Math.ceil(timeSpentSeconds / (timeSpentSeconds + remainingEstimateSeconds) * 100)
    }

    if (percentage <= 100) {
      timeBar.style.width = percentage + '%'
    } else {
      timeBar.style.width = '100%'

      const timeBarOverflow = timeBar.createDiv({ cls: ['jira-issue-time-bar-overflow'] })
      timeBarOverflow.style.width = (percentage - 100) + '%'
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
  }

  openTransitionModal(): void {
    if (!this.issue) {
      return
    }
    
    new TransitionModal(this.plugin, this.jiraIssueKey).open()
  }
}
