export class SAXEvent<T extends string>{
  type: T;
  constructor(type: T) {
    this.type = type;
  }
}
