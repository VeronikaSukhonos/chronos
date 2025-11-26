import { CastError } from 'mongoose';

import Event from '../models/eventModel.js';
import { EventDto } from '../dtos/eventDto.js';
// import Calendar from '../models/calendarModel.js';
import Tag from '../models/tagModel.js';

class Events {
  async getAll(req, res) {
    try {
      let parameters = {};
      if (req.body.calendar) {
        if (req.body.calendar instanceof Array) {
          parameters.calendarId = {
            $in: req.body.calendar
          };
        } else
          parameters.calendarId = req.body.calendar;
      }
      if (req.body.type) {
        if (req.body.type instanceof Array) {
          parameters.type = {
            $in: req.body.type
          };
        } else
          parameters.type = req.body.type;
      }
      if (req.body.tag) {
        if (req.body.tag instanceof Array) {
          const tags = await Tag.find({
            title: {
              $in: req.body.tag
            }
          });
          let tagIds = [];
          for (let i of tags)
            tagIds.push(i._id);
          parameters.tags = {
            $in: tagIds
          };
        } else {
          const tag = await Tag.findOne({
            title: req.body.tag
          });
          if (tag)
            parameters.tags = {
              $in: [tag._id]
            };
        }
      }
      if (req.body.search)
        parameters.name = req.body.search instanceof Array ? {
          $in: req.body.search
        }
        : req.body.search;
      const events = await Event.find(parameters).select("-participants");
      return res.status(200).json({
        message: 'Getting events successfully',
        data: {
          events: events.map(event => new EventDto(event))
        }
      })
    } catch (err) {
      err.message = `Getting events failed: ${err.message}`;
      throw err;
    }
  }

  async getOne(req, res) {
    try {
      const eventId = req.params.eventId;
      const event = await Event.findOne({ _id: eventId });

      if (!event) return res.status(404).json({ message: 'Event is not found' });

      return res.status(200).json({
        message: 'Fetched event data successfully',
        data: { event: new EventDto(event) }
      });
    } catch (err) {
      if (err instanceof CastError)
        return res.status(404).json({ message: 'Invalid event ID' });
      err.message = `Getting event data failed: ${err.message}`;
      throw err;
    }
  }

  async getParticipants(req, res) {
    try {
      const eventId = req.params.eventId;
      const event = await Event.findOne({ _id: eventId });

      if (!event) return res.status(404).json({ message: 'Event is not found' });

      const participants = User.find({ _id: { $in: event.participants }}).select('id login avatar');

      return res.status(200).json({
        message: 'Fetched event participants data successfully',
        data: { participants }
      });
    } catch (err) {
      if (err instanceof CastError)
        return res.status(404).json({ message: 'Invalid user ID' });
      err.message = `Getting event participants data failed: ${err.message}`;
      throw err;
    }
  }

  async updateOne(req, res) {
    try {
      const { name, description, color, participants, tags, repeat, link } = req.body;
      const eventId = req.params.eventId;
      const event = await Event.findOne({ _id: eventId });

      if (!event) return res.status(404).json({ message: 'Event is not found' });

      if (name)
        event.name = name;
      if (event.description || description) event.description = description;
      if (event.color || color) event.color = color;
      if (participants)
        event.participants = participants;
      if (tags)
        event.tags = tags;
      if (repeat)
        event.repeat = repeat;
      if (event.link || link) event.link = link;

      if (event.isModified()) {
        const result = await event.save();
        return res.status(result ? 200:500).json({
          message: result ? 'Updated event successully':"Something went wrong"
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
          message: "The message is not found"
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
      if (!(event.participants.includes(req.user._id)))
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
      if (!(event.participants.includes(req.user._id)))
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
        message: result ? 'Unmarking done successully'
                          : 'Something went wrong'
      });
    } catch (err) {
      err.message = `Unmarking done failed: ${err.message}`;
      throw err;
    }
  }
}

export default new Events;
