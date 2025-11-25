import api from './api.js';

class Tags {
  async fetchTags() {
    return await api.get(`/tags`);
  }

  async createTag(params) {
    return await api.post(`/tags`, params);
  }

  async updateTag(tagId, params) {
    return await api.patch(`/tags/${tagId}`, params);
  }

  async deleteTag(tagId) {
    return await api.delete(`/tags/${tagId}`);
  }
}

export default new Tags;
