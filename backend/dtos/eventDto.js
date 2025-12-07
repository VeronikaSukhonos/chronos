export class EventDto {
  constructor(model, forOneEvent) {
    this.id = model.id;
    this.author = model.author;
    this.calendarId = model.calendarId;
    this.name = model.name;
    this.description = model.description;
    this.color = model.color;
    if (model.repeat)
      this.repeat = { frequency: model.repeat.frequency, parameter: model.repeat.parameter };
    if (model.tags)
      this.tags = model.tags.map(tag => forOneEvent? { id: tag.id, title: tag.title }:tag.title);
    else
      this.tags = [];
    this.createDate = model.createDate;
    this.type = model.type;
    this.visibleForAll = model.visibleForAll;
    this.startDate = model.startDate;
    this.endDate = model.endDate;
    if (this.type == 'arrangement')
      this.link = model.link;
    else if (this.type == 'task')
      this.doneDate = model.doneDate;
    this.allDay = model.allDay;
  }
}
