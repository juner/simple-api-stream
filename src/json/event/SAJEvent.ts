export class SAJEvent<T extends string> {
  name: T;
  constructor(name: T) {
    this.name = name;
  }
}
