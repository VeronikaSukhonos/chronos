const Test = require('../models/test');

module.exports = {
  getAll: async (req, res) => {
    try {
      const result = await Test.find(); // returns an array of all objects
      return res.status(200).json({
        status: true,
        data: result
      });
    } catch(err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        error: err
      });
    }
  },

  getOne: async (req, res) => {
    try {
      const result = await Test.findOne({ _id: req.params.test }); // returns founded object
      return res.status(200).json({
        status: true,
        data: result
      });
    } catch(err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        error: err
      });
    }
  },

  createOne: async (req, res) => {
    const title = req.body ? req.body.title:undefined;
    try {
      const result = await Test.create({ title }); // returns newly created object
      return res.status(201).json({
        status: true,
        data: result
      });
    } catch(err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        error: err
      });
    }
  },

  updateOne: async (req, res) => {
    const title = req.body ? req.body.title:undefined;
    try {
      const result = await Test.findOneAndUpdate({ _id: req.params.test }, { title }); // returns updated object before changes
      return res.status(200).json({
        status: true,
        data: result
      });
    } catch(err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        error: err
      });
    }
  },

  deleteOne: async (req, res) => {
    try {
      const result = await Test.deleteOne({ _id: req.params.test }); // returns object like { acknowledged: true, deletedCount: 1 }
      return res.status(200).json({
        status: true,
        data: result
      });
    } catch(err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        error: err
      });
    }
  }
};

