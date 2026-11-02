/** Shared input state, written by keyboard listeners and on-screen touch buttons. */
export class Input {
  left = false;
  right = false;
  jumpHeld = false;
  private jumpQueued = false;

  pressJump() {
    if (!this.jumpHeld) this.jumpQueued = true;
    this.jumpHeld = true;
  }

  releaseJump() {
    this.jumpHeld = false;
  }

  /** True once per jump press. */
  consumeJump() {
    const queued = this.jumpQueued;
    this.jumpQueued = false;
    return queued;
  }

  reset() {
    this.left = this.right = this.jumpHeld = this.jumpQueued = false;
  }
}
