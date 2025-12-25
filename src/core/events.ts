/**
 * A lightweight, native TypeScript event emitter to replace jQuery's $.Callbacks().
 * 
 * Usage:
 *   var emitter = new Callbacks();
 *   emitter.add(function(a, b) { console.log(a, b); });
 *   emitter.fire("hello", 42);
 */

module BP3D.Core {

  /**
   * A callback manager that replaces jQuery's $.Callbacks().
   * Supports adding, removing, and firing callbacks.
   */
  export class Callbacks {

    /** The list of registered callback functions */
    private callbacks: Function[] = [];

    /**
     * Register a callback function to be invoked when fire() is called.
     * @param callback The function to add
     * @returns this for chaining
     */
    public add(callback: Function): Callbacks {
      if (callback && typeof callback === 'function') {
        // Avoid adding duplicates
        if (this.callbacks.indexOf(callback) === -1) {
          this.callbacks.push(callback);
        }
      }
      return this;
    }

    /**
     * Remove a previously registered callback function.
     * @param callback The function to remove
     * @returns this for chaining
     */
    public remove(callback: Function): Callbacks {
      var index = this.callbacks.indexOf(callback);
      if (index !== -1) {
        this.callbacks.splice(index, 1);
      }
      return this;
    }

    /**
     * Invoke all registered callbacks with the provided arguments.
     * @param args Arguments to pass to each callback
     */
    public fire(...args: any[]): void {
      // Create a copy to allow modifications during iteration
      var callbacksCopy = this.callbacks.slice();
      for (var i = 0; i < callbacksCopy.length; i++) {
        try {
          callbacksCopy[i].apply(null, args);
        } catch (e) {
          console.error('Error in callback:', e);
        }
      }
    }

    /**
     * Check if a callback is registered.
     * @param callback The function to check
     * @returns true if the callback is registered
     */
    public has(callback: Function): boolean {
      return this.callbacks.indexOf(callback) !== -1;
    }

    /**
     * Remove all registered callbacks.
     * @returns this for chaining
     */
    public empty(): Callbacks {
      this.callbacks = [];
      return this;
    }

    /**
     * Get the number of registered callbacks.
     * @returns The count of callbacks
     */
    public count(): number {
      return this.callbacks.length;
    }
  }
}
