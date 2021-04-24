import { ButtonComponent, DropdownComponent, Modal } from 'obsidian'
import JiraIssuePlugin from './main'

export default class TransitionModal extends Modal {
  plugin: JiraIssuePlugin;
  issueIdOrKey: string;

  constructor (plugin: JiraIssuePlugin, issueIdOrKey: string) {
    super(plugin.app)
    this.plugin = plugin
    this.issueIdOrKey = issueIdOrKey
  }

  async onOpen(): Promise<void> {
    this.contentEl.empty()
    this.contentEl.innerHTML = 'loading..'
    
    this.loadTransition()
  }

  async loadTransition(): Promise<void> {
    let transitions = []
    
    try {
      transitions = await this.plugin.jiraClient.getIssueTransitions(this.issueIdOrKey)  
    } catch (error) {
      this.contentEl.innerHTML = error.errorMessages ? error.errorMessages.join(' ') : error
      return
    }
    this.contentEl.empty()
    
    if (transitions.length === 0) {
      this.contentEl.createEl('h2', 'No available transitions found')
      return
    }

    this.contentEl.createEl('h2', {
      text: `Transition issue ${this.issueIdOrKey} to`,
      cls: ['jira-modal-title']
    })
    
    const dropdown = new DropdownComponent(this.contentEl)
    for (const transition of transitions) {
      dropdown.addOption(transition.id, transition.name)
    }

    const commandContainer = this.contentEl.createDiv({ cls: ['jira-modal-commands'] })

    new ButtonComponent(commandContainer)
      .setButtonText('transition')
      .onClick(() => {
        this.saveAndClose(dropdown.getValue())
      })
  }

  async saveAndClose(transitionId: string): Promise<void> {
    await this.plugin.jiraClient.transitionIssue(this.issueIdOrKey, transitionId)
    this.plugin.refreshData()
    this.close()
  }
}
