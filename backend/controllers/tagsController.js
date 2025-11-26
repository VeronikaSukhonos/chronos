import Tag from '../models/tagModel.js';
import Event from '../models/eventModel.js';
import User from '../models/userModel.js';
import { TagDto } from '../dtos/tagDto.js';

class Tags {
  async getAll(req, res) {
    try {
      const result = await Tag.find({ authorId: req.user.id }).sort('title');

      return res.status(200).json({
        message: 'Fetched tags successfully',
        data: { tags: result.map(tag => new TagDto(tag)) }
      });
    } catch (err) {
      err.message = `Getting tags failed: ${err.message}`;
      throw err;
    }
  }

  async createOne(req, res) {
    try {
      const { title } = req.body;
      const tag = await Tag.findOne({ authorId: req.user.id, title });

      if (tag) {
        return res.status(409).json({
          message: 'Tag with this title already exists',
          errors: [{ param: 'title', error: 'Tag with this title already exists' }]
        });
      }
      const newTag = await Tag.create({ authorId: req.user.id, title });

      return res.status(201).json({
        message: 'New tag created successfully',
        data: { tag: new TagDto(newTag) }
      });
    } catch (err) {
      err.message = `New tag creating failed: ${err.message}`;
      throw err;
    }
  }

  async updateOne(req, res) {
    try {
      const { title } = req.body;
      const tag = await Tag.findById(req.params.tagId);

      if (!tag) return res.status(404).json({ message: 'Tag is not found' });
      if (tag.authorId != req.user.id)
        return res.status(403).json({ message: "Cannot update not your own tag" });
      if (tag.title === title)
        return res.status(200).json({ message: "Nothing has changed" });
      if (await Tag.findOne({ authorId: req.user.id, title })) {
        return res.status(409).json({
          message: 'Tag with this title already exists',
          errors: [{ param: 'title', error: 'Tag with this title already exists' }]
        });
      }
      tag.title = title;
      const result = await tag.save();

      return res.status(200).json({
        message: 'Tag updated successfully',
        data: { tag: new TagDto(result) }
      });
    } catch (err) {
      err.message = `Tag updating failed: ${err.message}`;
      throw err;
    }
  }

  async deleteOne(req, res) {
    try {
      const tag = await Tag.findById(req.params.tagId);

      if (!tag) return res.status(404).json({ message: 'Tag is not found' });
      if (tag.authorId != req.user.id)
        return res.status(403).json({ message: "Cannot delete not your own tag" });
      await Event.updateMany({ tags: tag.id }, { $pull: { tags: tag.id } });
      await User.updateOne({ _id: req.user.id }, { $pull: { "visibilitySettings.tags": tag.id } });
      await Tag.deleteOne({ _id: tag.id });
      return res.status(200).json({
        message: 'Tag deleted successfully'
      });
    } catch (err) {
      err.message = `Tag deleting failed: ${err.message}`;
      throw err;
    }
  }
}

export default new Tags;
