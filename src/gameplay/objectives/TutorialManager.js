export class TutorialManager {
  constructor(tasks = [], eventBus = null) {
    this.tasks = tasks;
    this.eventBus = eventBus;
    this.index = 0;
    this.completed = [];
  }

  get current() {
    return this.tasks[this.index] || null;
  }

  complete(task = this.current) {
    if (!task || task !== this.current) return false;
    this.completed.push(task);
    this.index++;
    this.eventBus?.emit("tutorial:advanced", {
      completed: task,
      current: this.current
    });
    return true;
  }

  serialize() {
    return { index: this.index, completed: this.completed };
  }

  hydrate(value = {}) {
    this.index = Number(value.index || 0);
    this.completed = value.completed || [];
  }
}
