import mongoose from 'mongoose';

import Calendar from '../models/calendarModel.js';
import User from '../models/userModel.js';
import Event from '../models/eventModel.js';
import { CalendarDto } from '../dtos/calendarDto.js';
import { EventDto } from '../dtos/eventDto.js';
import { sendCalendarParticipation } from '../utils/emailUtil.js';
import { createParticipationToken } from '../utils/tokenUtil.js';

class Calendars {
  async getAll(req, res) {
    try {
      let parameters = {
        $or: [
          { authorId: req.user._id },
          {
            participants: {
              $elemMatch: {
                participantId: req.user._id,
                isConfirmed: null
              }
            }
          },
          {
            followers: {
              $in: [req.user._id]
            }
          }
        ],
        isHidden: false
      };
      if (req.query.name) {
        if (req.body.name instanceof Array)
          parameters.name = {
            $in: req.query.name
          };
        else
          parameters.name = req.query.name;
      }
      if (req.query.author) {
        if (req.query.author instanceof Array) {
          let authors = [];
          for (let i of req.query.author) {
            const author = await User.findOne({
              login: req.query.author[i]
            });
            if (author)
              authors.push(author._id);
          }
          if (authors.length !== 0)
            parameters.authorId = {
              $in: authors
            };
        } else {
          const author = await User.findOne({
            login: req.query.author
          });
          if (author)
            parameters.authorId = author._id;
        }
      }
      const calendars = await Calendar.find(parameters)
                                      .select("id name color authorId type isPublic followers")
                                      .sort({
                                        type: 1,
                                        name: 1
                                      })
                                      .limit(Number(req?.query?.limit));
      let calendarsDtos = calendars.map(calendar => new CalendarDto(calendar));
      calendarsDtos[0].id = calendarsDtos[0].id.toString();
      calendarsDtos[1].id = calendarsDtos[1].id.toString();
      calendarsDtos[0].authorId = calendarsDtos[0].authorId.toString();
      calendarsDtos[1].authorId = calendarsDtos[1].authorId.toString();
      const buffer = JSON.parse(JSON.stringify(calendarsDtos[0]));
      calendarsDtos[0] = JSON.parse(JSON.stringify(calendarsDtos[1]));
      calendarsDtos[1] = JSON.parse(JSON.stringify(buffer));
      calendarsDtos[0].id = new mongoose.Types.ObjectId(calendarsDtos[0].id);
      calendarsDtos[1].id = new mongoose.Types.ObjectId(calendarsDtos[1].id);
      calendarsDtos[0].authorId = new mongoose.Types.ObjectId(calendarsDtos[0].authorId);
      calendarsDtos[1].authorId = new mongoose.Types.ObjectId(calendarsDtos[1].authorId);
      for (let i = 0; i < calendarsDtos.length; i += 1) {
        if (calendarsDtos[i].authorId.toString() === req.user._id.toString())
          calendarsDtos[i].role = "author";
        else if (calendarsDtos[i].followers.includes(req.user._id))
          calendarsDtos[i].role = "follower";
        else
          calendarsDtos[i].role = "participant";
        delete calendarsDtos[i].followers;
      }
      return res.status(200).json({
        message: 'Fetched calendars successfully',
        data: {
          calendars: calendarsDtos
        }
      });
    } catch (err) {
      err.message = `Getting calendars failed: ${err.message}`;
      throw err;
    }
  }

