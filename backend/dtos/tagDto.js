export class TagDto {
  constructor(model) {
    this.id = model.id;
    this.authorId = model.authorId;
    this.title = model.title;
  }
}
