export class UndoableString {
  private initialValue: string
  private value: string
  private history: string[]
  private future: string[]

  constructor(initialValue: string = '') {
    this.value = initialValue
    this.initialValue = initialValue
    this.history = []
    this.future = []
  }

  public getInitialValue(): string {
    return this.initialValue
  }

  // Get the current value of the string
  public getValue(): string {
    return this.value
  }

  public getHistory(): string[] {
    return this.history
  }

  // Update the value and save the current state to the history
  public setValue(newValue: string): void {
    this.history.push(this.value) // Save current value to history
    this.value = newValue
    this.future = [] // Clear future states
  }

  // Undo the last operation
  public undo(): void {
    if (this.history.length > 0) {
      this.future.push(this.value) // Save current value to future
      this.value = this.history.pop()! // Restore the last value
    }
    else {
      console.warn('Undo not available')
    }
  }

  // Redo the last undone operation
  public redo(): void {
    if (this.future.length > 0) {
      this.history.push(this.value) // Save current value to history
      this.value = this.future.pop()! // Restore the last undone value
    }
    else {
      console.warn('Redo not available')
    }
  }
}