  async getHidden(req, res) {
    try {
      const calendars = await Calendar.find({
        authorId: req.user._id,
        isHidden: true
      }).select("id name color isPublic participants followers").sort({
        name: 1
      });
      const calendarsDtos = calendars.map(calendar => new CalendarDto(calendar));
      for (let i = 0; i < calendarsDtos.length; i += 1) {
        let events = await Event.find({
          calendarId: calendarsDtos[i].id
        });
        events = events.map(event => new EventDto(event));
        calendarsDtos[i].eventsCount = events.length;
        calendarsDtos[i].participantsCount = calendarsDtos[i].participants.length;
        calendarsDtos[i].followersCount = calendarsDtos[i].followers.length;
        delete calendarsDtos[i].participants;
        delete calendarsDtos[i].followers;
      }
      return res.status(200).json({
        message: 'Fetched hidden calendars successfully',
        data: {
          calendars: calendarsDtos
        }
      });
    } catch (err) {
      err.message = `Getting hidden calendars failed: ${err.message}`;
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
          message: "Calendar is not found"
        });
      let hasAccess = false;
      if (calendar.authorId.toString() === req.user._id.toString()
          || calendar.followers.includes(req.user._id))
        hasAccess = true;
      else {
        for (let i of calendar.participants) {
          if (i.participantId.toString() === req.user._id.toString() && i.isConfirmed === null) {
            hasAccess = true;
            break;
          }
        }
      }
      if (hasAccess) {
        let calendarDto = new CalendarDto(calendar);
        if (calendarDto.authorId.toString() === req.user._id.toString())
          calendarDto.role = "author";
        else if (calendarDto.followers.includes(req.user._id))
          calendarDto.role = "follower";
        else
          calendarDto.role = "participant";
        if (calendarDto.authorId.toString() !== req.user._id.toString())
          calendarDto.participants = calendarDto.participants.filter(participant => participant.isConfirmed === null);
        const formattedParticipants = [];
        for (let i = 0; i < calendarDto.participants.length; i += 1) {
          const user = await User.findOne({
            _id: calendarDto.participants[i].participantId
          });
          if (user)
            formattedParticipants.push({
              id: user._id,
              login: user.login,
              avatar: user.avatar,
              isConfirmed: calendarDto.participants[i].isConfirmed
            });
        }
        calendarDto.participants = formattedParticipants;
        let formattedFollowers = [];
        for (let i = 0; i < calendarDto.followers.length; i += 1) {
          const user = await User.findOne({
            _id: calendarDto.followers[i]
          });
          if (user)
            formattedFollowers.push({
              id: user._id,
              login: user.login,
              avatar: user.avatar
            });
        }
        calendarDto.followers = formattedFollowers;
        return res.status(200).json({
          message: 'Fetched calendar successfully',
          data: { calendar: calendarDto }
        });
      } else
        return res.status(403).json({
          message: "You do not have access to the calendar"
        });
    } catch (err) {
      if (err instanceof CastError)
        return res.status(404).json({ message: 'Calendar is not found' });
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
        name: req.body.name,
        description: req.body.description,
        color: req.body.color,
        isPublic: req.body.isPublic
      });
      if (participants.length !== 0) {
        for (let i = 0; i < newCalendar.participants.length; i += 1) {
          const user = await User.findOne({
            _id: newCalendar.participants[i].participantId
          }).select("+email");
          if (!user) {
            return res.status(404).json({
              message: 'Participant is not found'
            });
          }
          newCalendar.participants[i].isConfirmed = await createParticipationToken(user, newCalendar.id);
          await newCalendar.save();
          await sendCalendarParticipation(user, newCalendar, newCalendar.participants[i].isConfirmed);
        }
      }
      let calendarDto = new CalendarDto(newCalendar);
      delete calendarDto.participants;
      delete calendarDto.followers;
      return res.status(201).json({
        message: 'New calendar created successfully',
        data: { calendar: calendarDto }
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
          message: "Calendar is not found"
        });
      const user = await User.findOne({
        _id: req.body.participantId
      }).select("+email");
      if (!user)
        return res.status(404).json({
          message: "Participant is not found"
        });
      for (let i = 0; i < calendar.participants.length; i += 1) {
        if (calendar.participants[i].participantId.toString() === user._id.toString()) {
          calendar.participants[i].isConfirmed = await createParticipationToken(user, calendar.id);
          await calendar.save();
          await sendCalendarParticipation(user, calendar, calendar.participants[i].isConfirmed);
          return res.status(200).json({
            message: "The mail with the confirmation link is sent to your e-mail address"
          });
        }
      }
      return res.status(403).json({
        message: "You are not a participant of the calendar"
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
          message: "Calendar is not found"
        });
      for (let i = 0; i < calendar.participants.length; i += 1) {
        if (calendar.participants[i].participantId.toString() === req.user._id.toString()) {
          if (calendar.participants[i].isConfirmed === null)
            return res.status(400).json({
              message: "Your participation in the calendar has already been confirmed"
            });
          else {
            if (calendar.participants[i].isConfirmed === req.params.confirmToken) {
              calendar.participants[i].isConfirmed = null;
              await calendar.save();
              return res.status(200).json({
                message: "Your participation in the calendar has been confirmed successfully"
              });
            } else
              return res.status(400).json({
                message: "Incorrect token. Please follow the link from the latest e-mail"
              });
          }
        }
      }
      return res.status(403).json({
        message: "You are not a participant of the calendar"
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
          message: "Calendar is not found"
        });
      let hasRights = false;
      if (calendar.authorId.toString() === req.user._id.toString())
        hasRights = true;
      else {
        for (let i of calendar.participants) {
          if (i.participantId.toString() === req.user._id.toString() && i.isConfirmed === null) {
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
        message: "You do not have rights to create events in the calendar"
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
          message: "Calendar is not found"
        });
      if (!calendar.isPublic)
        return res.status(403).json({
          message: "Calendar is not public"
        });
      for (let i of calendar.participants) {
        if (i.participantId.toString() === req.user._id.toString())
          return res.status(400).json({
            message: "Participants of calendars cannot follow them"
          });
        }
        if (calendar.followers.length === 0) {
        calendar.followers.push(req.user._id);
        await calendar.save();
        return res.status(200).json({
          message: "Successfully followed the calendar"
        }); 
      } else {
        if (calendar.followers.includes(req.user._id))
          return res.status(400).json({
            message: "You are already following the calendar"
          });
        else {
          calendar.followers.push(req.user._id);
          await calendar.save();
          return res.status(200).json({
            message: "Successfully followed the calendar"
          });
        }
      }
    } catch (err) {
      err.message = `Calendar following failed: ${err.message}`;
      throw err;
    }
  }

  async archive(req, res) {
    try {
      const calendar = await Calendar.findOne({
        _id: req.params.calendarId
      });
      if (!calendar)
        return res.status(404).json({
          message: "Calendar is not found"
        });
      if (calendar.authorId.toString() !== req.user._id.toString())
        return res.status(403).json({
          message: "You are not an author of the calendar"
        });
      if (calendar.isHidden)
        return res.status(400).json({
          message: "Calendar is already archived"
        });
      else {
        calendar.isHidden = true;
        await calendar.save();
        return res.status(200).json({
          message: "Calendar archived successfully"
        });
      }
    } catch (err) {
      err.message = `Calendar archiving failed: ${err.message}`;
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
          message: "Calendar is not found"
        });
      if (calendar.authorId.toString() === req.user._id.toString()) {
        if (req.body.participants && calendar.type === "other") {
          for (let i of req.body.participants) {
            let present = false;
            for (let j of calendar.participants) {
              if (i === j.participantId.toString()) {
                present = true;
                break;
              }
            }
            if (!present) {
              const user = await User.findOne({
                _id: new mongoose.Types.ObjectId(i)
              }).select("+email");
              if (user) {
                calendar.participants.push({
                  participantId: user._id,
                  isConfirmed: await createParticipationToken(user, calendar.id)
                });
                await sendCalendarParticipation(user, calendar, calendar.participants[calendar.participants.length - 1].isConfirmed);
              }
            }
          }
        }
        if (req.body.name && calendar.type === "other")
          calendar.name = req.body.name;
        if (req.body.description !== undefined && calendar.type === "other")
          calendar.description = req.body.description;
        if (req.body.color)
          calendar.color = req.body.color;
        if (req.body.isPublic !== undefined && calendar.type === "other") {
          calendar.isPublic = req.body.isPublic;
          if (!calendar.isPublic)
            calendar.followers = [];
        }
        if (calendar.isModified()) {
          await calendar.save();
          let calendarDto = new CalendarDto(calendar);
          delete calendarDto.participants;
          delete calendarDto.followers;
          return res.status(200).json({
            message: "Calendar updated successfully",
            data: { calendar: calendarDto }
          });
        } else
          return res.status(200).json({
            message: "Nothing has changed"
          });
      } else
        return res.status(403).json({
          message: "You are not an author of the calendar"
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
          message: "Calendar is not found"
        });
      if (calendar.authorId.toString() === req.user._id.toString()) {
        if (calendar.type !== "other")
          return res.status(403).json({
            message: "You cannot delete your main calendar or one with holidays"
          });
        await Event.deleteMany({
          calendarId: calendar._id
        });
        await Calendar.deleteOne({
          _id: calendar._id
        });
        return res.status(200).json({
          message: "Calendar deleted successfully"
        });
      } else if (calendar.followers.includes(req.user._id)) {
        calendar.followers.pop(req.user._id);
        await calendar.save();
        return res.status(200).json({
          message: "Successfully unfollowed the calendar"
        });
      } else {
        for (let i of calendar.participants) {
          if (i.participantId === req.user._id) {
            calendar.participants.pop(i);
            break;
          }
        }
        await calendar.save();
        return res.status(200).json({
          message: "You are no longer a participant of the calendar"
        });
      }
    } catch (err) {
      err.message = `Calendar deleting failed: ${err.message}`;
      throw err;
    }
  }

  async dearchive(req, res) {
    try {
      const calendar = await Calendar.findOne({
        _id: req.params.calendarId
      });
      if (!calendar)
        return res.status(404).json({
          message: "Calendar is not found"
        });
      if (calendar.authorId.toString() !== req.user._id.toString())
        return res.status(403).json({
          message: "You are not an author of the calendar"
        });
      if (!calendar.isHidden)
        return res.status(400).json({
          message: "Calendar is not archived yet"
        });
      else {
        calendar.isHidden = false;
        await calendar.save();
        return res.status(200).json({
          message: "Calendar dearchived successfully"
        });
      }
    } catch (err) {
      err.message = `Calendar dearchiving failed: ${err.message}`;
      throw err;
    }
  }

}

export default new Calendars;



