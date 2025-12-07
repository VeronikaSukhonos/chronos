import axios from 'axios';
import { CastError } from 'mongoose';

import Event from '../models/eventModel.js';
import { EventDto } from '../dtos/eventDto.js';
import User from '../models/userModel.js';
import { UserDto } from '../dtos/userDto.js';
import Calendar from '../models/calendarModel.js';
import Tag from '../models/tagModel.js';
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
      const searchTags = [];
      if (req.body.tag) {
        if (!(req.body.tag instanceof Array))
          req.body.tag = [req.body.tag];
        for (let i = req.body.tag.length - 1; i >= 0; --i) {
          const tag = await Tag.findOne({ _id: req.body.tag[i] });
          if (!tag || req.body.tag.indexOf(req.body.tag[i]) < i)
            req.body.tag.splice(i, 1);
          else
            searchTags.splice(0, 0, tag.title);
        }
      }
      const today = new Date();
      let startDate, endDate, events;
      if (req.body.search !== undefined) {
        parameters.name = {
          $regex: new RegExp(req.body.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'i')
        };
        events = await Event.find({
                                    ...parameters,
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
                                      { visibleForAll: true }
                                    ]
                                  })
                            .select("-participants")
                            .populate('tags');
      } else {
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
        events = await Event.find({
                                    ...parameters,
                                    $and: [
                                      {
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
                                          { visibleForAll: true }
                                        ]
                                      },
                                      {
                                        $or: [
                                          { startDate: { $gte: startDate, $lt: endDate } },
                                          {
                                            startDate: { $lt: startDate },
                                            endDate: { $gte: startDate }
                                          }
                                        ]
                                      }
                                    ]
                                  })
                            .select("-participants")
                            .populate('tags');
      }
      if (req.body.tag)
        events = events.filter(event => event.tags.some(tag => searchTags.includes(tag.title)));
      if (req.body.search === undefined) {
        if (getHolidays && req.body.country && !req.body.tag) {
          if (!holidaysCalendar)
            holidaysCalendar = await Calendar.findOne({ authorId: req.user._id, type: 'holidays' });
          const startYearHolidaysResponce = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${startDate.getFullYear()}/${req.body.country}`);
          let endYearHolidaysResponce = { data: [] };
          if (startDate.getFullYear() != endDate.getFullYear())
            endYearHolidaysResponce = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${endDate.getFullYear()}/${req.body.country}`);
          events = events.concat(startYearHolidaysResponce.data.map(holiday => {
                                                                                 return {
                                                                                  calendarId: holidaysCalendar._id,
                                                                                  name: holiday.name,
                                                                                  startDate: holiday.date,
                                                                                  allDay: true, type: 'holiday',
                                                                                  color: holidaysCalendar.color
                                                                                };
                                                                              })
                                                               .filter(holiday => new Date(holiday.startDate) >= startDate && new Date(holiday.startDate) < endDate),
                                 endYearHolidaysResponce.data.map(holiday => {
                                                                               return {
                                                                                calendarId: holidaysCalendar._id,
                                                                                name: holiday.name,
                                                                                startDate: holiday.date,
                                                                                allDay: true, type: 'holiday',
                                                                                color: holidaysCalendar.color
                                                                              };
                                                                            })
                                                               .filter(holiday => new Date(holiday.startDate) < endDate));
        }
        let repeatEvents = await Event.find({
                                              ...parameters,
                                              startDate: { $lt: startDate },
                                              repeat: { $exists: true },
                                              $and: [
                                                {
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
                                                    { visibleForAll: true }
                                                  ]
                                                },
                                                {
                                                  $or: [
                                                    { endDate: { $exists: false } },
                                                    { endDate: { $lt: startDate } }
                                                  ]
                                                }
                                              ]
                                            })
                                      .select("-participants")
                                      .populate('tags');
        if (req.body.tag)
          repeatEvents = repeatEvents.filter(event => event.tags.some(tag => searchTags.includes(tag.title)));
        for (let i of repeatEvents) {
          let eventDate = new Date(i.startDate);
          let eventEndDate = new Date(i.endDate);
          let repeatDelta, nextRepeatEventTime, prevRepeatEventTime, prevRepeatEventEndTime, startMonth, eventMonth, newDate, prevDate;
          if (i.authorId)
            i.author = new UserDto(await User.findOne({ _id: i.authorId }).select('id login avatar'));
          switch (i.repeat?.frequency) {
            case 'day':
              repeatDelta = (Math.ceil((startDate - eventDate) / 86400000) % i.repeat.parameter) || i.repeat.parameter;
              nextRepeatEventTime = startDate.getTime() + (i.repeat.parameter - repeatDelta) * 86400000;
              prevRepeatEventTime = nextRepeatEventTime - i.repeat.parameter * 86400000;
              prevRepeatEventEndTime = prevRepeatEventTime +
                                       ((eventEndDate.getTime() - (eventEndDate.getUTCHours() * 3600000 + eventEndDate.getUTCMinutes() * 60000 + eventEndDate.getUTCSeconds() * 1000 + eventEndDate.getUTCMilliseconds())) -
                                       (eventDate.getTime() - (eventDate.getUTCHours() * 3600000 + eventDate.getUTCMinutes() * 60000 + eventDate.getUTCSeconds() * 1000 + eventDate.getUTCMilliseconds()))) * 86400000;
              if ((prevRepeatEventTime < startDate && prevRepeatEventEndTime >= startDate)
                || (nextRepeatEventTime >= startDate && nextRepeatEventTime < endDate)) {
                const newEvent = JSON.parse(JSON.stringify(new EventDto(i, true)));
                let timeToAdd = (Math.ceil((startDate - eventDate) / 86400000) + (i.repeat.parameter - repeatDelta - (prevRepeatEventTime < startDate && prevRepeatEventEndTime >= startDate ? i.repeat.parameter:0))) * 86400000;
                newEvent.startDate = new Date(eventDate.getTime() + timeToAdd).toISOString();
                if (i.endDate)
                  newEvent.endDate = new Date(new Date(i.endDate).getTime() + timeToAdd).toISOString();
                events.push(newEvent);
              }
              break;
            case 'week':
              repeatDelta = ((Math.ceil((startDate - eventDate) / 86400000) / 7) % i.repeat.parameter) || i.repeat.parameter;
              nextRepeatEventTime = startDate.getTime() + (i.repeat.parameter - repeatDelta) * 86400000 * 7 + (7 - ((Math.ceil((startDate - eventDate) / 86400000) % 7) || 7)) * 86400000;
              prevRepeatEventTime = nextRepeatEventTime - i.repeat.parameter * 7 * 86400000;
              prevRepeatEventEndTime = prevRepeatEventTime +
                                       ((eventEndDate.getTime() - (eventEndDate.getUTCHours() * 3600000 + eventEndDate.getUTCMinutes() * 60000 + eventEndDate.getUTCSeconds() * 1000 + eventEndDate.getUTCMilliseconds())) -
                                       (eventDate.getTime() - (eventDate.getUTCHours() * 3600000 + eventDate.getUTCMinutes() * 60000 + eventDate.getUTCSeconds() * 1000 + eventDate.getUTCMilliseconds()))) * 86400000;
              if ((prevRepeatEventTime < startDate && prevRepeatEventEndTime >= startDate)
                || (nextRepeatEventTime >= startDate && nextRepeatEventTime < endDate)) {
                const newEvent = JSON.parse(JSON.stringify(new EventDto(i, true)));
                let timeToAdd = ((Math.ceil((startDate - eventDate) / 86400000) / 7) + (i.repeat.parameter - repeatDelta - (prevRepeatEventTime < startDate && prevRepeatEventEndTime >= startDate ? i.repeat.parameter:0))) * 86400000 * 7;
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
              newDate.setFullYear(newDate.getFullYear() + yearsToAdd);
              newDate.setMonth(newDate.getMonth() + monthsToAdd);
              if (newDate.getDate() != eventDate.getDate())
                newDate.setDate(0);
              prevDate = new Date(eventDate);
              prevDate.setFullYear(prevDate.getFullYear() + yearsToAdd);
              prevDate.setMonth(prevDate.getMonth() + monthsToAdd - i.repeat.parameter);
              if (prevDate.getDate() != eventDate.getDate())
                prevDate.setDate(0);
              if ((prevDate < startDate && prevDate + (new Date(i.endDate) - new Date(i.startDate)) >= startDate)
                || (newDate >= startDate && newDate < endDate)) {
                const newEvent = JSON.parse(JSON.stringify(new EventDto(i, true)));
                newEvent.startDate = (prevDate < startDate && prevDate + (new Date(i.endDate) - new Date(i.startDate)) >= startDate ? prevDate:newDate).toISOString();
                if (i.endDate) {
                  const newEndDate = new Date(i.endDate);
                  newEndDate.setFullYear(newEndDate.getFullYear() + yearsToAdd);
                  newEndDate.setMonth(newEndDate.getMonth() + monthsToAdd - (prevDate < startDate && prevDate + (new Date(i.endDate) - new Date(i.startDate)) >= startDate ? i.repeat.parameter:0));
                  if (newEndDate.getDate() != new Date(i.endDate).getDate())
                    newEndDate.setDate(0);
                  newEvent.endDate = newEndDate.toISOString();
                }
                events.push(newEvent);
              }
              break;
            case 'year':
              startMonth = startDate.getMonth();
              eventMonth = eventDate.getMonth();
              let yearsCount = startDate.getFullYear() - eventDate.getFullYear();
              yearsCount += i.repeat.parameter - ((yearsCount % i.repeat.parameter) || i.repeat.parameter);
              newDate = new Date(eventDate);
              newDate.setFullYear(newDate.getFullYear() + yearsCount);
              if (newDate.getDate() != eventDate.getDate())
                newDate.setDate(0);
              prevDate = new Date(eventDate);
              prevDate.setFullYear(prevDate.getFullYear() + yearsCount - i.repeat.parameter);
              if (prevDate.getDate() != eventDate.getDate())
                prevDate.setDate(0);
              if ((prevDate < startDate && prevDate + (new Date(i.endDate) - new Date(i.startDate)) >= startDate)
                || (newDate >= startDate && newDate < endDate)) {
                const newEvent = JSON.parse(JSON.stringify(new EventDto(i, true)));
                newEvent.startDate = (prevDate < startDate && prevDate + (new Date(i.endDate) - new Date(i.startDate)) >= startDate ? prevDate:newDate).toISOString();
                if (i.endDate) {
                  const newEndDate = new Date(i.endDate);
                  newEndDate.setFullYear(newEndDate.getFullYear() + yearsCount - (prevDate < startDate && prevDate + (new Date(i.endDate) - new Date(i.startDate)) >= startDate ? i.repeat.parameter:0));
                  if (newEndDate.getDate() != new Date(i.endDate).getDate())
                    newEndDate.setDate(0);
                  newEvent.endDate = newEndDate.toISOString();
                }
                if (i.type == 'birthday')
                  newEvent.birthday = i.startDate;
                events.push(newEvent);
              }
              break;
          }
        }
        const currEventCount = events.length;
        for (let i = 0; i < currEventCount; ++i) {
          if (events[i].authorId)
            events[i].author = new UserDto(await User.findOne({ _id: events[i].authorId }).select('id login avatar'));
          if (events[i].type == 'birthday' && !events[i].birthday)
            events[i].birthday = events[i].startDate;
          events[i] = new EventDto(events[i]);
          if (events[i].repeat && events[i].repeat.frequency && events[i].repeat.parameter) {
            let eventDate = new Date(events[i].startDate);
            const timeToAdd = {};
            if (events[i].repeat.frequency !== 'week')
              timeToAdd[events[i].repeat.frequency] = events[i].repeat.parameter;
            else
              timeToAdd.day = events[i].repeat.parameter * 7;
            let j = 1;
            while ((timeToAdd.year || timeToAdd.month || timeToAdd.day)
              && new Date(Date.UTC(eventDate.getUTCFullYear() + (timeToAdd.year || 0) * j,
                                   eventDate.getUTCMonth() + (timeToAdd.month || 0) * j,
                                   eventDate.getUTCDate() + (timeToAdd.day || 0) * j))
              < endDate) {
              const newEvent = JSON.parse(JSON.stringify(events[i]));
              const newStartDate = new Date(eventDate);
              newStartDate.setFullYear(newStartDate.getFullYear() + (timeToAdd.year || 0) * j);
              newStartDate.setMonth(newStartDate.getMonth() + (timeToAdd.month || 0) * j);
              newStartDate.setDate(newStartDate.getDate() + (timeToAdd.day || 0) * j);
              if (!timeToAdd.day && newStartDate.getDate() != eventDate.getDate())
                newStartDate.setDate(0);
              newEvent.startDate = newStartDate.toISOString();
              if (events[i].endDate) {
                const newEndDate = new Date(events[i].endDate);
                newEndDate.setFullYear(newEndDate.getFullYear() + (timeToAdd.year || 0) * j);
                newEndDate.setMonth(newEndDate.getMonth() + (timeToAdd.month || 0) * j);
                newEndDate.setDate(newEndDate.getDate() + (timeToAdd.day || 0) * j);
                if (!timeToAdd.day && newEndDate.getDate() != new Date(events[i].endDate).getDate())
                  newEndDate.setDate(0);
                newEvent.endDate = newEndDate.toISOString();
              }
              events.push(newEvent);
              j += 1;
            }
          }
        }
        if (req.body.vsChange !== false) {
          req.user.visibilitySettings = {
            calendars: req.body.calendar,
            eventTypes: req.body.type,
            tags: req.body.tag
          };
          await req.user.save();
        }
      } else
        events = await Promise.all(events.map(async event => {
          event = await event.populate('calendarId');
          const formattedEvent = new EventDto(event);
          formattedEvent.calendar = {
            id: event.calendarId._id.toString(),
            name: event.calendarId.name,
            color: event.calendarId.color
          };
          delete formattedEvent.calendarId;
          return formattedEvent;
        }));
      events.sort((a, b) => {
        const firstStartDate = new Date(a.startDate);
        const secondStartDate = new Date(b.startDate);
        const firstCreateDate = new Date(a.createDate);
        const secondCreateDate = new Date(b.createDate);
        if (req.body.search !== undefined) {
          if ((firstStartDate >= today && secondStartDate < today)
            || (firstStartDate <= today && secondStartDate > today))
            return secondStartDate - firstStartDate;
          else
            return firstStartDate !== secondStartDate
                   ? Math.abs(firstStartDate - today) - Math.abs(secondStartDate - today)
                   : Math.abs(firstCreateDate - today) - Math.abs(secondCreateDate - today);
        } else
          return firstStartDate !== secondStartDate
                 ? firstStartDate - secondStartDate
                 : firstCreateDate - secondCreateDate;
      });
      if (req.body.search !== undefined && req.body.limit !== undefined)
        events = events.slice(0, req.body.limit || 0);
      return res.status(200).json({
        message: 'Fetched events successfully',
        data: { events }
      })
    } catch (err) {
      if (err instanceof CastError)
        return res.status(404).json({ message: 'Calendar is not found' });
      err.message = `Fetching events failed: ${err.message}`;
      throw err;
    }
  }

  async getOne(req, res) {
    try {
      const eventId = req.params.eventId;
      const event = await Event.findOne({ _id: eventId }).populate('tags');

      if (!event) return res.status(404).json({ message: 'Event is not found' });
      const calendar = await Calendar.findOne({
        _id: event.calendarId
      });
      if (!calendar)
        return res.status(404).json({
          message: "Calendar is not found"
        });
      event.author = new UserDto(await User.findOne({ _id: event.authorId }).select('id login avatar'));

      let hasAccess = false;
      if (event.author.id.toString() === req.user._id.toString())
        hasAccess = true;
      else if (event.visibleForAll) {
        if (calendar.isPublic && calendar.followers.includes(req.user._id))
          hasAccess = true;
        else {
          for (let i of calendar.participants) {
            if (i.participantId.toString() === req.user._id.toString() && i.isConfirmed === null) {
              hasAccess = true;
              break;
            }
          }
        }
      } else {
        for (let i of event.participants) {
          if (i.participantId.toString() === req.user._id.toString() && i.isConfirmed === null) {
            hasAccess = true;
            break;
          }
        }
      }
      
      if (hasAccess) {
        const result = new EventDto(event, true);
        if (event.author.id.toString() !== req.user._id.toString()
          && calendar.authorId.toString() !== req.user._id.toString())
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
        result.calendar = {
          id: calendar._id,
          name: calendar.name,
          color: calendar.color,
          author: new UserDto(await User.findOne({ _id: calendar.authorId }).select('id login avatar')),
          type: calendar.type
        };
        delete result.calendarId;
        
        return res.status(200).json({
          message: 'Fetched event data successfully',
          data: { event: result }
        });
      } else
        return res.status(403).json({
          message: 'You do not have access to this event'
        });
    } catch (err) {
      if (err instanceof CastError)
        return res.status(404).json({ message: 'Event is not found' });
      err.message = `Fetching event data failed: ${err.message}`;
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
      err.message = `Fetched event failed: ${err.message}`;
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
          for (let j = 0; j < calendar.participants.length; i += 1) {
            if (calendar.participants[j].participantId.toString() === event.participants[i].participantId.toString()) {
              calendarParticipant = calendar.participants[j].isConfirmed === null ? true:j;
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
          if (calendarParticipant !== true) {
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
      const { name, description, startDate, endDate, color, participants, tags, repeat, link, visibleForAll, allDay } = req.body;
      const eventId = req.params.eventId;
      const event = await Event.findOne({ _id: eventId });

      if (!event) return res.status(404).json({ message: 'Event is not found' });
      const calendar = await Calendar.findOne({ _id: event.calendarId });
      if (!calendar)
        return res.status(404).json({
          message: "Calendar is not found"
        });
      if (event.authorId.toString() != req.user._id.toString()
        && calendar.authorId.toString() != req.user._id.toString())
        return res.status(403).json({ message: 'You do not have rights to edit the event' });

      if (name)
        event.name = name;
      if (event.description || description !== undefined) event.description = description;
      if (event.color || color) event.color = color;
      if (!(event.type == 'birthday' || event.type == 'holiday')
        && allDay !== undefined && allDay !== event.allDay) {
        event.allDay = allDay;
        if (event.allDay) {
          event.endDate = new Date(new Date(event.startDate).getTime() + 23 * 3600000 + 59 * 60000 + 59 * 1000 + 999).toISOString();
        }
      }
      if (!event.allDay) {
        if (startDate)
          event.startDate = startDate;
        if ((event.type == 'arrangement' || event.type == 'task') && endDate) {
          if (new Date(endDate) <= new Date(event.startDate))
            return res.status(400).json({
              message: "Validation failed",
              errors: [{ param: "endDate", error: "End date must be later than start date" }]
            });
          else
            event.endDate = endDate;
        }
      }
      if (!(calendar.type == 'main' || calendar.type == 'holidays')) {
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
            if (filteredParticipants.indexOf(filteredParticipants[i]) < i
              || !(filteredParticipants[i] === req.user._id.toString()
              || filteredParticipants[i] === calendar.authorId.toString()
              || await User.findOne({ _id: filteredParticipants[i] })))
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
                  if (filteredParticipants[i] === req.user._id.toString()
                    || filteredParticipants[i] === calendar.authorId.toString())
                    filteredParticipants[i] = {
                      participantId: user._id,
                      isConfirmed: null
                    };
                  else {
                    let calendarParticipant = false;
                    for (let j = 0; j < calendar.participants.length; i += 1) {
                      if (calendar.participants[j].participantId.toString() === filteredParticipants[i]) {
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
                    filteredParticipants[i] = {
                      participantId: user._id,
                      isConfirmed: await createParticipationToken(user, undefined, event.id)
                    };
                    await sendEventParticipation(user, event, filteredParticipants[i].isConfirmed);
                  }
                }
              }
            }
          }
          await calendar.save();
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
          if (!(await Tag.findOne({ _id: tags[i], authorId: req.user._id }))
            || tags.indexOf(tags[i]) < i)
            tags.splice(i, 1);
        }
        event.tags = tags;
      if ((event.type === 'arrangement' || event.type === 'reminder') && (event.repeat || repeat))
        event.repeat = repeat !== null ? repeat:undefined;
      if (event.type == 'arrangement' && event.repeat) {
        const timeDelta = new Date(event.endDate) - new Date(event.startDate);
        let repetitionTime = 86400000 * event.repeat.parameter;
        if (event.repeat.frequency === 'week')
          repetitionTime *= 7;
        else if (event.repeat.frequency === 'month')
          repetitionTime *= 30
        else if (event.repeat.frequency === 'year')
          repetitionTime *= 365;
        if (timeDelta >= repetitionTime)
          return res.status(400).json({
            message: "Validation failed",
            errors: [{ param: "repeat", error: "Repeat period must be longer that event duration" }]
          });
      }
      if (event.type === 'arrangement' && (event.link || link !== undefined)) event.link = link;

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
      if (err instanceof CastError)
        return res.status(404).json({ message: 'Event is not found' });
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
      const calendar = await Calendar.findOne({ _id: event.calendarId });
      if (!calendar)
        return res.status(404).json({
          message: "Calendar is not found"
        });
      let hasRights = false;
      if (event.authorId.toString() === req.user._id.toString()
        || calendar.authorId.toString() === req.user._id.toString())
        hasRights = true;
      else {
        for (let i of event.participants) {
          if (i.participantId.toString() === req.user._id.toString()) {
            hasRights = true;
            break;
          }
        }
      }
      if (hasRights) {
        if (event.authorId.toString() === req.user._id.toString()
          || calendar.authorId.toString() === req.user._id.toString()) {
          await Event.deleteOne({ _id: event.id });
          return res.status(200).json({ message: 'Deleted event successfully' });
        } else {
          for (let i = event.participants.length - 1; i >= 0; i -= 1) {
            if (event.participants[i].participantId.toString() === req.user._id.toString()) {
              event.participants.splice(i, 1);
              break;
            }
          }
          await event.save();
          return res.status(200).json({
            message: "You are no longer a participant of the event"
          });
        }
      } else
        return res.status(403).json({
          message: "You do not have rights to delete the event"
        });
    } catch (err) {
      if (err instanceof CastError)
        return res.status(404).json({ message: 'Event is not found' });
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
      let isParticipant = false;
      if ((event.visibleForAll || eventCalendar?.type == 'main' || eventCalendar?.type == 'holidays')
        && eventCalendar?.authorId.toString() == req.user._id.toString())
        isParticipant = true;
      else {
        for (let i of event.participants) {
          if (i.participantId.toString() == req.user._id.toString()) {
            isParticipant = i.isConfirmed === null;
            break;
          }
        }
        if (!isParticipant && event.visibleForAll && eventCalendar) {
          for (let i of eventCalendar.participants) {
            if (i.participantId.toString() == req.user._id.toString()) {
              isParticipant = i.isConfirmed === null;
              break;
            }
          }
        }
      }
      if (!isParticipant)
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
        message: result ? 'Marked the task done successully':'Something went wrong',
        data: result
        ? {
          doneDate: event.doneDate
        }
        : undefined
      });
    } catch (err) {
      if (err instanceof CastError)
        return res.status(404).json({ message: 'Event is not found' });
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
      let isParticipant = false;
      if ((event.visibleForAll || eventCalendar?.type == 'main' || eventCalendar?.type == 'holidays')
        && eventCalendar?.authorId.toString() == req.user._id.toString())
        isParticipant = true;
      else {
        for (let i of event.participants) {
          if (i.participantId.toString() == req.user._id.toString()) {
            isParticipant = i.isConfirmed === null;
            break;
          }
        }
        if (!isParticipant && event.visibleForAll && eventCalendar) {
          for (let i of eventCalendar.participants) {
            if (i.participantId.toString() == req.user._id.toString()) {
              isParticipant = i.isConfirmed === null;
              break;
            }
          }
        }
      }
      if (!isParticipant)
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
        message: result ? 'Unmarked the task successully':'Something went wrong',
        data: result
        ? {
          doneDate: event.doneDate
        }
        : undefined
      });
    } catch (err) {
      if (err instanceof CastError)
        return res.status(404).json({ message: 'Event is not found' });
      err.message = `Unmarking done failed: ${err.message}`;
      throw err;
    }
  }
}

export default new Events;
