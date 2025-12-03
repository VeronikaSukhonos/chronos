import axios from 'axios';
import { CastError } from 'mongoose';

import Event from '../models/eventModel.js';
import { EventDto } from '../dtos/eventDto.js';
import User from '../models/userModel.js';
import { UserDto } from '../dtos/userDto.js';
import Calendar from '../models/calendarModel.js';
import Tag from '../models/tagModel.js';
import config from '../config.js';
import { sendCalendarParticipation, sendEventParticipation } from '../utils/emailUtil.js';
import { createParticipationToken } from '../utils/tokenUtil.js';

class Events {
  async getAll(req, res) {
    try {
      let parameters = {};
      let getHolidays = false;
      let holidaysCalendar;
      if (req.body.calendar) {
        if (!(req.body.calendar instanceof Array))
          req.body.calendar = [req.body.calendar];
        for (let i = req.body.calendar.length - 1; i >= 0; --i) {
          const calendar = await Calendar.findOne({ _id: req.body.calendar[i] });
          if (!calendar
            || !(calendar.authorId.toString() == req.user._id.toString()
            || calendar.participants.some(participant => participant.participantId.toString() == req.user._id.toString() && participant.isConfirmed === null)
            || calendar.followers.map(follower => follower.toString()).includes(req.user._id.toString())))
            req.body.calendar.splice(i, 1);
          else if (calendar.type === 'holidays') {
            getHolidays = true;
            holidaysCalendar = calendar;
          }
        }
      } else {
        req.body.calendar = await Calendar.find({
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
          ]
        });
        getHolidays = true;
      }
      parameters.calendarId = {
        $in: req.body.calendar
      };
      if (req.body.type) {
        if (!(req.body.type instanceof Array))
          req.body.type = [req.body.type];
        req.body.type = req.body.type.filter(type => ["arrangement", "reminder", "task", "holiday", "birthday"].includes(type));
        parameters.type = {
          $in: req.body.type
        };
        if (req.body.type.length < 0 || !req.body.type.includes('holiday'))
          getHolidays = false;
      }
      if (req.body.tag) {
        if (!(req.body.tag instanceof Array))
          req.body.tag = [req.body.tag];
        for (let i = req.body.tag.length - 1; i >= 0; --i) {
          if (!(await Tag.findOne({ authorId: req.user._id, title: req.body.tag[i] }))
            || req.body.tag.indexOf(req.body.tag[i]) < i)
            req.body.tag.splice(i, 1);
        }
      }
      const today = new Date();
      let startDate, endDate;
      if (req.body.search !== undefined)
        parameters.name = {
          $regex: req.body.search
        };
      else {
        let year = req.body.year !== undefined
          ? (req.body.year instanceof Array ? req.body.year[0] : req.body.year)
          : today.getFullYear();
        let month, week, day;
        if (req.body.week !== undefined)
          week = req.body.week instanceof Array ? req.body.week[0] : req.body.week;
        else {
          month = req.body.month !== undefined
            ? (req.body.month instanceof Array ? req.body.month[0] : req.body.month)
            : req.body.year !== undefined && req.body.day === undefined ? 0 : today.getMonth();
          day = req.body.day !== undefined
            ? (req.body.day instanceof Array ? req.body.day[0] : req.body.day)
            : req.body.month !== undefined || req.body.year !== undefined ? 1 : today.getDate();
        }
        if (week) {
          let january1st = new Date(Date.UTC(year, 0, 1));
          if (week === 1) {
            startDate = new Date(january1st - ((january1st.getUTCDay() || 7) - 1) * 86400000);
          } else {
            startDate = new Date(january1st.getTime() + ((7 - (january1st.getUTCDay() || 7)) + 1 + (week - 2) * 7) * 86400000);
          }
          endDate = new Date(startDate.getTime() + 7 * 86400000);
        } else {
          startDate = new Date(Date.UTC(year, month, day));
          endDate = new Date(Date.UTC(year + (req.body.year !== undefined && req.body.month === undefined && req.body.day === undefined ? 1 : 0),
                             month + (req.body.month !== undefined && req.body.day === undefined ? 1 : 0),
                             day + (req.body.day !== undefined || (req.body.year === undefined && req.body.month === undefined) ? 1 : 0)));
        }
        parameters.startDate = { $gte: startDate, $lt: endDate };
      }
      let events = await Event.find({
                                      ...parameters,
                                      $or: [
                                        { authorId: req.user._id },
                                        {
                                          participants: {
                                            $in: [req.user._id]
                                          }
                                        },
                                        { visibleForAll: true }
                                      ]
                                    })
                              .select("-participants")
                              .populate('tags');
      if (req.body.tag)
        events = events.filter(event => event.tags.some(tag => req.body.tag.includes(tag.title)));
      if (req.body.search === undefined) {
        if (getHolidays) {
          if (!holidaysCalendar)
            holidaysCalendar = await Calendar.findOne({ authorId: req.user._id, type: 'holidays' });
          const countryResponce = await axios.get(`https://api.ipinfo.io/lite/me?token=${config.IP_API_KEY}`);
          const startYearHolidaysResponce = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${startDate.getUTCFullYear()}/${countryResponce.data.country_code}`);
          let endYearHolidaysResponce = { data: [] };
          if (startDate.getUTCFullYear() != endDate.getUTCFullYear())
            endYearHolidaysResponce = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${endDate.getUTCFullYear()}/${countryResponce.data.country_code}`);
          events = events.concat(startYearHolidaysResponce.data.map(holiday => { return { calendarId: holidaysCalendar._id, name: holiday.name, startDate: holiday.date, type: 'holiday' }; })
            .filter(holiday => new Date(holiday.startDate) >= startDate && new Date(holiday.startDate) < endDate),
            endYearHolidaysResponce.data.map(holiday => { return { calendarId: holidaysCalendar._id, name: holiday.name, startDate: holiday.date, type: 'holiday' }; })
              .filter(holiday => new Date(holiday.startDate) < endDate));
        }
        let repeatEvents = await Event.find({
                                              ...parameters,
                                              startDate: { $lt: startDate },
                                              repeat: { $exists: true },
                                              $or: [
                                                { authorId: req.user._id },
                                                {
                                                  participants: {
                                                    $in: [req.user._id]
                                                  }
                                                },
                                                { visibleForAll: true }
                                              ]
                                            })
                                      .select("-participants")
                                      .populate('tags');
        if (req.body.tag)
          repeatEvents = repeatEvents.filter(event => event.tags.some(tag => req.body.tag.includes(tag.title)));
        for (let i of repeatEvents) {
          let eventDate = new Date(i.startDate);
          let repeatDelta, nextRepeatEventTime, startMonth, eventMonth, newDate;
          if (i.authorId)
            i.author = new UserDto(await User.findOne({ _id: i.authorId }).select('id login avatar'));
          switch (i.repeat.frequency) {
            case 'day':
              repeatDelta = (Math.ceil((startDate - eventDate) / 86400000) % i.repeat.parameter) || i.repeat.parameter;
              nextRepeatEventTime = startDate.getTime() + (i.repeat.parameter - repeatDelta) * 86400000;
              if (nextRepeatEventTime >= startDate && nextRepeatEventTime < endDate) {
                const newEvent = JSON.parse(JSON.stringify(new EventDto(i)));
                let timeToAdd = (Math.ceil((startDate - eventDate) / 86400000) + (i.repeat.parameter - repeatDelta)) * 86400000;
                newEvent.startDate = new Date(eventDate.getTime() + timeToAdd).toISOString();
                if (i.endDate)
                  newEvent.endDate = new Date(new Date(i.endDate).getTime() + timeToAdd).toISOString();
                events.push(newEvent);
              }
              break;
            case 'week':
              repeatDelta = ((Math.ceil((startDate - eventDate) / 86400000) / 7) % i.repeat.parameter) || i.repeat.parameter;
              nextRepeatEventTime = startDate.getTime() + (i.repeat.parameter - repeatDelta) * 86400000 * 7 + (7 - ((Math.ceil((startDate - eventDate) / 86400000) % 7) || 7)) * 86400000;
              if (nextRepeatEventTime >= startDate && nextRepeatEventTime < endDate) {
                const newEvent = JSON.parse(JSON.stringify(new EventDto(i)));
                let timeToAdd = ((Math.ceil((startDate - eventDate) / 86400000) / 7) + (i.repeat.parameter - repeatDelta)) * 86400000 * 7;
                newEvent.startDate = new Date(eventDate.getTime() + timeToAdd).toISOString();
                if (i.endDate)
                  newEvent.endDate = new Date(new Date(i.endDate).getTime() + timeToAdd).toISOString();
                events.push(newEvent);
              }
              break;
            case 'month':
              startMonth = startDate.getMonth();
              eventMonth = eventDate.getMonth();
              let monthCount = (startDate.getFullYear() - eventDate.getFullYear() - (startMonth < eventMonth ? 1 : 0)) * 12 + (startMonth >= eventMonth ? startMonth - eventMonth : 12 + startMonth - eventMonth);
              monthCount += i.repeat.parameter - ((monthCount % i.repeat.parameter) || i.repeat.parameter);
              let yearsToAdd = Math.floor(monthCount / 12);
              let monthsToAdd = monthCount % 12;
              newDate = new Date(eventDate);
              newDate.setUTCFullYear(newDate.getUTCFullYear() + yearsToAdd);
              newDate.setUTCMonth(newDate.getUTCMonth() + monthsToAdd);
              if (newDate.getUTCDate() != eventDate.getUTCDate())
                newDate.setUTCDate(0);
              if (newDate >= startDate && newDate < endDate) {
                const newEvent = JSON.parse(JSON.stringify(new EventDto(i)));
                newEvent.startDate = newDate.toISOString();
                if (i.endDate) {
                  const newEndDate = new Date(i.endDate);
                  newEndDate.setUTCFullYear(newEndDate.getUTCFullYear() + yearsToAdd);
                  newEndDate.setUTCMonth(newEndDate.getUTCMonth() + monthsToAdd);
                  if (newEndDate.getUTCDate() != new Date(i.endDate).getUTCDate())
                    newEndDate.setUTCDate(0);
                  newEvent.endDate = newEndDate.toISOString();
                }
                events.push(newEvent);
              }
              break;
            case 'year':
              startMonth = startDate.getMonth();
              eventMonth = eventDate.getMonth();
              let yearsCount = (startDate.getFullYear() - eventDate.getFullYear() - (startMonth < eventMonth ? 1 : 0));
              yearsCount += i.repeat.parameter - ((yearsCount % i.repeat.parameter) || i.repeat.parameter);
              newDate = new Date(eventDate);
              newDate.setUTCFullYear(newDate.getUTCFullYear() + yearsCount);
              if (newDate.getUTCDate() != eventDate.getUTCDate())
                newDate.setUTCDate(0);
              if (newDate >= startDate && newDate < endDate) {
                const newEvent = JSON.parse(JSON.stringify(new EventDto(i)));
                newEvent.startDate = newDate.toISOString();
                if (i.endDate) {
                  const newEndDate = new Date(i.endDate);
                  newEndDate.setUTCFullYear(newEndDate.getUTCFullYear() + yearsCount);
                  if (newEndDate.getUTCDate() != new Date(i.endDate).getUTCDate())
                    newEndDate.setUTCDate(0);
                  newEvent.endDate = newEndDate.toISOString();
                }
                events.push(newEvent);
              }
              break;
          }
        }
        const currEventCount = events.length;
        for (let i = 0; i < currEventCount; ++i) {
          if (events[i].authorId)
            events[i].author = new UserDto(await User.findOne({ _id: events[i].authorId }).select('id login avatar'));
          events[i] = new EventDto(events[i]);
          if (events[i].repeat) {
            let eventDate = new Date(events[i].startDate);
            const timeToAdd = {};
            if (events[i].repeat.frequency !== 'week')
              timeToAdd[events[i].repeat.frequency] = events[i].repeat.parameter;
            else
              timeToAdd.day = events[i].repeat.parameter * 7;
            let j = 1;
            while (new Date(Date.UTC(eventDate.getUTCFullYear() + (timeToAdd.year || 0) * j,
                                     eventDate.getMonth() + (timeToAdd.month || 0) * j,
                                     eventDate.getUTCDate() + (timeToAdd.day || 0) * j))
              < endDate) {
              const newEvent = JSON.parse(JSON.stringify(new EventDto(events[i])));
              const newStartDate = new Date(eventDate);
              newStartDate.setUTCFullYear(newStartDate.getUTCFullYear() + (timeToAdd.year || 0) * j);
              newStartDate.setUTCMonth(newStartDate.getUTCMonth() + (timeToAdd.month || 0) * j);
              newStartDate.setUTCDate(newStartDate.getUTCDate() + (timeToAdd.day || 0) * j);
              if (!timeToAdd.day && newStartDate.getUTCDate() != eventDate.getUTCDate())
                newStartDate.setUTCDate(0);
              newEvent.startDate = newStartDate.toISOString();
              if (events[i].endDate) {
                const newEndDate = new Date(events[i].endDate);
                newEndDate.setUTCFullYear(newEndDate.getUTCFullYear() + (timeToAdd.year || 0) * j);
                newEndDate.setUTCMonth(newEndDate.getUTCMonth() + (timeToAdd.month || 0) * j);
                newEndDate.setUTCDate(newEndDate.getUTCDate() + (timeToAdd.day || 0) * j);
                if (!timeToAdd.day && newEndDate.getUTCDate() != new Date(events[i].endDate).getUTCDate())
                  newEndDate.setUTCDate(0);
                newEvent.endDate = newEndDate.toISOString();
              }
              events.push(newEvent);
              j += 1;
            }
          }
        }
        req.user.visibilitySettings = {
          calendars: req.body.calendar,
          eventTypes: req.body.type,
          tags: parameters.tags?.$in
        };
        await req.user.save();
      } else
        events = events.map(event => new EventDto(event));
      events.sort((a, b) => {
        const firstStartDate = new Date(a.startDate);
        const secondStartDate = new Date(b.startDate);
        if (req.body.search !== undefined) {
          if ((firstStartDate > today && secondStartDate < today)
            || (firstStartDate < today && secondStartDate > today))
            return secondStartDate - firstStartDate;
          else
            return Math.abs(firstStartDate - today) - Math.abs(secondStartDate - today);
        } else
          return firstStartDate - secondStartDate;
      });
      if (req.body.search !== undefined)
        events = events.slice(0, req.body.limit || 0);
      return res.status(200).json({
        message: 'Getting events successfully',
        data: { events }
      })
    } catch (err) {
      err.message = `Getting events failed: ${err.message}`;
      throw err;
    }
  }

  async getOne(req, res) {
    try {
      const eventId = req.params.eventId;
      const event = await Event.findOne({ _id: eventId }).populate('tags');

      if (!event) return res.status(404).json({ message: 'Event is not found' });
      event.author = new UserDto(await User.findOne({ _id: event.authorId }).select('id login avatar'));

      const result = new EventDto(event);
      if (event.author.id.toString() !== req.user._id.toString())
        event.participants = event.participants.filter(participant => participant.isConfirmed === null);
      result.participants = [];
      for (let i of event.participants) {
        const user = await User.findOne({ _id: i.participantId });
        if (user)
          result.participants.push({
            id: user._id,
            login: user.login,
            avatar: user.avatar,
            isConfirmed: i.isConfirmed === null ? true:false
          });
      }
      const calendar = await Calendar.findOne({
        _id: event.calendarId
      });
      if (!calendar)
        return res.status(404).json({
          message: "Calendar is not found"
        });
      result.calendar = {
        id: calendar._id,
        name: calendar.name,
        color: calendar.color,
        authorId: calendar.authorId
      };
      delete result.calendarId;

      return res.status(200).json({
        message: 'Fetched event data successfully',
        data: { event: result }
      });
    } catch (err) {
      if (err instanceof CastError)
        return res.status(404).json({ message: 'Invalid event ID' });
      err.message = `Getting event data failed: ${err.message}`;
      throw err;
    }
  }

  async viewParticipation(req, res) {
    try {
      const event = await Event.findOne({
        _id: req.eventId
      }).select("name calendarId authorId");
      if (!event)
        return res.status(404).json({
          message: "Event is not found"
        });
      const calendar = await Calendar.findOne({
        _id: event.calendarId
      }).select("name authorId");
      if (!calendar)
        return res.status(404).json({
          message: "Calendar is not found"
        });
      const author = await User.findOne({
        _id: event.authorId
      });
      if (!author)
        return res.status(404).json({
          message: "Author of the event is not found"
        });
      let eventDto = new EventDto(event);
      eventDto.author = {
        id: author._id,
        login: author.login
      };
      eventDto.calendar = {
        id: calendar._id,
        name: calendar.name
      };
      delete eventDto.calendarId;
      delete eventDto.tags;
      return res.status(200).json({
        message: "Fetched event successfully",
        data: {
          event: eventDto
        }
      });
    } catch (err) {
      if (err instanceof CastError)
        return res.status(404).json({ message: 'Event is not found' });
      err.message = `Getting event failed: ${err.message}`;
      throw err;
    }
  }

  async sendParticipationMail(req, res) {
    try {
      if (!req.body)
        return res.status(400).json({
          message: "Body is not provided"
        });
      const event = await Event.findOne({
        _id: req.params.eventId
      });
      if (!event)
        return res.status(404).json({
          message: "Event is not found"
        });
      const calendar = await Calendar.findOne({
        _id: event.calendarId
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
      for (let i = 0; i < event.participants.length; i += 1) {
        if (event.participants[i].participantId.toString() === user._id.toString()) {
          let calendarParticipant = false;
          for (let j of calendar.participants) {
            if (j.participantId.toString() === newEvent.participants[i].participantId.toString() && j.isConfirmed === null) {
              calendarParticipant = true;
              break;
            }
          }
          if (!calendarParticipant) {
            calendar.participants.push({
              participantId: user._id,
              isConfirmed: await createParticipationToken(user, calendar.id)
            });
            await calendar.save();
            await sendCalendarParticipation(user, calendar, calendar.participants[calendar.participants.length - 1].isConfirmed);
          }
          event.participants[i].isConfirmed = await createParticipationToken(user, undefined, event.id);
          await event.save();
          await sendEventParticipation(user, event, event.participants[i].isConfirmed);
          return res.status(200).json({
            message: "Participation link has been sent to the user's email address"
          });
        }
      }
      return res.status(403).json({
        message: "You are not a participant of the event"
      });
    } catch (err) {
      if (err instanceof CastError)
        return res.status(404).json({ message: 'Event is not found' });
      err.message = `Participation mail sending failed: ${err.message}`;
      throw err;
    }
  }
  
  async confirmParticipation(req, res) {
    try {
      const event = await Event.findOne({
        _id: req.eventId
      });
      if (!event)
        return res.status(404).json({
          message: "Event is not found"
        });
      const calendar = await Calendar.findOne({
        _id: event.calendarId
      });
      if (!calendar)
        return res.status(404).json({
          message: "Calendar is not found"
        });
      let calendarParticipant = false;
      for (let j of calendar.participants) {
        if (j.participantId.toString() === req.user._id.toString() && j.isConfirmed === null) {
          calendarParticipant = true;
          break;
        }
      }
      if (!calendarParticipant)
        return res.status(403).json({
          message: "You are not a participant of the calendar"
        });
      for (let i = 0; i < event.participants.length; i += 1) {
        if (event.participants[i].participantId.toString() === req.user._id.toString()) {
          if (event.participants[i].isConfirmed === null)
            return res.status(400).json({
              message: "Your participation in the event has already been confirmed"
            });
          else {
            if (event.participants[i].isConfirmed === req.params.confirmToken) {
              event.participants[i].isConfirmed = null;
              await event.save();
              return res.status(200).json({
                message: "Confirmed participation in the event successfully"
              });
            } else
              return res.status(400).json({
                message: "Invalid or expired participation token. Please use the link from the latest email"
              });
          }
        }
      }
      return res.status(403).json({
        message: "You are not a participant of the event"
      });
    } catch (err) {
      if (err instanceof CastError)
        return res.status(404).json({ message: 'Event is not found' });
      err.message = `Participation confirmation failed: ${err.message}`;
      throw err;
    }
  }

  async editOne(req, res) {
    try {
      const { name, description, color, participants, tags, repeat, link, visibleForAll } = req.body;
      const eventId = req.params.eventId;
      const event = await Event.findOne({ _id: eventId });

      if (!event) return res.status(404).json({ message: 'Event is not found' });
      if (event.authorId.toString() != req.user._id.toString())
        return res.status(403).json({ message: 'You are not an author of the event' });
      const calendar = await Calendar.findOne({ _id: event.calendarId });

      if (name)
        event.name = name;
      if (event.description || description !== undefined) event.description = description;
      if (event.color || color) event.color = color;
      if (calendar.type == 'main' || calendar.type == 'holidays') {
        event.participants = [];
        event.visibleForAll = false;
      } else {
        let filteredParticipants = participants;
        if (visibleForAll !== undefined && visibleForAll !== event.visibleForAll) {
          if (visibleForAll || !participants) {
            filteredParticipants = [];
            if (visibleForAll)
              event.participants = filteredParticipants;
          }
          event.visibleForAll = visibleForAll;
        }
        if (filteredParticipants && !event.visibleForAll) {
          if (!filteredParticipants.includes(calendar.authorId.toString()))
            filteredParticipants.splice(0, 0, calendar.authorId.toString())
          if (!filteredParticipants.includes(req.user._id.toString()))
            filteredParticipants.splice(0, 0, req.user._id.toString())
          for (let i = filteredParticipants.length - 1; i >= 0; --i) {
            if (!(filteredParticipants[i] === req.user._id.toString()
              || filteredParticipants[i] === calendar.authorId.toString()
              || await User.findOne({ _id: filteredParticipants[i] }))
              || filteredParticipants.indexOf(filteredParticipants[i]) < i)
              filteredParticipants.splice(i, 1);
            else {
              let present = false;
              for (let j of event.participants) {
                if (j.participantId.toString() === filteredParticipants[i]) {
                  filteredParticipants[i] = j;
                  present = true;
                  break;
                }
              }
              if (!present) {
                const user = await User.findOne({
                  _id: filteredParticipants[i]
                }).select("+email");
                if (user) {
                  let calendarParticipant = false;
                  for (let j of calendar.participants) {
                    if (j.participantId.toString() === filteredParticipants[i] && j.isConfirmed === null) {
                      calendarParticipant = true;
                      break;
                    }
                  }
                  if (!calendarParticipant) {
                    calendar.participants.push({
                      participantId: user._id,
                      isConfirmed: await createParticipationToken(user, calendar.id)
                    });
                    await calendar.save();
                    await sendCalendarParticipation(user, calendar, calendar.participants[calendar.participants.length - 1].isConfirmed);
                  }
                  filteredParticipants[i] = {
                    participantId: user._id,
                    isConfirmed: await createParticipationToken(user, undefined, event.id)
                  };
                  await sendEventParticipation(user, event, filteredParticipants[i].isConfirmed);
                }
              }
            }
          }
          filteredParticipants.sort((p1, p2) => {
            if (p1.participantId.toString() === req.user._id.toString()
                || p1.participantId.toString() === calendar.authorId.toString())
              return -1
            else if (p2.participantId.toString() === req.user._id.toString()
                     || p2.participantId.toString() === calendar.authorId.toString())
              return 1
            else
              return 0
          });
          event.participants = filteredParticipants;
        }
      }
      if (tags)
        for (let i = tags.length - 1; i >= 0; --i) {
          if (!(await Tag.findOne({ _id: tags[i] }))
            || tags.indexOf(tags[i]) < i)
            tags.splice(i, 1);
        }
        event.tags = tags;
      if ((event.type === 'arrangement' || event.type === 'reminder') && (event.repeat || repeat))
        event.repeat = repeat;
      if (event.type === 'arrangement' && (event.link || link)) event.link = link;

      if (event.isModified()) {
        await event.save();
        const result = await event.populate('tags');
        result.author = new UserDto(await User.findOne({ _id: result.authorId }).select('id login avatar'));
        return res.status(result ? 200:500).json({
          message: result ? 'Updated event successully':"Something went wrong",
          data: result ? { event: new EventDto(result) }:undefined
        });
      } else return res.status(200).json({ message: 'Nothing has changed' });
    } catch (err) {
      err.message = `Updating event failed: ${err.message}`;
      throw err;
    }
  }

  async deleteOne(req, res) {
    try {
      const event = await Event.findOne({
        _id: req.params.eventId
      });
      if (!event)
        return res.status(404).json({
          message: "Event is not found"
        });
      if (event.authorId.toString() === req.user._id.toString()) {
        await Event.deleteOne({ _id: event.id });
        return res.status(200).json({ message: 'Deleted event successfully' });
      } else
        return res.status(403).json({
          message: "You are not the author"
        });
    } catch (err) {
      err.message = `Deleting event failed: ${err.message}`;
      throw err;
    }
  }

  async markDone(req, res) {
    try {
      const event = await Event.findOne({
        _id: req.params.eventId
      });
      if (!event)
        return res.status(404).json({
          message: "The event is not found"
        });
      if (event.type !== "task")
        return res.status(400).json({
          message: "The event is not a task"
        });
      const eventCalendar = await Calendar.findOne({ _id: event.calendarId });
      if (!(event.participants.includes(req.user._id)
        || (event.visibleForAll && eventCalendar?.participants.includes(req.user._id))))
        return res.status(403).json({
          message: "You are not the participant"
        });
      if (event.doneDate !== null)
        return res.status(400).json({
          message: "The task is already done"
        });
      event.doneDate = Date.now();
      const result = await event.save();
      return res.status(result ? 200:500).json({
        message: result ? 'Marking done successully':'Something went wrong'
      });
    } catch (err) {
      err.message = `Marking done failed: ${err.message}`;
      throw err;
    }
  }

  async markUndone(req, res) {
    try {
      const event = await Event.findOne({
        _id: req.params.eventId
      });
      if (!event)
        return res.status(404).json({
          message: "The event is not found"
        });
      if (event.type !== "task")
        return res.status(400).json({
          message: "The event is not a task"
        });
      const eventCalendar = await Calendar.findOne({ _id: event.calendarId });
      if (!(event.participants.includes(req.user._id)
        || (event.visibleForAll && eventCalendar?.participants.includes(req.user._id))))
        return res.status(403).json({
          message: "You are not the participant"
        });
      if (event.doneDate === null)
        return res.status(400).json({
          message: "The task is not done yet"
        });
      event.doneDate = null;
      const result = await event.save();
      return res.status(result ? 200:500).json({
        message: result ? 'Unmarking done successully':'Something went wrong'
      });
    } catch (err) {
      err.message = `Unmarking done failed: ${err.message}`;
      throw err;
    }
  }
}

export default new Events;
