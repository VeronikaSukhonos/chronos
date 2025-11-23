import Tag from '../models/tagModel';
import Event from '../models/eventModel';
import { TagDto } from '../dtos/tagDto.js';

class Tags {
  async getAll(req, res) {
    try {
      const result = await Tag.find({ authorId: req.user.id });
      return res.status(200).json({
        message: 'Getting tags successfully',
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
        return res.status(400).json({
          message: "The tag with this title already exists"
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
      if (tag.authorId != req.user.id) return res.status(403).json({ message: "Can't update not own tag" });
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
      if (tag.authorId != req.user.id) return res.status(403).json({ message: "Can't delete not own tag" });
      await Event.updateMany({ tags: tag.id }, { $pull: { tags: tag.id } });
      await Tag.deleteOne({ _id: req.params.tagId });
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
