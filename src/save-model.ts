import { ButtonComponent, Modal } from "obsidian";
import { Timer } from "./lib/timer";
import JiraIssuePlugin from "./main";

export default class SaveModal extends Modal {
  plugin: JiraIssuePlugin;
  timer: Timer;

  constructor (plugin: JiraIssuePlugin, timer: Timer) {
    super(plugin.app)
    this.plugin = plugin
    this.timer = timer
  }

  onOpen(): void {
    this.contentEl.empty()
    
    const duration = this.timer.getFormattedDurationObject()
    this.contentEl.createSpan({
      text: `${duration.hours}h ${duration.minutes}m ${duration.seconds}s`
    })

    new ButtonComponent(this.contentEl)
      .setButtonText("save")
      .onClick(() => {
        this.saveAndClose()
      })
  }

  async saveAndClose(): Promise<void> {
    await this.plugin.jiraClient.createWorkLog(this.timer)

    this.timer.timerManager.deleteById(this.timer.id)
    this.close()
  }
}
