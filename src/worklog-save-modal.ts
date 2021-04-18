import { ButtonComponent, Modal, Setting } from 'obsidian'
import { JiraIssue } from './lib/jira'
import JiraIssuePlugin from './main'
import { OnTimerSaveEvent } from './types'

export default class TrackingSaveModal extends Modal {
  plugin: JiraIssuePlugin
  event: OnTimerSaveEvent;

	constructor(plugin: JiraIssuePlugin, event: OnTimerSaveEvent) {
		super(plugin.app)
    this.plugin = plugin
    this.event = event
	}

  async onOpen(): Promise<void> {
    this.contentEl.empty()
    this.contentEl.createSpan({
      text: 'Loading..',
      cls: ['jira-modal-loading']
    })

    let issue: JiraIssue
    try {
      issue = await this.plugin.jiraClient.getIssueDetails(this.event.detail.id)
    } catch (error) {
      this.contentEl.empty()
      this.contentEl.createEl('h2', {
        text: error.toString()
      }).addClass('in-error')
      return  
    }
    
    this.contentEl.empty()
    this.contentEl.createEl('h2', {
      text: `${issue.id} ${issue.summary}`,
      cls: ['jira-modal-title']
    })
    this.contentEl.createEl('p', {
      text: `The original estimate for this issue was ${issue.timeTracking.originalEstimate}.`
    })

    let seconds = this.event.detail.duration
    const parts = (new Date(seconds * 1000)).toISOString().substr(11, 8).split(':')
    const hours = parseInt(parts[0])
    const minutes = parseInt(parts[1])
    seconds = parseInt(parts[2])

    let duration = ''
    if (hours > 0) {
      duration += `${hours}h`
    }
    if (minutes > 0) {
      if (duration.length > 0) {
        duration += ''
      }
      duration += `${minutes}m`
    }

    new Setting(this.contentEl)
      .setName('Time spent')
      .addText(text => text
        .setValue(duration)
        .setPlaceholder('6h 45m')
        .onChange(async (value) => {
          duration = value
        }))

    let timeRemaining = ''

    new Setting(this.contentEl)
      .setName('Time remaining')
      .addText(text => text
        .setValue(timeRemaining)
        .setPlaceholder('0m')
        .onChange(async (value) => {
          timeRemaining = value
        }))

    let comment = ''

    new Setting(this.contentEl)
      .setName('Work description')
      .addTextArea(textArea => textArea
        .setValue(comment)
        .onChange(async (value) => {
          comment = value
        }))

    const commandContainer = this.contentEl.createDiv({ cls: ['jira-modal-commands'] })

    const btnSave = new ButtonComponent(commandContainer)
      .setButtonText('save')
      .onClick(() => {
        if (parseFloat(duration) <= 0) {
          return
        }

        btnSave.setDisabled(true)
        this.save(duration, timeRemaining, comment).finally(() => {
          btnSave.setDisabled(false)
        }).then(() => {
          this.close()
        }).catch(error => {
          console.error(error)
        })
      })
  }

  async save(duration: string, timeRemaining: string, comment: string): Promise<void> {
    await this.plugin.jiraClient.saveIssueWorkLog(this.event.detail.id, duration, this.event.detail.startedAt, timeRemaining, comment)
    this.plugin.onTimerSaved(this.event)
  }
}
