export class CalendarDto {
  constructor(model) {
    this.id = model.id;
    this.authorId = model.authorId;
    this.participants = model.participants;
    this.followers = model.followers;
    this.name = model.name;
    this.description = model.description;
    this.color = model.color;
    this.isHidden = model.isHidden;
    this.isPublic = model.isPublic;
    this.type = model.type;
  }
}
