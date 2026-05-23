export interface Command {
  execute: () => void;
  undo: () => void;
}

export class CommandHistory {
  private history: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistory: number;

  constructor(maxHistory: number = 10) {
    this.maxHistory = maxHistory;
  }

  execute(command: Command) {
    command.execute();
    this.history.push(command);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.redoStack = []; // Clear redo stack on new action
  }

  undo() {
    if (this.history.length > 0) {
      const command = this.history.pop()!;
      command.undo();
      this.redoStack.push(command);
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const command = this.redoStack.pop()!;
      command.execute();
      this.history.push(command);
    }
  }

  get canUndo() {
    return this.history.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }
}
