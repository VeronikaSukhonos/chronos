import mongoose from 'mongoose';

import Calendar from '../models/calendarModel.js';
import User from '../models/userModel.js';
import Event from '../models/eventModel.js';
import Tag from '../models/tagModel.js';
import { UserDto } from '../dtos/userDto.js';
import { CalendarDto } from '../dtos/calendarDto.js';
import { EventDto } from '../dtos/eventDto.js';
import { sendCalendarParticipation, sendEventParticipation } from '../utils/emailUtil.js';
import { createParticipationToken } from '../utils/tokenUtil.js';

class Calendars {
  async getAll(req, res) {
    try {
      let parameters = {};
      if (req.query.name || req.query.author || req.query.limit)
        parameters = {
          isHidden: false,
          isPublic: true,
          authorId: {
            $not: {
              $eq: req.user._id
            }
          },
          participants: {
            $not: {
              $elemMatch: {
                participantId: req.user._id,
                isConfirmed: null
              }
            }
          },
          followers: {
            $not: {
              $in: [req.user._id]
            }
          }
        };
      else
        parameters = {
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
        if (req.query.name instanceof Array)
          return res.status(400).json({
            message: "You can provide only one name to the query"
          });
        else
          parameters.name = {
            $regex: new RegExp(req.query.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'i')
          };
      }
      if (req.query.author) {
        if (req.query.author instanceof Array)
          return res.status(400).json({
            message: "You can provide only one author's login to the query"
          })
        else {
          const author = await User.findOne({
            login: req.query.author
          });
          if (author)
            parameters.authorId = author._id;
        }
      }
      if (req.query.limit) {
        if (req.query.limit instanceof Array)
          return res.status(400).json({
            message: "You can provide only one limit to the query"
          });
        if (/\D/.test(req.query.limit) || req.query.limit === "0")
          return res.status(400).json({
            message: "Limit must be a positive integer"
          });
      }
      const calendars = await Calendar.find(parameters)
                                      .select("id name color authorId type isPublic followers participants")
                                      .sort({
                                        type: 1,
                                        name: 1
                                      })
                                      .limit(Number(req?.query?.limit));
      let calendarsDtos = calendars.map(calendar => new CalendarDto(calendar));
      if (!req.query.name && !req.query.author && !req.query.limit) {
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
      }
      for (let i = 0; i < calendarsDtos.length; i += 1) {
        const author = await User.findOne({
          _id: calendarsDtos[i].authorId
        });
        if (author)
          calendarsDtos[i].author = {
            id: author._id,
            login: author.login,
            avatar: author.avatar
          };
        if (calendarsDtos[i].authorId.toString() === req.user._id.toString())
          calendarsDtos[i].role = "author";
        else if (calendarsDtos[i].followers.includes(req.user._id))
          calendarsDtos[i].role = "follower";
        else {
          let isParticipant = false;
          for (let j = 0; j < calendarsDtos[i].participants.length; j += 1) {
            if (calendarsDtos[i].participants[j].participantId.toString() === req.user._id.toString()) {
              isParticipant = true;
              break;
            }
          }
          calendarsDtos[i].role = isParticipant ? "participant":"guest";
        }
        delete calendarsDtos[i].participants;
        delete calendarsDtos[i].followers;
        delete calendarsDtos[i].authorId;
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
        const events = await Event.find({
          calendarId: calendarsDtos[i].id
        });
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
          || calendar.followers.includes(req.user._id) || calendar.isPublic)
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
        const author = await User.findOne({
          _id: calendarDto.authorId
        });
        if (author)
          calendarDto.author = {
            id: author._id,
            login: author.login,
            avatar: author.avatar
          };
        if (calendarDto.authorId.toString() === req.user._id.toString())
          calendarDto.role = "author";
        else if (calendarDto.followers.includes(req.user._id))
          calendarDto.role = "follower";
        else {
          let isParticipant = false;
          for (let i = 0; i < calendarDto.participants.length; i += 1) {
            if (calendarDto.participants[i].participantId.toString() === req.user._id.toString()) {
              isParticipant = true;
              break;
            }
          }
          calendarDto.role = isParticipant ? "participant":"guest";
        }
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
              isConfirmed: calendarDto.participants[i].isConfirmed === null ? true:false
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
        delete calendarDto.authorId;
        return res.status(200).json({
          message: 'Fetched calendar successfully',
          data: { calendar: calendarDto }
        });
      } else
        return res.status(403).json({
          message: "You do not have access to the calendar"
        });
    } catch (err) {
      if (err instanceof mongoose.CastError)
        return res.status(404).json({ message: 'Calendar is not found' });
      err.message = `Getting calendar failed: ${err.message}`;
      throw err;
    }
  }

  async viewParticipation(req, res) {
    try {
      const calendar = await Calendar.findOne({
        _id: req.calendarId
      }).select("name authorId");
      if (!calendar)
        return res.status(404).json({
          message: "Calendar is not found"
        });
      let calendarDto = new CalendarDto(calendar);
      const author = await User.findOne({
        _id: calendarDto.authorId
      });
      if (!author)
        return res.status(404).json({
          message: "Author of the calendar is not found"
        });
      calendarDto.author = {
        id: author._id,
        login: author.login
      };
      delete calendarDto.authorId;
      return res.status(200).json({
        message: "Fetched calendar successfully",
        data: {
          calendar: calendarDto
        }
      });
    } catch (err) {
      if (err instanceof mongoose.CastError)
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
      const calendar = await Calendar.findOne({
        authorId: req.user._id,
        name: req.body.name
      });
      if (calendar)
        return res.status(400).json({
          message: "Calendar with such name already exists"
        });
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
      const author = await User.findOne({
        _id: calendarDto.authorId
      });
      if (author)
        calendarDto.author = {
          id: author._id,
          login: author.login,
          avatar: author.avatar
        };
      delete calendarDto.authorId;
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
      if (!req.body)
        return res.status(400).json({
          message: "Body is not provided"
        });
      const calendar = await Calendar.findOne({
        _id: req.params.calendarId
      });
      if (!calendar)
        return res.status(404).json({
          message: "Calendar is not found"
        });
      const user = await User.findOne({
        _id: req.body?.participantId
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
            message: "Participation link has been sent to the user's email address"
          });
        }
      }
      return res.status(403).json({
        message: "You are not a participant of the calendar"
      });
    } catch (err) {
      if (err instanceof mongoose.CastError)
        return res.status(404).json({ message: 'Calendar is not found' });
      err.message = `Participation mail sending failed: ${err.message}`;
      throw err;
    }
  }

  async confirmParticipation(req, res) {
    try {
      const calendar = await Calendar.findOne({
        _id: req.calendarId
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
              for (let j = calendar.followers.length - 1; j >= 0; j -=1) {
                if (calendar.followers[j].toString() === calendar.participants[i].participantId.toString())
                  calendar.followers.splice(j, 1);
              }
              await calendar.save();
              return res.status(200).json({
                message: "Confirmed participation in the calendar successfully"
              });
            } else
              return res.status(400).json({
                message: "Invalid or expired participation token. Please use the link from the latest email"
              });
          }
        }
      }
      return res.status(403).json({
        message: "You are not a participant of the calendar"
      });
    } catch (err) {
      if (err instanceof mongoose.CastError)
        return res.status(404).json({ message: 'Calendar is not found' });
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
      if (calendar.type === 'holidays')
        return res.status(400).json({
          message: "You can't create events in Holidays calendar"
        });
      if (hasRights) {
        if ((req.body.type == 'arrangement' || req.body.type == 'task') && !req.body.endDate)
          req.body.endDate = new Date(new Date(req.body.startDate).getTime() + 3600000).toISOString();
        if (!req.body.color)
          req.body.color = calendar.color;
        if (req.body.type == 'birthday' || req.body.type == 'holiday') {
          req.body.repeat = { frequency: 'year', parameter: 1 };
          req.body.allDay = true;
        }
        if (req.body.visibleForAll || calendar.type == 'main' || calendar.type == 'holidays') {
          req.body.participants = [];
        } else {
          if (!req.body.participants)
            req.body.participants = [];
          for (let i = req.body.participants.length - 1; i >= 0; --i) {
            if (req.body.participants.indexOf(req.body.participants[i]) < i
              || !(req.body.participants[i] === req.user._id.toString()
              || req.body.participants[i] === calendar.authorId.toString()
              || await User.findOne({ _id: req.body.participants[i] })))
              req.body.participants.splice(i, 1);
          }
          if (!req.body.participants.includes(calendar.authorId.toString()))
            req.body.participants.splice(0, 0, calendar.authorId.toString())
          if (!req.body.participants.includes(req.user._id.toString()))
            req.body.participants.splice(0, 0, req.user._id.toString())
        }
        if (req.body.tags) {
          for (let i = req.body.tags.length - 1; i >= 0; --i) {
            if (!(await Tag.findOne({ _id: req.body.tags[i], authorId: req.user._id }))
              || req.body.tags.indexOf(req.body.tags[i]) < i)
              req.body.tags.splice(i, 1);
          }
        }
        if (req.body.allDay) {
          req.body.endDate = new Date(new Date(req.body.startDate).getTime() + 23 * 3600000 + 59 * 60000 + 59 * 1000 + 999).toISOString();
        }
        let participants = req.body.participants.map(participant => { return { participantId: participant }; });
        participants.sort((p1, p2) => {
          if (p1.participantId.toString() === req.user._id.toString()
              || p1.participantId.toString() === calendar.authorId.toString())
            return -1
          else if (p2.participantId.toString() === req.user._id.toString()
                   || p2.participantId.toString() === calendar.authorId.toString())
            return 1
          else
            return 0
        });
        const newEvent = await Event.create({
          authorId: req.user._id,
          calendarId: calendar._id,
          name: req.body.name,
          description: req.body.description,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          link: req.body.type == 'arrangement' ? req.body.link:undefined,
          color: req.body.color,
          repeat: req.body.type !== 'task' && req.body.repeat !== null ? req.body.repeat:undefined,
          participants: participants,
          tags: req.body.tags,
          type: req.body.type,
          visibleForAll: calendar.type == 'main' || calendar.type == 'holidays' ? false:req.body.visibleForAll,
          allDay: req.body.allDay
        });
        if (participants.length !== 0) {
          for (let i = 0; i < newEvent.participants.length; i += 1) {
            const user = await User.findOne({
              _id: newEvent.participants[i].participantId
            }).select("+email");
            if (user) {
              if (newEvent.participants[i].participantId.toString() !== req.user._id.toString()
                && newEvent.participants[i].participantId.toString() !== calendar.authorId.toString()) {
                let calendarParticipant = false;
                for (let j = 0; j < calendar.participants.length; i += 1) {
                  if (calendar.participants[j].participantId.toString() === newEvent.participants[i].participantId.toString()) {
                    calendarParticipant = calendar.participants[j].isConfirmed === null ? true : j;
                    break;
                  }
                }
                if (calendarParticipant === false)
                  calendar.participants.push({
                    participantId: user._id,
                    isConfirmed: await createParticipationToken(user, calendar.id)
                  });
                else if (calendarParticipant !== true)
                  calendar.participants[calendarParticipant].isConfirmed = await createParticipationToken(user, calendar.id);
                if (calendarParticipant !== true)
                  await sendCalendarParticipation(user, calendar, calendar.participants[calendarParticipant === false ? calendar.participants.length - 1 : j].isConfirmed);
                newEvent.participants[i].isConfirmed = await createParticipationToken(user, undefined, newEvent.id);
                await sendEventParticipation(user, newEvent, newEvent.participants[i].isConfirmed);
              } else
                newEvent.participants[i].isConfirmed = null;
            }
          }
          await calendar.save();
          await newEvent.save();
        }
        const result = await newEvent.populate('tags');
        result.author = new UserDto(await User.findOne({ _id: req.user._id }).select('id login avatar'));
        return res.status(201).json({
          message: 'New event created successfully',
          data: { event: new EventDto(result) }
        });
      } else
        return res.status(403).json({
          message: "You do not have rights to create events in the calendar"
        });
    } catch (err) {
      if (err instanceof mongoose.CastError)
        return res.status(404).json({ message: 'Calendar is not found' });
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
      if (calendar.isHidden)
        return res.status(403).json({
          message: "Calendar is hidden"
        });
      if (calendar.authorId.toString() === req.user._id.toString())
        return res.status(403).json({
          message: "Authors of calendars cannot follow them"
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
      if (err instanceof mongoose.CastError)
        return res.status(404).json({ message: 'Calendar is not found' });
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
      if (calendar.type !== "other")
        return res.status(400).json({
          message: "You cannot archive your main calendar or one with holidays"
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
      if (err instanceof mongoose.CastError)
        return res.status(404).json({ message: 'Calendar is not found' });
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
        if (calendar.isHidden)
          return res.status(400).json({
            message: "Calendar is hidden"
          });
        if (req.body.participants && calendar.type === "other") {
          let participantsToDelete = [];
          if (req.body.participants.length === 0) {
            for (let i = 0; i < calendar.participants.length; i += 1)
              participantsToDelete.push(calendar.participants[i]);
          } else {
            for (let i = 0; i < calendar.participants.length; i += 1) {
              if (!req.body.participants.includes(calendar.participants[i].participantId.toString()))
                participantsToDelete.push(calendar.participants[i]);
            }
          }
          for (let i = calendar.participants.length - 1; i >= 0; i -= 1) {
            if (participantsToDelete.includes(calendar.participants[i]))
              calendar.participants.splice(i, 1);
          }
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
          for (let i of calendar.participants) {
            if (calendar.followers.includes(i.participantId)) {
              for (let j = calendar.followers.length - 1; j >= 0; j -= 1) {
                if (calendar.followers[j].toString() === i.participantId.toString())
                  calendar.followers.splice(j, 1);
              }
            }
          }
        }
        if (req.body.followers && calendar.type === "other") {
          let followersToDelete = [];
          if (req.body.followers.length === 0) {
            for (let i = 0; i < calendar.followers.length; i += 1)
              followersToDelete.push(calendar.followers[i]);
          } else {
            for (let i = 0; i < calendar.followers.length; i += 1) {
              if (!req.body.followers.includes(calendar.followers[i].toString()))
                followersToDelete.push(calendar.followers[i]);
            }
          }
          for (let i = calendar.followers.length - 1; i >= 0; i -= 1) {
            if (followersToDelete.includes(calendar.followers[i]))
              calendar.followers.splice(i, 1);
          }
          for (let i of req.body.followers) {
            let present = false;
            let isParticipant = false;
            for (let j of calendar.followers) {
              if (i === j.toString()) {
                present = true;
                break;
              }
            }
            for (let j of calendar.participants) {
              if (i === j.participantId.toString()) {
                isParticipant = true;
                break;
              }
            }
            if (!present && !isParticipant) {
              const user = await User.findOne({
                _id: new mongoose.Types.ObjectId(i)
              });
              if (user)
                calendar.followers.push(user._id);
            }
          }
        }
        if (req.body.name && calendar.type === "other") {
          if (req.body.name !== calendar.name) {
            const newCalendar = await Calendar.findOne({
              authorId: calendar.authorId,
              name: req.body.name
            });
            if (newCalendar)
              return res.status(400).json({
                message: "Calendar with such name already exists"
              });
            else
              calendar.name = req.body.name;
          }
        }
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
          const author = await User.findOne({
            _id: calendarDto.authorId
          });
          if (author)
            calendarDto.author = {
              id: author._id,
              login: author.login,
              avatar: author.avatar
            };
          delete calendarDto.authorId;
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
      if (err instanceof mongoose.CastError)
        return res.status(404).json({ message: 'Calendar is not found' });
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
        for (let i = calendar.followers.length - 1; i >= 0; i -= 1) {
          if (calendar.followers[i].toString() === req.user._id.toString()) {
            calendar.followers.splice(i, 1);
            break;
          }
        }
        await calendar.save();
        return res.status(200).json({
          message: "Successfully unfollowed the calendar"
        });
      } else {
        for (let i = calendar.participants.length - 1; i >= 0; i -= 1) {
          if (calendar.participants[i].participantId.toString() === req.user._id.toString()) {
            calendar.participants.splice(i, 1);
            break;
          }
        }
        await calendar.save();
        return res.status(200).json({
          message: "You are no longer a participant of the calendar"
        });
      }
    } catch (err) {
      if (err instanceof mongoose.CastError)
        return res.status(404).json({ message: 'Calendar is not found' });
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
      if (err instanceof mongoose.CastError)
        return res.status(404).json({ message: 'Calendar is not found' });
      err.message = `Calendar dearchiving failed: ${err.message}`;
      throw err;
    }
  }

}

export default new Calendars;
