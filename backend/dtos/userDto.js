export class UserDto {
  constructor(model) {
    this.id = model.id;
    this.login = model.login;
    this.email = model.email;
    this.fullName = model.fullName;
    this.dob = model.dob;
    this.avatar = model.avatar;
  }
}
