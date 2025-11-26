export class EventDto {
  constructor(model) {
    this.id = model.id;
    this.authorId = model.authorId;
    this.calendarId = model.calendarId;
    this.name = model.name;
    this.description = model.description;
    this.color = model.color;
    this.repeat = model.repeat;
    this.createDate = model.createDate;
    this.type = model.type;
    this.startDate = model.startDate;
    if (this.type == 'arrangement') {
      this.endDate = model.endDate;
      this.link = model.link;
    } else if (this.type == 'task')
      this.doneDate = model.doneDate;
  }
}
