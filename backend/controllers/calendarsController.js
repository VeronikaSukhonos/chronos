import mongoose from 'mongoose';
import Calendar from '../models/calendarModel.js';
import User from '../models/userModel.js';
import Event from '../models/eventModel.js';
import { CalendarDto } from '../dtos/calendarDto.js';
import { EventDto } from '../dtos/eventDto.js';
import { sendCalendarParticipation } from '../utils/emailUtil.js';
class Calendars {
  async getAll(req, res) {
    try {
      const calendars = await Calendar.find(req.query.hidden
                                            && req.query.hidden
                                                  .toLowerCase() == "true"
                                            ? {
                                              authorId: req.user._id,
                                              isHidden: true
                                            }
                                            : {
                                              $or: [
                                                { authorId: req.user._id },
                                                {
                                                  participants: {
                                                    $in: [req.user._id]
                                                  }
                                                },
                                                {
                                                  followers: {
                                                    $in: [req.user._id]
                                                  }
                                                }
                                              ],
                                              isHidden: false
                                            }).select("id name color");
      return res.status(200).json({
        message: 'Getting calendars successfully',
        data: {
          calendars: calendars.map(calendar => new CalendarDto(calendar))
        }
      });
    } catch (err) {
      err.message = `Getting calendars failed: ${err.message}`;
      throw err;
    }
  }
  async getOne(req, res) {
    try {
      const calendar = await Calendar.findOne({
        _id: req.params.calendarId
      });
      if (!calendar)
        return res.status(404).json({
          message: "The calendar is not found"
        });
      let hasAccess = false;
      console.log(calendar.authorId.toString() === req.user._id.toString());
      if (calendar.authorId.toString() === req.user._id.toString()
          || calendar.followers.includes(req.user._id))
        hasAccess = true;
      else {
        for (let i of calendar.participants) {
          if (i.participantId.toString() === req.user._id.toString() && i.isConfirmed === true) {
            hasAccess = true;
            break;
          }
        }
      }
      if (hasAccess)
        return res.status(200).json({
          message: 'Getting calendar successfully',
          data: { calendar: new CalendarDto(calendar) }
        });
      else
        return res.status(403).json({
          message: "You do not have access to the calendar"
        });
    } catch (err) {
      err.message = `Getting calendar failed: ${err.message}`;
      throw err;
    }
  }
  async createOne(req, res) {
    try {
      let participants = [];
      if (req.body.participants) {
        for (let i of req.body.participants)
          participants.push({
            participantId: new mongoose.Types.ObjectId(i)
          });
      }
      const newCalendar = await Calendar.create({
        authorId: req.user._id,
        participants: participants,
        followers: req.body.followers,
        name: req.body.name,
        description: req.body.description,
        color: req.body.color,
        isPublic: req.body.isPublic,
        type: req.body.type
      });
      if (participants.length !== 0) {
        for (let i of participants) {
          const user = await User.findOne({
            _id: i.participantId
          }).select("+email");
          if (!user) {
            return res.status(404).json({
              message: 'The participant is not found'
            });
          }
          await sendCalendarParticipation(user, newCalendar);
        }
      }
      return res.status(201).json({
        message: 'New calendar created successfully',
        data: { calendar: new CalendarDto(newCalendar) }
      });
    } catch (err) {
      err.message = `New calendar creating failed: ${err.message}`;
      throw err;
    }
  }
  async sendParticipationMail(req, res) {
    try {
      const calendar = await Calendar.findOne({
        _id: req.params.calendarId
      });
      if (!calendar)
        return res.status(404).json({
          message: "The calendar is not found"
        });
      await sendCalendarParticipation(user, newCalendar);
      return res.status(200).json({
        message: "The mail with the confirmation link is sent to your e-mail address"
      });
    } catch (err) {
      err.message = `Mail sending failed: ${err.message}`;
      throw err;
    }
  }
  async confirmParticipation(req, res) {
    try {
      const calendar = await Calendar.findOne({
        _id: req.params.calendarId
      });
      if (!calendar)
        return res.status(404).json({
          message: "The calendar is not found"
        });
      for (let i = 0; i < calendar.participants.length; i += 1) {
        if (calendar.participants[i].participantId.toString() === req.user._id.toString()) {
          if (calendar.participants[i].isConfirmed === true)
            return res.status(400).json({
              message: "Your participation is already confirmed"
            });
          else {
            calendar.participants[i].isConfirmed = true;
            const result = await calendar.save();
            if (result)
              return res.status(200).json({
                message: "Your participation is confirmed"
              });
            else
              return res.status(500).json({
                message: "Something went wrong"
              });
          }
        }
      }
      return res.status(403).json({
        message: "You are not the participant"
      });
    } catch (err) {
      err.message = `Participation confirmation failed: ${err.message}`;
      throw err;
    }
  }
  async createEvent(req, res) {
    try {
      const calendar = await Calendar.findOne({
        _id: req.params.calendarId
      });
      if (!calendar)
        return res.status(404).json({
          message: "The calendar is not found"
        });
      let hasRights = false;
      if (calendar.authorId.toString() === req.user._id.toString())
        hasRights = true;
      else {
        for (let i of calendar.participants) {
          if (i.participantId.toString() === req.user._id.toString() && i.isConfirmed === true) {
            hasRights = true;
            break;
          }
        }
      }
      let eventParticipants = [];
      eventParticipants.push(calendar.authorId);
      for (let i of calendar.participants)
        eventParticipants.push(i.participantId);
      if (hasRights) {
        const newEvent = await Event.create({
          authorId: req.user._id,
          calendarId: calendar._id,
          name: req.body.name,
          description: req.body.description,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          link: req.body.link,
          color: req.body.color,
          repeat: req.body.repeat,
          participants: req.body.participants ? req.body.participants:eventParticipants,
          tags: req.body.tags,
          type: req.body.type
        });
        return res.status(201).json({
          message: 'New event created successfully',
          data: { event: new EventDto(newEvent) }
        });
      } else
        return res.status(403).json({
        message: "You do not have rights"
      });
    } catch (err) {
      err.message = `New event creating failed: ${err.message}`;
      throw err;
    }
  }
  async follow(req, res) {
    try {
      const calendar = await Calendar.findOne({
        _id: req.params.calendarId
      });
      if (!calendar)
        return res.status(404).json({
          message: "The calendar is not found"
        });
      if (!calendar.isPublic)
        return res.status(403).json({
          message: "The calendar is not public"
        });
      for (let i of calendar.participants) {
        if (i.participantId.toString() === req.user._id.toString())
          return res.status(400).json({
            message: "Participants cannot follow the calendar"
          });
        }
        if (calendar.followers.length === 0) {
        calendar.followers.push(req.user._id);
        const result = await calendar.save();
        return res.status(result ? 200:500).json({
          message: result ? "Successfully followed the calendar"
                            : "Something went wrong"
        }); 
      } else {
        if (calendar.followers.includes(req.user._id))
          return res.status(400).json({
            message: "You are already following the calendar"
          });
        else {
          calendar.followers.push(req.user._id);
          const result = await calendar.save();
          return res.status(result ? 200:500).json({
            message: result ? "Successfully followed the calendar"
                              : "Something went wrong"
          });
        }
      }
    } catch (err) {
      err.message = `Calendar following failed: ${err.message}`;
      throw err;
    }
  }
  async editOne(req, res) {
    try {
      const calendar = await Calendar.findOne({
        _id: req.params.calendarId
      });
      if (!calendar)
        return res.status(404).json({
          message: "The calendar is not found"
        });
      if (calendar.authorId.toString() === req.user._id.toString()) {
        if (req.body.participants) {
          for (let i of req.body.participants) {
            let present = false;
            for (let j of calendar.participants) {
              if (i === j.participantId.toString()) {
                present = true;
                break;
              }
            }
            if (!present)
              calendar.participants.push({
                participantId: new mongoose.Types.ObjectId(i)
              });
          }
        }
        if (req.body.name)
          calendar.name = req.body.name;
        if (req.body.description)
          calendar.description = req.body.description;
        if (req.body.color)
          calendar.color = req.body.color;
        if (req.body.isPublic)
          calendar.isPublic = req.body.isPublic;
        if (calendar.isModified()) {
          const result = await calendar.save();
          for (let i of calendar.participants) {
            if (!i.isConfirmed) {
              const user = await User.findOne({
                _id: i.participantId
              }).select("+email");
              if (!user)
                return res.status(404).json({
                  message: "The new participant is not found"
                });
              await sendCalendarParticipation(user, calendar);
            }
          }
          return res.status(result ? 200:500).json({
            message: result ? "Successfully edited the calendar"
                              : "Something went wrong"
          });
        } else
          return res.status(200).json({
            message: "Nothing has changed"
          });
      } else
        return res.status(403).json({
          message: "You are not the author"
        });
    } catch (err) {
      err.message = `Calendar editing failed: ${err.message}`;
      throw err;
    }
  }
  async deleteOne(req, res) {
    try {
      const calendar = await Calendar.findOne({
        _id: req.params.calendarId
      });
      if (!calendar)
        return res.status(404).json({
          message: "The calendar is not found"
        });
      if (calendar.authorId.toString() === req.user._id.toString()) {
        await Event.deleteMany({
          calendarId: calendar._id
        });
        await Calendar.deleteOne({
          _id: calendar._id
        });
        return res.status(200).json({
          message: "Calendar successfully deleted"
        });
      } else if (calendar.followers.includes(req.user._id)) {
        calendar.followers.pop(req.user._id);
        const result = await calendar.save();
        return res.status(result ? 200:500).json({
          message: result ? "Successfully unfollowed the calendar"
                            : "Something went wrong"
        });
      } else {
        for (let i of calendar.participants) {
          if (i.participantId === req.user._id) {
            calendar.participants.pop(i);
            break;
          }
        }
        const result = await calendar.save();
        return res.status(result ? 200:500).json({
          message: result ? "You are no longer the participant"
                            : "Something went wrong"
        });
      }
    } catch (err) {
      err.message = `Calendar deleting failed: ${err.message}`;
      throw err;
    }
  }
}
export default new Calendars;
