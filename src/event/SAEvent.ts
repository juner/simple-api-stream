/**
 * Simple API Event Base class
 */
export class SAEvent<T extends string> {
  name: T;
  constructor(name: T) {
    this.name = name;
  }
}
