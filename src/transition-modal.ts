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
    
    const transitions = await this.plugin.jiraClient.getIssueTransitions(this.issueIdOrKey)
    if (transitions.length === 0) {
      this.contentEl.createEl('h2', 'No available transitions found')
      return
    }
    
    const dropdown = new DropdownComponent(this.contentEl)
    for (const transition of transitions) {
      dropdown.addOption(transition.id, transition.name)
    }

    const commandContainer = this.contentEl.createDiv({ cls: ['jira-modal-commands'] })

    new ButtonComponent(commandContainer)
      .setButtonText('change')
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
