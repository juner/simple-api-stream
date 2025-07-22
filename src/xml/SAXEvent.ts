export class SAXEvent<T extends string> {
  name: T;
  constructor(name: T) {
    this.name = name;
  }
}
